import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import data from '../../src/data/tetra.json' with { type: 'json' };
import { assertNoHorizontalOverflow, loadVisibleImages, trackBrowserErrors } from '../helpers';

export const routes = ['/', '/rreth-nesh/', '/zgjidhje/', ...data.solutions.map(x => x.href), '/projekte/', ...data.projects.map(x => x.href), '/partnere/', '/kontakt/'];
const widths = [320, 375, 390, 430, 768, 1024, 1440];
const slug = (route: string) => route === '/' ? 'home' : route.slice(1, -1).replaceAll('/', '-');

for (const route of routes) {
  for (const width of widths) {
    test(`responsive ${route} at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const errors = trackBrowserErrors(page);
      page.on('requestfailed', request => errors.push(`Request failed: ${request.url()} ${request.failure()?.errorText}`));
      expect((await page.goto(route))?.status()).toBe(200);
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator('h1')).toHaveCount(1);
      await loadVisibleImages(page);
      await assertNoHorizontalOverflow(page);

      const geometry = await page.evaluate(() => {
        const visible = (e: Element) => e.checkVisibility({ checkVisibilityCSS: true }) && e.getBoundingClientRect().width > 0;
        const describe = (e: Element) => `${e.tagName.toLowerCase()}.${e.className} ${(e.textContent || '').trim().slice(0, 85)}`;
        const clippedText = [...document.querySelectorAll<HTMLElement>('h1,h2,h3,p,dd,dt,li,a,summary,strong,span')].filter(e => {
          if (!visible(e) || e.closest('.brand')) return false;
          const s = getComputedStyle(e);
          return e.clientWidth > 0 && e.scrollWidth > e.clientWidth + 2 && s.display !== 'inline' && s.webkitLineClamp === 'none';
        }).map(describe);
        const textOutsideViewport: string[] = [];
        for (const element of document.querySelectorAll('main h1,main h2,main h3,main p,main dd,main dt,footer a')) {
          if (!visible(element)) continue;
          const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
          while (walker.nextNode()) {
            if (!walker.currentNode.textContent?.trim()) continue;
            const range = document.createRange();
            range.selectNodeContents(walker.currentNode);
            if ([...range.getClientRects()].some(r => r.right > innerWidth + 1 || r.left < -1)) textOutsideViewport.push(describe(element));
          }
        }
        const overlaps: string[] = [];
        for (const selector of ['.purpose-grid', '.solutions-grid', '.projects-grid', '.related-solutions', '.footer-top', '.page-hero-grid', '.contact-page-grid', '.project-facts', '.about-stats', '.history-stats']) {
          for (const grid of document.querySelectorAll(selector)) {
            const children = [...grid.children].filter(visible);
            for (let i = 0; i < children.length; i++) for (let j = i + 1; j < children.length; j++) {
              const a = children[i].getBoundingClientRect(), b = children[j].getBoundingClientRect();
              if (Math.min(a.right,b.right)-Math.max(a.left,b.left)>1 && Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1) overlaps.push(`${selector}: ${describe(children[i])} / ${describe(children[j])}`);
            }
          }
        }
        const distortedImages = [...document.images].filter(visible).filter(img => {
          const s = getComputedStyle(img);
          if (s.objectFit === 'cover' || s.objectFit === 'contain') return false;
          return Math.abs((img.width / img.height) / (img.naturalWidth / img.naturalHeight) - 1) > .03;
        }).map(img => img.currentSrc);
        const smallTargets = [...document.querySelectorAll('a,button,summary')].filter(visible).filter(e => {
          const r = e.getBoundingClientRect();
          return r.height < 43.9 || r.width < 43.9;
        }).map(describe);
        return { clippedText, textOutsideViewport, overlaps, distortedImages, smallTargets };
      });
      expect(geometry.clippedText, 'Text containers must not overflow').toEqual([]);
      expect(geometry.textOutsideViewport, 'Rendered text must stay within the viewport').toEqual([]);
      expect(geometry.overlaps, 'Cards, hero columns, facts and footer columns must not overlap').toEqual([]);
      expect(geometry.distortedImages, 'Images must retain their aspect ratio or use intentional object-fit').toEqual([]);
      if (width <= 900) expect(geometry.smallTargets, 'Visible mobile links and controls must be at least 44 × 44 CSS pixels').toEqual([]);
      // Variant layouts must survive production CSS bundling order.
      for (const [selector, columns] of [
        ['.solutions-grid.overview-solutions', width <= 700 ? 1 : width <= 900 ? 2 : 3],
        ['.projects-grid.overview-projects', width <= 700 ? 1 : 2],
        ['.projects-grid.related-projects', width <= 700 ? 1 : 2],
      ] as const) {
        for (const grid of await page.locator(selector).all()) {
          expect(await grid.evaluate(e => getComputedStyle(e).gridTemplateColumns.split(' ').length), `${selector} columns at ${width}px`).toBe(columns);
        }
      }

      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await expect.poll(() => page.locator('header').evaluate(e => e.classList.contains('is-scrolled'))).toBe(false);
      if ([320, 390, 1440].includes(width)) {
        await mkdir('tests/mobile/screenshots', { recursive: true });
        const path = `tests/mobile/screenshots/${slug(route)}-${width}.png`;
        await page.screenshot({ path, fullPage: true, animations: 'disabled' });
        await testInfo.attach('full-page', { path, contentType: 'image/png' });
      }

      // Exercise the shared menu on every route at every requested width.
      const toggle = page.locator('[data-menu-toggle]');
      if (width <= 900) {
        await expect(toggle).toBeVisible();
        await expect(page.locator('#main-nav')).toBeHidden();
        await toggle.click();
        await expect(toggle).toHaveAttribute('aria-expanded', 'true');
      } else {
        await expect(toggle).toBeHidden();
        await expect(page.locator('#main-nav')).toBeVisible();
      }
      await page.locator('#main-nav summary').click();
      await expect(page.locator('#main-nav details')).toHaveAttribute('open', '');
      for (const link of await page.locator('.dropdown-panel a').all()) {
        await expect(link).toBeVisible();
        await link.scrollIntoViewIfNeeded();
        await link.click({ trial: true });
      }
      await assertNoHorizontalOverflow(page);
      await page.keyboard.press('Escape');
      await expect(page.locator('#main-nav details')).not.toHaveAttribute('open', '');
      if (width <= 900) await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      expect(errors, 'No console errors, runtime errors, failed requests or local HTTP errors').toEqual([]);
    });
  }

  for (const width of [320, 1440]) {
    test(`accessibility ${route} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(route);
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      expect(result.violations.map(v => ({ id:v.id, nodes:v.nodes.map(n => ({target:n.target, failure:n.failureSummary})) }))).toEqual([]);
    });
  }
}

