import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { PERMISSIONS } from '../../auth/permissions.js';
import { resolveShopScope } from '../../lib/tenant.js';
import * as svc from './catalog.service.js';

const variantSchema = z.object({
  sku: z.string().min(1),
  packSize: z.string().optional(),
  attributes: z.record(z.unknown()).optional(),
  pricePaise: z.number().int().nonnegative(),
  mrpPaise: z.number().int().nonnegative().optional(),
  costPaise: z.number().int().nonnegative().optional(),
});

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  images: z.array(z.string().url()).optional(),
  variants: z.array(variantSchema).min(1),
});

const receiveSchema = z.object({
  branchId: z.string(),
  supplierId: z.string().optional(),
  reference: z.string().optional(),
  items: z
    .array(
      z.object({
        variantId: z.string(),
        quantity: z.number().int().positive(),
        costPaise: z.number().int().nonnegative(),
        batchNo: z.string().optional(),
        expiryDate: z.string().datetime().optional(),
      }),
    )
    .min(1),
});

const adjustSchema = z.object({
  variantId: z.string(),
  branchId: z.string(),
  delta: z.number().int(),
  type: z.enum(['ADJUSTMENT', 'DAMAGE', 'EXPIRY', 'RETURN']),
  reason: z.string().min(1),
});

const importSchema = z.object({
  rows: z
    .array(
      z.object({
        productName: z.string(),
        sku: z.string(),
        pricePaise: z.number().int().nonnegative(),
        packSize: z.string().optional(),
        categoryName: z.string().optional(),
      }),
    )
    .min(1),
});

export async function catalogRoutes(app: FastifyInstance) {
  const canView = app.requirePermissions(PERMISSIONS.PRODUCT_VIEW);
  const canManage = app.requirePermissions(PERMISSIONS.PRODUCT_MANAGE);
  const canViewInv = app.requirePermissions(PERMISSIONS.INVENTORY_VIEW);
  const canManageInv = app.requirePermissions(PERMISSIONS.INVENTORY_MANAGE);
  const canSupplier = app.requirePermissions(PERMISSIONS.SUPPLIER_MANAGE);

  // Categories
  app.get('/my-shop/categories', { preHandler: [app.authenticate, canView] }, async (req, reply) => {
    const shopId = resolveShopScope(req.auth!);
    return reply.send({ categories: await svc.listCategories(shopId) });
  });
  app.post('/my-shop/categories', { preHandler: [app.authenticate, canManage] }, async (req, reply) => {
    const shopId = resolveShopScope(req.auth!);
    const body = z.object({ name: z.string().min(1), parentId: z.string().optional() }).parse(req.body);
    return reply.status(201).send({ category: await svc.createCategory(shopId, body) });
  });

  // Products
  app.get('/my-shop/products', { preHandler: [app.authenticate, canView] }, async (req, reply) => {
    const shopId = resolveShopScope(req.auth!);
    const q = z.object({ search: z.string().optional() }).parse(req.query);
    return reply.send({ products: await svc.listProducts(shopId, q) });
  });
  app.post('/my-shop/products', { preHandler: [app.authenticate, canManage] }, async (req, reply) => {
    const shopId = resolveShopScope(req.auth!);
    const body = productSchema.parse(req.body);
    return reply.status(201).send({ product: await svc.createProduct(shopId, body, req.auth!.userId) });
  });
  app.put('/my-shop/variants/:id/price', { preHandler: [app.authenticate, canManage] }, async (req, reply) => {
    const shopId = resolveShopScope(req.auth!);
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const body = z
      .object({
        pricePaise: z.number().int().nonnegative().optional(),
        mrpPaise: z.number().int().nonnegative().optional(),
        costPaise: z.number().int().nonnegative().optional(),
      })
      .parse(req.body);
    return reply.send({ variant: await svc.updateVariantPrice(shopId, id, body, req.auth!.userId) });
  });
  app.post('/my-shop/products/import', { preHandler: [app.authenticate, canManage] }, async (req, reply) => {
    const shopId = resolveShopScope(req.auth!);
    const { rows } = importSchema.parse(req.body);
    return reply.send(await svc.importProducts(shopId, rows));
  });

  // Inventory
  app.get('/my-shop/branches/:branchId/inventory', { preHandler: [app.authenticate, canViewInv] }, async (req, reply) => {
    const shopId = resolveShopScope(req.auth!);
    const { branchId } = z.object({ branchId: z.string() }).parse(req.params);
    return reply.send({ inventory: await svc.getInventory(shopId, branchId) });
  });
  app.post('/my-shop/inventory/receive', { preHandler: [app.authenticate, canManageInv] }, async (req, reply) => {
    const shopId = resolveShopScope(req.auth!);
    const body = receiveSchema.parse(req.body);
    return reply.status(201).send({ receipt: await svc.receiveStock(shopId, body, req.auth!.userId) });
  });
  app.post('/my-shop/inventory/adjust', { preHandler: [app.authenticate, canManageInv] }, async (req, reply) => {
    const shopId = resolveShopScope(req.auth!);
    const body = adjustSchema.parse(req.body);
    return reply.status(201).send({ movement: await svc.adjustStock(shopId, body, req.auth!.userId) });
  });
  app.get('/my-shop/inventory/low-stock', { preHandler: [app.authenticate, canViewInv] }, async (req, reply) => {
    const shopId = resolveShopScope(req.auth!);
    return reply.send({ alerts: await svc.lowStockAlerts(shopId) });
  });

  // Suppliers
  app.get('/my-shop/suppliers', { preHandler: [app.authenticate, canSupplier] }, async (req, reply) => {
    const shopId = resolveShopScope(req.auth!);
    return reply.send({ suppliers: await svc.listSuppliers(shopId) });
  });
  app.post('/my-shop/suppliers', { preHandler: [app.authenticate, canSupplier] }, async (req, reply) => {
    const shopId = resolveShopScope(req.auth!);
    const body = z
      .object({
        name: z.string().min(1),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        gstin: z.string().optional(),
      })
      .parse(req.body);
    return reply.status(201).send({ supplier: await svc.createSupplier(shopId, body) });
  });
}
