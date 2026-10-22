import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  // Direct (non-pooled) connection used only by Prisma CLI for migrations.
  // Optional at app runtime.
  DIRECT_URL: z.string().optional(),
  // Comma-separated list of allowed browser origins for CORS in production,
  // e.g. "https://furfairy.in,https://www.furfairy.in".
  CORS_ORIGINS: z.string().optional(),
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET too short'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET too short'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),
  PLATFORM_ADMIN_EMAIL: z.string().email().default('admin@furfairy.in'),
  PLATFORM_ADMIN_PASSWORD: z.string().min(6).default('ChangeMe!123'),
  INTEGRATION_MODE: z.enum(['sandbox', 'live']).default('sandbox'),
  RATE_LIMIT_MAX: z.coerce.number().default(200),
  RATE_LIMIT_WINDOW: z.string().default('1 minute'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;

/**
 * Live external transactions are gated behind this flag. Configuring provider
 * credentials never flips this to live; that requires an explicit, deliberate change.
 */
export const isLiveIntegrationsEnabled = env.INTEGRATION_MODE === 'live';
