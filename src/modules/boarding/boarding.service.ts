import { prisma } from '../../lib/prisma.js';
import { BadRequest, Conflict, Forbidden, NotFound } from '../../lib/errors.js';
import { writeAudit } from '../../lib/audit.js';
import type { AuthContext } from '../../auth/types.js';
import type { BoardingTier, BoardingPackageStatus, Prisma } from '@prisma/client';
import crypto from 'node:crypto';

/**
 * Phase 1 policy: Bronze/Silver may be ACTIVE (bookable). Gold/Platinum are
 * configurable but may only be COMING_SOON in Phase 1 — never bookable. This is
 * enforced in the backend so a visible card can't be mistaken for an operational
 * feature.
 */
const PHASE1_BOOKABLE_TIERS: BoardingTier[] = ['BRONZE', 'SILVER'];

function assertStatusAllowedForTier(tier: BoardingTier, status: BoardingPackageStatus) {
  const isPhase2Tier = tier === 'GOLD' || tier === 'PLATINUM';
  if (isPhase2Tier && status === 'ACTIVE') {
    throw BadRequest(
      `${tier} is a Phase 2 tier and cannot be set ACTIVE yet. Allowed: DRAFT, COMING_SOON, DISABLED.`,
    );
  }
}

// ── Package configuration (shop admin) ──
export async function upsertPackage(
  shopId: string,
  data: {
    tier: BoardingTier;
    name: string;
    description?: string;
    status: BoardingPackageStatus;
    inclusions?: Record<string, unknown>;
    pricePerNightPaise: number;
    capacity: number;
  },
  actorId: string,
) {
  assertStatusAllowedForTier(data.tier, data.status);
  const pkg = await prisma.boardingPackage.upsert({
    where: { shopId_tier: { shopId, tier: data.tier } },
    create: {
      shopId,
      tier: data.tier,
      name: data.name,
      description: data.description,
      status: data.status,
      inclusions: data.inclusions as Prisma.InputJsonValue | undefined,
      pricePerNightPaise: data.pricePerNightPaise,
      capacity: data.capacity,
    },
    update: {
      name: data.name,
      description: data.description,
      status: data.status,
      inclusions: data.inclusions as Prisma.InputJsonValue | undefined,
      pricePerNightPaise: data.pricePerNightPaise,
      capacity: data.capacity,
    },
  });
  await writeAudit({
    shopId,
    actorId,
    action: 'BOARDING_PACKAGE_UPSERT',
    entityType: 'BoardingPackage',
    entityId: pkg.id,
    metadata: { tier: data.tier, status: data.status },
  });
  return pkg;
}

export async function listPackages(shopId: string) {
  return prisma.boardingPackage.findMany({ where: { shopId }, orderBy: { tier: 'asc' } });
}

// ── Capacity check ──
async function countOverlappingReservations(
  tx: Prisma.TransactionClient,
  packageId: string,
  checkIn: Date,
  checkOut: Date,
): Promise<number> {
  // A stay overlaps if existing.checkIn < new.checkOut AND existing.checkOut > new.checkIn.
  return tx.boardingReservation.count({
    where: {
      packageId,
      status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'ACTIVE'] },
      checkIn: { lt: checkOut },
      checkOut: { gt: checkIn },
    },
  });
}

