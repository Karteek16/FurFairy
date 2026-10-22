import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { PERMISSIONS } from '../../auth/permissions.js';
import { resolveShopScope } from '../../lib/tenant.js';
import * as svc from './employee.service.js';

const createEmployeeSchema = z.object({
  username: z.string().min(2).regex(/^[a-zA-Z0-9._-]+$/, 'Invalid username characters'),
  fullName: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().min(6).optional(),
  roleKey: z.string().min(1),
  branchId: z.string().optional(),
  initialPassword: z.string().min(8),
  extraPermissions: z.array(z.string()).optional(),
});

const createRoleSchema = z.object({
  key: z.string().min(2),
  description: z.string().optional(),
  permissions: z.array(z.string()),
});

const updateRoleSchema = z.object({
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
});

export async function employeeRoutes(app: FastifyInstance) {
  // Roles
  app.get(
    '/my-shop/roles',
    { preHandler: [app.authenticate, app.requirePermissions(PERMISSIONS.EMPLOYEE_VIEW)] },
    async (req, reply) => {
      const shopId = resolveShopScope(req.auth!);
      return reply.send({ roles: await svc.listRoles(shopId) });
    },
  );

  app.post(
    '/my-shop/roles',
    { preHandler: [app.authenticate, app.requirePermissions(PERMISSIONS.ROLE_MANAGE)] },
    async (req, reply) => {
      const shopId = resolveShopScope(req.auth!);
      const body = createRoleSchema.parse(req.body);
      return reply.status(201).send({ role: await svc.createRole(shopId, body, req.auth!.userId) });
    },
  );

  app.put(
    '/my-shop/roles/:id',
    { preHandler: [app.authenticate, app.requirePermissions(PERMISSIONS.ROLE_MANAGE)] },
    async (req, reply) => {
      const shopId = resolveShopScope(req.auth!);
      const { id } = z.object({ id: z.string() }).parse(req.params);
      const body = updateRoleSchema.parse(req.body);
      return reply.send({ role: await svc.updateRole(shopId, id, body, req.auth!.userId) });
    },
  );

  // Employees
  app.get(
    '/my-shop/employees',
    { preHandler: [app.authenticate, app.requirePermissions(PERMISSIONS.EMPLOYEE_VIEW)] },
    async (req, reply) => {
      const shopId = resolveShopScope(req.auth!);
      return reply.send({ employees: await svc.listEmployees(shopId) });
    },
  );

  app.post(
    '/my-shop/employees',
    { preHandler: [app.authenticate, app.requirePermissions(PERMISSIONS.EMPLOYEE_MANAGE)] },
    async (req, reply) => {
      const shopId = resolveShopScope(req.auth!);
      const body = createEmployeeSchema.parse(req.body);
      return reply.status(201).send({ employee: await svc.createEmployee(shopId, body, req.auth!.userId) });
    },
  );

  app.put(
    '/my-shop/employees/:id/role',
    { preHandler: [app.authenticate, app.requirePermissions(PERMISSIONS.EMPLOYEE_MANAGE)] },
    async (req, reply) => {
      const shopId = resolveShopScope(req.auth!);
      const { id } = z.object({ id: z.string() }).parse(req.params);
      const { roleKey } = z.object({ roleKey: z.string() }).parse(req.body);
      return reply.send({ employee: await svc.changeEmployeeRole(shopId, id, roleKey, req.auth!.userId) });
    },
  );

  app.put(
    '/my-shop/employees/:id/active',
    { preHandler: [app.authenticate, app.requirePermissions(PERMISSIONS.EMPLOYEE_MANAGE)] },
    async (req, reply) => {
      const shopId = resolveShopScope(req.auth!);
      const { id } = z.object({ id: z.string() }).parse(req.params);
      const { isActive } = z.object({ isActive: z.boolean() }).parse(req.body);
      return reply.send({ employee: await svc.setEmployeeActive(shopId, id, isActive, req.auth!.userId) });
    },
  );
}
