import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const env = { ...process.env, SITE_URL: 'https://tetra.al', BASE_PATH: '/' };
function run(command, args) {
  console.log('> ' + [command, ...args].join(' '));
  const result = spawnSync(command, args, { cwd: root, env, stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(command + ' exited with status ' + result.status);
}
run('npm', ['run', 'check']);
run('npm', ['run', 'build']);
run('npm', ['run', 'verify:static']);
run('node', ['scripts/package-cpanel.mjs']);
console.log('cPanel deployment ZIP created and validated: ' + path.join(root, 'tetra-cpanel-ready.zip'));
