import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import { DEFAULT_ROLES, ALL_PERMISSIONS } from '../src/auth/permissions.js';

const prisma = new PrismaClient();

const MODULES = [
  { key: 'BOARDING', name: 'Pet Boarding', requiresVerification: false },
  { key: 'GROOMING', name: 'Pet Grooming', requiresVerification: false },
  { key: 'RETAIL', name: 'Pet Food Retail', requiresVerification: false },
  { key: 'SUPPLIES', name: 'Pet Supplies Retail', requiresVerification: false },
  { key: 'VET', name: 'Veterinary Services', requiresVerification: true },
];

async function main() {
  console.log('Seeding platform data...');

  // 1. Modules
  for (const m of MODULES) {
    await prisma.module.upsert({
      where: { key: m.key },
      create: m,
      update: { name: m.name, requiresVerification: m.requiresVerification },
    });
  }
  console.log(`  modules: ${MODULES.length}`);

  // 2. Platform admin
  const adminEmail = (process.env.PLATFORM_ADMIN_EMAIL ?? 'admin@furfairy.in').toLowerCase();
  const adminPassword = process.env.PLATFORM_ADMIN_PASSWORD ?? 'ChangeMe!123';
  const adminHash = await bcrypt.hash(adminPassword, 12);
  await prisma.user.upsert({
    where: { email: adminEmail },
    create: { type: 'PLATFORM_ADMIN', email: adminEmail, passwordHash: adminHash },
    update: { passwordHash: adminHash, type: 'PLATFORM_ADMIN' },
  });
  console.log(`  platform admin: ${adminEmail}`);

  // 3. Demo shop (approved) with owner, roles, modules, boarding packages
  const demoEmail = 'owner@happytails.local';
  const existingDemo = await prisma.shop.findUnique({ where: { slug: 'happy-tails' } });
  if (!existingDemo) {
    const ownerHash = await bcrypt.hash('OwnerPass!123', 12);
    const boarding = await prisma.module.findUnique({ where: { key: 'BOARDING' } });
    const grooming = await prisma.module.findUnique({ where: { key: 'GROOMING' } });
    const retail = await prisma.module.findUnique({ where: { key: 'RETAIL' } });

    const shop = await prisma.shop.create({
      data: {
        name: 'Happy Tails',
        slug: 'happy-tails',
        description: 'Demo shop with boarding, grooming and retail',
        ownerName: 'Demo Owner',
        ownerEmail: demoEmail,
        ownerPhone: '+919000000000',
        status: 'APPROVED',
        approvedAt: new Date(),
        branding: { create: { primaryColor: '#3b82f6' } },
      },
    });

    for (const mod of [boarding, grooming, retail]) {
      if (mod) {
        await prisma.shopModule.create({
          data: { shopId: shop.id, moduleId: mod.id, status: 'ENABLED' },
        });
      }
    }

    const roles = await Promise.all(
      Object.entries(DEFAULT_ROLES).map(([key, def]) =>
        prisma.role.create({
          data: { shopId: shop.id, key, description: def.description, permissions: def.permissions, isSystem: true },
        }),
      ),
    );
    const ownerRole = roles.find((r) => r.key === 'SHOP_OWNER')!;

    const ownerUser = await prisma.user.create({
      data: { type: 'EMPLOYEE', email: demoEmail, phone: '+919000000000', passwordHash: ownerHash },
    });
    await prisma.employee.create({
      data: { userId: ownerUser.id, shopId: shop.id, username: 'owner', fullName: 'Demo Owner', roleId: ownerRole.id },
    });

    const branch = await prisma.branch.create({
      data: {
        shopId: shop.id,
        name: 'Main Branch',
        addressLine1: '12 MG Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
      },
    });

    // Boarding packages: Bronze/Silver ACTIVE, Gold/Platinum COMING_SOON.
    await prisma.boardingPackage.createMany({
      data: [
        {
          shopId: shop.id,
          tier: 'BRONZE',
          name: 'Bronze — Basic',
          status: 'ACTIVE',
          pricePerNightPaise: 50000,
          capacity: 10,
          inclusions: { foodType: 'Shop standard', mealFrequency: 2, walks: 1 },
        },
        {
          shopId: shop.id,
          tier: 'SILVER',
          name: 'Silver — Advanced',
          status: 'ACTIVE',
          pricePerNightPaise: 80000,
          capacity: 6,
          inclusions: { foodType: 'Premium', mealFrequency: 3, walks: 2, grooming: 'basic' },
        },
        {
          shopId: shop.id,
          tier: 'GOLD',
          name: 'Gold',
          status: 'COMING_SOON',
          pricePerNightPaise: 120000,
          capacity: 4,
          inclusions: { note: 'Shop-configurable; camera access optional (Phase 2)' },
        },
        {
          shopId: shop.id,
          tier: 'PLATINUM',
          name: 'Platinum',
          status: 'COMING_SOON',
          pricePerNightPaise: 180000,
          capacity: 2,
          inclusions: { note: 'Shop-configurable premium services (Phase 2)' },
        },
      ],
    });

    await prisma.boardingUnit.createMany({
      data: Array.from({ length: 5 }).map((_, i) => ({
        shopId: shop.id,
        branchId: branch.id,
        name: `Kennel ${i + 1}`,
      })),
    });

    await prisma.groomingService.create({
      data: {
        shopId: shop.id,
        name: 'Full Grooming',
        basePricePaise: 70000,
        durationMinutes: 90,
        petType: 'DOG',
        inStoreAvailable: true,
        homeServiceAvailable: true,
        depositPaise: 20000,
        serviceAreaPincodes: ['560001', '560002'],
        pricingRules: { bySize: { SMALL: 60000, MEDIUM: 70000, LARGE: 90000 } },
      },
    });

    console.log(`  demo shop: happy-tails (owner login: ${demoEmail} / OwnerPass!123)`);
  } else {
    console.log('  demo shop already exists, skipping');
  }

  console.log(`Total permissions defined: ${ALL_PERMISSIONS.length}`);
  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
