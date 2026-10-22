import { prisma } from '../../lib/prisma.js';
import { BadRequest, Conflict, NotFound } from '../../lib/errors.js';
import { writeAudit } from '../../lib/audit.js';
import { hashPassword } from '../../auth/password.js';
import { DEFAULT_ROLES } from '../../auth/permissions.js';
import type { Prisma } from '@prisma/client';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base || 'shop';
  let i = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await prisma.shop.findUnique({ where: { slug } })) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

export interface RegisterShopInput {
  name: string;
  description?: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  gstin?: string;
  moduleKeys: string[]; // which modules the shop wants to offer
}

/**
 * Public shop registration. Creates the shop in DRAFT -> PENDING_REVIEW,
 * seeds default roles, and creates the owner employee account.
 * The shop is NOT publicly visible until a platform admin approves it.
 */
export async function registerShop(input: RegisterShopInput, ownerPassword: string) {
  if (ownerPassword.length < 8) throw BadRequest('Owner password must be at least 8 characters');

  const existing = await prisma.user.findUnique({
    where: { email: input.ownerEmail.toLowerCase() },
  });
  if (existing) throw Conflict('An account with this email already exists');

  const modules = await prisma.module.findMany({
    where: { key: { in: input.moduleKeys } },
  });
  const foundKeys = new Set(modules.map((m) => m.key));
  const missing = input.moduleKeys.filter((k) => !foundKeys.has(k));
  if (missing.length) throw BadRequest(`Unknown module(s): ${missing.join(', ')}`);

  const slug = await uniqueSlug(slugify(input.name));
  const passwordHash = await hashPassword(ownerPassword);

  const result = await prisma.$transaction(async (tx) => {
    const shop = await tx.shop.create({
      data: {
        name: input.name,
        slug,
        description: input.description,
        ownerName: input.ownerName,
        ownerEmail: input.ownerEmail.toLowerCase(),
        ownerPhone: input.ownerPhone,
        gstin: input.gstin,
        status: 'PENDING_REVIEW',
        branding: { create: {} },
      },
    });

    // Seed default roles for this shop.
    const roleRecords = await Promise.all(
      Object.entries(DEFAULT_ROLES).map(([key, def]) =>
        tx.role.create({
          data: {
            shopId: shop.id,
            key,
            description: def.description,
            permissions: def.permissions,
            isSystem: true,
          },
        }),
      ),
    );
    const ownerRole = roleRecords.find((r) => r.key === 'SHOP_OWNER')!;

    // Enable selected modules. Modules requiring verification start pending.
    for (const m of modules) {
      await tx.shopModule.create({
        data: {
          shopId: shop.id,
          moduleId: m.id,
          status: m.requiresVerification ? 'PENDING_VERIFICATION' : 'ENABLED',
        },
      });
    }

    // Create the owner's user + employee account.
    const user = await tx.user.create({
      data: {
        type: 'EMPLOYEE',
        email: input.ownerEmail.toLowerCase(),
        phone: input.ownerPhone,
        passwordHash,
      },
    });
    await tx.employee.create({
      data: {
        userId: user.id,
        shopId: shop.id,
        username: 'owner',
        fullName: input.ownerName,
        roleId: ownerRole.id,
      },
    });

    return shop;
  });

  await writeAudit({
    shopId: result.id,
    action: 'SHOP_REGISTERED',
    entityType: 'Shop',
    entityId: result.id,
    metadata: { name: result.name, modules: input.moduleKeys },
  });

  return result;
}

export async function getShopById(shopId: string) {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: {
      branding: true,
      branches: true,
      shopModules: { include: { module: true } },
      documents: true,
    },
  });
  if (!shop) throw NotFound('Shop not found');
  return shop;
}

/** Public listing: only approved (publicly visible) shops. */
export async function listPublicShops(params: { search?: string; moduleKey?: string }) {
  const where: Prisma.ShopWhereInput = { status: 'APPROVED' };
  if (params.search) {
    where.name = { contains: params.search, mode: 'insensitive' };
  }
  if (params.moduleKey) {
    where.shopModules = {
      some: { module: { key: params.moduleKey }, status: 'ENABLED' },
    };
  }
  return prisma.shop.findMany({
    where,
    include: { branding: true, shopModules: { include: { module: true } } },
    orderBy: { name: 'asc' },
  });
}

