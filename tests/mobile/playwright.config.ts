import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const auditDir = fileURLToPath(new URL('./', import.meta.url));
const projectRoot = fileURLToPath(new URL('../../', import.meta.url));

export default defineConfig({
  testDir: '..',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  workers: 3,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['json', { outputFile: `${auditDir}/results.json` }], ['html', { outputFolder: `${auditDir}/playwright-report`, open: 'never' }]],
  outputDir: `${auditDir}/test-results`,
  use: { baseURL: 'http://127.0.0.1:4322', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.TETRA_AUDIT_PREVIEW === 'external' ? undefined : {
    command: 'node node_modules/astro/bin/astro.mjs preview --host 127.0.0.1 --port 4322 --ignore-lock',
    cwd: projectRoot,
    url: 'http://127.0.0.1:4322',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
