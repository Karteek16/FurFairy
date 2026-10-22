import { buildApp } from './app.js';
import { env } from './config/env.js';

async function main() {
  const app = await buildApp();
  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(`FurFairy API listening on http://${env.HOST}:${env.PORT}`);
    app.log.info(`Integration mode: ${env.INTEGRATION_MODE}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

void main();
