import { prisma } from '../../lib/prisma.js';
import { BadRequest, Conflict, Forbidden, NotFound } from '../../lib/errors.js';
import { writeAudit } from '../../lib/audit.js';
import type { AuthContext } from '../../auth/types.js';
import type { Prisma } from '@prisma/client';
import crypto from 'node:crypto';

// ── Service menu (shop admin) ──
export async function createService(
  shopId: string,
  data: {
    name: string;
    description?: string;
    basePricePaise: number;
    durationMinutes: number;
    petType?: string;
    inStoreAvailable: boolean;
    homeServiceAvailable: boolean;
    depositPaise?: number;
    pricingRules?: Record<string, unknown>;
    serviceAreaPincodes?: string[];
    cancellationPolicy?: Record<string, unknown>;
  },
  actorId: string,
) {
  const service = await prisma.groomingService.create({
    data: {
      shopId,
      name: data.name,
      description: data.description,
      basePricePaise: data.basePricePaise,
      durationMinutes: data.durationMinutes,
      petType: data.petType,
      inStoreAvailable: data.inStoreAvailable,
      homeServiceAvailable: data.homeServiceAvailable,
      depositPaise: data.depositPaise ?? 0,
      pricingRules: data.pricingRules as Prisma.InputJsonValue | undefined,
      serviceAreaPincodes: data.serviceAreaPincodes ?? [],
      cancellationPolicy: data.cancellationPolicy as Prisma.InputJsonValue | undefined,
    },
  });
  await writeAudit({ shopId, actorId, action: 'GROOMING_SERVICE_CREATED', entityType: 'GroomingService', entityId: service.id });
  return service;
}

export async function listServices(shopId: string) {
  return prisma.groomingService.findMany({ where: { shopId }, orderBy: { name: 'asc' } });
}

export async function updateService(
  shopId: string,
  serviceId: string,
  data: Prisma.GroomingServiceUpdateInput,
  actorId: string,
) {
  const existing = await prisma.groomingService.findFirst({ where: { id: serviceId, shopId } });
  if (!existing) throw NotFound('Service not found');
  const updated = await prisma.groomingService.update({ where: { id: serviceId }, data });
  await writeAudit({ shopId, actorId, action: 'GROOMING_SERVICE_UPDATED', entityType: 'GroomingService', entityId: serviceId });
  return updated;
}

// ── Pricing resolution: breed/size overrides ──
function resolvePrice(
  basePricePaise: number,
  pricingRules: unknown,
  pet: { breed?: string | null; sizeClass?: string | null },
): number {
  if (!pricingRules || typeof pricingRules !== 'object') return basePricePaise;
  const rules = pricingRules as { bySize?: Record<string, number>; byBreed?: Record<string, number> };
  if (pet.breed && rules.byBreed?.[pet.breed] != null) return rules.byBreed[pet.breed];
  if (pet.sizeClass && rules.bySize?.[pet.sizeClass] != null) return rules.bySize[pet.sizeClass];
  return basePricePaise;
}

