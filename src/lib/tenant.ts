import type { AuthContext } from '../auth/types.js';
import { Forbidden } from './errors.js';

/**
 * Resolves the shopId an employee request operates on and asserts the actor is
 * allowed to act on that shop. Platform admins must pass an explicit shopId
 * (no silent, un-scoped access to all tenants).
 */
export function resolveShopScope(auth: AuthContext, requestedShopId?: string): string {
  if (auth.type === 'EMPLOYEE') {
    if (!auth.shopId) throw Forbidden('Employee is not linked to a shop');
    if (requestedShopId && requestedShopId !== auth.shopId) {
      throw Forbidden('Cross-tenant access is not permitted');
    }
    return auth.shopId;
  }
  if (auth.type === 'PLATFORM_ADMIN') {
    if (!requestedShopId) {
      throw Forbidden('Platform admin must specify a shopId for shop-scoped access');
    }
    return requestedShopId;
  }
  throw Forbidden('Not authorised for shop-scoped access');
}

/**
 * Asserts that a loaded record belongs to the actor's shop scope.
 */
export function assertSameShop(auth: AuthContext, recordShopId: string): void {
  if (auth.type === 'PLATFORM_ADMIN') return; // admin access is explicit/audited elsewhere
  if (auth.shopId !== recordShopId) {
    throw Forbidden('Record belongs to a different shop');
  }
}

/**
 * For branch-scoped employees (e.g. boarding staff assigned to one branch),
 * restricts data to their branch when they are not shop-wide managers.
 */
export function branchFilter(auth: AuthContext): { branchId?: string } {
  if (auth.type === 'EMPLOYEE' && auth.branchId) {
    return { branchId: auth.branchId };
  }
  return {};
}
