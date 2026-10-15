/**
 * Read-only, build-time WordPress adapter. Run `npm run sync:content` to refresh.
 * A checked-in snapshot keeps builds independent of the source site's uptime.
 * Only the five mapped company pages and their media are considered, never posts.
 */
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readSolutions, readProject, readPartner, validateSnapshot, mergeCuratedSolutions } from './lib/tetra-content.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataPath = path.join(root, 'src/data/tetra.json');
const assetDirectory = path.join(root, 'public/images');
const origin = 'https://tetra.al';
const strict = process.argv.includes('--strict');
const offline = process.argv.includes('--offline');
const refreshAssets = process.argv.includes('--refresh-assets');
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', middot: '·' };
const decode = (s) => s.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (whole, e) => e[0] === '#' ? String.fromCodePoint(parseInt(e.slice(e[1]?.toLowerCase() === 'x' ? 2 : 1), e[1]?.toLowerCase() === 'x' ? 16 : 10)) : (entities[e] ?? whole));
const clean = (s) => decode(s.replace(/<(style|script)\b[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/<br\s*\/?\s*>/gi, ' ').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
const paragraphs = (s) => [...s.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => clean(m[1])).filter(Boolean);
const headings = (s) => [...s.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map((m) => ({ title: clean(m[2]), index: m.index, end: m.index + m[0].length }));
const section = (html, title) => {
  const hs = headings(html);
  const i = hs.findIndex((h) => h.title.toLocaleLowerCase() === title.toLocaleLowerCase());
  if (i < 0) throw new Error(`WordPress section missing: ${title}`);
  return html.slice(hs[i].end, hs[i + 1]?.index ?? html.length);
};

async function request(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { 'User-Agent': 'TetraHomepageContentSync/1.0' } });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response;
}

const imageSpec = (local, sourceUrl, alt, width, height) => ({ src: `/images/${local}`, sourceUrl, alt, width, height });
const upload = (file) => `${origin}/wp-content/uploads/2023/05/${file}`;

async function sync() {
  if (offline) {
    validateSnapshot(JSON.parse(await readFile(dataPath, 'utf8')));
    console.log('Using the checked-in Tetra WordPress content snapshot.');
    return;
  }
  // One request retrieves published pages; only the five mapped pages are used.
  const pages = await (await request(`${origin}/wp-json/wp/v2/pages?per_page=100&_fields=id,slug,link,title,content,modified_gmt`)).json();
  const page = (slug) => {
    const p = pages.find((p) => p.slug === slug);
    if (!p?.content?.rendered && slug !== 'kontakt-2') throw new Error(`Missing WordPress page ${slug}`);
    return p;
  };
  const home = page('kreu'), solutionsPage = page('our-solution'), projectsPage = page('projektet'), partnersPage = page('partneret'), contactPage = page('kontakt-2');
  const html = home.content.rendered;
  const history = paragraphs(section(html, 'Historia jonë'));
  if (history.length !== 3) throw new Error('History structure changed; review the source before replacing the snapshot.');
  const mission = paragraphs(section(html, 'MISIONI'));
  const vision = paragraphs(section(html, 'VIZIONI'));
  const values = paragraphs(section(html, 'VLERAT'));
  if (!mission.length || !vision.length || values.length !== 4) throw new Error('Purpose content changed; manual mapping review required.');

  const parking = imageSpec('parking-skidata.png', upload('Web-photo-Skidata2.png'), 'Sistemi i automatizuar i parkimit SKIDATA', 1611, 885);
  const airAlbania = imageSpec('air-albania.jpg', upload('Stadiumi-Air-Albania-scaled-1-1536x1152.jpg'), 'Stadiumi Air Albania', 1536, 1152);
  const solutionDefs = [
    ['parkim', 'Sisteme Parkimi', parking, 'parking'],
    ['karikim-ev', 'Karikues per Automjete Elektrike', imageSpec('karikim-elektrik.jpg', upload('electric-car-power-charging.jpg'), 'Karikimi i një automjeti elektrik', 1500, 955), 'charging'],
    ['akses-kontroll', 'Sisteme akses-kontrolli', imageSpec('akses-kontroll.jpg', upload('ticket-barriers-subway-entrance.jpg'), 'Pajisje për kontrollin e aksesit', 1500, 1001), 'shield'],
    ['siguri', 'Zgjidhje aksesi per ambjente me siguri te larte', imageSpec('siguri-aksesi.jpg', upload('scanning-finger-coronavirus-contaminated-fingerprint-access-control-1.jpg'), 'Kontroll aksesi me gjurmë gishti', 1165, 844), 'fingerprint'],
    ['sinjalistike', 'Sinjalistike inteligjente parkimi', imageSpec('sinjalistike-parkimi.jpg', upload('parking.jpg'), 'Ambiente parkimi me sinjalistikë', 1500, 1000), 'signpost'],
  ];
  const detailContent = readSolutions(solutionsPage.content.rendered);
  const solutionRouting = {
    parkim: { slug: 'sisteme-parkimi', relatedPartnerIds: ['skidata'], relatedProjectIds: ['air-albania', 'qsut', 'teg', 'kika'] },
    'karikim-ev': { slug: 'karikues-per-automjete-elektrike', relatedPartnerIds: ['circontrol'], relatedProjectIds: ['qsut', 'teg'] },
    'akses-kontroll': { slug: 'sisteme-akses-kontrolli', relatedPartnerIds: ['zucchetti'], relatedProjectIds: ['air-albania'] },
    siguri: { slug: 'akses-siguri-te-larte', relatedPartnerIds: ['gunnebo'], relatedProjectIds: ['air-albania'] },
    sinjalistike: { slug: 'sinjalistike-inteligjente-parkimi', relatedPartnerIds: ['circontrol'], relatedProjectIds: ['air-albania', 'teg'] },
  };
  const solutions = mergeCuratedSolutions(solutionDefs.map(([id, title, image, icon]) => ({
    id, title, description: paragraphs(section(html, title))[0],
    ...solutionRouting[id], ...detailContent[id],
    href: `/zgjidhje/${solutionRouting[id].slug}/`, sourceUrl: solutionsPage.link, sourcePageId: solutionsPage.id, image, icon,
  })));
  if (solutions.some((s) => !s.description || /Content Goes Here/i.test(s.description))) throw new Error('A source solution description is missing or is a placeholder.');

  const projectDefs = [
    ['air-albania', 'AIR ALBANIA', airAlbania],
    ['qsut', 'QSUT', imageSpec('qsut.webp', upload('qsut.webp'), 'Qendra Spitalore Universitare Nënë Tereza, QSUT', 1280, 720)],
    ['kika', 'KOMPLEKSI KIKA', imageSpec('kompleksi-kika.jpg', `${origin}/wp-content/uploads/2023/09/kompleksi-kika-shiten-3-garsoniere-1054820279_large-1536x893.jpg`, 'Kompleksi Kika', 1536, 893)],
    ['teg', 'TEG', imageSpec('teg.jpeg', upload('teg3-scaled-e1622077092328.jpeg'), 'Qendra tregëtare TEG', 800, 450)],
  ];
  const projects = projectDefs.map(([id, title, image]) => {
    // The project page has a title-only index followed by the real project bodies.
    const hs = headings(projectsPage.content.rendered);
    const candidates = hs.filter((h) => h.title.toUpperCase() === title);
    const h = candidates.at(-1);
    if (!h) throw new Error(`Project missing: ${title}`);
    const next = hs.find((n) => n.index > h.index);
    const body = projectsPage.content.rendered.slice(h.end, next?.index ?? undefined);
    const description = paragraphs(body).find((p) => p.startsWith('Emri i projektit:'))?.replace(/^Emri i projektit:\s*[“"]?/, '').replace(/[”"]$/, '');
    if (!description) throw new Error(`Project description missing: ${title}`);
    const slug = id === 'kika' ? 'kompleksi-kika' : id;
    return { id, slug, title, ...readProject(projectsPage.content.rendered, title), href: `/projekte/${slug}/`, sourceUrl: projectsPage.link, sourcePageId: projectsPage.id, image,
      relatedSolutionIds: solutions.filter(solution => solution.relatedProjectIds.includes(id)).map(solution => solution.id),
    };
  });

  const partnerDefs = [['skidata', 'SKIDATA', 'SKIDATA-BLACK.png', 'SKIDATA'], ['circontrol', 'CIRCONTROL', 'circontrol.png', 'CIRCONTROL'], ['gunnebo', 'GUNNEBO', 'gunnebo-black.png', 'GUNNEBO'], ['gymgest', 'GYMGEST', 'gymgest.png', 'GYMGEST'], ['zucchetti', 'Zucchetti Group', 'zuchetii.png', 'Zuccheti Group']];
  const partners = partnerDefs.map(([id, name, file, sourceTitle]) => {
    if (!partnersPage.content.rendered.includes(file)) throw new Error(`Partner logo no longer present: ${file}`);
    return { id, anchor: id, name, ...readPartner(partnersPage.content.rendered, id, sourceTitle), logo: imageSpec(file.toLowerCase(), upload(file), name, 287, 161), href: `/partnere/#${id}`, sourceUrl: partnersPage.link, sourcePageId: partnersPage.id,
      relatedSolutionIds: solutions.filter(solution => solution.relatedPartnerIds.includes(id)).map(solution => solution.id),
    };
  });

  // These exact public contact details were recovered from the indexed original
  // /partneret/ footer because its current rendered footer and Kontakt page are
  // empty. Their provenance is recorded in docs/content-sources.md.
  const contact = {
    href: '/kontakt/',
    phone: '+355 676 095 841',
    phoneHref: 'tel:+355676095841',
    email: null,
    locations: ['Tiranë', 'Prishtinë'],
    socials: [
      { label: 'Facebook', href: 'https://www.facebook.com/tetra.al' },
      { label: 'LinkedIn', href: 'https://www.linkedin.com/company/tetra-solutions/' },
      { label: 'Instagram', href: 'https://www.instagram.com/tetra.al/' },
    ],
    sourceUrl: `${origin}/tetra-solution-logo-2/`,
  };
  const data = {
    source: { url: `${origin}/`, fetchedAt: new Date().toISOString(), pages: [home, solutionsPage, projectsPage, partnersPage, contactPage].filter(Boolean).map((p) => ({ id: p.id, slug: p.slug, url: p.link, modified: p.modified_gmt })) },
    brand: { name: 'TETRA', logo: imageSpec('tetra-logo.svg', upload('T-blue-1.svg'), 'Tetra', 32, 32), wordmark: imageSpec('tetra-wordmark.svg', `${origin}/wp-content/uploads/2023/04/logo-blue.svg`, 'Tetra', 160, 160), tagline: headings(html)[0].title },
    nav: [{ label: 'Kreu', href: '/' }, { label: 'Rreth nesh', href: '/rreth-nesh/' }, { label: 'Zgjidhje', href: '/zgjidhje/' }, { label: 'Partnerët', href: '/partnere/' }, { label: 'Projektet', href: '/projekte/' }, { label: 'Kontakt', href: '/kontakt/' }],
    hero: { intro: mission[0], image: parking },
    history: { title: 'Historia jonë', paragraphs: history, image: airAlbania, stats: [{ value: '2007', label: 'Viti i themelimit' }, { value: String(contact.locations.length), label: 'Vendndodhje' }, { value: 'Shqipëri + Kosovë', label: 'Tregjet ku veprojmë' }] },
    purpose: [{ title: 'Misioni', paragraphs: mission, icon: 'target' }, { title: 'Vizioni', paragraphs: vision, icon: 'eye' }, { title: 'Vlerat', paragraphs: values, icon: 'diamond' }],
    solutions, projects, partners, contact,
    overviews: {
      solutions: { title: 'Zgjidhjet tona', intro: paragraphs(solutionsPage.content.rendered)[0], sourceUrl: solutionsPage.link },
      partners: { title: 'Partnerët tanë, forca jonë', intro: 'Transformimi i ideve në realitet', sourceUrl: partnersPage.link },
    },
    links: { home: '/', about: '/rreth-nesh/', solutions: '/zgjidhje/', projects: '/projekte/', partners: '/partnere/', contact: '/kontakt/', legal: [] },
  };
  // Validate verified headline facts rather than silently introducing new stats.
  if (!history[0].includes('2007') || !history[2].includes('3 vendndodhje') || !vision.join(' ').includes('Shqipëri dhe Kosovë')) throw new Error('Company facts changed; review statistics before updating.');
  // User-approved location correction (5 October 2026). Keep future source
  // refreshes from restoring the old Durrës office; project references stay intact.
  history[2] = history[2]
    .replace('3 vendndodhje', `${contact.locations.length} vendndodhje`)
    .replace(', zyra jonë ne qytetin e Durrësit', '');
  validateSnapshot(data);

  const assets = [data.brand.logo, data.brand.wordmark, data.hero.image, data.history.image, ...solutions.flatMap((s) => [s.image, s.heroImage].filter(Boolean)), ...projects.map((p) => p.image), ...partners.map((p) => p.logo)];
  await mkdir(assetDirectory, { recursive: true });
  for (const asset of new Map(assets.map((a) => [a.src, a])).values()) {
    const destination = path.join(root, 'public', asset.src);
    if (!refreshAssets && await stat(destination).then((s) => s.size > 0).catch(() => false)) continue;
    await pause(1600);
    const response = await request(asset.sourceUrl);
    if (!response.headers.get('content-type')?.startsWith('image/')) throw new Error(`Unexpected media type: ${asset.sourceUrl}`);
    await writeFile(destination, Buffer.from(await response.arrayBuffer()));
    console.log(`Downloaded ${asset.src}`);
  }
  await mkdir(path.dirname(dataPath), { recursive: true });
  await writeFile(dataPath, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`Refreshed Tetra content: ${solutions.length} solutions, ${projects.length} projects, ${partners.length} partners.`);
}

try {
  await sync();
} catch (error) {
  const fallbackExists = await readFile(dataPath, 'utf8').then(value => { validateSnapshot(JSON.parse(value)); return true; }).catch(() => false);
  if (!strict && fallbackExists) {
    console.warn(`Tetra content refresh unavailable (${error.message}). Keeping the last verified snapshot.`);
  } else {
    console.error(error.message);
    process.exitCode = 1;
  }
}
