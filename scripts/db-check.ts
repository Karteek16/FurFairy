import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient({ log: ['error', 'warn'] });

async function main() {
  console.log('connecting...');
  const n = await prisma.module.count();
  console.log('module count =', n);
  const u = await prisma.user.count();
  console.log('user count =', u);
  console.log('OK');
}

main()
  .catch((e) => {
    console.error('DB CHECK ERROR:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
