/**
 * Full end-to-end test against a real, in-process PostgreSQL (PGlite).
 *
 * This boots the ACTUAL Fastify app and makes real HTTP requests through it,
 * exercising routing, auth, RBAC, validation and the service/business logic
 * against a genuine Postgres engine — no Docker, no mocks.
 *
 * It:
 *   1. Creates a PGlite database and applies the schema (via Prisma push SQL).
 *   2. Injects a PGlite-backed Prisma client as the app's shared client.
 *   3. Seeds platform data (admin, modules, demo shop + boarding packages).
 *   4. Runs assertions covering the Phase-1 happy path AND key negative rules.
 */
import { PGlite } from '@electric-sql/pglite';
import { PrismaPGlite } from 'pglite-prisma-adapter';
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'node:fs';
import bcrypt from 'bcryptjs';
import { DEFAULT_ROLES } from '../src/auth/permissions.js';

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean, extra?: unknown) {
  if (cond) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    fail++;
    console.error(`  FAIL  ${name}`, extra ?? '');
  }
}

async function main() {
  console.log('── Setting up in-process PostgreSQL (PGlite) ──');
  const client = new PGlite();
  await client.waitReady;

  // Apply the schema. We translate the Prisma migration SQL into PGlite.
  const migrationSql = readFileSync('prisma/migrations/0001_init/migration.sql', 'utf8').replace(/^\uFEFF/, '');
  // PGlite runs statements; exec handles multiple semicolon-separated statements.
  await client.exec(migrationSql);
  console.log('  schema applied');

  // Build a Prisma client backed by this PGlite instance and make the app use it.
  const adapter = new PrismaPGlite(client);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prisma = new PrismaClient({ adapter } as any);
  (globalThis as unknown as { prisma?: PrismaClient }).prisma = prisma;

  // ── Seed (mirrors prisma/seed.ts, using our injected client) ──
  console.log('── Seeding ──');
  const MODULES = [
    { key: 'BOARDING', name: 'Pet Boarding', requiresVerification: false },
    { key: 'GROOMING', name: 'Pet Grooming', requiresVerification: false },
    { key: 'RETAIL', name: 'Pet Food Retail', requiresVerification: false },
    { key: 'SUPPLIES', name: 'Pet Supplies Retail', requiresVerification: false },
    { key: 'VET', name: 'Veterinary Services', requiresVerification: true },
  ];
  for (const m of MODULES) {
    await prisma.module.upsert({ where: { key: m.key }, create: m, update: {} });
  }
  const adminHash = await bcrypt.hash('ChangeMe!123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@furfairy.in' },
    create: { type: 'PLATFORM_ADMIN', email: 'admin@furfairy.in', passwordHash: adminHash },
    update: {},
  });

  const ownerHash = await bcrypt.hash('OwnerPass!123', 12);
  const boarding = await prisma.module.findUnique({ where: { key: 'BOARDING' } });
  const grooming = await prisma.module.findUnique({ where: { key: 'GROOMING' } });
  const shop = await prisma.shop.create({
    data: {
      name: 'Happy Tails', slug: 'happy-tails', ownerName: 'Demo Owner',
      ownerEmail: 'owner@happytails.local', ownerPhone: '+919000000000',
      status: 'APPROVED', approvedAt: new Date(), branding: { create: { primaryColor: '#3b82f6' } },
    },
  });
  await prisma.shopModule.create({ data: { shopId: shop.id, moduleId: boarding!.id, status: 'ENABLED' } });
  await prisma.shopModule.create({ data: { shopId: shop.id, moduleId: grooming!.id, status: 'ENABLED' } });
  const roles = [];
  for (const [key, def] of Object.entries(DEFAULT_ROLES)) {
    roles.push(await prisma.role.create({
      data: { shopId: shop.id, key, description: def.description, permissions: def.permissions, isSystem: true },
    }));
  }
  const ownerRole = roles.find((r) => r.key === 'SHOP_OWNER')!;
  const ownerUser = await prisma.user.create({
    data: { type: 'EMPLOYEE', email: 'owner@happytails.local', passwordHash: ownerHash },
  });
  await prisma.employee.create({
    data: { userId: ownerUser.id, shopId: shop.id, username: 'owner', fullName: 'Demo Owner', roleId: ownerRole.id },
  });
  await prisma.branch.create({
    data: { shopId: shop.id, name: 'Main Branch', addressLine1: '12 MG Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
  });
  await prisma.boardingPackage.createMany({
    data: [
      { shopId: shop.id, tier: 'BRONZE', name: 'Bronze — Basic', status: 'ACTIVE', pricePerNightPaise: 50000, capacity: 2 },
      { shopId: shop.id, tier: 'SILVER', name: 'Silver', status: 'ACTIVE', pricePerNightPaise: 80000, capacity: 6 },
      { shopId: shop.id, tier: 'GOLD', name: 'Gold', status: 'COMING_SOON', pricePerNightPaise: 120000, capacity: 4 },
      { shopId: shop.id, tier: 'PLATINUM', name: 'Platinum', status: 'COMING_SOON', pricePerNightPaise: 180000, capacity: 2 },
    ],
  });
  console.log('  seed complete');

  // ── Boot the real app ──
  console.log('── Booting app and running HTTP assertions ──');
  const { buildApp } = await import('../src/app.js');
  const app = await buildApp();
  await app.ready();

  const call = async (method: string, url: string, body?: unknown, token?: string) => {
    const res = await app.inject({
      method: method as never,
      url,
      payload: body as never,
      headers: token ? { authorization: `Bearer ${token}` } : undefined,
    });
    let json: any = null;
    try { json = res.json(); } catch { /* non-json */ }
    return { status: res.statusCode, body: json };
  };

  // Health
  const health = await call('GET', '/health');
  check('health returns ok', health.body?.status === 'ok', health.body);

  // Admin login
  const adminLogin = await call('POST', '/api/v1/auth/login', { identifier: 'admin@furfairy.in', password: 'ChangeMe!123' });
  check('admin can log in', adminLogin.status === 200 && !!adminLogin.body?.accessToken, adminLogin.body);
  const adminToken = adminLogin.body?.accessToken;

  // Admin can list shops; a wrong password cannot log in
  const badLogin = await call('POST', '/api/v1/auth/login', { identifier: 'admin@furfairy.in', password: 'wrong' });
  check('wrong password rejected (401)', badLogin.status === 401, badLogin.status);

  const adminShops = await call('GET', '/api/v1/admin/shops', undefined, adminToken);
  check('admin lists shops', adminShops.status === 200 && Array.isArray(adminShops.body?.shops), adminShops.status);

  // Owner login
  const ownerLogin = await call('POST', '/api/v1/auth/login', { identifier: 'owner@happytails.local', password: 'OwnerPass!123' });
  check('owner can log in', ownerLogin.status === 200 && !!ownerLogin.body?.accessToken, ownerLogin.body);
  const ownerToken = ownerLogin.body?.accessToken;

  // Owner sees boarding packages
  const pkgs = await call('GET', '/api/v1/my-shop/boarding/packages', undefined, ownerToken);
  check('owner lists 4 boarding packages', pkgs.status === 200 && pkgs.body?.packages?.length === 4, pkgs.body);
  const bronze = pkgs.body?.packages?.find((p: any) => p.tier === 'BRONZE');

  // NEGATIVE: cannot set GOLD to ACTIVE (Phase 1 rule)
  const goldActive = await call('PUT', '/api/v1/my-shop/boarding/packages',
    { tier: 'GOLD', name: 'Gold', status: 'ACTIVE', pricePerNightPaise: 120000, capacity: 4 }, ownerToken);
  check('GOLD cannot be set ACTIVE in Phase 1 (400)', goldActive.status === 400, goldActive.body);

  // Owner creates a boarding-staff employee
  const createEmp = await call('POST', '/api/v1/my-shop/employees',
    { username: 'ravi', fullName: 'Ravi Kumar', roleKey: 'BOARDING_STAFF', initialPassword: 'StaffPass!123' }, ownerToken);
  check('owner creates employee', createEmp.status === 201, createEmp.body);

  // Staff login + NEGATIVE: staff forbidden from managing packages
  const staffLogin = await call('POST', '/api/v1/auth/login', { identifier: 'ravi', password: 'StaffPass!123', shopSlug: 'happy-tails' });
  check('staff can log in', staffLogin.status === 200, staffLogin.body);
  const staffToken = staffLogin.body?.accessToken;
  const staffPkg = await call('GET', '/api/v1/my-shop/boarding/packages', undefined, staffToken);
  check('staff forbidden from package management (403)', staffPkg.status === 403, staffPkg.status);

  // Customer register + OTP login
  await call('POST', '/api/v1/customers/register', { fullName: 'Anita', email: 'anita@example.com', phone: '+919111111111', password: 'CustPass!123' });
  const otpReq = await call('POST', '/api/v1/customers/otp/request', { phone: '+919111111111' });
  check('otp request returns devOtp (sandbox)', !!otpReq.body?.devOtp, otpReq.body);
  const otpVerify = await call('POST', '/api/v1/customers/otp/verify', { phone: '+919111111111', code: otpReq.body.devOtp });
  check('otp verify logs customer in', otpVerify.status === 200 && !!otpVerify.body?.accessToken, otpVerify.body);
  const custToken = otpVerify.body?.accessToken;

  // Create pet
  const pet = await call('POST', '/api/v1/me/pets', { name: 'Bruno', species: 'DOG', breed: 'Labrador', sizeClass: 'LARGE' }, custToken);
  check('customer creates pet', pet.status === 201, pet.body);
  const petId = pet.body?.pet?.id;

  // Book a BRONZE boarding stay
  const booking = await call('POST', '/api/v1/boarding/reservations', {
    shopSlug: 'happy-tails', packageId: bronze.id, petId,
    checkIn: '2026-11-01T10:00:00.000Z', checkOut: '2026-11-04T10:00:00.000Z', transportType: 'IN_STORE',
  }, custToken);
  check('customer books Bronze stay', booking.status === 201 && !!booking.body?.reservation?.reference, booking.body);

  // NEGATIVE: booking a COMING_SOON (Gold) package must be rejected
  const gold = pkgs.body?.packages?.find((p: any) => p.tier === 'GOLD');
  const goldBooking = await call('POST', '/api/v1/boarding/reservations', {
    shopSlug: 'happy-tails', packageId: gold.id, petId,
    checkIn: '2026-11-01T10:00:00.000Z', checkOut: '2026-11-04T10:00:00.000Z', transportType: 'IN_STORE',
  }, custToken);
  check('Gold (COMING_SOON) booking rejected (409)', goldBooking.status === 409, goldBooking.body);

  // CONCURRENCY: Bronze capacity is 2. Fire 5 overlapping bookings in parallel;
  // at most 2 should succeed (overbooking guard).
  const petsForConc = [];
  for (let i = 0; i < 5; i++) {
    const p = await call('POST', '/api/v1/me/pets', { name: `P${i}`, species: 'DOG' }, custToken);
    petsForConc.push(p.body.pet.id);
  }
  const results = await Promise.all(
    petsForConc.map((pid) =>
      call('POST', '/api/v1/boarding/reservations', {
        shopSlug: 'happy-tails', packageId: bronze.id, petId: pid,
        checkIn: '2026-12-01T10:00:00.000Z', checkOut: '2026-12-03T10:00:00.000Z', transportType: 'IN_STORE',
      }, custToken),
    ),
  );
  const confirmed = results.filter((r) => r.status === 201).length;
  check(`overbooking guard: <= capacity(2) succeed (got ${confirmed})`, confirmed <= 2, results.map((r) => r.status));

  await app.close();
  await prisma.$disconnect();

  console.log(`\n── Results: ${pass} passed, ${fail} failed ──`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error('E2E harness error:', e);
  process.exit(1);
});