// ── Customer booking ──
export async function bookAppointment(
  auth: AuthContext,
  input: {
    shopSlug: string;
    serviceId: string;
    petId: string;
    staffId?: string;
    location: 'IN_STORE' | 'HOME';
    startsAt: string;
    homeAddress?: { pincode?: string; [k: string]: unknown };
  },
) {
  if (auth.type !== 'CUSTOMER' || !auth.customerId) throw Forbidden('Customer access required');
  const customerId = auth.customerId;

  const shop = await prisma.shop.findFirst({ where: { slug: input.shopSlug, status: 'APPROVED' } });
  if (!shop) throw NotFound('Shop not found');

  const pet = await prisma.pet.findFirst({ where: { id: input.petId, customerId } });
  if (!pet) throw NotFound('Pet not found or not owned by you');

  const startsAt = new Date(input.startsAt);
  if (startsAt.getTime() < Date.now()) throw BadRequest('Appointment time must be in the future');

  return prisma.$transaction(async (tx) => {
    const service = await tx.groomingService.findFirst({
      where: { id: input.serviceId, shopId: shop.id, isActive: true },
    });
    if (!service) throw NotFound('Service not found');

    // Location availability.
    if (input.location === 'IN_STORE' && !service.inStoreAvailable) {
      throw BadRequest('This service is not available in-store');
    }
    if (input.location === 'HOME') {
      if (!service.homeServiceAvailable) throw BadRequest('This service is not available as home service');
      const pincode = input.homeAddress?.pincode;
      if (!pincode) throw BadRequest('Home service requires a pincode');
      if (service.serviceAreaPincodes.length && !service.serviceAreaPincodes.includes(pincode)) {
        throw BadRequest('Your location is outside this shop’s service area');
      }
    }

    const endsAt = new Date(startsAt.getTime() + service.durationMinutes * 60 * 1000);

    // Anti-double-booking: if a staff member is specified, ensure no overlap.
    if (input.staffId) {
      const staff = await tx.employee.findFirst({ where: { id: input.staffId, shopId: shop.id, isActive: true } });
      if (!staff) throw BadRequest('Staff member not found in this shop');
      const clash = await tx.groomingAppointment.count({
        where: {
          staffId: input.staffId,
          status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
          startsAt: { lt: endsAt },
          endsAt: { gt: startsAt },
        },
      });
      if (clash > 0) throw Conflict('Selected staff is already booked for that time');
    }

    const pricePaise = resolvePrice(service.basePricePaise, service.pricingRules, pet);

    const appointment = await tx.groomingAppointment.create({
      data: {
        shopId: shop.id,
        serviceId: service.id,
        customerId,
        petId: pet.id,
        staffId: input.staffId,
        location: input.location,
        homeAddress: input.homeAddress as Prisma.InputJsonValue | undefined,
        startsAt,
        endsAt,
        status: 'PENDING',
        pricePaise,
        depositPaise: service.depositPaise,
        reference: `GRM-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
        policySnapshot: (service.cancellationPolicy ?? {}) as Prisma.InputJsonValue,
      },
    });

    await tx.shopCustomer.upsert({
      where: { shopId_customerId: { shopId: shop.id, customerId } },
      create: { shopId: shop.id, customerId },
      update: {},
    });

    return appointment;
  });
}

// ── Shop-side management ──
export async function listAppointments(
  shopId: string,
  auth: AuthContext,
  params: { date?: string; mine?: boolean },
) {
  const where: Prisma.GroomingAppointmentWhereInput = { shopId };
  if (params.date) {
    const start = new Date(params.date);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    where.startsAt = { gte: start, lt: end };
  }
  // A groomer typically only sees their own assigned appointments.
  if (params.mine && auth.employeeId) where.staffId = auth.employeeId;

  return prisma.groomingAppointment.findMany({
    where,
    include: { service: true, pet: true, customer: true, staff: true },
    orderBy: { startsAt: 'asc' },
  });
}

const ALLOWED: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['IN_PROGRESS', 'CANCELLED', 'NO_SHOW'],
  IN_PROGRESS: ['COMPLETED'],
};

export async function updateAppointmentStatus(
  shopId: string,
  auth: AuthContext,
  appointmentId: string,
  nextStatus: string,
  notes?: string,
) {
  const appt = await prisma.groomingAppointment.findFirst({ where: { id: appointmentId, shopId } });
  if (!appt) throw NotFound('Appointment not found');
  // Groomers may only act on appointments assigned to them.
  if (auth.roleKey === 'GROOMER' && appt.staffId !== auth.employeeId) {
    throw Forbidden('You can only update your own assigned appointments');
  }
  const allowed = ALLOWED[appt.status] ?? [];
  if (!allowed.includes(nextStatus)) {
    throw BadRequest(`Cannot transition from ${appt.status} to ${nextStatus}`);
  }
  const updated = await prisma.groomingAppointment.update({
    where: { id: appointmentId },
    data: { status: nextStatus as never, notes: notes ?? appt.notes },
  });
  await writeAudit({
    shopId,
    actorId: auth.userId,
    action: 'GROOMING_STATUS_CHANGED',
    entityType: 'GroomingAppointment',
    entityId: appointmentId,
    metadata: { from: appt.status, to: nextStatus },
  });
  return updated;
}
