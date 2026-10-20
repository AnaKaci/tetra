import { test, expect, type APIRequestContext } from '@playwright/test';
import data from '../src/data/tetra.json' with { type: 'json' };
import { solutionDetails } from '../src/data/solution-details';
import { assertAccessible, assertNoHorizontalOverflow, loadVisibleImages, trackBrowserErrors, widths } from './helpers';

const routes = [
  { path: '/', title: 'SMART', active: '/', text: [data.history.paragraphs[0]] },
  { path: '/rreth-nesh/', title: 'Rreth nesh', active: '/rreth-nesh/', text: data.history.paragraphs },
  { path: '/zgjidhje/', title: 'Zgjidhjet tona', active: '/zgjidhje/', text: [data.overviews.solutions.intro] },
  ...data.solutions.map(solution => ({ path: solution.href, title: solutionDetails[solution.id].title, active: '/zgjidhje/', text: [solutionDetails[solution.id].intro] })),
  { path: '/projekte/', title: 'Projekte që bëjnë diferencën', active: '/projekte/', text: data.projects.map(project => project.title) },
  ...data.projects.map(project => ({ path: project.href, title: project.title, active: '/projekte/', text: [project.projectName, project.location, project.installationYear, project.parkingSpaces, ...project.requirements, ...project.solutionsProvided, ...project.equipment] })),
  { path: '/partnere/', title: data.overviews.partners.title, active: '/partnere/', text: data.partners.flatMap(partner => [partner.description, ...partner.sections.flatMap(section => [...section.paragraphs, ...section.bullets])]) },
  { path: '/kontakt/', title: 'Na kontaktoni', active: '/kontakt/', text: [data.contact.phone, ...data.contact.locations] },
];
const htmlCache = new Map<string, string>();
async function getHTML(request: APIRequestContext, path: string) {
  if (!htmlCache.has(path)) {
    const response = await request.get(path);
    expect(response.status(), `Broken internal route: ${path}`).toBe(200);
    htmlCache.set(path, await response.text());
  }
  return htmlCache.get(path)!;
}

for (const route of routes) {
  for (const width of [1440, 375]) {
    test(`${route.path} content, navigation and assets at ${width}px`, async ({ page, request }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const errors = trackBrowserErrors(page);
      const response = await page.goto(route.path);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      await expect(page.getByRole('heading', { level: 1 })).toContainText(route.title);
      for (const text of route.text) await expect(page.locator('main')).toContainText(text);
      await assertNoHorizontalOverflow(page);
      await loadVisibleImages(page);
      await assertNoHorizontalOverflow(page);

      const anchors = await page.locator('a[href]').evaluateAll(elements => elements.map(element => element.getAttribute('href')!));
      expect(anchors.filter(href => /^https?:\/\/(www\.)?tetra\.al(?:\/|$)/i.test(href)), 'No frontend anchors may navigate back to the original Tetra website').toEqual([]);
      for (const href of new Set(anchors)) {
        if (/^(tel:|mailto:|https?:)/.test(href)) continue;
        expect(href).toMatch(/^(\/|#)/);
        const target = new URL(href, page.url());
        expect(target.pathname).toMatch(/\/$/);
        const html = await getHTML(request, target.pathname);
        if (target.hash) expect(html, `Missing anchor: ${href}`).toContain(`id="${decodeURIComponent(target.hash.slice(1))}"`);
      }
      for (const link of await page.locator('a[target="_blank"]').all()) {
        expect(await link.getAttribute('rel')).toContain('noopener');
        expect(await link.getAttribute('rel')).toContain('noreferrer');
      }
      const nav = page.locator('#main-nav');
      const active = route.active === '/zgjidhje/' ? nav.locator('summary.is-active') : nav.locator(`a.nav-link[href="${route.active}"]`);
      await expect(active).toHaveClass(/is-active/);
      expect(await active.getAttribute('aria-current')).toBeTruthy();
      // Scrolling to the footer must not replace the pathname-based active state.
      await page.locator('footer').scrollIntoViewIfNeeded();
      await expect(active).toHaveClass(/is-active/);

      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(new URL(canonical!).pathname).toBe(route.path);
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', canonical!);
      const title = await page.title();
      expect(title).toContain('TETRA');
      expect(await page.locator('meta[name="description"]').getAttribute('content')).toBeTruthy();
      expect(await page.locator('meta[property="og:image"]').getAttribute('content')).toBeTruthy();
      expect(errors).toEqual([]);
    });
  }
}

const templates = ['/rreth-nesh/', '/zgjidhje/', '/zgjidhje/akses-siguri-te-larte/', '/zgjidhje/karikues-per-automjete-elektrike/', '/projekte/', '/projekte/air-albania/', '/partnere/', '/kontakt/'];
for (const width of widths.filter(width => ![1440, 375].includes(width))) {
  test(`internal page templates have no overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const path of templates) {
      await page.goto(path);
      await assertNoHorizontalOverflow(page);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    }
  });
}

for (const width of [1440, 375]) {
  for (const path of templates) {
    test(`${path} accessibility at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(path);
      await assertAccessible(page);
    });
  }
}

test('internal-page mobile dropdown and contact navigation remain usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/zgjidhje/sisteme-parkimi/');
  const toggle = page.locator('[data-menu-toggle]');
  await toggle.click();
  await page.locator('#main-nav summary').click();
  await expect(page.locator('#main-nav .nav-dropdown')).toHaveAttribute('open', '');
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toBeFocused();
  await toggle.click();
  await page.locator('#main-nav a.nav-link[href="/kontakt/"]').click();
  await expect(page).toHaveURL(/\/kontakt\/$/);
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('main a[href="tel:+355676095841"]')).toHaveCount(2);
  await expect(page.locator('main form, main input[type="email"], main a[href^="mailto:"]')).toHaveCount(0);
});

test('all four projects and five partner anchors exist', async ({ page }) => {
  await page.goto('/projekte/');
  await expect(page.locator('main .project-card')).toHaveCount(4);
  await page.goto('/partnere/');
  for (const partner of data.partners) await expect(page.locator(`main #${partner.anchor}`)).toBeVisible();
});
