import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';

/**
 * Single shared Prisma client. In development we attach it to globalThis to
 * avoid exhausting connections during hot-reload.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
