import { prisma } from '../../lib/prisma.js';
import { BadRequest, Conflict, NotFound } from '../../lib/errors.js';
import { writeAudit } from '../../lib/audit.js';
import { hashPassword } from '../../auth/password.js';
import { ALL_PERMISSIONS, type Permission } from '../../auth/permissions.js';

function validatePermissions(perms: string[]): asserts perms is Permission[] {
  const allowed = new Set<string>(ALL_PERMISSIONS);
  const bad = perms.filter((p) => !allowed.has(p));
  if (bad.length) throw BadRequest(`Unknown permission(s): ${bad.join(', ')}`);
}

export async function listRoles(shopId: string) {
  return prisma.role.findMany({ where: { shopId }, orderBy: { key: 'asc' } });
}

export async function createRole(
  shopId: string,
  data: { key: string; description?: string; permissions: string[] },
  actorId: string,
) {
  validatePermissions(data.permissions);
  const role = await prisma.role.create({
    data: {
      shopId,
      key: data.key.toUpperCase().replace(/\s+/g, '_'),
      description: data.description,
      permissions: data.permissions,
    },
  });
  await writeAudit({ shopId, actorId, action: 'ROLE_CREATED', entityType: 'Role', entityId: role.id });
  return role;
}

export async function updateRole(
  shopId: string,
  roleId: string,
  data: { description?: string; permissions?: string[] },
  actorId: string,
) {
  const role = await prisma.role.findFirst({ where: { id: roleId, shopId } });
  if (!role) throw NotFound('Role not found');
  if (data.permissions) validatePermissions(data.permissions);
  const updated = await prisma.role.update({
    where: { id: roleId },
    data: { description: data.description, permissions: data.permissions },
  });
  await writeAudit({ shopId, actorId, action: 'ROLE_UPDATED', entityType: 'Role', entityId: roleId });
  return updated;
}

export interface CreateEmployeeInput {
  username: string;
  fullName: string;
  email?: string;
  phone?: string;
  roleKey: string;
  branchId?: string;
  initialPassword: string;
  extraPermissions?: string[];
}

export async function createEmployee(
  shopId: string,
  input: CreateEmployeeInput,
  actorId: string,
) {
  if (input.initialPassword.length < 8) {
    throw BadRequest('Initial password must be at least 8 characters');
  }
  if (input.extraPermissions?.length) validatePermissions(input.extraPermissions);

  const role = await prisma.role.findFirst({
    where: { shopId, key: input.roleKey.toUpperCase() },
  });
  if (!role) throw BadRequest(`Role '${input.roleKey}' does not exist for this shop`);

  if (input.branchId) {
    const branch = await prisma.branch.findFirst({ where: { id: input.branchId, shopId } });
    if (!branch) throw BadRequest('Branch does not belong to this shop');
  }

  const dupUsername = await prisma.employee.findUnique({
    where: { shopId_username: { shopId, username: input.username } },
  });
  if (dupUsername) throw Conflict('Username already exists in this shop');

  if (input.email) {
    const dupEmail = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (dupEmail) throw Conflict('A user with this email already exists');
  }

  const passwordHash = await hashPassword(input.initialPassword);

  const employee = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        type: 'EMPLOYEE',
        email: input.email?.toLowerCase(),
        phone: input.phone,
        passwordHash,
      },
    });
    return tx.employee.create({
      data: {
        userId: user.id,
        shopId,
        branchId: input.branchId,
        username: input.username,
        fullName: input.fullName,
        roleId: role.id,
        extraPermissions: input.extraPermissions ?? [],
      },
      include: { role: true, branch: true },
    });
  });

  await writeAudit({
    shopId,
    actorId,
    action: 'EMPLOYEE_CREATED',
    entityType: 'Employee',
    entityId: employee.id,
    metadata: { username: input.username, roleKey: role.key },
  });

  // Never return the password hash.
  return sanitizeEmployee(employee);
}

export async function listEmployees(shopId: string) {
  const employees = await prisma.employee.findMany({
    where: { shopId },
    include: { role: true, branch: true },
    orderBy: { createdAt: 'asc' },
  });
  return employees.map(sanitizeEmployee);
}

export async function changeEmployeeRole(
  shopId: string,
  employeeId: string,
  roleKey: string,
  actorId: string,
) {
  const employee = await prisma.employee.findFirst({ where: { id: employeeId, shopId } });
  if (!employee) throw NotFound('Employee not found');
  const role = await prisma.role.findFirst({ where: { shopId, key: roleKey.toUpperCase() } });
  if (!role) throw BadRequest(`Role '${roleKey}' does not exist`);
  const updated = await prisma.employee.update({
    where: { id: employeeId },
    data: { roleId: role.id },
    include: { role: true, branch: true },
  });
  await writeAudit({
    shopId,
    actorId,
    action: 'EMPLOYEE_ROLE_CHANGED',
    entityType: 'Employee',
    entityId: employeeId,
    metadata: { roleKey: role.key },
  });
  return sanitizeEmployee(updated);
}

export async function setEmployeeActive(
  shopId: string,
  employeeId: string,
  isActive: boolean,
  actorId: string,
) {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, shopId },
    include: { role: true },
  });
  if (!employee) throw NotFound('Employee not found');
  if (employee.role.key === 'SHOP_OWNER' && !isActive) {
    const activeOwners = await prisma.employee.count({
      where: { shopId, isActive: true, role: { key: 'SHOP_OWNER' } },
    });
    if (activeOwners <= 1) throw BadRequest('Cannot deactivate the only active shop owner');
  }
  const updated = await prisma.$transaction(async (tx) => {
    const emp = await tx.employee.update({
      where: { id: employeeId },
      data: { isActive },
      include: { role: true, branch: true },
    });
    await tx.user.update({ where: { id: emp.userId }, data: { isActive } });
    if (!isActive) {
      await tx.refreshToken.updateMany({
        where: { userId: emp.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return emp;
  });
  await writeAudit({
    shopId,
    actorId,
    action: isActive ? 'EMPLOYEE_ACTIVATED' : 'EMPLOYEE_DEACTIVATED',
    entityType: 'Employee',
    entityId: employeeId,
  });
  return sanitizeEmployee(updated);
}

function sanitizeEmployee<T extends { id: string }>(employee: T) {
  // Employee records never contain passwordHash (that's on User), but strip the
  // userId from client output to avoid leaking the identity link.
  const { ...rest } = employee as Record<string, unknown>;
  delete rest.userId;
  return rest;
}
