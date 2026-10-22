/**
 * Central permission catalog. Permissions are checked in the backend on every
 * protected route. UI visibility is a convenience only; it never grants access.
 *
 * Convention: "<domain>:<action>". Keep this list the single source of truth.
 */
export const PERMISSIONS = {
  // Shop administration
  SHOP_MANAGE: 'shop:manage',
  SHOP_VIEW: 'shop:view',
  BRANCH_MANAGE: 'branch:manage',
  MODULE_MANAGE: 'module:manage',
  BRANDING_MANAGE: 'branding:manage',

  // Employees & roles
  EMPLOYEE_MANAGE: 'employee:manage',
  EMPLOYEE_VIEW: 'employee:view',
  ROLE_MANAGE: 'role:manage',

  // Customers & pets
  CUSTOMER_VIEW: 'customer:view',
  CUSTOMER_MANAGE: 'customer:manage',
  PET_VIEW: 'pet:view',
  PET_MANAGE: 'pet:manage',

  // Catalog & inventory
  PRODUCT_VIEW: 'product:view',
  PRODUCT_MANAGE: 'product:manage',
  INVENTORY_VIEW: 'inventory:view',
  INVENTORY_MANAGE: 'inventory:manage',
  SUPPLIER_MANAGE: 'supplier:manage',

  // Boarding
  BOARDING_PACKAGE_MANAGE: 'boarding:package:manage',
  BOARDING_RESERVATION_VIEW: 'boarding:reservation:view',
  BOARDING_RESERVATION_MANAGE: 'boarding:reservation:manage',
  BOARDING_CARE_VIEW: 'boarding:care:view',
  BOARDING_CARE_COMPLETE: 'boarding:care:complete',

  // Grooming
  GROOMING_SERVICE_MANAGE: 'grooming:service:manage',
  GROOMING_APPOINTMENT_VIEW: 'grooming:appointment:view',
  GROOMING_APPOINTMENT_MANAGE: 'grooming:appointment:manage',

  // Billing & POS (foundations for later milestones)
  POS_OPERATE: 'pos:operate',
  INVOICE_VIEW: 'invoice:view',

  // Reports
  REPORT_VIEW: 'report:view',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS = Object.values(PERMISSIONS) as Permission[];

/**
 * Default role templates seeded per shop. A shop admin can clone/customise.
 * SHOP_OWNER is special: it implicitly holds every permission.
 */
export const DEFAULT_ROLES: Record<string, { description: string; permissions: Permission[] }> = {
  SHOP_OWNER: {
    description: 'Full access to all shop administration and operations',
    permissions: ALL_PERMISSIONS,
  },
  MANAGER: {
    description: 'Operational and staff management for the branch',
    permissions: [
      PERMISSIONS.SHOP_VIEW,
      PERMISSIONS.EMPLOYEE_VIEW,
      PERMISSIONS.CUSTOMER_VIEW,
      PERMISSIONS.CUSTOMER_MANAGE,
      PERMISSIONS.PET_VIEW,
      PERMISSIONS.PRODUCT_VIEW,
      PERMISSIONS.INVENTORY_VIEW,
      PERMISSIONS.BOARDING_RESERVATION_VIEW,
      PERMISSIONS.BOARDING_RESERVATION_MANAGE,
      PERMISSIONS.BOARDING_CARE_VIEW,
      PERMISSIONS.GROOMING_APPOINTMENT_VIEW,
      PERMISSIONS.GROOMING_APPOINTMENT_MANAGE,
      PERMISSIONS.POS_OPERATE,
      PERMISSIONS.INVOICE_VIEW,
      PERMISSIONS.REPORT_VIEW,
    ],
  },
  CASHIER: {
    description: 'Point of sale and billing operations',
    permissions: [
      PERMISSIONS.POS_OPERATE,
      PERMISSIONS.INVOICE_VIEW,
      PERMISSIONS.PRODUCT_VIEW,
      PERMISSIONS.INVENTORY_VIEW,
      PERMISSIONS.CUSTOMER_VIEW,
    ],
  },
  INVENTORY_MANAGER: {
    description: 'Product and stock management',
    permissions: [
      PERMISSIONS.PRODUCT_VIEW,
      PERMISSIONS.PRODUCT_MANAGE,
      PERMISSIONS.INVENTORY_VIEW,
      PERMISSIONS.INVENTORY_MANAGE,
      PERMISSIONS.SUPPLIER_MANAGE,
    ],
  },
  GROOMER: {
    description: 'Grooming appointments and service tasks',
    permissions: [
      PERMISSIONS.GROOMING_APPOINTMENT_VIEW,
      PERMISSIONS.GROOMING_APPOINTMENT_MANAGE,
      PERMISSIONS.PET_VIEW,
      PERMISSIONS.CUSTOMER_VIEW,
    ],
  },
  BOARDING_STAFF: {
    description: 'Boarding reservations and pet care tasks',
    permissions: [
      PERMISSIONS.BOARDING_RESERVATION_VIEW,
      PERMISSIONS.BOARDING_CARE_VIEW,
      PERMISSIONS.BOARDING_CARE_COMPLETE,
      PERMISSIONS.PET_VIEW,
      PERMISSIONS.CUSTOMER_VIEW,
    ],
  },
};
