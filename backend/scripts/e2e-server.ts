/**
 * Arranca el backend real (server.ts) contra un MongoDB en memoria desechable,
 * para los tests E2E de Playwright. Nunca toca la base de datos real: las
 * variables de entorno se fijan antes de importar server.ts (que las lee de
 * forma síncrona a través de config/env.ts al cargarse).
 */
import { MongoMemoryServer } from 'mongodb-memory-server';

async function main(): Promise<void> {
  const mongod = await MongoMemoryServer.create();

  process.env['MONGODB_URI'] = mongod.getUri('coinhub_e2e');
  process.env['JWT_SECRET'] ??= 'e2e-test-secret-not-real-0000000000';
  process.env['NODE_ENV'] = 'test';
  process.env['PORT'] ??= '5051';
  process.env['FRONTEND_URLS'] ??= 'http://localhost:4173';
  process.env['CLOUDINARY_CLOUD_NAME'] ??= 'e2e-test';
  process.env['CLOUDINARY_API_KEY'] ??= 'e2e-test';
  process.env['CLOUDINARY_API_SECRET'] ??= 'e2e-test';

  process.on('SIGTERM', () => {
    void mongod.stop().finally(() => process.exit(0));
  });

  await import('../server.js');
}

void main();
