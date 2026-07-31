import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BACKEND_PORT = 5051;
const FRONTEND_PORT = 4173;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${FRONTEND_PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      // Backend real contra un MongoDB en memoria desechable (ver
      // backend/scripts/e2e-server.ts) — nunca toca la base de datos real.
      command: 'npx tsx scripts/e2e-server.ts',
      cwd: path.resolve(__dirname, '../backend'),
      port: BACKEND_PORT,
      reuseExistingServer: false,
      timeout: 60_000,
      stdout: 'pipe',
    },
    {
      command: `npx vite --port ${FRONTEND_PORT} --strictPort`,
      cwd: __dirname,
      port: FRONTEND_PORT,
      reuseExistingServer: false,
      timeout: 30_000,
      env: {
        VITE_API_URL: `http://localhost:${BACKEND_PORT}/api`,
      },
    },
  ],
});
