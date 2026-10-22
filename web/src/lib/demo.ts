// Demo data for UI preview mode. This lets every screen render without the API
// or a database. When we move to integration, these are replaced by live calls.
import type {
  Appointment,
  BoardingPackage,
  Employee,
  GroomingService,
  Pet,
  Product,
  Reservation,
  Role,
  Shop,
} from './types';

export const demoShops: Shop[] = [
  {
    id: 'shop_happy',
    name: 'Happy Tails',
    slug: 'happy-tails',
    description: 'Boarding, grooming and retail for dogs and cats in central Bengaluru.',
    status: 'APPROVED',
    branding: { primaryColor: '#3b6ef5', logoUrl: null },
    shopModules: [
      { status: 'ENABLED', module: { key: 'BOARDING', name: 'Boarding' } },
      { status: 'ENABLED', module: { key: 'GROOMING', name: 'Grooming' } },
      { status: 'ENABLED', module: { key: 'RETAIL', name: 'Retail' } },
    ],
    branches: [
      { id: 'br1', name: 'Main Branch', city: 'Bengaluru', state: 'Karnataka', pincode: '560001', addressLine1: '12 MG Road' },
    ],
  },
  {
    id: 'shop_paws',
    name: 'Pampered Paws',
    slug: 'pampered-paws',
    description: 'Premium grooming salon with home-service across the city.',
    status: 'APPROVED',
    branding: { primaryColor: '#8b5cf6', logoUrl: null },
    shopModules: [{ status: 'ENABLED', module: { key: 'GROOMING', name: 'Grooming' } }],
    branches: [
      { id: 'br2', name: 'Indiranagar', city: 'Bengaluru', state: 'Karnataka', pincode: '560038', addressLine1: '100 Ft Road' },
    ],
  },
  {
    id: 'shop_woof',
    name: 'Woof Resort',
    slug: 'woof-resort',
    description: 'Spacious boarding resort with large play areas.',
    status: 'APPROVED',
    branding: { primaryColor: '#059669', logoUrl: null },
    shopModules: [
      { status: 'ENABLED', module: { key: 'BOARDING', name: 'Boarding' } },
      { status: 'ENABLED', module: { key: 'SUPPLIES', name: 'Supplies' } },
    ],
    branches: [
      { id: 'br3', name: 'Whitefield', city: 'Bengaluru', state: 'Karnataka', pincode: '560066', addressLine1: 'EPIP Zone' },
    ],
  },
];

export const demoPackages: BoardingPackage[] = [
  {
    id: 'pkg_bronze',
    tier: 'BRONZE',
    name: 'Bronze — Basic',
    status: 'ACTIVE',
    pricePerNightPaise: 50000,
    capacity: 10,
    description: 'Comfortable kennel stay with daily feeding and a short walk.',
    inclusions: { foodType: 'Shop standard', mealFrequency: 2, walks: 1 },
  },
  {
    id: 'pkg_silver',
    tier: 'SILVER',
    name: 'Silver — Advanced',
    status: 'ACTIVE',
    pricePerNightPaise: 80000,
    capacity: 6,
    description: 'Premium food, extra walks and a basic grooming touch-up.',
    inclusions: { foodType: 'Premium', mealFrequency: 3, walks: 2, grooming: 'basic' },
  },
  {
    id: 'pkg_gold',
    tier: 'GOLD',
    name: 'Gold',
    status: 'COMING_SOON',
    pricePerNightPaise: 120000,
    capacity: 4,
    description: 'Spacious suite. Optional camera access (coming soon).',
    inclusions: { note: 'Shop-configurable; camera access optional' },
  },
  {
    id: 'pkg_platinum',
    tier: 'PLATINUM',
    name: 'Platinum',
    status: 'COMING_SOON',
    pricePerNightPaise: 180000,
    capacity: 2,
    description: 'Luxury suite with premium care services.',
    inclusions: { note: 'Shop-configurable premium services' },
  },
];

export const demoServices: GroomingService[] = [
  {
    id: 'svc_full',
    name: 'Full Grooming',
    description: 'Bath, haircut, nail trim, ear cleaning.',
    basePricePaise: 70000,
    durationMinutes: 90,
    petType: 'DOG',
    inStoreAvailable: true,
    homeServiceAvailable: true,
    depositPaise: 20000,
    serviceAreaPincodes: ['560001', '560038'],
    isActive: true,
  },
  {
    id: 'svc_bath',
    name: 'Bath & Brush',
    description: 'Quick wash and blow dry.',
    basePricePaise: 40000,
    durationMinutes: 45,
    petType: 'ANY',
    inStoreAvailable: true,
    homeServiceAvailable: false,
    depositPaise: 0,
    serviceAreaPincodes: [],
    isActive: true,
  },
];

export const demoPets: Pet[] = [
  { id: 'pet_bruno', name: 'Bruno', species: 'DOG', breed: 'Labrador', sizeClass: 'LARGE' },
  { id: 'pet_milo', name: 'Milo', species: 'CAT', breed: 'Persian', sizeClass: 'SMALL' },
];

