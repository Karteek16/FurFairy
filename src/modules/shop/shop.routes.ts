import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { PERMISSIONS } from '../../auth/permissions.js';
import { resolveShopScope } from '../../lib/tenant.js';
import * as shopService from './shop.service.js';

const registerSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  ownerName: z.string().min(2),
  ownerEmail: z.string().email(),
  ownerPhone: z.string().min(6),
  ownerPassword: z.string().min(8),
  gstin: z.string().optional(),
  moduleKeys: z.array(z.string()).min(1),
});

const brandingSchema = z.object({
  logoUrl: z.string().url().nullable().optional(),
  primaryColor: z.string().nullable().optional(),
});

const branchSchema = z.object({
  name: z.string().min(1),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().min(4),
  phone: z.string().optional(),
  openingHours: z.record(z.unknown()).optional(),
});

const documentSchema = z.object({
  docType: z.string().min(1),
  fileUrl: z.string().url(),
});

const moduleToggleSchema = z.object({
  moduleKey: z.string().min(1),
  enabled: z.boolean(),
});

export async function shopRoutes(app: FastifyInstance) {
  // ── Public ──
  app.post('/shops/register', async (req, reply) => {
    const body = registerSchema.parse(req.body);
    const { ownerPassword, ...rest } = body;
    const shop = await shopService.registerShop(rest, ownerPassword);
    return reply.status(201).send({
      shop: { id: shop.id, slug: shop.slug, status: shop.status },
      message: 'Registration submitted. Your shop will be visible after admin approval.',
    });
  });

  app.get('/shops', async (req, reply) => {
    const q = z
      .object({ search: z.string().optional(), moduleKey: z.string().optional() })
      .parse(req.query);
    return reply.send({ shops: await shopService.listPublicShops(q) });
  });

  app.get('/shops/:slug', async (req, reply) => {
    const { slug } = z.object({ slug: z.string() }).parse(req.params);
    return reply.send({ shop: await shopService.getPublicShopBySlug(slug) });
  });

  // ── Shop-scoped (authenticated employee) ──
  app.get(
    '/my-shop',
    { preHandler: [app.authenticate, app.requirePermissions(PERMISSIONS.SHOP_VIEW)] },
    async (req, reply) => {
      const shopId = resolveShopScope(req.auth!);
      return reply.send({ shop: await shopService.getShopById(shopId) });
    },
  );

  app.put(
    '/my-shop/branding',
    { preHandler: [app.authenticate, app.requirePermissions(PERMISSIONS.BRANDING_MANAGE)] },
    async (req, reply) => {
      const shopId = resolveShopScope(req.auth!);
      const body = brandingSchema.parse(req.body);
      return reply.send({ branding: await shopService.updateBranding(shopId, body, req.auth!.userId) });
    },
  );

  app.post(
    '/my-shop/documents',
    { preHandler: [app.authenticate, app.requirePermissions(PERMISSIONS.SHOP_MANAGE)] },
    async (req, reply) => {
      const shopId = resolveShopScope(req.auth!);
      const body = documentSchema.parse(req.body);
      return reply.status(201).send({ document: await shopService.addDocument(shopId, body) });
    },
  );

  app.get(
    '/my-shop/branches',
    { preHandler: [app.authenticate, app.requirePermissions(PERMISSIONS.SHOP_VIEW)] },
    async (req, reply) => {
      const shopId = resolveShopScope(req.auth!);
      return reply.send({ branches: await shopService.listBranches(shopId) });
    },
  );

  app.post(
    '/my-shop/branches',
    { preHandler: [app.authenticate, app.requirePermissions(PERMISSIONS.BRANCH_MANAGE)] },
    async (req, reply) => {
      const shopId = resolveShopScope(req.auth!);
      const body = branchSchema.parse(req.body);
      const branch = await shopService.createBranch(shopId, body as never, req.auth!.userId);
      return reply.status(201).send({ branch });
    },
  );

  app.put(
    '/my-shop/modules',
    { preHandler: [app.authenticate, app.requirePermissions(PERMISSIONS.MODULE_MANAGE)] },
    async (req, reply) => {
      const shopId = resolveShopScope(req.auth!);
      const body = moduleToggleSchema.parse(req.body);
      const sm = await shopService.setShopModule(shopId, body.moduleKey, body.enabled, req.auth!.userId);
      return reply.send({ shopModule: sm });
    },
  );

  // ── Platform admin ──
  app.get(
    '/admin/shops',
    { preHandler: [app.authenticate, app.requirePlatformAdmin] },
    async (req, reply) => {
      const { status } = z.object({ status: z.string().optional() }).parse(req.query);
      return reply.send({ shops: await shopService.listShopsForAdmin(status) });
    },
  );

  app.post(
    '/admin/shops/:id/approve',
    { preHandler: [app.authenticate, app.requirePlatformAdmin] },
    async (req, reply) => {
      const { id } = z.object({ id: z.string() }).parse(req.params);
      return reply.send({ shop: await shopService.approveShop(id, req.auth!.userId) });
    },
  );

  app.post(
    '/admin/shops/:id/reject',
    { preHandler: [app.authenticate, app.requirePlatformAdmin] },
    async (req, reply) => {
      const { id } = z.object({ id: z.string() }).parse(req.params);
      const { reason } = z.object({ reason: z.string().min(1) }).parse(req.body);
      return reply.send({ shop: await shopService.rejectShop(id, reason, req.auth!.userId) });
    },
  );

  app.post(
    '/admin/shops/:id/suspend',
    { preHandler: [app.authenticate, app.requirePlatformAdmin] },
    async (req, reply) => {
      const { id } = z.object({ id: z.string() }).parse(req.params);
      const { reason } = z.object({ reason: z.string().min(1) }).parse(req.body);
      return reply.send({ shop: await shopService.suspendShop(id, reason, req.auth!.userId) });
    },
  );
}