test('all same-page contents links, partner anchors and footer back-to-top work', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const route of routes) {
    await page.goto(route);
    const links = page.locator('main a[href^="#"], main a[href*="/partnere/#"]');
    const hrefs = await links.evaluateAll(els => els.map(e => e.getAttribute('href')!));
    for (const href of [...new Set(hrefs)]) {
      await page.goto(route);
      await page.locator(`main a[href="${href}"]`).first().click();
      const target = new URL(href, new URL(route, page.url()));
      await expect(page).toHaveURL(target.href);
      await expect(page.locator(`[id="${decodeURIComponent(target.hash.slice(1))}"]`)).toBeVisible();
    }
    await page.locator('.back-top').click();
    await expect(page.locator('#main-content')).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(100);
  }
});

test('inventory every link and verify local destinations and fragments', async ({ page, request }) => {
  const links = new Map<string, string[]>();
  for (const route of routes) {
    await page.goto(route);
    for (const href of await page.locator('a').evaluateAll(els => els.map(e => e.getAttribute('href')))) {
      expect(href, `Empty link on ${route}`).toBeTruthy();
      const url = new URL(href!, page.url()).href;
      links.set(url, [...new Set([...(links.get(url) || []), route])]);
    }
  }
  for (const url of links.keys()) {
    if (!url.startsWith('http://127.0.0.1:4322/')) continue;
    const response = await request.get(url);
    expect(response.status(), url).toBe(200);
    const hash = new URL(url).hash;
    if (hash) expect(await response.text(),url).toContain(`id="${decodeURIComponent(hash.slice(1))}"`);
  }
  await writeFile('tests/mobile/link-inventory.json', JSON.stringify([...links].map(([url,pages]) => ({url,pages,checked:url.startsWith('http://127.0.0.1:4322/') ? 'HTTP and fragment' : 'destination inventory only'})),null,2));
});
