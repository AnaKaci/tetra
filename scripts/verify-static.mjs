import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Verify the actual production output without contacting the live website.
const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const directory = path.resolve(projectRoot, process.argv.find(arg => arg.startsWith('--dist='))?.slice(7) || 'dist');
const basePath = `/${(process.env.BASE_PATH || '').replace(/^\/+|\/+$/g, '')}`.replace(/\/$/, '');
const siteOrigin = process.env.SITE_URL ? new URL(process.env.SITE_URL).origin : undefined;
const origin = siteOrigin || 'https://static-verification.invalid';
const errors = [];
const documents = new Map();
const resourceReferences = new Set();
const externalActions = new Set();
let internalLinks = 0;

async function walk(folder) {
  const entries = await readdir(folder, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory() ? walk(path.join(folder, entry.name)) : path.join(folder, entry.name)))).flat();
}

function decode(value) {
  return value.replace(/&amp;/g, '&').replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code))).replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

function attributes(tag) {
  const body = tag.replace(/^<[\w-]+/, '');
  return Object.fromEntries([...body.matchAll(/(?:^|\s)([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)].map(match => [match[1].toLowerCase(), decode(match[2] ?? match[3] ?? match[4] ?? '')]));
}

function publicPath(filename) {
  return `${basePath}/${path.relative(directory, filename).split(path.sep).join('/')}`;
}

function fail(location, message) { errors.push(`${location}: ${message}`); }

function withinBase(pathname) {
  return !basePath || pathname === basePath || pathname.startsWith(`${basePath}/`);
}

function verifyMetadataUrl(value, source, label, expectedPath, expectedOrigin = siteOrigin) {
  let url;
  try {
    url = new URL(value);
    if (!/^https?:$/.test(url.protocol)) throw new Error('not an HTTP URL');
  } catch { fail(source, `Missing or invalid ${label} URL`); return; }
  if (expectedOrigin && url.origin !== expectedOrigin) fail(source, `${label} origin does not match deployment origin: ${value}`);
  if (!withinBase(url.pathname)) fail(source, `${label} URL escapes BASE_PATH: ${value}`);
  if (expectedPath && (url.pathname !== expectedPath || url.search || url.hash)) fail(source, `${label} path does not match generated route: ${value}`);
  return url;
}

async function verifyReference(value, source, anchor = false) {
  if (!value || /^(?:data|blob|mailto|tel|javascript):/i.test(value)) return;
  let url;
  try { url = new URL(value, new URL(source, origin)); } catch { fail(source, `Invalid URL ${value}`); return; }
  if (url.origin !== origin) return;
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch { fail(source, `Invalid URL encoding: ${value}`); return; }
  if (!withinBase(pathname)) { fail(source, `URL escapes BASE_PATH: ${value}`); return; }
  const relative = pathname.slice(basePath.length).replace(/^\/+/, '');
  let target = path.resolve(directory, relative);
  if (target !== directory && !target.startsWith(directory + path.sep)) { fail(source, `URL escapes output directory: ${value}`); return; }
  try {
    if ((await stat(target)).isDirectory()) target = path.join(target, 'index.html');
    if (!(await stat(target)).isFile()) throw new Error('not a file');
  } catch { fail(source, `Missing local ${anchor ? 'link' : 'asset'}: ${value}`); return; }
  if (anchor) {
    internalLinks += 1;
    if (url.hash && target.endsWith('.html')) {
      const document = documents.get(target);
      let fragment;
      try { fragment = decodeURIComponent(url.hash.slice(1)); } catch { fail(source, `Invalid fragment encoding: ${value}`); return; }
      if (!document?.ids.has(fragment)) fail(source, `Missing fragment ${value}`);
    }
  } else resourceReferences.add(publicPath(target));
}

const files = await walk(directory);
const pages = files.filter(filename => filename.endsWith('.html'));
const content = JSON.parse(await readFile(path.join(projectRoot, 'src/data/tetra.json'), 'utf8'));
const expectedRoutes = ['/', '/rreth-nesh/', '/zgjidhje/', '/projekte/', '/partnere/', '/kontakt/', ...content.solutions.map(item => item.href), ...content.projects.map(item => item.href)].map(route => `${basePath}${route}`).sort();
const routes = pages.map(filename => publicPath(filename).replace(/index\.html$/, '')).sort();
if (JSON.stringify(expectedRoutes) !== JSON.stringify(routes)) fail('dist', `Expected routes ${JSON.stringify(expectedRoutes)}, received ${JSON.stringify(routes)}`);

for (const filename of pages) {
  const html = await readFile(filename, 'utf8');
  const tags = [...html.matchAll(/<[a-z][^>]*>/gi)].map(match => ({ name: match[0].match(/^<([a-z][\w-]*)/i)[1].toLowerCase(), attributes: attributes(match[0]) }));
  const idValues = tags.map(tag => tag.attributes.id).filter(Boolean);
  const ids = new Set(idValues);
  const source = publicPath(filename).replace(/index\.html$/, '');
  const document = { html, tags, ids, source };
  documents.set(filename, document);
  if (ids.size !== idValues.length) fail(source, 'Duplicate HTML IDs');
  if (tags.filter(tag => tag.name === 'h1').length !== 1) fail(source, 'Expected exactly one H1');
  if (!tags.some(tag => tag.name === 'html' && tag.attributes.lang === 'sq')) fail(source, 'Missing Albanian document language');
  if (!tags.some(tag => tag.name === 'meta' && tag.attributes.name === 'viewport' && tag.attributes.content?.includes('width=device-width'))) fail(source, 'Missing responsive viewport metadata');
  if (!ids.has('main-content') || !ids.has('main-nav')) fail(source, 'Missing shared navigation or main-content target');
  if (!tags.some(tag => tag.name === 'button' && tag.attributes['aria-controls'] === 'main-nav' && tag.attributes['aria-expanded'] === 'false')) fail(source, 'Missing collapsed accessible mobile menu button');
  const canonical = tags.find(tag => tag.name === 'link' && tag.attributes.rel === 'canonical')?.attributes.href;
  document.canonicalOrigin = verifyMetadataUrl(canonical, source, 'Canonical', source)?.origin;
}

for (const { html, tags, source, canonicalOrigin } of documents.values()) {
  const metadataOrigin = siteOrigin || canonicalOrigin;
  const openGraphUrl = tags.find(tag => tag.name === 'meta' && tag.attributes.property === 'og:url')?.attributes.content;
  verifyMetadataUrl(openGraphUrl, source, 'Open Graph', source, metadataOrigin);
  const openGraphImage = tags.find(tag => tag.name === 'meta' && tag.attributes.property === 'og:image')?.attributes.content;
  const socialImage = verifyMetadataUrl(openGraphImage, source, 'Open Graph image', undefined, metadataOrigin);
  if (socialImage) await verifyReference(socialImage.pathname, source);
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (attributes(`<script${match[1]}>`).type !== 'application/ld+json') continue;
    let schema;
    try { schema = JSON.parse(match[2]); } catch { fail(source, 'Invalid JSON-LD metadata'); continue; }
    if (schema['@type'] === 'Organization') {
      verifyMetadataUrl(schema.url, source, 'Organization', `${basePath}/`, metadataOrigin);
      const logo = verifyMetadataUrl(schema.logo, source, 'Organization logo', undefined, metadataOrigin);
      if (logo) await verifyReference(logo.pathname, source);
    }
  }
  for (const { name, attributes: attrs } of tags) {
    if (name === 'a') {
      if (!attrs.href || attrs.href === '#') fail(source, 'Empty navigation destination');
      else if (/^(https?:|tel:|mailto:)/i.test(attrs.href)) {
        externalActions.add(attrs.href);
        await verifyReference(attrs.href, source, true);
        if (/^https?:\/\/(?:www\.)?tetra\.al(?:\/|$)/i.test(attrs.href)) fail(source, `Frontend link points at original WordPress origin: ${attrs.href}`);
        if (attrs.target === '_blank' && (!attrs.rel?.split(/\s+/).includes('noopener') || !attrs.rel?.split(/\s+/).includes('noreferrer'))) fail(source, `New-window link lacks safety attributes: ${attrs.href}`);
      } else await verifyReference(attrs.href, source, true);
    }
    if (attrs.src) await verifyReference(attrs.src, source);
    if (attrs.poster) await verifyReference(attrs.poster, source);
    if (attrs.srcset) for (const candidate of attrs.srcset.split(',')) await verifyReference(candidate.trim().split(/\s+/)[0], source);
    if (name === 'link' && attrs.href && ['stylesheet', 'icon', 'preload', 'modulepreload'].includes(attrs.rel)) await verifyReference(attrs.href, source);
    if (name === 'img' && !Object.hasOwn(attrs, 'alt')) fail(source, `Image lacks alt attribute: ${attrs.src}`);
  }
}

for (const filename of files.filter(filename => filename.endsWith('.css'))) {
  const css = await readFile(filename, 'utf8');
  for (const match of css.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/g)) await verifyReference(match[1], publicPath(filename));
}

const result = {
  passed: errors.length === 0,
  outputDirectory: directory,
  basePath: basePath || '/',
  generatedPages: pages.length,
  routes,
  files: files.length,
  internalLinkReferencesChecked: internalLinks,
  uniqueLocalAssetsReferenced: resourceReferences.size,
  externalActions: [...externalActions].sort(),
  errors,
};
console.log(JSON.stringify(result, null, 2));
process.exitCode = errors.length ? 1 : 0;
