import type { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';
import { BadRequest, Unauthorized } from '../../lib/errors.js';
import {
  generateToken,
  hashToken,
  verifyPassword,
  hashPassword,
} from '../../auth/password.js';

const REFRESH_TTL_MS = parseTtl(env.JWT_REFRESH_TTL);

function parseTtl(ttl: string): number {
  const match = /^(\d+)([smhd])$/.exec(ttl.trim());
  if (!match) return 30 * 24 * 60 * 60 * 1000;
  const n = Number(match[1]);
  const unit = match[2];
  const mult = unit === 's' ? 1000 : unit === 'm' ? 60000 : unit === 'h' ? 3600000 : 86400000;
  return n * mult;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: { id: string; type: string };
}

async function issueTokens(
  app: FastifyInstance,
  user: { id: string; type: string },
): Promise<LoginResult> {
  const accessToken = app.jwt.sign(
    { sub: user.id, type: user.type },
    { expiresIn: env.JWT_ACCESS_TTL },
  );
  const { token: refreshToken, tokenHash } = generateToken();
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    },
  });
  return { accessToken, refreshToken, user: { id: user.id, type: user.type } };
}

/** Employee / platform-admin login by email OR username(+shop) with password. */
export async function loginWithPassword(
  app: FastifyInstance,
  params: { identifier: string; password: string; shopSlug?: string },
): Promise<LoginResult> {
  const { identifier, password, shopSlug } = params;

  // Try email-based (platform admin or employee email) first.
  let user = await prisma.user.findFirst({
    where: { email: identifier.toLowerCase() },
  });

  // Fall back to username within a shop (employee login).
  if (!user && shopSlug) {
    const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
    if (shop) {
      const employee = await prisma.employee.findUnique({
        where: { shopId_username: { shopId: shop.id, username: identifier } },
        include: { user: true },
      });
      user = employee?.user ?? null;
    }
  }

  if (!user || !user.passwordHash) throw Unauthorized('Invalid credentials');
  if (!user.isActive) throw Unauthorized('Account is inactive');

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw Unauthorized('Invalid credentials');

  return issueTokens(app, user);
}

export async function refreshTokens(
  app: FastifyInstance,
  refreshToken: string,
): Promise<LoginResult> {
  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw Unauthorized('Invalid or expired refresh token');
  }
  // Rotate: revoke the old token.
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });
  return issueTokens(app, stored.user);
}

export async function revokeRefreshToken(refreshToken: string): Promise<void> {
  const tokenHash = hashToken(refreshToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/** Initiates a password reset; returns the opaque token (would be emailed/SMS'd). */
export async function initiatePasswordReset(email: string): Promise<string | null> {
  const user = await prisma.user.findFirst({ where: { email: email.toLowerCase() } });
  if (!user) return null; // do not reveal account existence
  const { token, tokenHash } = generateToken();
  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });
  return token;
}

export async function completePasswordReset(
  token: string,
  newPassword: string,
): Promise<void> {
  if (newPassword.length < 8) throw BadRequest('Password must be at least 8 characters');
  const tokenHash = hashToken(token);
  const reset = await prisma.passwordReset.findUnique({ where: { tokenHash } });
  if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
    throw BadRequest('Invalid or expired reset token');
  }
  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: reset.userId }, data: { passwordHash } }),
    prisma.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
    // Revoke all refresh tokens on password change.
    prisma.refreshToken.updateMany({
      where: { userId: reset.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
}
