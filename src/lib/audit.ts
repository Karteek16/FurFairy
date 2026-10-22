import { prisma } from './prisma.js';

export interface AuditEntry {
  shopId?: string | null;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Writes an append-only audit record. Failures here must never break the
 * primary operation, so we swallow+log errors rather than throw.
 */
export async function writeAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        shopId: entry.shopId ?? null,
        actorId: entry.actorId ?? null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        metadata: entry.metadata ? (entry.metadata as object) : undefined,
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[audit] failed to write audit log', entry.action, err);
  }
}
