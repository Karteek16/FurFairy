import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env.js';
import { authPlugin } from './plugins/auth.js';
import { errorHandlerPlugin } from './plugins/error-handler.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { shopRoutes } from './modules/shop/shop.routes.js';
import { employeeRoutes } from './modules/employee/employee.routes.js';
import { customerRoutes } from './modules/customer/customer.routes.js';
import { catalogRoutes } from './modules/catalog/catalog.routes.js';
import { boardingRoutes } from './modules/boarding/boarding.routes.js';
import { groomingRoutes } from './modules/grooming/grooming.routes.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger:
      env.NODE_ENV === 'development'
        ? { transport: { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } } }
        : true,
  });

  await app.register(helmet, { contentSecurityPolicy: false });

  // In production, restrict CORS to the configured origins (e.g. furfairy.in).
  // In development, reflect any origin so the Vite dev server works.
  const allowedOrigins = (env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  await app.register(cors, {
    credentials: true,
    origin:
      env.NODE_ENV !== 'production' || allowedOrigins.length === 0
        ? true
        : allowedOrigins,
  });
  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW,
  });

  await app.register(errorHandlerPlugin);
  await app.register(authPlugin);

  // Health & meta
  app.get('/health', async () => ({
    status: 'ok',
    integrationMode: env.INTEGRATION_MODE,
    time: new Date().toISOString(),
  }));

  // API v1
  await app.register(
    async (api) => {
      await api.register(authRoutes);
      await api.register(shopRoutes);
      await api.register(employeeRoutes);
      await api.register(customerRoutes);
      await api.register(catalogRoutes);
      await api.register(boardingRoutes);
      await api.register(groomingRoutes);
    },
    { prefix: '/api/v1' },
  );

  return app;
}
