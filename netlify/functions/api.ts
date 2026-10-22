// Netlify Function that wraps the Fastify app as a serverless handler.
//
// The whole FurFairy API runs inside this single function. Netlify maps
// `/api/*` to `/.netlify/functions/api/*` (see netlify.toml redirects), and
// Fastify's own `/api/v1` prefix still applies, so public routes stay at
// `https://furfairy.in/api/v1/...`.
//
// We cache the built Fastify instance across warm invocations so we only pay
// the cold-start (plugin registration, Prisma connect) once per container.
import type { Handler } from '@netlify/functions';
import serverlessHttp from 'serverless-http';
import type { FastifyInstance } from 'fastify';

// Import the COMPILED app from dist/. The backend build (`npm run build`) runs
// before Netlify bundles this function, so dist/app.js exists.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - resolved at bundle time from the compiled output
import { buildApp } from '../../dist/app.js';

type ServerlessHandler = (event: unknown, context: unknown) => Promise<unknown>;

let cached: ServerlessHandler | null = null;

async function getHandler(): Promise<ServerlessHandler> {
  if (cached) return cached;
  const app: FastifyInstance = await buildApp();
  await app.ready();
  // serverless-http adapts Fastify's Node HTTP server to the Lambda event model
  // that Netlify Functions use under the hood.
  cached = serverlessHttp(app, {
    // Netlify delivers the path including the function mount; strip it so
    // Fastify sees the real API path (/api/v1/... or /health).
    basePath: '/.netlify/functions/api',
  }) as unknown as ServerlessHandler;
  return cached;
}

export const handler: Handler = async (event, context) => {
  const h = await getHandler();
  // Keep the Lambda warm callback semantics; Prisma pooling handles connections.
  (context as { callbackWaitsForEmptyEventLoop?: boolean }).callbackWaitsForEmptyEventLoop = false;
  return (await h(event, context)) as Awaited<ReturnType<Handler>>;
};
