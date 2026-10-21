import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import data from '../src/data/tetra.json' with { type: 'json' };
import { assertAccessible, assertNoHorizontalOverflow, loadVisibleImages, trackBrowserErrors } from './helpers';

const base = `/${(process.env.BASE_PATH || '').replace(/^\/+|\/+$/g, '')}`.replace(/\/$/, '');
const url = (path: string) => `${base}${path}`;
const requiredContent: Record<string, string[]> = {
  parkim: ['SKIDATA', 'ticket-based', 'ticketless', 'LPR', 'RFID', 'kartëmonedha'],
  'karikim-ev': ['Wallbox', 'Post eVolve', 'Raption 50', 'Raption 100', 'Raption 150', 'Raption 350', 'CCS2', 'COSMOS', 'DLM'],
  'akses-kontroll': ['Zucchetti Group', 'Prania në kohë reale', 'Orët dhe turnet', 'sistemi i pagave'],
  siguri: ['27', 'Air Albania', 'Loro Boriçi', 'Elbasan Arena', 'Selman Stërmasi', 'Autoriteti Portual Durrës', 'Full Height Turnstiles', 'SpeedStiles', 'Tripods'],
  sinjalistike: ['CirPark', 'Numërimi', 'Detektimi', 'Orientimi', 'LED', '222', '1 000'],
  'akses-me-pagese': ['TRINITY', 'LOGITURN', 'V2A', 'dy ose tre krahë', 'gjashtë lloje monedhash', 'Printer termik'],
};

