import { preview } from 'astro';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
// Like the existing mobile audit, own the server so Windows teardown does not
// leave a detached Astro CLI process waiting after all tests have completed.
const server = await preview({ root, server: { host: '127.0.0.1', port: 4323 }, logLevel: 'error' });
try {
  if (server.port !== 4323) throw new Error('Port 4323 is in use; close that local server before testing.');
  process.exitCode = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [
      'node_modules/@playwright/test/cli.js', 'test', '--config', 'tests/solutions/playwright.config.ts', ...process.argv.slice(2),
    ], { cwd: root, env: { ...process.env, TETRA_SOLUTION_PREVIEW: 'external' }, stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', code => resolve(code ?? 1));
  });
} finally {
  await server.stop();
}
