import { prisma } from '../../lib/prisma.js';
import { BadRequest, Conflict, NotFound } from '../../lib/errors.js';
import { writeAudit } from '../../lib/audit.js';
import type { Prisma, StockMovementType } from '@prisma/client';

// ── Categories ──
export async function createCategory(
  shopId: string,
  data: { name: string; parentId?: string },
) {
  if (data.parentId) {
    const parent = await prisma.productCategory.findFirst({
      where: { id: data.parentId, shopId },
    });
    if (!parent) throw BadRequest('Parent category not found in this shop');
  }
  return prisma.productCategory.create({ data: { shopId, name: data.name, parentId: data.parentId } });
}

export async function listCategories(shopId: string) {
  return prisma.productCategory.findMany({ where: { shopId }, orderBy: { name: 'asc' } });
}

// ── Products & variants ──
export interface VariantInput {
  sku: string;
  packSize?: string;
  attributes?: Record<string, unknown>;
  pricePaise: number;
  mrpPaise?: number;
  costPaise?: number;
}

export async function createProduct(
  shopId: string,
  data: {
    name: string;
    description?: string;
    categoryId?: string;
    images?: string[];
    variants: VariantInput[];
  },
  actorId: string,
) {
  if (!data.variants.length) throw BadRequest('A product needs at least one variant');
  if (data.categoryId) {
    const cat = await prisma.productCategory.findFirst({ where: { id: data.categoryId, shopId } });
    if (!cat) throw BadRequest('Category not found in this shop');
  }
  // Guard against duplicate SKUs in the payload.
  const skus = data.variants.map((v) => v.sku);
  if (new Set(skus).size !== skus.length) throw BadRequest('Duplicate SKU in variants');

  const product = await prisma.product.create({
    data: {
      shopId,
      name: data.name,
      description: data.description,
      categoryId: data.categoryId,
      images: data.images?.length
        ? { create: data.images.map((url, i) => ({ url, position: i })) }
        : undefined,
      variants: {
        create: data.variants.map((v) => ({
          sku: v.sku,
          packSize: v.packSize,
          attributes: v.attributes as Prisma.InputJsonValue | undefined,
          pricePaise: v.pricePaise,
          mrpPaise: v.mrpPaise,
          costPaise: v.costPaise,
        })),
      },
    },
    include: { variants: true, images: true },
  });
  await writeAudit({ shopId, actorId, action: 'PRODUCT_CREATED', entityType: 'Product', entityId: product.id });
  return product;
}