for (const solution of data.solutions) {
  for (const width of [320, 390, 768, 1024, 1440]) {
    test(`${solution.id} layout and content at ${width}px`, async ({ page, request }) => {
      await page.setViewportSize({ width, height: 960 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const errors = trackBrowserErrors(page);
      expect((await page.goto(url(solution.href)))?.status()).toBe(200);
      await page.evaluate(() => document.fonts.ready);
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      await expect(page.locator('.detail-sidebar, .contents-nav')).toHaveCount(0);
      for (const selector of ['body', '.solution-hero']) {
        const background = await page.locator(selector).evaluate(el => getComputedStyle(el).backgroundImage);
        expect(background).toContain(url('/images/background.png'));
        const imageUrls = [...background.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(match => match[1]);
        expect(imageUrls).toHaveLength(1);
        const response = await request.get(imageUrls[0]);
        expect(response.ok()).toBe(true);
        expect(response.headers()['content-type']).toContain('image/png');
      }
      for (const text of requiredContent[solution.id]) await expect(page.locator('main')).toContainText(text);
      // Preserve incoming links to all previously published section fragments.
      for (const section of solution.sections) await expect(page.locator(`[id="${section.id}"]`)).toHaveCount(1);
      await loadVisibleImages(page);
      await assertNoHorizontalOverflow(page);
      const geometry = await page.locator('main').evaluate(main => {
        const clipped = [...main.querySelectorAll<HTMLElement>('h1,h2,h3,p,dt,dd,th,td,li')].filter(el =>
          el.clientWidth && el.scrollWidth > el.clientWidth + 2).map(el => el.textContent?.trim());
        const smallLinks = [...main.querySelectorAll('a')].filter(el => {
          const rect = el.getBoundingClientRect();
          return rect.height < 44 || rect.width < 44;
        }).map(el => el.textContent?.trim());
        const distortedImages = [...main.querySelectorAll('img')].filter(img => {
          const style = getComputedStyle(img);
          return !['cover', 'contain'].includes(style.objectFit) &&
            Math.abs((img.width / img.height) / (img.naturalWidth / img.naturalHeight) - 1) > .03;
        }).map(img => img.src);
        return { clipped, smallLinks, distortedImages };
      });
      expect(geometry.clipped).toEqual([]);
      expect(geometry.distortedImages).toEqual([]);
      if (width <= 800) expect(geometry.smallLinks).toEqual([]);
      if (width <= 600) {
        const wrappedModels = await page.locator('.solution-table--comparison tbody th').evaluateAll(cells =>
          cells.filter(cell => cell.getBoundingClientRect().height > parseFloat(getComputedStyle(cell).lineHeight) + 1)
            .map(cell => cell.textContent?.trim()));
        expect(wrappedModels, 'Mobile model names should fit their existing grid column').toEqual([]);
      }
      const heroCopy = await page.locator('.solution-hero-copy').boundingBox();
      const heroVisual = await page.locator('.solution-hero-media, .solution-ranges').boundingBox();
      if (width <= 800) expect(heroVisual!.y).toBeGreaterThanOrEqual(heroCopy!.y + heroCopy!.height - 1);
      else expect(heroVisual!.x).toBeGreaterThanOrEqual(heroCopy!.x + heroCopy!.width - 1);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`${url(solution.href)}$`));
      await expect(page.locator('.solution-hero a.solution-button')).toHaveAttribute('href', url('/kontakt/'));
      await expect(page.locator('#main-nav summary')).toHaveClass(/is-active/);
      const links = await page.locator('main a').evaluateAll(els => els.map(el => el.getAttribute('href')!));
      for (const href of links) expect(href).toMatch(new RegExp(`^${base}/`));
      if ([390, 1440].includes(width)) {
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
        await expect.poll(() => page.locator('[data-header]').evaluate(el => el.classList.contains('is-scrolled'))).toBe(false);
        const folder = `test-results/solution-previews/${base ? 'github-pages' : 'root'}`;
        await mkdir(folder, { recursive: true });
        await page.screenshot({ path: `${folder}/${solution.slug}-${width}.png`, fullPage: true });
        await page.screenshot({ path: `${folder}/${solution.slug}-${width}-hero.png` });
      }
      expect(errors).toEqual([]);
    });
  }
  for (const width of [390, 1440]) {
    test(`${solution.id} accessibility at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 960 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(url(solution.href));
      await assertAccessible(page);
    });
  }
}

test('charging comparison preserves model powers and separates AC from DC', async ({ page }) => {
  await page.goto(url('/zgjidhje/karikues-per-automjete-elektrike/'));
  const ac = page.getByRole('table', { name: 'Karikues AC', exact: true });
  const dc = page.getByRole('table', { name: 'Karikues të shpejtë DC', exact: true });
  await expect(ac.getByRole('row')).toHaveCount(3);
  await expect(dc.getByRole('row')).toHaveCount(5);
  for (const power of [50, 100, 150, 350]) {
    await expect(dc.getByRole('row', { name: new RegExp(`Raption ${power} `) })).toContainText(`${power} kW`);
  }
  await expect(page.locator('main')).not.toContainText('kWh');
});

test('contact and mobile navigation work with the deployment prefix', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url('/zgjidhje/akses-me-pagese/'));
  const cta = page.locator('.solution-hero a.solution-button');
  await cta.focus();
  await expect(cta).toBeFocused();
  expect(await cta.evaluate(el => getComputedStyle(el).outlineStyle)).toBe('solid');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(new RegExp(`${url('/kontakt/')}$`));
  await expect(page.locator('main a[href="tel:+355676095841"]').first()).toBeVisible();
  await page.locator('[data-menu-toggle]').click();
  await page.locator('#main-nav summary').click();
  await page.locator(`#main-nav a[href="${url('/zgjidhje/sisteme-parkimi/')}"]`).click();
  await expect(page).toHaveURL(new RegExp(`${url('/zgjidhje/sisteme-parkimi/')}$`));
  await expect(page.locator('[data-menu-toggle]')).toHaveAttribute('aria-expanded', 'false');
});

test('solution project references use compact photo cards and retain project links', async ({ page }) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 960 });
    await page.goto(url('/zgjidhje/sisteme-parkimi/'));
    const cards = page.locator('.solution-references .solution-reference');
    await expect(cards).toHaveCount(4);
    expect(await cards.evaluateAll(elements => elements.map(a => a.getAttribute('href')))).toEqual([
      url('/projekte/qsut/'),
      url('/projekte/kompleksi-kika/'),
      url('/projekte/air-albania/'),
      url('/projekte/teg/'),
    ]);
    await expect(cards.first().locator('.solution-reference-content')).toContainText('QSUT');
    await expect(cards.first().locator('.solution-reference-category')).toHaveText('Spital');
    await expect(cards.first().locator('img')).toHaveAttribute('alt', '');
    await expect(cards.first().locator('img')).toHaveCSS('object-fit', 'cover');
    const columns = await page.locator('.solution-references').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length);
    expect(columns).toBe(width < 600 ? 1 : 2);
    if (width === 1440) {
      const box = await cards.first().boundingBox();
      expect(box!.height).toBeLessThan(350);
    }
    await assertNoHorizontalOverflow(page);
  }
});