export const demoReservations: Reservation[] = [
  {
    id: 'res1',
    reference: 'BRD-8F2A',
    status: 'CONFIRMED',
    checkIn: '2026-11-01T10:00:00.000Z',
    checkOut: '2026-11-04T10:00:00.000Z',
    totalPaise: 150000,
    transportType: 'IN_STORE',
    pet: demoPets[0],
    customer: { fullName: 'Anita Sharma' },
    package: { tier: 'BRONZE', name: 'Bronze — Basic' },
  },
  {
    id: 'res2',
    reference: 'BRD-1C7D',
    status: 'PENDING',
    checkIn: '2026-11-10T09:00:00.000Z',
    checkOut: '2026-11-12T09:00:00.000Z',
    totalPaise: 160000,
    transportType: 'HOME',
    pet: demoPets[1],
    customer: { fullName: 'Rahul Verma' },
    package: { tier: 'SILVER', name: 'Silver — Advanced' },
  },
];

export const demoAppointments: Appointment[] = [
  {
    id: 'apt1',
    reference: 'GRM-4B9E',
    status: 'CONFIRMED',
    startsAt: '2026-11-05T09:00:00.000Z',
    endsAt: '2026-11-05T10:30:00.000Z',
    location: 'IN_STORE',
    pricePaise: 90000,
    pet: demoPets[0],
    customer: { fullName: 'Anita Sharma' },
    service: { name: 'Full Grooming' },
    staff: { fullName: 'Priya (Groomer)' },
  },
  {
    id: 'apt2',
    reference: 'GRM-2D6F',
    status: 'PENDING',
    startsAt: '2026-11-06T14:00:00.000Z',
    endsAt: '2026-11-06T14:45:00.000Z',
    location: 'HOME',
    pricePaise: 40000,
    pet: demoPets[1],
    customer: { fullName: 'Rahul Verma' },
    service: { name: 'Bath & Brush' },
    staff: null,
  },
];

export const demoRoles: Role[] = [
  { id: 'r_owner', key: 'SHOP_OWNER', description: 'Full access', permissions: [] },
  { id: 'r_mgr', key: 'MANAGER', description: 'Operations & staff', permissions: [] },
  { id: 'r_cashier', key: 'CASHIER', description: 'Billing', permissions: [] },
  { id: 'r_groomer', key: 'GROOMER', description: 'Grooming tasks', permissions: [] },
  { id: 'r_board', key: 'BOARDING_STAFF', description: 'Boarding care', permissions: [] },
];

export const demoEmployees: Employee[] = [
  { id: 'e1', username: 'owner', fullName: 'Demo Owner', isActive: true, role: demoRoles[0] },
  { id: 'e2', username: 'priya', fullName: 'Priya Nair', isActive: true, role: demoRoles[3] },
  { id: 'e3', username: 'ravi', fullName: 'Ravi Kumar', isActive: true, role: demoRoles[4] },
  { id: 'e4', username: 'sana', fullName: 'Sana Khan', isActive: false, role: demoRoles[2] },
];

export const demoProducts: Product[] = [
  {
    id: 'p1',
    name: 'Chicken & Rice Dog Food',
    description: 'Complete adult dog food.',
    variants: [
      { id: 'v1', sku: 'DOGFOOD-1KG', packSize: '1kg', pricePaise: 45000, mrpPaise: 50000 },
      { id: 'v2', sku: 'DOGFOOD-5KG', packSize: '5kg', pricePaise: 200000, mrpPaise: 220000 },
    ],
  },
  {
    id: 'p2',
    name: 'Catnip Mouse Toy',
    description: 'Soft plush toy with catnip.',
    variants: [{ id: 'v3', sku: 'TOY-MOUSE', packSize: '1 pc', pricePaise: 15000, mrpPaise: 20000 }],
  },
];

export const demoInventory = [
  { variantSku: 'DOGFOOD-1KG', product: 'Chicken & Rice Dog Food', quantity: 120, reserved: 4, lowStock: false },
  { variantSku: 'DOGFOOD-5KG', product: 'Chicken & Rice Dog Food', quantity: 8, reserved: 0, lowStock: true },
  { variantSku: 'TOY-MOUSE', product: 'Catnip Mouse Toy', quantity: 60, reserved: 2, lowStock: false },
];

export const demoAdminShops: Shop[] = [
  ...demoShops,
  {
    id: 'shop_new1',
    name: 'City Vet & Boarding',
    slug: 'city-vet',
    description: 'Awaiting verification.',
    status: 'PENDING_REVIEW',
    ownerName: 'Dr. Mehta',
    ownerEmail: 'mehta@cityvet.local',
    shopModules: [
      { status: 'PENDING_VERIFICATION', module: { key: 'VET', name: 'Veterinary' } },
      { status: 'ENABLED', module: { key: 'BOARDING', name: 'Boarding' } },
    ],
  },
  {
    id: 'shop_new2',
    name: 'Tiny Paws Grooming',
    slug: 'tiny-paws',
    description: 'Awaiting verification.',
    status: 'PENDING_REVIEW',
    ownerName: 'Fatima S.',
    ownerEmail: 'fatima@tinypaws.local',
    shopModules: [{ status: 'ENABLED', module: { key: 'GROOMING', name: 'Grooming' } }],
  },
];
