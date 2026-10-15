import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve Windows PowerShell directly; GUI-launched terminals may omit it from PATH.
const executable = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
const script = fileURLToPath(new URL('./package-cpanel.ps1', import.meta.url));
const result = spawnSync(executable, ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script, ...process.argv.slice(2)], { stdio: 'inherit', windowsHide: true });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
