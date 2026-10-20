import data from './tetra.json';
import type { ContentImage } from '../types/content';

// Editorial presentation of the verified snapshot. Keep the original CMS copy
// and provenance intact; content refreshes must not overwrite this composition.
// See docs/solution-redesign.md for source mapping and technical corrections.
export interface DetailItem { title: string; text: string; id?: string; href?: string; }
interface SectionBase { id: string; label: string; title: string; intro?: string; }
export type DetailSection = SectionBase & (
  | { kind: 'features'; items: DetailItem[]; layout?: 'rows' | 'columns' }
  | { kind: 'table'; columns: string[]; rows: string[][]; note?: string }
  | { kind: 'process'; items: DetailItem[]; ordered?: boolean }
  | { kind: 'applications'; items: string[] }
  | { kind: 'media'; image: ContentImage; caption: string; paragraphs: string[]; items?: DetailItem[] }
  | { kind: 'references'; items: { projectId: string; text: string }[] }
);
export interface SolutionDetail {
  title: string;
  label: string;
  intro: string;
  hero: { variant: 'equipment' | 'application' | 'project' | 'product' | 'technical'; image?: ContentImage; caption?: string; productName?: string; ranges?: { label: string; power: string; models: string }[] };
  facts: { label: string; value: string }[];
  sections: DetailSection[];
  contact: string;
}
const solution = (id: string) => {
  const item = data.solutions.find(item => item.id === id);
  if (!item) throw new Error(`Missing solution content: ${id}`);
  return item;
};
const project = (id: string) => {
  const item = data.projects.find(item => item.id === id);
  if (!item) throw new Error(`Missing project content: ${id}`);
  return item;
};