function nightsBetween(checkIn: Date, checkOut: Date): number {
  const ms = checkOut.getTime() - checkIn.getTime();
  return Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

// ── Customer booking ──
export async function createReservation(
  auth: AuthContext,
  input: {
    shopSlug: string;
    packageId: string;
    petId: string;
    checkIn: string;
    checkOut: string;
    transportType: 'IN_STORE' | 'HOME';
    transportAddress?: Record<string, unknown>;
  },
) {
  if (auth.type !== 'CUSTOMER' || !auth.customerId) throw Forbidden('Customer access required');
  const customerId = auth.customerId;

  const checkIn = new Date(input.checkIn);
  const checkOut = new Date(input.checkOut);
  if (!(checkIn < checkOut)) throw BadRequest('checkOut must be after checkIn');

  const shop = await prisma.shop.findFirst({ where: { slug: input.shopSlug, status: 'APPROVED' } });
  if (!shop) throw NotFound('Shop not found');

  const pet = await prisma.pet.findFirst({ where: { id: input.petId, customerId } });
  if (!pet) throw NotFound('Pet not found or not owned by you');

  return prisma.$transaction(async (tx) => {
    const pkg = await tx.boardingPackage.findFirst({
      where: { id: input.packageId, shopId: shop.id },
    });
    if (!pkg) throw NotFound('Boarding package not found');

    // Enforce bookable rules.
    if (pkg.status !== 'ACTIVE') {
      throw Conflict(`This package is '${pkg.status}' and not currently bookable`);
    }
    if (!PHASE1_BOOKABLE_TIERS.includes(pkg.tier)) {
      throw Conflict(`${pkg.tier} boarding is coming soon and not yet bookable`);
    }

    // Transport eligibility.
    if (input.transportType === 'HOME' && !input.transportAddress) {
      throw BadRequest('Home transport requires a collection/return address');
    }

    // Capacity guard (serialised inside transaction row scope).
    const overlapping = await countOverlappingReservations(tx, pkg.id, checkIn, checkOut);
    if (overlapping >= pkg.capacity) {
      throw Conflict('No capacity available for the selected dates');
    }

    const nights = nightsBetween(checkIn, checkOut);
    const transportFeePaise = 0; // configurable per shop; charged separately when enabled
    const totalPaise = pkg.pricePerNightPaise * nights + transportFeePaise;

    // Snapshot care instructions + a policy snapshot so later changes don't rewrite this agreement.
    const careInstructions = { petNotes: pet.notes ?? null, inclusions: pkg.inclusions ?? null };
    const policySnapshot = { capturedAt: new Date().toISOString(), tier: pkg.tier };

    const reservation = await tx.boardingReservation.create({
      data: {
        shopId: shop.id,
        packageId: pkg.id,
        customerId,
        petId: pet.id,
        checkIn,
        checkOut,
        transportType: input.transportType,
        transportAddress: input.transportAddress as Prisma.InputJsonValue | undefined,
        transportFeePaise,
        totalPaise,
        status: 'PENDING',
        reference: `BRD-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
        careInstructions: careInstructions as Prisma.InputJsonValue,
        policySnapshot: policySnapshot as Prisma.InputJsonValue,
      },
    });

    // Link customer to shop for shop-scoped views.
    await tx.shopCustomer.upsert({
      where: { shopId_customerId: { shopId: shop.id, customerId } },
      create: { shopId: shop.id, customerId },
      update: {},
    });

    return reservation;
  });
}

// ── Shop-side reservation management ──
export async function listReservations(shopId: string, status?: string) {
  return prisma.boardingReservation.findMany({
    where: { shopId, status: status ? (status as never) : undefined },
    include: { pet: true, customer: true, package: true },
    orderBy: { checkIn: 'asc' },
  });
}

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['CHECKED_IN', 'CANCELLED', 'NO_SHOW'],
  CHECKED_IN: ['ACTIVE', 'CHECKED_OUT'],
  ACTIVE: ['CHECKED_OUT'],
};

export async function updateReservationStatus(
  shopId: string,
  reservationId: string,
  nextStatus: string,
  actorId: string,
) {
  const reservation = await prisma.boardingReservation.findFirst({
    where: { id: reservationId, shopId },
  });
  if (!reservation) throw NotFound('Reservation not found');
  const allowed = ALLOWED_TRANSITIONS[reservation.status] ?? [];
  if (!allowed.includes(nextStatus)) {
    throw BadRequest(`Cannot transition from ${reservation.status} to ${nextStatus}`);
  }
  const updated = await prisma.boardingReservation.update({
    where: { id: reservationId },
    data: { status: nextStatus as never },
  });
  await writeAudit({
    shopId,
    actorId,
    action: 'BOARDING_STATUS_CHANGED',
    entityType: 'BoardingReservation',
    entityId: reservationId,
    metadata: { from: reservation.status, to: nextStatus },
  });
  return updated;
}

// ── Care tasks (Phase 1: package/stay-level scheduled tasks) ──
export async function scheduleCareTask(
  shopId: string,
  reservationId: string,
  data: { type: 'FEED' | 'WALK' | 'GROOM' | 'MEDICATION' | 'OTHER'; scheduledAt: string; instructions?: string },
) {
  const reservation = await prisma.boardingReservation.findFirst({
    where: { id: reservationId, shopId },
  });
  if (!reservation) throw NotFound('Reservation not found');
  // Medication/other instructions are stored exactly as provided; the system
  // never invents dosage or treatment.
  return prisma.careTask.create({
    data: {
      reservationId,
      type: data.type,
      scheduledAt: new Date(data.scheduledAt),
      instructions: data.instructions,
    },
  });
}

/** Operational task list for staff: due / completed / overdue. */
export async function careTaskList(shopId: string, params: { date?: string }) {
  const now = new Date();
  const dayStart = params.date ? new Date(params.date) : new Date(now.toISOString().slice(0, 10));
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const tasks = await prisma.careTask.findMany({
    where: {
      reservation: { shopId },
      scheduledAt: { gte: dayStart, lt: dayEnd },
    },
    include: {
      reservation: { include: { pet: true } },
      completion: true,
    },
    orderBy: { scheduledAt: 'asc' },
  });

  return tasks.map((t) => {
    let computedStatus = t.status;
    if (!t.completion && t.status === 'DUE' && t.scheduledAt < now) {
      computedStatus = 'OVERDUE';
    } else if (t.completion) {
      computedStatus = 'COMPLETED';
    }
    return {
      id: t.id,
      type: t.type,
      scheduledAt: t.scheduledAt,
      status: computedStatus,
      instructions: t.instructions,
      pet: { id: t.reservation.pet.id, name: t.reservation.pet.name },
      reference: t.reservation.reference,
    };
  });
}

export async function completeCareTask(
  shopId: string,
  auth: AuthContext,
  careTaskId: string,
  notes?: string,
) {
  if (!auth.employeeId) throw Forbidden('Employee access required');
  const task = await prisma.careTask.findFirst({
    where: { id: careTaskId, reservation: { shopId } },
  });
  if (!task) throw NotFound('Care task not found');
  if (task.status === 'COMPLETED') throw BadRequest('Task already completed');

  const result = await prisma.$transaction(async (tx) => {
    await tx.careTask.update({ where: { id: careTaskId }, data: { status: 'COMPLETED' } });
    return tx.careTaskCompletion.create({
      data: { careTaskId, employeeId: auth.employeeId!, notes },
    });
  });
  await writeAudit({
    shopId,
    actorId: auth.userId,
    action: 'CARE_TASK_COMPLETED',
    entityType: 'CareTask',
    entityId: careTaskId,
  });
  return result;
}
