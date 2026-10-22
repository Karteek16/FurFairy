import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { PERMISSIONS } from '../../auth/permissions.js';
import { resolveShopScope } from '../../lib/tenant.js';
import * as svc from './grooming.service.js';

const serviceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  basePricePaise: z.number().int().nonnegative(),
  durationMinutes: z.number().int().positive(),
  petType: z.string().optional(),
  inStoreAvailable: z.boolean().default(true),
  homeServiceAvailable: z.boolean().default(false),
  depositPaise: z.number().int().nonnegative().optional(),
  pricingRules: z.record(z.unknown()).optional(),
  serviceAreaPincodes: z.array(z.string()).optional(),
  cancellationPolicy: z.record(z.unknown()).optional(),
});

const bookSchema = z.object({
  shopSlug: z.string(),
  serviceId: z.string(),
  petId: z.string(),
  staffId: z.string().optional(),
  location: z.enum(['IN_STORE', 'HOME']),
  startsAt: z.string().datetime(),
  homeAddress: z.record(z.unknown()).optional(),
});

export async function groomingRoutes(app: FastifyInstance) {
  const serviceManage = app.requirePermissions(PERMISSIONS.GROOMING_SERVICE_MANAGE);
  const apptView = app.requirePermissions(PERMISSIONS.GROOMING_APPOINTMENT_VIEW);
  const apptManage = app.requirePermissions(PERMISSIONS.GROOMING_APPOINTMENT_MANAGE);

  // Shop admin: service menu
  app.get('/my-shop/grooming/services', { preHandler: [app.authenticate, apptView] }, async (req, reply) => {
    const shopId = resolveShopScope(req.auth!);
    return reply.send({ services: await svc.listServices(shopId) });
  });
  app.post('/my-shop/grooming/services', { preHandler: [app.authenticate, serviceManage] }, async (req, reply) => {
    const shopId = resolveShopScope(req.auth!);
    const body = serviceSchema.parse(req.body);
    return reply.status(201).send({ service: await svc.createService(shopId, body, req.auth!.userId) });
  });
  app.put('/my-shop/grooming/services/:id', { preHandler: [app.authenticate, serviceManage] }, async (req, reply) => {
    const shopId = resolveShopScope(req.auth!);
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const body = serviceSchema.partial().parse(req.body);
    return reply.send({ service: await svc.updateService(shopId, id, body as never, req.auth!.userId) });
  });

  // Shop staff: appointments
  app.get('/my-shop/grooming/appointments', { preHandler: [app.authenticate, apptView] }, async (req, reply) => {
    const shopId = resolveShopScope(req.auth!);
    const q = z.object({ date: z.string().optional(), mine: z.coerce.boolean().optional() }).parse(req.query);
    return reply.send({ appointments: await svc.listAppointments(shopId, req.auth!, q) });
  });
  app.put('/my-shop/grooming/appointments/:id/status', { preHandler: [app.authenticate, apptManage] }, async (req, reply) => {
    const shopId = resolveShopScope(req.auth!);
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const { status, notes } = z.object({ status: z.string(), notes: z.string().optional() }).parse(req.body);
    return reply.send({ appointment: await svc.updateAppointmentStatus(shopId, req.auth!, id, status, notes) });
  });

  // Customer: book
  app.post('/grooming/appointments', { preHandler: [app.authenticate, app.requireCustomer] }, async (req, reply) => {
    const body = bookSchema.parse(req.body);
    return reply.status(201).send({ appointment: await svc.bookAppointment(req.auth!, body) });
  });
}