export const solutionDetails: Record<string, SolutionDetail> = {
  parkim: {
    title: 'Sisteme parkimi',
    label: 'Menaxhim parkimi · SKIDATA',
    intro: 'Hyrje-dalje, pagesa dhe menaxhim i parkimit në një sistem. Zgjidhjet modulare SKIDATA përshtaten nga parkimet e vogla deri te komplekset me disa hyrje dhe zona.',
    hero: {
      variant: 'equipment',
      image: { src: '/images/parking-skidata.png', alt: 'Terminale hyrje-daljeje, barrierë dhe automat pagese SKIDATA', width: 1611, height: 885 },
      caption: 'SKIDATA · Pajisje aksesi dhe pagese për parkime',
    },
    facts: [{ label: 'Aksesi', value: 'Biletë ose targë' }, { label: 'Pagesa', value: 'Me operator ose automatike' }, { label: 'Menaxhimi', value: 'Softuer modular' }],
    sections: [
      { kind: 'features', id: 'sistemi-yne', label: 'Kontrolli i hyrje-daljeve', title: 'Dy mënyra për të menaxhuar aksesin', layout: 'columns', items: [
        { id: 'opsionet', title: 'Me biletë · ticket-based', text: 'Terminalet lëshojnë bileta fizike për menaxhimin e hyrjes dhe daljes së automjeteve.' },
        { title: 'Me targë · ticketless', text: 'Kamerat LPR lexojnë targën në hyrje dhe dalje. Automjeti identifikohet pa përdorur biletë fizike.' },
      ] },
      { kind: 'table', id: 'pagesat', label: 'Pagesa dhe shërbime', title: 'Një sistem për parkimin dhe karikimin', columns: ['Mënyra', 'Funksionimi'], rows: [
        ['Pagesë me operator', 'Arkëtimi i tarifës së parkimit në pikën e pagesës.'],
        ['Pagesë automatike', 'Monedha, kartëmonedha dhe karta debiti ose krediti. Kthim kusuri në monedha apo kartëmonedha, sipas pajisjes.'],
        ['Karikim i integruar', 'Identifikim me biletë, kartë RFID ose targë. Tarifa e parkimit dhe e karikimit paguhen në një faturë të vetme.'],
      ] },
      { kind: 'features', id: 'avantazhet', label: 'Për operatorin', title: 'Kontroll mbi funksionimin e përditshëm', items: [
        { title: 'Konfigurim modular', text: 'Funksionet e softuerit përshtaten me tipologjinë dhe madhësinë e parkimit.' },
        { title: 'Të dhëna dhe të ardhura', text: 'Menaxhim i të dhënave dhe i arkëtimeve, me transparencë në pagesat e klientëve.' },
        { title: 'Raportim', text: 'Raporte për operimin e përditshëm dhe për vendimmarrjen mbi menaxhimin e parkimit.' },
      ] },
      { kind: 'applications', id: 'segmentet', label: 'Fushat e përdorimit', title: 'Nga rezidencat te infrastruktura publike', items: ['Aeroporte', 'Qendra tregtare', 'Operatorë parkimi', 'Rezidenca banimi', 'Qendra spitalore', 'Hotele', 'Parkime qyteti'] },
      { kind: 'references', id: 'projekte', label: 'Referenca TETRA', title: 'Sisteme parkimi në përdorim', items: [
        { projectId: 'qsut', text: 'Menaxhim i tre hyrje-daljeve, arkëtim pagesash dhe kamera LPR.' },
        { projectId: 'kika', text: 'Menaxhim i qendërzuar i katër ambienteve të parkimit dhe akses përmes targës.' },
        { projectId: 'air-albania', text: 'Menaxhim parkimi me Parking.Logic, terminale Lite.Gate dhe kamera LPR.' },
        { projectId: 'teg', text: 'Hyrje-dalje, pagesa automatike dhe integrim me karikimin elektrik.' },
      ] },
    ],
    contact: 'Na tregoni numrin e hyrje-daljeve, kapacitetin e parkimit dhe mënyrën e pagesës që kërkoni.',
  },
  'karikim-ev': {
    title: 'Karikues për automjete elektrike',
    label: 'Karikim elektrik · CIRCONTROL',
    intro: 'Karikues AC dhe DC, me menaxhim të qendërzuar dhe shpërndarje dinamike të energjisë. Zgjidhni modelin sipas mënyrës së përdorimit dhe kapacitetit të instalimit.',
    // The available charging pictures are generic illustrations, not verified
    // CIRCONTROL products. Use the real model ranges instead of mislabelling them.
    hero: { variant: 'technical', ranges: [
      { label: 'AC', power: '7,4–22 kW', models: 'Wallbox / Post eVolve' },
      { label: 'DC', power: '50–350 kW', models: 'Familja Raption' },
    ] },
    facts: [{ label: 'Karikimi', value: 'AC dhe DC' }, { label: 'Platforma', value: 'COSMOS' }, { label: 'Energjia', value: 'Dynamic Load Management' }],
    sections: [
      { kind: 'table', id: 'karikues-ac', label: 'Rrymë alternative', title: 'Karikues AC', intro: 'Modelet Wallbox dhe Post eVolve mbulojnë karikimin AC me fuqi deri në 22 kW.', columns: ['Modeli', 'Fuqia', 'Konfigurimi'], rows: [
        ['Wallbox', '7,4–22 kW', 'Karikim AC, sipas modelit të përzgjedhur.'],
        ['Post eVolve', 'Deri në 22 kW', 'Dy dalje për karikimin e njëkohshëm të dy automjeteve.'],
      ] },
      { kind: 'table', id: 'karikues-dc', label: 'Rrymë e vazhduar', title: 'Karikues të shpejtë DC', intro: 'Familja Raption ofron nivele të ndryshme fuqie dhe konfigurime për karikim të njëkohshëm.', columns: ['Modeli', 'Fuqia maksimale DC', 'Daljet dhe opsionet'], rows: [
        ['Raption 50', '50 kW', 'CCS2. Opsion me dalje AC deri në 22 kW për një automjet të dytë.'],
        ['Raption 100', '100 kW', 'CCS2. Opsion me dalje AC deri në 22 kW për një automjet të dytë.'],
        ['Raption 150', '150 kW', 'CCS2. Konfigurim me dy dalje CCS2 për karikim të njëkohshëm në DC.'],
        ['Raption 350', '350 kW', 'Karikim DC me fuqi të lartë. Konfigurimi përcaktohet sipas instalimit.'],
      ], note: 'Fuqia dhe daljet varen nga modeli dhe konfigurimi. Përzgjedhja bëhet në përputhje me kapacitetin elektrik të objektit.' },
      { kind: 'features', id: 'jetegjatesia-dhe-menaxhimi', label: 'Softueri', title: 'Menaxhimi i pikave dhe i energjisë', layout: 'columns', items: [
        { title: 'COSMOS Platform', text: 'Menaxhim në distancë i karikuesve përmes internetit: statusi i pajisjeve, alarmet, konsumi sipas periudhës dhe dhënia ose heqja e aksesit.' },
        { title: 'DLM', text: 'Dynamic Load Management shpërndan fuqinë e disponueshme për karikim duke marrë parasysh konsumin e pajisjeve të tjera në ndërtesë.' },
      ] },
      { kind: 'references', id: 'projekte', label: 'Referenca TETRA', title: 'Karikim i integruar në parkim', items: [
        { projectId: 'qsut', text: 'Një karikues elektrik, krahas sistemit të menaxhimit të parkimit.' },
        { projectId: 'teg', text: 'Karikues elektrikë të integruar me sistemin e parkimit.' },
      ] },
    ],
    contact: 'Na tregoni numrin e pikave të karikimit, përdorimin e tyre dhe fuqinë elektrike të disponueshme.',
  },
  'akses-kontroll': {
    title: 'Sisteme akses-kontrolli',
    label: 'Akses dhe kohë pune · Zucchetti Group',
    intro: 'Menaxhoni hyrje-daljet dhe kohën e punës në një sistem të integruar. Zgjidhja Zucchetti Group mbledh dhe përpunon të dhënat e aksesit dhe të pranisë së punonjësve.',
    hero: { variant: 'application', image: solution('akses-kontroll').image, caption: 'Kontroll i kalimit në hyrje-dalje' },
    facts: [{ label: 'Aksesi', value: 'Hyrje-dalje të kontrolluara' }, { label: 'Stafi', value: 'Prani dhe turne pune' }, { label: 'Integrimi', value: 'Import / eksport të dhënash' }],
    sections: [
      { kind: 'features', id: 'menaxhimi', label: 'Menaxhimi i stafit', title: 'Nga hyrja në ambient te evidenca e punës', items: [
        { title: 'Prania në kohë reale', text: 'Kontroll i pjesëmarrjes dhe mungesave, me raportim të anomalive të frekuentimit.' },
        { title: 'Orët dhe turnet', text: 'Llogaritje automatike e orëve të planifikuara dhe të kryera në ambientin e punës, si dhe planifikim i turneve.' },
        { title: 'Struktura e organizatës', text: 'Organizim sipas kompanive, departamenteve dhe pozicioneve, me të dhëna për secilin punonjës.' },
      ] },
      { kind: 'features', id: 'avantazhet', label: 'Integrimi', title: 'Të dhëna të përdorshme nga sistemet e tjera', layout: 'columns', items: [
        { title: 'Shkëmbim të dhënash', text: 'Import dhe eksport për përpunim në sisteme të treta. Akses-kontrolli lidhet me matjen e kohës së punës.' },
        { title: 'Raporte për administrimin', text: 'Raporte të personalizuara dhe të dhëna që mund të përdoren nga sistemi i pagave.' },
      ] },
      { kind: 'applications', id: 'perdorimi', label: 'Fushat e përdorimit', title: 'Një strukturë për organizata të ndryshme', items: ['Ndërmarrje të çdo madhësie', 'Institucione publike', 'Spitale', 'Institucione arsimore', 'Hotele'] },
      { kind: 'references', id: 'projekte', label: 'Referencë TETRA', title: 'Kontroll aksesi në Air Albania', items: [
        { projectId: 'air-albania', text: 'Sistem akses-kontrolli nga Zucchetti Group për menaxhimin e hyrjes së tifozëve në stadium.' },
      ] },
    ],
    contact: 'Na tregoni numrin e punonjësve, pikat e aksesit dhe sistemet me të cilat duhet të shkëmbehen të dhënat.',
  },
  siguri: {
    title: 'Akses për ambiente me siguri të lartë',
    label: 'Siguri fizike · Gunnebo',
    intro: 'Kontroll i hyrjes në stadiume, porte dhe ambiente me akses të kufizuar. Pajisjet Gunnebo përshtaten me fluksin e vizitorëve dhe organizimin e zonave të sigurisë.',
    hero: { variant: 'project', image: project('air-albania').image, caption: 'Stadiumi Air Albania · Projekt TETRA' },
    facts: [{ label: 'Pajisjet', value: 'Gunnebo' }, { label: 'Referencë', value: 'Stadiumi Air Albania' }, { label: 'Instalimi në stadium', value: '27 Full Height Turnstiles' }],
    sections: [
      { kind: 'features', id: 'zbatimi-ne-projekte', label: 'Përvoja në terren', title: 'Referenca në Shqipëri', items: [
        { title: 'Stadiumi Air Albania', text: 'Kontroll i hyrjes së tifozëve me 27 turnikete me lartësi të plotë dhe softuer akses-kontrolli.', href: '/projekte/air-albania/' },
        { title: 'Stadiume të tjera', text: 'Zgjidhje të zbatuara në stadiumet Loro Boriçi, Elbasan Arena dhe Selman Stërmasi.' },
        { title: 'Autoriteti Portual Durrës', text: 'Zbatim i sistemit të akses-kontrollit në ambientet portuale.' },
      ] },
      { kind: 'table', id: 'pajisjet', label: 'Pajisjet Gunnebo', title: 'Përzgjedhje sipas pikës së hyrjes', columns: ['Kategoria', 'Përdorimi'], rows: [
        ['Full Height Turnstiles', 'Turnikete me lartësi të plotë për stadiume, ambiente ushtarake, zyra shtetërore dhe banka.'],
        ['SpeedStiles', 'Kontroll i hyrje-daljeve në zyra, porte, aeroporte dhe metro.'],
        ['Tripods', 'Turnikete për kontrollin e kalimit në hyrje-dalje të ambienteve të zyrave.'],
      ] },
      { kind: 'features', id: 'aksesi-i-sigurt', label: 'Organizimi i aksesit', title: 'Hyrje të përshtatura me përdoruesit', layout: 'columns', items: [
        { title: 'Evente dhe flukse vizitorësh', text: 'Organizim i hyrjeve për publikun, zonat VIP dhe të ftuarit në evente sportive e kulturore.' },
        { id: 'gunnebo', title: 'Zona me akses të kufizuar', text: 'Përzgjedhje e pajisjeve Gunnebo sipas nevojave të sigurisë, duke marrë parasysh edhe kalimin e personave me aftësi të kufizuara.' },
      ] },
    ],
    contact: 'Diskutojmë fluksin e vizitorëve, zonat e kontrollit dhe kërkesat e aksesit për objektin tuaj.',
  },
  sinjalistike: {
    title: 'Sinjalistikë inteligjente parkimi',
    label: 'Orientim në parkim · CIRCONTROL',
    intro: 'Nga hyrja e parkimit deri te vendi i lirë. Parking Guidance System jep informacion për disponueshmërinë dhe orienton drejtuesit përmes numërimit, sensorëve dhe sinjalistikës LED.',
    hero: { variant: 'application', image: { ...solution('sinjalistike').image, alt: 'Parkim i brendshëm me tregues LED të gjelbër mbi vendet e parkimit' }, caption: 'Sinjalistikë LED për identifikimin e vendeve të lira' },
    facts: [{ label: 'Në hyrje', value: 'Numërim sipas zonës' }, { label: 'Në vendparkim', value: 'Detektim me sensorë' }, { label: 'Për drejtuesin', value: 'Orientim me LED' }],
    sections: [
      { kind: 'process', id: 'cirpark', label: 'Parking Guidance System', title: 'Tre nivele informacioni për parkimin', intro: 'Platforma CirPark lidh informacionin mbi hapësirat e parkimit me udhëzimin e drejtuesve.', items: [
        { id: 'numerimi', title: 'Numërimi', text: 'Informacion për vendet e lira në hyrjen kryesore dhe sipas zonave të parkimit.' },
        { id: 'detektimi', title: 'Detektimi', text: 'Sensorët identifikojnë nëse vendi i parkimit është i lirë apo i zënë.' },
        { id: 'orientimi', title: 'Orientimi', text: 'Sinjalistika LED udhëzon drejtuesin drejt vendit të lirë. Ngjyra e gjelbër tregon disponueshmërinë.' },
      ] },
      { kind: 'media', id: 'informacioni-ne-parkim', label: 'Nga zona te vendi', title: 'Informacion aty ku merret vendimi', image: { ...solution('parkim').image, alt: 'Tabela me numrin e vendeve të lira dhe shigjeta orientimi brenda një parkimi' }, caption: 'Numërim sipas zonës dhe sinjalistikë orientuese', paragraphs: ['Në hyrje, drejtuesi sheh cilat zona kanë vende të lira. Brenda parkimit, treguesit LED e ndihmojnë të identifikojë vendin e disponueshëm.', 'Numërimi dhe orientimi reduktojnë qarkullimin e panevojshëm në kërkim të një vendi parkimi.'] },
      { kind: 'references', id: 'projekte', label: 'Referenca TETRA', title: 'Parking Guidance System në projekte', items: [
        { projectId: 'air-albania', text: 'Parking Guidance System për 222 vende dhe softuer SCADA për menaxhimin e disponueshmërisë.' },
        { projectId: 'teg', text: 'Parking Guidance System për 1 000 vende, me sinjalistikë LED dhe menaxhim përmes SCADA.' },
      ] },
    ],
    contact: 'Na tregoni numrin e vendeve, ndarjen në zona dhe organizimin e qarkullimit brenda parkimit.',
  },
  'akses-me-pagese': {
    title: 'Sisteme aksesi me pagesë',
    label: 'Gotschlich · TRINITY',
    intro: 'TRINITY bashkon një automat pagese dhe një turniket të motorizuar në një pajisje. Pagesa e tarifës lidhet drejtpërdrejt me hyrjen në ambientin e shërbimit.',
    hero: { variant: 'product', productName: 'TRINITY', image: solution('akses-me-pagese').heroImage, caption: 'TRINITY · Versioni me tre krahë' },
    facts: [{ label: 'Produkti', value: 'TRINITY' }, { label: 'Kontrolli', value: 'LOGITURN' }, { label: 'Konstruksioni', value: 'Çelik inox V2A' }],
    sections: [
      { kind: 'process', id: 'hyrja-dhe-pagesa', label: 'Rrjedha e vizitorit', title: 'Nga pagesa te hyrja', ordered: true, items: [
        { title: 'Udhëzimi', text: 'Vizitori ndjek udhëzimet në ekranin me ngjyra të njësisë së pagesës.' },
        { title: 'Pagesa', text: 'Kryen pagesën e tarifës së hyrjes me monedhat e pranuara nga pajisja.' },
        { title: 'Kalimi', text: 'Pas pagesës, kalon përmes turniketit të motorizuar në zonën e shërbimit.' },
      ] },
      { kind: 'table', id: 'pagesa-dhe-kontrolli', label: 'Të dhënat e pajisjes', title: 'Specifikimet e TRINITY', columns: ['Elementi', 'Përshkrimi'], rows: [
        ['Trupi', 'Çelik inox V2A për turniketin dhe njësinë e pagesës.'],
        ['Krahët', 'Versione me dy ose tre krahë.'],
        ['Mekanizmi', 'Turniket i motorizuar me kontroll LOGITURN dhe funksionim në të dy drejtimet.'],
        ['Pagesa', 'Deri në gjashtë lloje monedhash, sipas konfigurimit. Tarifë hyrjeje e rregullueshme.'],
        ['Ndërfaqja', 'Ekran me ngjyra për udhëzimin e vizitorit.'],
        ['Administrimi', 'Numërues i kalimeve dhe pagesave. Kuti monedhash me bravë sigurie.'],
      ] },
      { kind: 'media', id: 'opsionet', label: 'Konfigurimi', title: 'Opsione për administrimin e pagesave', image: solution('akses-me-pagese').image, caption: 'Detaj i ekranit dhe hyrjes së monedhave', paragraphs: ['Konfigurimi përshtatet me mënyrën e përdorimit dhe organizimin e hyrje-daljeve.'], items: [
        { title: 'Printer termik', text: 'Printim kuponësh, si pajisje opsionale.' },
        { title: 'Monitorim', text: 'Monitorim i mbushjes së kutisë së monedhave dhe zbulim i ndërhyrjeve të paautorizuara, sipas konfigurimit.' },
      ] },
      { kind: 'applications', id: 'fushat-e-perdorimit', label: 'Fushat e përdorimit', title: 'Ambiente me tarifë hyrjeje', items: ['Parqe argëtimi dhe atraksione turistike', 'Pishina dhe ambiente rekreative', 'Tualete dhe dushe publike', 'Ambiente sanitare në pika shërbimi dhe restorante'] },
    ],
    contact: 'Na tregoni fluksin e vizitorëve, tarifën e hyrjes dhe organizimin e kalimit për të përcaktuar konfigurimin e TRINITY.',
  },
};
