import type { FastifyInstance, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { Forbidden, Unauthorized } from '../lib/errors.js';
import type { AccessTokenPayload, AuthContext } from '../auth/types.js';
import { PERMISSIONS, type Permission } from '../auth/permissions.js';

declare module 'fastify' {
  interface FastifyRequest {
    auth?: AuthContext;
  }
  interface FastifyInstance {
    /** Verifies the bearer token and loads the full auth context. */
    authenticate: (req: FastifyRequest) => Promise<void>;
    /** Requires an authenticated employee holding every listed permission. */
    requirePermissions: (
      ...perms: Permission[]
    ) => (req: FastifyRequest) => Promise<void>;
    /** Requires a platform admin. */
    requirePlatformAdmin: (req: FastifyRequest) => Promise<void>;
    /** Requires an authenticated customer. */
    requireCustomer: (req: FastifyRequest) => Promise<void>;
  }
}

async function loadAuthContext(userId: string): Promise<AuthContext | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      employee: { include: { role: true } },
      customer: true,
    },
  });
  if (!user || !user.isActive) return null;

  if (user.type === 'EMPLOYEE' && user.employee) {
    const emp = user.employee;
    if (!emp.isActive) return null;
    const rolePerms = (emp.role?.permissions ?? []) as Permission[];
    const extra = (emp.extraPermissions ?? []) as Permission[];
    const permissions = Array.from(new Set([...rolePerms, ...extra]));
    return {
      userId: user.id,
      type: user.type,
      employeeId: emp.id,
      shopId: emp.shopId,
      branchId: emp.branchId,
      roleKey: emp.role?.key,
      permissions,
    };
  }

  if (user.type === 'CUSTOMER' && user.customer) {
    return {
      userId: user.id,
      type: user.type,
      customerId: user.customer.id,
      permissions: [],
    };
  }

  if (user.type === 'PLATFORM_ADMIN') {
    // Platform admin implicitly holds all permissions, but tenant-scoped routes
    // still require explicit, audited access rather than silent bypass.
    return {
      userId: user.id,
      type: user.type,
      permissions: Object.values(PERMISSIONS) as Permission[],
    };
  }

  return null;
}

export const authPlugin = fp(async (app: FastifyInstance) => {
  await app.register(jwt, {
    secret: env.JWT_ACCESS_SECRET,
  });

  app.decorate('authenticate', async (req: FastifyRequest) => {
    let payload: AccessTokenPayload;
    try {
      payload = await req.jwtVerify<AccessTokenPayload>();
    } catch {
      throw Unauthorized('Invalid or expired token');
    }
    const ctx = await loadAuthContext(payload.sub);
    if (!ctx) throw Unauthorized('Account not found or inactive');
    req.auth = ctx;
  });

  app.decorate('requirePermissions', (...perms: Permission[]) => {
    return async (req: FastifyRequest) => {
      if (!req.auth) throw Unauthorized();
      if (req.auth.type === 'CUSTOMER') {
        throw Forbidden('Customers cannot access shop operations');
      }
      const held = new Set(req.auth.permissions);
      const missing = perms.filter((p) => !held.has(p));
      if (missing.length > 0) {
        throw Forbidden(`Missing permission(s): ${missing.join(', ')}`);
      }
    };
  });

  app.decorate('requirePlatformAdmin', async (req: FastifyRequest) => {
    if (!req.auth) throw Unauthorized();
    if (req.auth.type !== 'PLATFORM_ADMIN') {
      throw Forbidden('Platform administrator access required');
    }
  });

  app.decorate('requireCustomer', async (req: FastifyRequest) => {
    if (!req.auth) throw Unauthorized();
    if (req.auth.type !== 'CUSTOMER') {
      throw Forbidden('Customer access required');
    }
  });
});
