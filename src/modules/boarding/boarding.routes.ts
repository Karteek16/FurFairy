import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { PERMISSIONS } from '../../auth/permissions.js';
import { resolveShopScope } from '../../lib/tenant.js';
import * as svc from './boarding.service.js';

const packageSchema = z.object({
  tier: z.enum(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']),
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['DRAFT', 'COMING_SOON', 'ACTIVE', 'TEMPORARILY_UNAVAILABLE', 'DISABLED']),
  inclusions: z.record(z.unknown()).optional(),
  pricePerNightPaise: z.number().int().nonnegative(),
  capacity: z.number().int().nonnegative(),
});

const reservationSchema = z.object({
  shopSlug: z.string(),
  packageId: z.string(),
  petId: z.string(),
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
  transportType: z.enum(['IN_STORE', 'HOME']),
  transportAddress: z.record(z.unknown()).optional(),
});

const careTaskSchema = z.object({
  type: z.enum(['FEED', 'WALK', 'GROOM', 'MEDICATION', 'OTHER']),
  scheduledAt: z.string().datetime(),
  instructions: z.string().optional(),
});

export async function boardingRoutes(app: FastifyInstance) {
  const pkgManage = app.requirePermissions(PERMISSIONS.BOARDING_PACKAGE_MANAGE);
  const resView = app.requirePermissions(PERMISSIONS.BOARDING_RESERVATION_VIEW);
  const resManage = app.requirePermissions(PERMISSIONS.BOARDING_RESERVATION_MANAGE);
  const careView = app.requirePermissions(PERMISSIONS.BOARDING_CARE_VIEW);
  const careComplete = app.requirePermissions(PERMISSIONS.BOARDING_CARE_COMPLETE);

  // Shop admin: package configuration
  app.get('/my-shop/boarding/packages', { preHandler: [app.authenticate, pkgManage] }, async (req, reply) => {
    const shopId = resolveShopScope(req.auth!);
    return reply.send({ packages: await svc.listPackages(shopId) });
  });
  app.put('/my-shop/boarding/packages', { preHandler: [app.authenticate, pkgManage] }, async (req, reply) => {
    const shopId = resolveShopScope(req.auth!);
    const body = packageSchema.parse(req.body);
    return reply.send({ package: await svc.upsertPackage(shopId, body, req.auth!.userId) });
  });

  // Shop staff: reservations
  app.get('/my-shop/boarding/reservations', { preHandler: [app.authenticate, resView] }, async (req, reply) => {
    const shopId = resolveShopScope(req.auth!);
    const { status } = z.object({ status: z.string().optional() }).parse(req.query);
    return reply.send({ reservations: await svc.listReservations(shopId, status) });
  });
  app.put('/my-shop/boarding/reservations/:id/status', { preHandler: [app.authenticate, resManage] }, async (req, reply) => {
    const shopId = resolveShopScope(req.auth!);
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const { status } = z.object({ status: z.string() }).parse(req.body);
    return reply.send({ reservation: await svc.updateReservationStatus(shopId, id, status, req.auth!.userId) });
  });

  // Care tasks
  app.post('/my-shop/boarding/reservations/:id/care-tasks', { preHandler: [app.authenticate, resManage] }, async (req, reply) => {
    const shopId = resolveShopScope(req.auth!);
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const body = careTaskSchema.parse(req.body);
    return reply.status(201).send({ careTask: await svc.scheduleCareTask(shopId, id, body) });
  });
  app.get('/my-shop/boarding/care-tasks', { preHandler: [app.authenticate, careView] }, async (req, reply) => {
    const shopId = resolveShopScope(req.auth!);
    const { date } = z.object({ date: z.string().optional() }).parse(req.query);
    return reply.send({ tasks: await svc.careTaskList(shopId, { date }) });
  });
  app.post('/my-shop/boarding/care-tasks/:id/complete', { preHandler: [app.authenticate, careComplete] }, async (req, reply) => {
    const shopId = resolveShopScope(req.auth!);
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const { notes } = z.object({ notes: z.string().optional() }).parse(req.body ?? {});
    return reply.send({ completion: await svc.completeCareTask(shopId, req.auth!, id, notes) });
  });

  // Customer: create reservation
  app.post('/boarding/reservations', { preHandler: [app.authenticate, app.requireCustomer] }, async (req, reply) => {
    const body = reservationSchema.parse(req.body);
    return reply.status(201).send({ reservation: await svc.createReservation(req.auth!, body) });
  });
}