export async function getPublicShopBySlug(slug: string) {
  const shop = await prisma.shop.findFirst({
    where: { slug, status: 'APPROVED' },
    include: {
      branding: true,
      branches: { where: { isActive: true } },
      shopModules: { where: { status: 'ENABLED' }, include: { module: true } },
      boardingPackages: {
        where: { status: { in: ['ACTIVE', 'COMING_SOON'] } },
      },
      groomingServices: { where: { isActive: true } },
    },
  });
  if (!shop) throw NotFound('Shop not found');
  return shop;
}

// ── Admin verification lifecycle ───────────────────────────────

export async function listShopsForAdmin(status?: string) {
  return prisma.shop.findMany({
    where: status ? { status: status as never } : undefined,
    include: { shopModules: { include: { module: true } }, documents: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function approveShop(shopId: string, actorId: string) {
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) throw NotFound('Shop not found');
  if (shop.status !== 'PENDING_REVIEW') {
    throw BadRequest(`Shop is ${shop.status}; only PENDING_REVIEW shops can be approved`);
  }
  const updated = await prisma.shop.update({
    where: { id: shopId },
    data: { status: 'APPROVED', approvedAt: new Date() },
  });
  await writeAudit({
    shopId,
    actorId,
    action: 'SHOP_APPROVED',
    entityType: 'Shop',
    entityId: shopId,
  });
  return updated;
}

export async function rejectShop(shopId: string, reason: string, actorId: string) {
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) throw NotFound('Shop not found');
  const updated = await prisma.shop.update({
    where: { id: shopId },
    data: { status: 'REJECTED', rejectionReason: reason },
  });
  await writeAudit({
    shopId,
    actorId,
    action: 'SHOP_REJECTED',
    entityType: 'Shop',
    entityId: shopId,
    metadata: { reason },
  });
  return updated;
}

export async function suspendShop(shopId: string, reason: string, actorId: string) {
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) throw NotFound('Shop not found');
  const updated = await prisma.shop.update({
    where: { id: shopId },
    data: { status: 'SUSPENDED', suspensionReason: reason },
  });
  await writeAudit({
    shopId,
    actorId,
    action: 'SHOP_SUSPENDED',
    entityType: 'Shop',
    entityId: shopId,
    metadata: { reason },
  });
  return updated;
}

// ── Branding, branches, modules, documents ─────────────────────

export async function updateBranding(
  shopId: string,
  data: { logoUrl?: string | null; primaryColor?: string | null },
  actorId: string,
) {
  const branding = await prisma.shopBranding.upsert({
    where: { shopId },
    create: { shopId, logoUrl: data.logoUrl ?? null, primaryColor: data.primaryColor ?? null },
    update: { logoUrl: data.logoUrl ?? null, primaryColor: data.primaryColor ?? null },
  });
  await writeAudit({ shopId, actorId, action: 'BRANDING_UPDATED', entityType: 'ShopBranding', entityId: branding.id });
  return branding;
}

export async function addDocument(
  shopId: string,
  data: { docType: string; fileUrl: string },
) {
  return prisma.shopDocument.create({ data: { shopId, ...data } });
}

export async function createBranch(
  shopId: string,
  data: Omit<Prisma.BranchUncheckedCreateInput, 'shopId'>,
  actorId: string,
) {
  const branch = await prisma.branch.create({ data: { ...data, shopId } });
  await writeAudit({ shopId, actorId, action: 'BRANCH_CREATED', entityType: 'Branch', entityId: branch.id });
  return branch;
}

export async function listBranches(shopId: string) {
  return prisma.branch.findMany({ where: { shopId }, orderBy: { createdAt: 'asc' } });
}

export async function setShopModule(
  shopId: string,
  moduleKey: string,
  enabled: boolean,
  actorId: string,
) {
  const module = await prisma.module.findUnique({ where: { key: moduleKey } });
  if (!module) throw NotFound('Module not found');
  if (!module.globallyEnabled && enabled) {
    throw BadRequest('This module is disabled platform-wide');
  }
  const status = enabled
    ? module.requiresVerification
      ? 'PENDING_VERIFICATION'
      : 'ENABLED'
    : 'DISABLED';
  const sm = await prisma.shopModule.upsert({
    where: { shopId_moduleId: { shopId, moduleId: module.id } },
    create: { shopId, moduleId: module.id, status },
    update: { status },
  });
  await writeAudit({
    shopId,
    actorId,
    action: 'SHOP_MODULE_CHANGED',
    entityType: 'ShopModule',
    entityId: sm.id,
    metadata: { moduleKey, status },
  });
  return sm;
}
