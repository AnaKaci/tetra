import { test, expect } from '@playwright/test';
import data from '../src/data/tetra.json' with { type: 'json' };
import { assertAccessible, assertNoHorizontalOverflow, loadVisibleImages, trackBrowserErrors, widths } from './helpers';

const sections = ['kreu', 'historia', 'qellimi', 'zgjidhje', 'projekte', 'partnere', 'kontakt'];

for (const width of widths) {
  test(`homepage renders without overflow or broken assets at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
    const errors = trackBrowserErrors(page);

    expect((await page.goto('/'))?.status()).toBe(200);
    await expect(page.locator('main#main-content')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/SMART[\s·]*SECURE[\s·]*GREEN/i);
    for (const id of sections) {
      await expect(page.locator(`#${id}`)).toBeVisible();
    }
    await expect(page.locator('#historia')).toContainText('2007');
    for (const title of ['Misioni', 'Vizioni', 'Vlerat']) {
      await expect(page.locator('#qellimi').getByRole('heading', { name: title, exact: true })).toBeVisible();
    }
    await expect(page.locator('body')).not.toContainText(/lorem ipsum|your company|placeholder text/i);
    await assertNoHorizontalOverflow(page);
    await loadVisibleImages(page, 11);
    await assertNoHorizontalOverflow(page);
    await page.evaluate(async () => { await document.fonts.ready; });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.screenshot({ path: testInfo.outputPath(`tetra-homepage-${width}.png`), fullPage: true, animations: 'disabled' });
    expect(errors, 'Browser console, page, and local resource errors').toEqual([]);
  });
}

test('navigation targets and solution links are usable', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  const navigation = page.locator('#main-nav');
  await expect(navigation).toBeVisible();
  const dropdown = navigation.locator('details');
  await dropdown.locator('summary').filter({ hasText: 'Zgjidhje' }).click();
  await expect(dropdown).toHaveAttribute('open', '');
  const links = dropdown.locator('a');
  const hrefs = await links.evaluateAll((elements) => elements.map((element) => element.getAttribute('href')));
  expect(hrefs).toEqual(['/zgjidhje/', ...data.solutions.map(solution => solution.href)]);
  expect(hrefs.slice(1).every(href => href?.startsWith('/zgjidhje/') && href !== '/zgjidhje/')).toBe(true);
  for (const link of await links.all()) {
    await expect(link).toBeVisible();
    expect((await link.textContent())?.trim()).toBeTruthy();
  }

  const brokenAnchors = await page.locator('a[href^="#"]').evaluateAll((elements) => elements
    .map((element) => element.getAttribute('href') || '')
    .filter((href) => href === '#' || !document.getElementById(decodeURIComponent(href.slice(1)))));
  expect(brokenAnchors, 'All internal navigation links must target a real section').toEqual([]);

  const contactLinks = page.getByRole('link', { name: /Na kontaktoni/i });
  expect(await contactLinks.count()).toBeGreaterThanOrEqual(2);
  for (const link of await contactLinks.all()) {
    expect(await link.getAttribute('href')).toBe('/kontakt/');
  }
  await expect(page.locator(`#kontakt a[href="${data.contact.phoneHref}"]`)).toBeVisible();
  for (const solution of data.solutions) {
    await expect(page.locator(`#zgjidhje .solution-card[href="${solution.href}"]`)).toHaveCount(1);
  }
  const projectCards = page.locator('#projekte .project-card');
  expect(await projectCards.count()).toBeGreaterThanOrEqual(3);
  for (const card of await projectCards.all()) {
    const href = await card.getAttribute('href');
    expect(href).toMatch(/^\/projekte\/[^/]+\/$/);
    expect(data.projects.map(project => project.href)).toContain(href);
  }
  for (const partner of data.partners) {
    await expect(page.locator(`#partnere .partner-logo[href="${partner.href}"]`)).toHaveCount(1);
  }
  await expect(page.locator('#historia a[href="/rreth-nesh/"]')).toBeVisible();
  await expect(page.locator('.hero-buttons a[href="/zgjidhje/"]')).toBeVisible();
  await expect(navigation.locator('a.nav-link[href="/"]')).toHaveAttribute('aria-current', 'page');
});

test('mobile menu supports Escape and closes after internal page navigation', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 });
  await page.goto('/');
  const toggle = page.locator('[data-menu-toggle]');
  const navigation = page.locator('#main-nav');
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(navigation).not.toBeVisible();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(navigation).toBeVisible();
  await assertNoHorizontalOverflow(page);
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(navigation).not.toBeVisible();
  await expect(toggle).toBeFocused();
  await toggle.click();
  await navigation.locator('a.nav-link[href="/projekte/"]').click();
  await expect(page).toHaveURL(/\/projekte\/$/);
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(navigation).not.toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('reduced-motion preference keeps content readable without animated scrolling', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const styles = await page.evaluate(() => ({
    scroll: getComputedStyle(document.documentElement).scrollBehavior,
    invisibleSections: [...document.querySelectorAll('main section')].filter((section) => getComputedStyle(section).opacity === '0').length,
  }));
  expect(styles.scroll).toBe('auto');
  expect(styles.invisibleSections).toBe(0);
  for (const id of sections) await expect(page.locator(`#${id}`)).toBeVisible();
});

for (const width of [1440, 375]) {
  test(`homepage accessibility at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await assertAccessible(page);
  });
}
