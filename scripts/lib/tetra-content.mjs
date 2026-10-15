/** Pure, source-specific readers for the published Tetra WordPress pages.
 * The old page stores tab bodies as paragraphs separated by <br>, not lists.
 * Keep the company's wording and split only at those original boundaries.
 */
import curatedSolutions from '../../src/data/curated-solutions.json' with { type: 'json' };

const wordpressSolutionIds = ['parkim', 'karikim-ev', 'akses-kontroll', 'siguri', 'sinjalistike'];

export function mergeCuratedSolutions(solutions) {
  if (solutions.length !== wordpressSolutionIds.length || new Set(solutions.map(item => item.id)).size !== solutions.length || solutions.some(item => !wordpressSolutionIds.includes(item.id))) {
    throw new Error('Unexpected WordPress solution mapping; review before refreshing.');
  }
  const combined = [...solutions, ...structuredClone(curatedSolutions)];
  for (const field of ['id', 'slug', 'href']) {
    if (new Set(combined.map(item => item[field])).size !== combined.length) throw new Error(`Duplicate curated solution ${field}`);
  }
  return combined;
}

const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', middot: '·' };
export const decode = (s) => s.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (whole, entity) => {
  if (entity[0] !== '#') return entities[entity.toLowerCase()] ?? whole;
  const hexadecimal = entity[1]?.toLowerCase() === 'x';
  const value = parseInt(entity.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
  return value <= 0x10ffff ? String.fromCodePoint(value) : whole;
});
export const clean = (s) => decode(s.replace(/<(style|script)\b[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/<br\s*\/?\s*>/gi, ' ').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
export const paragraphs = (s) => [...s.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => clean(m[1])).filter(Boolean);
export const headings = (s) => [...s.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map((m) => ({ title: clean(m[2]), index: m.index, end: m.index + m[0].length }));
export function section(html, title, last = false) {
  const hs = headings(html);
  const matches = hs.filter((h) => h.title.toLocaleLowerCase() === title.toLocaleLowerCase());
  const heading = last ? matches.at(-1) : matches[0];
  if (!heading) throw new Error(`WordPress section missing: ${title}`);
  return html.slice(heading.end, hs.find((h) => h.index > heading.index)?.index ?? html.length);
}

const groups = (html, title) => [...section(html, title).matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => m[1].split(/<br\s*\/?\s*>/gi).map(clean).filter((line) => line && line !== '.'));
const first = (html, title, minimum = 1) => {
  const lines = groups(html, title)[0] ?? [];
  if (lines.length < minimum) throw new Error(`Source content incomplete: ${title}`);
  return lines;
};
const bullet = (line) => line.replace(/^[–—-]\s*/, '').replace(/\.\s+\.$/, '.');
const contentSection = (id, title, text = [], list = []) => ({ id, title, paragraphs: text, bullets: list.map(bullet) });
const verifyCount = (lines, expected, label) => {
  if (lines.length !== expected) throw new Error(`Source structure changed: ${label} (${lines.length}, expected ${expected}); review the mapping before refreshing.`);
};

export function readSolutions(html) {
  const parkingTitle = 'Sisteme Parkimi';
  const parking = first(html, parkingTitle, 3);
  const segmentTitle = 'Segmentet se ku sistemet Skidata gjejne zbatim jane disa';
  const segments = first(html, segmentTitle, 12);
  const parkingAdvantages = 'Avantazhet e zgjidhjes Skidata per menaxhimin e parkimit';
  verifyCount(parking, 3, parkingTitle);
  verifyCount(segments, 12, segmentTitle);
  if (!segments[7].startsWith('Opsionet qe Skidata')) throw new Error('Skidata options heading changed.');

  const evTitle = 'Karikues per automjete elektrike';
  const ev = groups(html, evTitle);
  if (ev.length !== 3 || ev[0].length !== 1 || ev[1].length !== 1 || ev[2].length !== 2) throw new Error('AC charger content structure changed.');
  const dcTitle = 'Karikuesit DC perfshijne modelet:';
  const dc = first(html, dcTitle, 4);
  verifyCount(dc, 4, dcTitle);
  const evAdvantages = first(html, 'Jetegjatesia:', 3);

  const accessTitle = 'Sisteme akses-kontrolli';
  const access = first(html, accessTitle, 8);
  verifyCount(access, 8, accessTitle);
  if (!access[2].startsWith('Kjo zgjidhje përshtatet')) throw new Error('Access-control audience heading changed.');

  const guidanceTitle = 'Sinjalistike inteligjente parkimi';
  const guidance = first(html, guidanceTitle, 3);
  verifyCount(guidance, 3, guidanceTitle);
  const security = first(html, 'Zbatimi ne projekte', 13);
  verifyCount(security, 13, 'Zbatimi ne projekte');
  if (security[10] !== 'Gunnebo') throw new Error('Gunnebo section heading changed.');
  const equipmentTitle = 'Pajisjet e sigurise qe kompania jone mbulon me ane te partneritetit me kompanine Gunnebo jane :';
  // The source has plain-text download prompts but supplies no catalogue URLs.
  // Omit these nonfunctional UI prompts; retain every actual equipment description.
  const equipment = first(html, equipmentTitle).map((line) => line.replace(/\s*Kliko ketu per te shkarkuar katalogun\./g, '').trim()).filter(Boolean);
  verifyCount(equipment, 3, equipmentTitle);

  return {
    parkim: { intro: parking[0], sections: [
      contentSection('sistemi-yne', parkingTitle, parking.slice(1)),
      contentSection('segmentet', segmentTitle, [], segments.slice(0, 7)),
      contentSection('opsionet', segments[7], [], segments.slice(8)),
      contentSection('avantazhet', parkingAdvantages, [], first(html, parkingAdvantages, 6)),
    ] },
    'karikim-ev': { intro: ev[0][0], sections: [
      contentSection('karikues-ac', ev[1][0], [], ev[2]),
      contentSection('karikues-dc', dcTitle, [], dc),
      contentSection('jetegjatesia-dhe-menaxhimi', 'Jetegjatesia:', [], evAdvantages),
    ] },
    'akses-kontroll': { intro: access[0], sections: [
      contentSection('menaxhimi', accessTitle, [access[1]]),
      contentSection('perdorimi', access[2], [], access.slice(3)),
      contentSection('avantazhet', 'Avantazhet:', [], first(html, 'Avantazhet:', 10)),
    ] },
    sinjalistike: { intro: guidance[0], sections: [
      contentSection('cirpark', 'Parking Guidance System', guidance.slice(1)),
      contentSection('numerimi', 'Sistemi i numerimit:', first(html, 'Sistemi i numerimit:')),
      contentSection('orientimi', 'Sistemi i Orientimit:', first(html, 'Sistemi i Orientimit:')),
    ] },
    siguri: { intro: security[0], sections: [
      contentSection('zbatimi-ne-projekte', 'Zbatimi ne projekte', [security[1]], security.slice(2, 7)),
      contentSection('aksesi-i-sigurt', 'Zgjidhje aksesi per ambjente me siguri te larte', security.slice(7, 10)),
      contentSection('gunnebo', security[10], security.slice(11)),
      contentSection('pajisjet', equipmentTitle, [], equipment),
    ] },
  };
}

export function readProject(html, title) {
  const body = paragraphs(section(html, title, true)).join('\n');
  const labels = ['Emri i projektit', 'Vendi', 'Viti i instalimit', 'Ulëse tifozësh', 'Vende parkimi', 'Kërkesat', 'Zgjidhjet e ofruara', 'Pajisjet analitike'];
  const pattern = new RegExp(`(${labels.join('|')})\\s*:\\s*`, 'g');
  const matches = [...body.matchAll(pattern)];
  const fields = Object.fromEntries(matches.map((match, index) => [match[1], body.slice(match.index + match[0].length, matches[index + 1]?.index).trim()]));
  for (const label of ['Emri i projektit', 'Vendi', 'Viti i instalimit', 'Kërkesat', 'Zgjidhjet e ofruara', 'Pajisjet analitike']) {
    if (!fields[label]) throw new Error(`Project ${title} is missing ${label}.`);
  }
  const projectName = fields['Emri i projektit'].replace(/^[“"]|[”"]$/g, '');
  return {
    description: projectName,
    projectName,
    location: fields.Vendi,
    installationYear: fields['Viti i instalimit'],
    ...(fields['Vende parkimi'] ? { parkingSpaces: fields['Vende parkimi'] } : {}),
    ...(fields['Ulëse tifozësh'] ? { capacity: { label: 'Ulëse tifozësh', value: fields['Ulëse tifozësh'] } } : {}),
    requirements: [fields.Kërkesat],
    solutionsProvided: fields['Zgjidhjet e ofruara'].split(/(?<=;)\s+/).filter(Boolean),
    // Commas within numbers such as 1,000 must remain intact.
    equipment: fields['Pajisjet analitike'].split(/,\s+/).filter(Boolean),
  };
}

export function readPartner(html, id, sourceTitle) {
  const lines = first(html, sourceTitle);
  if (id === 'gunnebo') {
    verifyCount(lines, 1, sourceTitle);
    return { description: lines[0], sections: [] };
  }
  verifyCount(lines, id === 'circontrol' ? 4 : 2, sourceTitle);
  return {
    category: lines[0],
    description: lines[1],
    sections: id === 'circontrol' ? [contentSection('sinjalistika', lines[2], [lines[3]])] : [],
  };
}

export function validateSnapshot(data) {
  const fail = (message) => { throw new Error(`Invalid Tetra snapshot: ${message}`); };
  const internal = (href) => typeof href === 'string' && /^\/(?!\/)/.test(href);
  const expectedSolutionIds = [...wordpressSolutionIds, ...curatedSolutions.map(item => item.id)];
  if (data.solutions?.length !== expectedSolutionIds.length || data.projects?.length !== 4 || data.partners?.length !== 5) fail('unexpected record counts');
  if (!data.history?.paragraphs?.length || data.purpose?.length !== 3 || !data.contact?.phoneHref) fail('missing company information');
  for (const href of [...Object.values(data.links).filter((value) => typeof value === 'string'), ...data.nav.map((item) => item.href), data.contact.href]) {
    if (!internal(href)) fail(`noninternal navigation ${href}`);
  }
  const solutionIds = new Set(data.solutions.map((item) => item.id));
  const projectIds = new Set(data.projects.map((item) => item.id));
  const partnerIds = new Set(data.partners.map((item) => item.id));
  if (solutionIds.size !== data.solutions.length || projectIds.size !== data.projects.length || partnerIds.size !== data.partners.length) fail('duplicate record IDs');
  if (expectedSolutionIds.some(id => !solutionIds.has(id))) fail('unexpected solution IDs');
  for (const item of [...data.solutions, ...data.projects, ...data.partners]) {
    const curated = data.solutions.includes(item) && curatedSolutions.find(solution => solution.id === item.id);
    const validProvenance = curated
      ? ['sourceType', 'sourceUrl', 'sourcePageId', 'sourceDocumentUrl'].every(field => item[field] === curated[field])
      : item.sourceUrl?.startsWith('https://tetra.al/') && item.sourcePageId;
    if (!internal(item.href) || !validProvenance) fail(`missing routing/provenance for ${item.id}`);
    if (!item.description) fail(`missing description for ${item.id}`);
    for (const [field, ids] of [['relatedSolutionIds', solutionIds], ['relatedProjectIds', projectIds], ['relatedPartnerIds', partnerIds]]) {
      if (item[field]?.some((id) => !ids.has(id))) fail(`invalid ${field} for ${item.id}`);
    }
  }
  for (const solution of data.solutions) {
    if (!solution.intro || !solution.sections?.length || solution.href !== `/zgjidhje/${solution.slug}/`) fail(`incomplete solution ${solution.id}`);
    for (const block of solution.sections) {
      if (!block.id || !block.title || !Array.isArray(block.paragraphs) || !Array.isArray(block.bullets) || ![...block.paragraphs, ...block.bullets].length) fail(`empty solution section ${solution.id}/${block.id}`);
    }
  }
  for (const project of data.projects) {
    if (project.href !== `/projekte/${project.slug}/` || !project.projectName || !project.location || !project.installationYear || !project.requirements?.length || !project.solutionsProvided?.length || !project.equipment?.length) fail(`incomplete project ${project.id}`);
  }
  return data;
}
