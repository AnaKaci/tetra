import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, readdir, mkdir, mkdtemp, cp, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { readSolutions, readProject, readPartner, validateSnapshot, mergeCuratedSolutions } from '../scripts/lib/tetra-content.mjs';

// Captured public WordPress response, 28 September 2026. Keep source-format
// regression tests independent of both network availability and the live snapshot.
const fixture = JSON.parse(await readFile(new URL('./fixtures/tetra-wordpress-pages.json', import.meta.url), 'utf8'));
const html = slug => fixture.find(page => page.slug === slug).content.rendered;
const snapshotURL = new URL('../src/data/tetra.json', import.meta.url);
const root = fileURLToPath(new URL('../', import.meta.url));

test('source paragraphs and lists retain complete service detail', () => {
  const solutions = readSolutions(html('our-solution'));
  assert.equal(Object.keys(solutions).length, 5);
  const content = JSON.stringify(solutions);
  for (const phrase of ['SKIDATA', 'Wallbox', 'Raption', 'Cosmos', 'DLM', 'CirPark', 'Gunnebo']) {
    assert.ok(content.toLowerCase().includes(phrase.toLowerCase()), `Missing source detail: ${phrase}`);
  }
  assert.ok(solutions.parkim.sections.find(section => section.id === 'segmentet').bullets.length >= 7);
  assert.equal(solutions.siguri.sections.find(section => section.id === 'pajisjet').bullets.length, 3);
  assert.ok(!content.includes('Kliko ketu per te shkarkuar katalogun'), 'Source has no functioning catalogue URLs');
});

test('project parser separates merged labels and preserves numbers containing commas', () => {
  const teg = readProject(html('projektet'), 'TEG');
  assert.equal(teg.location, 'TEG');
  assert.equal(teg.installationYear, '2023 (në proces)');
  assert.equal(teg.parkingSpaces, '+1,000');
  assert.ok(teg.equipment.some(item => item.includes('1,000')));
  const air = readProject(html('projektet'), 'AIR ALBANIA');
  assert.equal(air.capacity.value, '22,000');
  assert.equal(air.parkingSpaces, '+200');
  assert.ok(air.requirements[0].includes('UEFA'));
  assert.ok(air.equipment.includes('Kamera LPR.'));
});

test('partner parser retains both Circontrol service descriptions', () => {
  const partner = readPartner(html('partneret'), 'circontrol', 'CIRCONTROL');
  assert.match(partner.description, /AC dhe DC/);
  assert.equal(partner.sections.length, 1);
  assert.match(partner.sections[0].paragraphs[0], /Parking Guidance System/);
});

test('changed source structure and external frontend routes are rejected', async () => {
  assert.throws(() => readSolutions(html('our-solution').replace('Sisteme Parkimi', 'Changed heading')), /missing/i);
  const snapshot = JSON.parse(await readFile(snapshotURL, 'utf8'));
  validateSnapshot(snapshot);
  snapshot.solutions[0].href = snapshot.solutions[0].sourceUrl;
  assert.throws(() => validateSnapshot(snapshot), /routing\/provenance/);
});

test('curated solutions retain exact routing and manufacturer provenance', async () => {
  const snapshot = JSON.parse(await readFile(snapshotURL, 'utf8'));
  const wordpressSolutions = snapshot.solutions.filter(solution => solution.sourceType !== 'manufacturer');
  const combined = mergeCuratedSolutions(wordpressSolutions);
  assert.equal(combined.length, 6);
  assert.deepEqual(combined.at(-1), snapshot.solutions.find(solution => solution.id === 'akses-me-pagese'));
  assert.throws(() => mergeCuratedSolutions(combined), /mapping/);
  const missing = structuredClone(snapshot);
  missing.solutions = wordpressSolutions;
  assert.throws(() => validateSnapshot(missing), /record counts/);
  const duplicate = structuredClone(snapshot);
  duplicate.solutions[5] = duplicate.solutions[0];
  assert.throws(() => validateSnapshot(duplicate), /duplicate record IDs/);
  const unapproved = structuredClone(snapshot);
  unapproved.solutions[5].sourceUrl = 'https://example.com/unverified';
  assert.throws(() => validateSnapshot(unapproved), /routing\/provenance/);
});

