import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { env } from '../../config/env.js';
import * as svc from './customer.service.js';

const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6).optional(),
  password: z.string().min(8),
});

const otpRequestSchema = z.object({ phone: z.string().min(6) });
const otpVerifySchema = z.object({
  phone: z.string().min(6),
  code: z.string().min(4),
  fullName: z.string().optional(),
});

const petSchema = z.object({
  name: z.string().min(1),
  species: z.string().min(1),
  breed: z.string().optional(),
  sizeClass: z.enum(['SMALL', 'MEDIUM', 'LARGE']).optional(),
  birthDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

const petUpdateSchema = petSchema.partial();

const docSchema = z.object({ docType: z.string().min(1), fileUrl: z.string().url() });
const vaxSchema = z.object({
  name: z.string().min(1),
  givenOn: z.string().datetime(),
  dueOn: z.string().datetime().optional(),
});

export async function customerRoutes(app: FastifyInstance) {
  // ── Public registration / auth ──
  app.post('/customers/register', async (req, reply) => {
    const body = registerSchema.parse(req.body);
    const result = await svc.registerCustomerByEmail(body);
    return reply.status(201).send({ customer: result });
  });

  app.post('/customers/otp/request', async (req, reply) => {
    const { phone } = otpRequestSchema.parse(req.body);
    const result = svc.requestOtp(phone);
    const payload: Record<string, unknown> = { ok: true, message: 'OTP sent (sandbox mode)' };
    if (env.NODE_ENV !== 'production') payload.devOtp = result.devOtp;
    return reply.send(payload);
  });

  app.post('/customers/otp/verify', async (req, reply) => {
    const { phone, code, fullName } = otpVerifySchema.parse(req.body);
    const result = await svc.verifyOtpAndLogin(app, phone, code, fullName);
    return reply.send(result);
  });

  // ── Authenticated customer ──
  app.get(
    '/me/profile',
    { preHandler: [app.authenticate, app.requireCustomer] },
    async (req, reply) => reply.send({ profile: await svc.getMyProfile(req.auth!) }),
  );

  app.get(
    '/me/pets',
    { preHandler: [app.authenticate, app.requireCustomer] },
    async (req, reply) => reply.send({ pets: await svc.listMyPets(req.auth!) }),
  );

  app.post(
    '/me/pets',
    { preHandler: [app.authenticate, app.requireCustomer] },
    async (req, reply) => {
      const body = petSchema.parse(req.body);
      return reply.status(201).send({ pet: await svc.createPet(req.auth!, body) });
    },
  );

  app.put(
    '/me/pets/:id',
    { preHandler: [app.authenticate, app.requireCustomer] },
    async (req, reply) => {
      const { id } = z.object({ id: z.string() }).parse(req.params);
      const body = petUpdateSchema.parse(req.body);
      const data = { ...body, birthDate: body.birthDate ? new Date(body.birthDate) : undefined };
      return reply.send({ pet: await svc.updatePet(req.auth!, id, data as never) });
    },
  );

  app.post(
    '/me/pets/:id/documents',
    { preHandler: [app.authenticate, app.requireCustomer] },
    async (req, reply) => {
      const { id } = z.object({ id: z.string() }).parse(req.params);
      const body = docSchema.parse(req.body);
      return reply.status(201).send({ document: await svc.addPetDocument(req.auth!, id, body) });
    },
  );

  app.post(
    '/me/pets/:id/vaccinations',
    { preHandler: [app.authenticate, app.requireCustomer] },
    async (req, reply) => {
      const { id } = z.object({ id: z.string() }).parse(req.params);
      const body = vaxSchema.parse(req.body);
      return reply.status(201).send({ vaccination: await svc.addVaccination(req.auth!, id, body) });
    },
  );
}
