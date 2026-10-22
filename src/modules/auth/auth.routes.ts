import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  loginWithPassword,
  refreshTokens,
  revokeRefreshToken,
  initiatePasswordReset,
  completePasswordReset,
} from './auth.service.js';
import { env } from '../../config/env.js';

const loginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
  shopSlug: z.string().optional(),
});

const refreshSchema = z.object({ refreshToken: z.string().min(1) });
const forgotSchema = z.object({ email: z.string().email() });
const resetSchema = z.object({ token: z.string().min(1), newPassword: z.string().min(8) });

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/login', async (req, reply) => {
    const body = loginSchema.parse(req.body);
    const result = await loginWithPassword(app, body);
    return reply.send(result);
  });

  app.post('/auth/refresh', async (req, reply) => {
    const { refreshToken } = refreshSchema.parse(req.body);
    const result = await refreshTokens(app, refreshToken);
    return reply.send(result);
  });

  app.post('/auth/logout', async (req, reply) => {
    const { refreshToken } = refreshSchema.parse(req.body);
    await revokeRefreshToken(refreshToken);
    return reply.send({ ok: true });
  });

  app.post('/auth/forgot-password', async (req, reply) => {
    const { email } = forgotSchema.parse(req.body);
    const token = await initiatePasswordReset(email);
    // In non-production we return the token to make testing possible.
    const payload: Record<string, unknown> = { ok: true };
    if (env.NODE_ENV !== 'production' && token) payload.devResetToken = token;
    return reply.send(payload);
  });

  app.post('/auth/reset-password', async (req, reply) => {
    const { token, newPassword } = resetSchema.parse(req.body);
    await completePasswordReset(token, newPassword);
    return reply.send({ ok: true });
  });

  // Returns the current authenticated identity + resolved permissions.
  app.get('/auth/me', { preHandler: app.authenticate }, async (req, reply) => {
    return reply.send({ auth: req.auth });
  });
}
