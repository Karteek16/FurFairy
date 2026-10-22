import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';

async function main() {
  const db = new PGlite();
  await db.waitReady;
  const sql = readFileSync('prisma/migrations/0001_init/migration.sql', 'utf8');
  console.log('sql length', sql.length, 'first 80:', JSON.stringify(sql.slice(0, 80)));
  try {
    await db.exec(sql);
    console.log('exec OK');
  } catch (e) {
    console.error('EXEC ERROR:', (e as Error).message);
    process.exit(2);
  }
  const r = await db.query('SELECT count(*)::int AS n FROM "Module"');
  console.log('Module rows:', JSON.stringify(r.rows));
  console.log('DONE');
}
main().catch((e) => { console.error('FATAL', e); process.exit(1); });
