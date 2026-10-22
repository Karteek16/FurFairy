// Starts an in-process PostgreSQL (PGlite, Postgres compiled to WASM) listening
// on a real TCP port. This lets Prisma connect over a normal postgresql:// URL
// WITHOUT Docker or a system Postgres install.
//
// Data is persisted under .pglite/ so migrate + seed + app share one database.
//
// Usage: npx tsx scripts/dev-postgres.ts   (keep running in its own terminal)
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';

const PORT = Number(process.env.PGLITE_PORT ?? 5432);
const HOST = process.env.PGLITE_HOST ?? '127.0.0.1';
const DATA_DIR = process.env.PGLITE_DIR ?? './.pglite';

async function main() {
  const db = await PGlite.create({ dataDir: DATA_DIR });
  const server = new PGLiteSocketServer({ db, port: PORT, host: HOST });
  await server.start();
  // eslint-disable-next-line no-console
  console.log(`[pglite] PostgreSQL-compatible server listening on ${HOST}:${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`[pglite] data dir: ${DATA_DIR}`);

  const shutdown = async () => {
    await server.stop();
    await db.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error('[pglite] failed to start:', e);
  process.exit(1);
});
