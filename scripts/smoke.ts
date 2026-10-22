// Boots the Fastify app (without listening) and prints the route table.
// This verifies all plugins/routes register correctly. It does NOT require a
// database connection, since route registration is lazy with respect to Prisma.
import { buildApp } from '../src/app.js';

async function main() {
  const app = await buildApp();
  await app.ready();
  // eslint-disable-next-line no-console
  console.log(app.printRoutes({ commonPrefix: false }));
  const count = app
    .printRoutes({ commonPrefix: false })
    .split('\n')
    .filter((l) => l.includes('(')).length;
  // eslint-disable-next-line no-console
  console.log(`\nApp booted successfully. Route tree printed above.`);
  await app.close();
  void count;
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error('Smoke test failed:', e);
  process.exit(1);
});
