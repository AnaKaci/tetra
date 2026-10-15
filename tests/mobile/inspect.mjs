import { chromium } from '@playwright/test';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
const data = JSON.parse(await readFile('src/data/tetra.json', 'utf8'));
const routes = ['/', '/rreth-nesh/', '/zgjidhje/', ...data.solutions.map(x => x.href), '/projekte/', ...data.projects.map(x => x.href), '/partnere/', '/kontakt/'];
const phase = process.argv[2] || 'baseline';
const base = process.env.AUDIT_URL || 'http://localhost:4321';
const browser = await chromium.launch();
const results = [];
await mkdir(`tests/mobile/${phase}`, { recursive: true });
try {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  for (const width of [1440, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of routes) {
      await page.goto(base + route);
      await page.evaluate(async () => {
        await document.fonts.ready;
        for (const img of document.images) { img.loading = 'eager'; }
        await Promise.all([...document.images].map(img => img.decode().catch(() => {})));
        document.querySelectorAll('[data-reveal]').forEach(x => x.classList.add('is-visible'));
      });
      const findings = await page.evaluate(() => {
        const visible = e => e.getBoundingClientRect().width && e.getBoundingClientRect().height && getComputedStyle(e).visibility !== 'hidden';
        const describe = e => `${e.tagName.toLowerCase()}.${e.className} ${(e.textContent || '').trim().slice(0, 65)}`;
        const overflow = [...document.querySelectorAll('main *, footer *')].filter(e => visible(e) && e.getBoundingClientRect().right > innerWidth + 1 && !e.closest('.brand') && getComputedStyle(e).position !== 'absolute').map(describe);
        const clipped = [...document.querySelectorAll('h1,h2,h3,p,dd,dt,li,a,summary,strong,span')].filter(e => visible(e) && e.clientWidth > 0 && e.scrollWidth > e.clientWidth + 2 && !e.closest('.brand') && getComputedStyle(e).display !== 'inline' && getComputedStyle(e).webkitLineClamp === 'none').map(e => ({element:describe(e), client:e.clientWidth, scroll:e.scrollWidth}));
        const smallTargets = [...document.querySelectorAll('a,button,summary')].filter(e => visible(e) && !e.classList.contains('skip-link') && !e.closest('.breadcrumbs')).filter(e => { const r=e.getBoundingClientRect(); return r.height < 44 || r.width < 24; }).map(e => ({element:describe(e),w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height}));
        return { pageWidth: Math.max(document.documentElement.scrollWidth,document.body.scrollWidth),overflow,clipped,smallTargets,menuToggle:!!document.querySelector('[data-menu-toggle]') };
      });
      results.push({route,width,...findings});
      if (width === 1440 || findings.pageWidth > width || findings.clipped.length) await page.screenshot({ path:`tests/mobile/${phase}/${route === '/' ? 'home' : route.slice(1,-1).replaceAll('/','-')}-${width}.png`, fullPage:true, animations:'disabled' });
      console.log(JSON.stringify({route,width,...findings}));
    }
  }
} finally { await browser.close(); }
await writeFile(`tests/mobile/${phase}/findings.json`, JSON.stringify(results,null,2));
