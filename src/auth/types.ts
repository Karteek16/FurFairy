import type { UserType } from '@prisma/client';
import type { Permission } from './permissions.js';

/** The resolved identity attached to each authenticated request. */
export interface AuthContext {
  userId: string;
  type: UserType;
  // Present for employees:
  employeeId?: string;
  shopId?: string;
  branchId?: string | null;
  roleKey?: string;
  permissions: Permission[];
  // Present for customers:
  customerId?: string;
}

/** JWT payload we sign. Kept small; permissions are resolved per-request. */
export interface AccessTokenPayload {
  sub: string; // userId
  type: UserType;
}