test('successful fixture refresh preserves curated content and local hero assets', async () => {
  const before = await readFile(snapshotURL, 'utf8');
  const snapshot = JSON.parse(before);
  const temporaryRoot = await mkdtemp(path.join(tmpdir(), 'tetra-content-sync-'));
  try {
    await cp(path.join(root, 'scripts'), path.join(temporaryRoot, 'scripts'), { recursive: true });
    await mkdir(path.join(temporaryRoot, 'src/data'), { recursive: true });
    await cp(path.join(root, 'src/data/curated-solutions.json'), path.join(temporaryRoot, 'src/data/curated-solutions.json'));
    await writeFile(path.join(temporaryRoot, 'src/data/tetra.json'), before);
    await writeFile(path.join(temporaryRoot, 'fixture.json'), JSON.stringify(fixture));
    // Existing assets avoid downloads. Leave the curated hero absent to verify
    // that a successful refresh also restores that required local image.
    const hero = snapshot.solutions.find(solution => solution.id === 'akses-me-pagese').heroImage;
    // Include the importer's original checked-in images as well as the newer
    // presentation assets selected in the current content snapshot.
    for (const name of await readdir(path.join(root, 'public/images'))) {
      if (name === path.basename(hero.src)) continue;
      const destination = path.join(temporaryRoot, 'public/images', name);
      await mkdir(path.dirname(destination), { recursive: true });
      await writeFile(destination, 'fixture-only existing image');
    }
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', `
      import { readFile } from 'node:fs/promises';
      const pages = JSON.parse(await readFile('./fixture.json', 'utf8'));
      globalThis.fetch = async url => {
        if (String(url).startsWith('https://tetra.al/wp-json/')) return new Response(JSON.stringify(pages), {headers: {'content-type': 'application/json'}});
        if (url === ${JSON.stringify(hero.sourceUrl)}) return new Response('fixture-only restored hero', {headers: {'content-type': 'image/jpeg'}});
        throw new Error('Unexpected fixture request: ' + url);
      };
      process.argv.push('--strict');
      await import('./scripts/sync-tetra-content.mjs');
    `], { cwd: temporaryRoot, encoding: 'utf8', timeout: 15_000 });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Refreshed Tetra content: 6 solutions/);
    const refreshed = JSON.parse(await readFile(path.join(temporaryRoot, 'src/data/tetra.json'), 'utf8'));
    validateSnapshot(refreshed);
    assert.deepEqual(refreshed.solutions.find(solution => solution.id === 'akses-me-pagese'), snapshot.solutions.find(solution => solution.id === 'akses-me-pagese'));
    assert.equal(await readFile(path.join(temporaryRoot, 'public', hero.src), 'utf8'), 'fixture-only restored hero');
    assert.equal(await readFile(snapshotURL, 'utf8'), before, 'The real snapshot must remain untouched');
  } finally {
    const allowedPrefix = path.resolve(tmpdir(), 'tetra-content-sync-');
    if (!path.resolve(temporaryRoot).startsWith(allowedPrefix)) throw new Error('Unsafe temporary cleanup path');
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test('offline, fallback, and strict modes never replace the verified snapshot on failure', async () => {
  const before = await readFile(snapshotURL, 'utf8');
  const invoke = args => spawnSync(process.execPath, ['--input-type=module', '-e', `
    globalThis.fetch = async () => { throw new Error('Simulated source outage'); };
    process.argv.push(...${JSON.stringify(args)});
    await import('./scripts/sync-tetra-content.mjs');
  `], { cwd: root, encoding: 'utf8', timeout: 10_000 });
  const offline = invoke(['--offline']);
  assert.equal(offline.status, 0, offline.stderr);
  assert.match(offline.stdout, /checked-in Tetra/);
  const fallback = invoke([]);
  assert.equal(fallback.status, 0, fallback.stderr);
  assert.match(fallback.stderr, /Keeping the last verified snapshot/);
  const strict = invoke(['--strict']);
  assert.equal(strict.status, 1);
  assert.match(strict.stderr, /Simulated source outage/);
  assert.equal(await readFile(snapshotURL, 'utf8'), before);
});
