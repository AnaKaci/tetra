import { readdir, readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const directory = resolve(projectRoot, process.argv.find(arg => arg.startsWith('--dist='))?.slice(7) || 'dist');
const basePath = `/${(process.env.BASE_PATH || '').replace(/^\/+|\/+$/g, '')}`.replace(/\/$/, '');
const origin = process.env.SITE_URL ? new URL(process.env.SITE_URL).origin : 'https://build.local';

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory() ? files(join(directory, entry.name)) : join(directory, entry.name)))).flat();
}

const assets = await files(directory);
let maximum = 0;
const pages = assets.filter(path => path.endsWith('.html'));
for (const page of pages) {
  const html = await readFile(page, 'utf8');
  let total = 0;
  const visited = new Set();
  const route = `${basePath}/${relative(directory, page).split(sep).join('/')}`;
  async function addScript(url, relativeTo = new URL(route, origin)) {
    const resolved = new URL(url, relativeTo);
    if (resolved.origin !== origin) return;
    const pathname = decodeURIComponent(resolved.pathname);
    if (basePath && pathname !== basePath && !pathname.startsWith(`${basePath}/`)) throw new Error(`${page}: Script URL escapes BASE_PATH: ${url}`);
    const path = resolve(directory, pathname.slice(basePath.length).replace(/^\/+/, ''));
    if (path !== directory && !path.startsWith(directory + sep)) throw new Error(`${page}: Script URL escapes output directory: ${url}`);
    if (visited.has(path)) return;
    visited.add(path);
    const source = await readFile(path, 'utf8');
    total += gzipSync(source).length;
    for (const match of source.matchAll(/(?:\bfrom\s*|\bimport\s*\(?)["']([^"']+\.m?js(?:\?[^"']*)?)["']/g)) await addScript(match[1], resolved);
  }
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (match[1].includes('application/ld+json')) continue;
    const src = match[1].match(/\bsrc=["']([^"']+)["']/)?.[1];
    if (src) await addScript(src);
    else if (match[2].trim()) total += gzipSync(match[2]).length;
  }
  maximum = Math.max(maximum, total);
  if (total > 30 * 1024) { console.error(`${page}: ${(total / 1024).toFixed(2)} KB exceeds the 30 KB per-route budget.`); process.exitCode = 1; }
}
console.log(`${pages.length} pages: largest first-party JavaScript payload ${(maximum / 1024).toFixed(2)} KB gzip (budget: 30 KB per route)`);