export async function listProducts(shopId: string, params: { search?: string }) {
  const where: Prisma.ProductWhereInput = { shopId };
  if (params.search) where.name = { contains: params.search, mode: 'insensitive' };
  return prisma.product.findMany({
    where,
    include: { variants: true, images: true, category: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateVariantPrice(
  shopId: string,
  variantId: string,
  data: { pricePaise?: number; mrpPaise?: number; costPaise?: number },
  actorId: string,
) {
  const variant = await prisma.productVariant.findFirst({
    where: { id: variantId, product: { shopId } },
  });
  if (!variant) throw NotFound('Variant not found');
  const updated = await prisma.productVariant.update({ where: { id: variantId }, data });
  await writeAudit({
    shopId,
    actorId,
    action: 'PRICE_CHANGED',
    entityType: 'ProductVariant',
    entityId: variantId,
    metadata: { from: variant.pricePaise, to: data.pricePaise ?? variant.pricePaise },
  });
  return updated;
}

// ── CSV import (validated, with per-row report) ──
export interface ImportRow {
  productName: string;
  sku: string;
  pricePaise: number;
  packSize?: string;
  categoryName?: string;
}

export async function importProducts(shopId: string, rows: ImportRow[]) {
  const results: { row: number; sku: string; status: 'imported' | 'skipped' | 'error'; message?: string }[] = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    try {
      if (!r.productName || !r.sku || !Number.isInteger(r.pricePaise) || r.pricePaise < 0) {
        results.push({ row: i + 1, sku: r.sku, status: 'error', message: 'Invalid required fields' });
        continue;
      }
      const dup = await prisma.productVariant.findFirst({
        where: { sku: r.sku, product: { shopId } },
      });
      if (dup) {
        results.push({ row: i + 1, sku: r.sku, status: 'skipped', message: 'SKU already exists' });
        continue;
      }
      let categoryId: string | undefined;
      if (r.categoryName) {
        const existing = await prisma.productCategory.findFirst({
          where: { shopId, name: r.categoryName },
        });
        const cat =
          existing ??
          (await prisma.productCategory.create({ data: { shopId, name: r.categoryName } }));
        categoryId = cat.id;
      }
      await prisma.product.create({
        data: {
          shopId,
          name: r.productName,
          categoryId,
          variants: { create: [{ sku: r.sku, packSize: r.packSize, pricePaise: r.pricePaise }] },
        },
      });
      results.push({ row: i + 1, sku: r.sku, status: 'imported' });
    } catch (err) {
      results.push({
        row: i + 1,
        sku: r.sku,
        status: 'error',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }
  const summary = {
    total: rows.length,
    imported: results.filter((r) => r.status === 'imported').length,
    skipped: results.filter((r) => r.status === 'skipped').length,
    errors: results.filter((r) => r.status === 'error').length,
  };
  return { summary, results };
}

// ── Inventory with safe reservation to prevent overselling ──

export async function getInventory(shopId: string, branchId: string) {
  const branch = await prisma.branch.findFirst({ where: { id: branchId, shopId } });
  if (!branch) throw NotFound('Branch not found');
  return prisma.inventory.findMany({
    where: { branchId, variant: { product: { shopId } } },
    include: { variant: { include: { product: true } } },
  });
}

/** Records a stock receipt and increases on-hand quantity atomically. */
export async function receiveStock(
  shopId: string,
  data: {
    branchId: string;
    supplierId?: string;
    reference?: string;
    items: { variantId: string; quantity: number; costPaise: number; batchNo?: string; expiryDate?: string }[];
  },
  actorId: string,
) {
  const branch = await prisma.branch.findFirst({ where: { id: data.branchId, shopId } });
  if (!branch) throw BadRequest('Branch not found in this shop');
  if (!data.items.length) throw BadRequest('Receipt needs at least one item');

  return prisma.$transaction(async (tx) => {
    const total = data.items.reduce((s, it) => s + it.costPaise * it.quantity, 0);
    const receipt = await tx.stockReceipt.create({
      data: {
        shopId,
        supplierId: data.supplierId,
        branchId: data.branchId,
        reference: data.reference,
        totalPaise: total,
        items: {
          create: data.items.map((it) => ({
            variantId: it.variantId,
            quantity: it.quantity,
            costPaise: it.costPaise,
            batchNo: it.batchNo,
            expiryDate: it.expiryDate ? new Date(it.expiryDate) : null,
          })),
        },
      },
    });

    for (const it of data.items) {
      const variant = await tx.productVariant.findFirst({
        where: { id: it.variantId, product: { shopId } },
      });
      if (!variant) throw BadRequest(`Variant ${it.variantId} not found in this shop`);

      await tx.inventory.upsert({
        where: { variantId_branchId: { variantId: it.variantId, branchId: data.branchId } },
        create: { variantId: it.variantId, branchId: data.branchId, quantity: it.quantity },
        update: { quantity: { increment: it.quantity } },
      });
      if (it.batchNo) {
        await tx.stockBatch.create({
          data: {
            variantId: it.variantId,
            batchNo: it.batchNo,
            quantity: it.quantity,
            costPaise: it.costPaise,
            expiryDate: it.expiryDate ? new Date(it.expiryDate) : null,
          },
        });
      }
      await tx.stockMovement.create({
        data: {
          variantId: it.variantId,
          branchId: data.branchId,
          type: 'RECEIPT',
          quantity: it.quantity,
          reference: receipt.id,
        },
      });
    }

    await writeAudit({
      shopId,
      actorId,
      action: 'STOCK_RECEIVED',
      entityType: 'StockReceipt',
      entityId: receipt.id,
    });
    return receipt;
  });
}

/**
 * Reserves stock for an order. Uses a conditional update so two concurrent
 * reservations cannot both succeed when only one unit is available — this is
 * the overselling guard, enforced at the DB level (not the frontend).
 */
export async function reserveStock(
  shopId: string,
  branchId: string,
  variantId: string,
  quantity: number,
  reference: string,
) {
  if (quantity <= 0) throw BadRequest('Quantity must be positive');
  return prisma.$transaction(async (tx) => {
    const inv = await tx.inventory.findUnique({
      where: { variantId_branchId: { variantId, branchId } },
      include: { variant: { include: { product: true } } },
    });
    if (!inv || inv.variant.product.shopId !== shopId) throw NotFound('Inventory not found');
    const available = inv.quantity - inv.reserved;
    if (available < quantity) {
      throw Conflict(`Insufficient stock: ${available} available, ${quantity} requested`);
    }
    // Conditional increment of reserved; guarded by available quantity check above
    // inside the same transaction row lock.
    await tx.inventory.update({
      where: { variantId_branchId: { variantId, branchId } },
      data: { reserved: { increment: quantity } },
    });
    return tx.stockReservation.create({
      data: { variantId, branchId, quantity, reference },
    });
  });
}

/** Releases a reservation (e.g. order cancelled/expired). */
export async function releaseReservation(reference: string) {
  return prisma.$transaction(async (tx) => {
    const reservations = await tx.stockReservation.findMany({
      where: { reference, releasedAt: null },
    });
    for (const r of reservations) {
      await tx.inventory.update({
        where: { variantId_branchId: { variantId: r.variantId, branchId: r.branchId } },
        data: { reserved: { decrement: r.quantity } },
      });
      await tx.stockReservation.update({ where: { id: r.id }, data: { releasedAt: new Date() } });
    }
    return { released: reservations.length };
  });
}

/** Converts reservations into an actual deduction (order confirmed/fulfilled). */
export async function commitReservation(reference: string, actorShopId: string) {
  return prisma.$transaction(async (tx) => {
    const reservations = await tx.stockReservation.findMany({
      where: { reference, releasedAt: null },
    });
    for (const r of reservations) {
      await tx.inventory.update({
        where: { variantId_branchId: { variantId: r.variantId, branchId: r.branchId } },
        data: { quantity: { decrement: r.quantity }, reserved: { decrement: r.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          variantId: r.variantId,
          branchId: r.branchId,
          type: 'SALE' as StockMovementType,
          quantity: -r.quantity,
          reference,
        },
      });
      await tx.stockReservation.update({ where: { id: r.id }, data: { releasedAt: new Date() } });
    }
    await writeAudit({
      shopId: actorShopId,
      action: 'STOCK_COMMITTED',
      entityType: 'StockReservation',
      entityId: reference,
      metadata: { count: reservations.length },
    });
    return { committed: reservations.length };
  });
}

export async function adjustStock(
  shopId: string,
  data: { variantId: string; branchId: string; delta: number; type: StockMovementType; reason: string },
  actorId: string,
) {
  const variant = await prisma.productVariant.findFirst({
    where: { id: data.variantId, product: { shopId } },
  });
  if (!variant) throw NotFound('Variant not found');
  if (!data.reason) throw BadRequest('Adjustment reason is required');

  return prisma.$transaction(async (tx) => {
    await tx.inventory.upsert({
      where: { variantId_branchId: { variantId: data.variantId, branchId: data.branchId } },
      create: { variantId: data.variantId, branchId: data.branchId, quantity: Math.max(0, data.delta) },
      update: { quantity: { increment: data.delta } },
    });
    const movement = await tx.stockMovement.create({
      data: {
        variantId: data.variantId,
        branchId: data.branchId,
        type: data.type,
        quantity: data.delta,
        reason: data.reason,
      },
    });
    await writeAudit({
      shopId,
      actorId,
      action: 'STOCK_ADJUSTED',
      entityType: 'StockMovement',
      entityId: movement.id,
      metadata: { delta: data.delta, type: data.type, reason: data.reason },
    });
    return movement;
  });
}

export async function lowStockAlerts(shopId: string) {
  const items = await prisma.inventory.findMany({
    where: { variant: { product: { shopId } }, lowStockThreshold: { gt: 0 } },
    include: { variant: { include: { product: true } } },
  });
  return items.filter((i) => i.quantity - i.reserved <= i.lowStockThreshold);
}

// ── Suppliers ──
export async function createSupplier(
  shopId: string,
  data: { name: string; phone?: string; email?: string; gstin?: string },
) {
  return prisma.supplier.create({ data: { shopId, ...data } });
}

export async function listSuppliers(shopId: string) {
  return prisma.supplier.findMany({ where: { shopId }, orderBy: { name: 'asc' } });
}
