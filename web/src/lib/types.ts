// Shared response types mirroring the backend API shapes we consume.

export type UserType = 'PLATFORM_ADMIN' | 'EMPLOYEE' | 'CUSTOMER';

export interface AuthContext {
  userId: string;
  type: UserType;
  employeeId?: string;
  shopId?: string;
  branchId?: string | null;
  roleKey?: string;
  permissions: string[];
  customerId?: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken?: string;
  user: { id: string; type: string };
}

export interface Shop {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  status: string;
  ownerName?: string;
  ownerEmail?: string;
  branding?: { logoUrl?: string | null; primaryColor?: string | null } | null;
  shopModules?: { status: string; module: { key: string; name: string } }[];
  branches?: Branch[];
  boardingPackages?: BoardingPackage[];
  groomingServices?: GroomingService[];
}

export interface Branch {
  id: string;
  name: string;
  city: string;
  state: string;
  pincode: string;
  addressLine1: string;
}

export type BoardingTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
export type BoardingPackageStatus =
  | 'DRAFT'
  | 'COMING_SOON'
  | 'ACTIVE'
  | 'TEMPORARILY_UNAVAILABLE'
  | 'DISABLED';

export interface BoardingPackage {
  id: string;
  tier: BoardingTier;
  name: string;
  description?: string | null;
  status: BoardingPackageStatus;
  pricePerNightPaise: number;
  capacity: number;
  inclusions?: Record<string, unknown> | null;
}

export interface GroomingService {
  id: string;
  name: string;
  description?: string | null;
  basePricePaise: number;
  durationMinutes: number;
  petType?: string | null;
  inStoreAvailable: boolean;
  homeServiceAvailable: boolean;
  depositPaise: number;
  serviceAreaPincodes: string[];
  isActive: boolean;
}

export interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string | null;
  sizeClass?: string | null;
}

export interface Role {
  id: string;
  key: string;
  description?: string | null;
  permissions: string[];
}

export interface Employee {
  id: string;
  username: string;
  fullName: string;
  isActive: boolean;
  role?: Role;
  branch?: Branch | null;
}

export interface Product {
  id: string;
  name: string;
  description?: string | null;
  variants: {
    id: string;
    sku: string;
    packSize?: string | null;
    pricePaise: number;
    mrpPaise?: number | null;
  }[];
}

export interface Reservation {
  id: string;
  reference: string;
  status: string;
  checkIn: string;
  checkOut: string;
  totalPaise: number;
  transportType: string;
  pet?: Pet;
  customer?: { fullName: string };
  package?: { tier: string; name: string };
}

export interface Appointment {
  id: string;
  reference: string;
  status: string;
  startsAt: string;
  endsAt: string;
  location: string;
  pricePaise: number;
  pet?: Pet;
  customer?: { fullName: string };
  service?: { name: string };
  staff?: { fullName: string } | null;
}

export function formatINR(paise: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(paise / 100);
}
