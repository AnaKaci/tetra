import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const base = `/${(process.env.BASE_PATH || '').replace(/^\/+|\/+$/g, '')}`.replace(/\/$/, '');

export default defineConfig({
  testDir: '..',
  testMatch: 'solution-details.spec.ts',
  fullyParallel: true,
  workers: 3,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { outputFolder: `${root}/playwright-report/solutions`, open: 'never' }]],
  outputDir: `${root}/test-results/solutions`,
  use: { baseURL: 'http://127.0.0.1:4323', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.TETRA_SOLUTION_PREVIEW === 'external' ? undefined : {
    command: 'node node_modules/astro/bin/astro.mjs preview --host 127.0.0.1 --port 4323 --ignore-lock',
    cwd: root,
    url: `http://127.0.0.1:4323${base}/`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
