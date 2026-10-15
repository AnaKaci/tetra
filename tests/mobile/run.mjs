import { preview } from 'astro';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
// Own the preview in this process so Windows can shut it down cleanly after
// Playwright writes its reports, without a detached CLI process or stale lock.
const server = await preview({ root, server: { host: '127.0.0.1', port: 4322 }, logLevel: 'error' });
try {
  if (server.port !== 4322) throw new Error('Port 4322 is in use; close that local server before testing.');
  const code = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [
      'node_modules/@playwright/test/cli.js', 'test', '--config', 'tests/mobile/playwright.config.ts', ...process.argv.slice(2),
    ], { cwd: root, env: { ...process.env, TETRA_AUDIT_PREVIEW: 'external' }, stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', code => resolve(code ?? 1));
  });
  process.exitCode = code;
} finally {
  await server.stop();
}
