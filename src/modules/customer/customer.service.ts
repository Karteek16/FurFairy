import { prisma } from '../../lib/prisma.js';
import { BadRequest, Conflict, Forbidden, NotFound } from '../../lib/errors.js';
import { hashPassword } from '../../auth/password.js';
import type { AuthContext } from '../../auth/types.js';
import type { Prisma } from '@prisma/client';

/**
 * Customer registration. Supports email+password now; mobile+OTP uses the
 * sandbox OTP flow below (no live SMS provider is enabled).
 */
export async function registerCustomerByEmail(input: {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
}) {
  if (input.password.length < 8) throw BadRequest('Password must be at least 8 characters');
  const existing = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (existing) throw Conflict('An account with this email already exists');
  const passwordHash = await hashPassword(input.password);

  const customer = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { type: 'CUSTOMER', email: input.email.toLowerCase(), phone: input.phone, passwordHash },
    });
    return tx.customer.create({
      data: { userId: user.id, fullName: input.fullName, email: input.email.toLowerCase(), phone: input.phone },
    });
  });
  return { id: customer.id };
}

// ── Sandbox OTP flow (no live SMS). OTP is returned in dev for testing. ──
const otpStore = new Map<string, { code: string; expiresAt: number }>();

export function requestOtp(phone: string): { devOtp?: string } {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  otpStore.set(phone, { code, expiresAt: Date.now() + 5 * 60 * 1000 });
  // Live SMS is disabled; in sandbox we expose the code for testing only.
  return { devOtp: code };
}

export async function verifyOtpAndLogin(
  app: { jwt: { sign: (p: object, o?: object) => string } },
  phone: string,
  code: string,
  fullName?: string,
) {
  const entry = otpStore.get(phone);
  if (!entry || entry.expiresAt < Date.now() || entry.code !== code) {
    throw BadRequest('Invalid or expired OTP');
  }
  otpStore.delete(phone);

  let user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({ data: { type: 'CUSTOMER', phone } });
      await tx.customer.create({ data: { userId: u.id, fullName: fullName ?? 'Customer', phone } });
      return u;
    });
  }
  if (user.type !== 'CUSTOMER') throw Forbidden('This phone is linked to a non-customer account');
  const accessToken = app.jwt.sign({ sub: user.id, type: user.type }, { expiresIn: '15m' });
  return { accessToken, userId: user.id };
}

// ── Pets (owned by the authenticated customer) ──

function requireCustomerId(auth: AuthContext): string {
  if (auth.type !== 'CUSTOMER' || !auth.customerId) throw Forbidden('Customer access required');
  return auth.customerId;
}

export async function listMyPets(auth: AuthContext) {
  const customerId = requireCustomerId(auth);
  return prisma.pet.findMany({
    where: { customerId },
    include: { vaccinations: true, documents: true },
    orderBy: { createdAt: 'asc' },
  });
}

export async function createPet(
  auth: AuthContext,
  data: {
    name: string;
    species: string;
    breed?: string;
    sizeClass?: string;
    birthDate?: string;
    notes?: string;
  },
) {
  const customerId = requireCustomerId(auth);
  return prisma.pet.create({
    data: {
      customerId,
      name: data.name,
      species: data.species,
      breed: data.breed,
      sizeClass: data.sizeClass,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      notes: data.notes,
    },
  });
}

async function assertOwnedPet(customerId: string, petId: string) {
  const pet = await prisma.pet.findFirst({ where: { id: petId, customerId } });
  if (!pet) throw NotFound('Pet not found');
  return pet;
}

export async function updatePet(
  auth: AuthContext,
  petId: string,
  data: Prisma.PetUpdateInput,
) {
  const customerId = requireCustomerId(auth);
  await assertOwnedPet(customerId, petId);
  return prisma.pet.update({ where: { id: petId }, data });
}

export async function addPetDocument(
  auth: AuthContext,
  petId: string,
  data: { docType: string; fileUrl: string },
) {
  const customerId = requireCustomerId(auth);
  await assertOwnedPet(customerId, petId);
  return prisma.petDocument.create({ data: { petId, ...data } });
}

export async function addVaccination(
  auth: AuthContext,
  petId: string,
  data: { name: string; givenOn: string; dueOn?: string },
) {
  const customerId = requireCustomerId(auth);
  await assertOwnedPet(customerId, petId);
  return prisma.vaccination.create({
    data: {
      petId,
      name: data.name,
      givenOn: new Date(data.givenOn),
      dueOn: data.dueOn ? new Date(data.dueOn) : null,
    },
  });
}

export async function getMyProfile(auth: AuthContext) {
  const customerId = requireCustomerId(auth);
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: { addresses: true, pets: true },
  });
  if (!customer) throw NotFound('Customer not found');
  return customer;
}
