import { test, expect } from '@playwright/test';
import { assertAccessible, assertNoHorizontalOverflow, trackBrowserErrors } from '../helpers';

const mobileWidths = [320, 375, 390, 430, 768];

test.describe('mobile navigation with touch input', () => {
  test.use({ hasTouch: true });

  for (const width of mobileWidths) {
    test(`menu and solution navigation work at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const errors = trackBrowserErrors(page);
      await page.goto('/');
      const toggle = page.getByRole('button', { name: 'Hap menunë' });
      const nav = page.getByRole('navigation', { name: 'Navigimi kryesor', includeHidden: true });
      await expect(toggle).toHaveAttribute('aria-controls', 'main-nav');
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await expect(nav).toBeHidden();
      const target = await toggle.boundingBox();
      expect(target?.width).toBeGreaterThanOrEqual(44);
      expect(target?.height).toBeGreaterThanOrEqual(44);

      await toggle.tap();
      const close = page.getByRole('button', { name: 'Mbyll menunë' });
      await expect(close).toHaveAttribute('aria-expanded', 'true');
      await expect(nav).toBeVisible();
      await nav.locator('summary').tap();
      await expect(nav.locator('details')).toHaveAttribute('open', '');
      await assertNoHorizontalOverflow(page);
      for (const link of await nav.locator('.dropdown-panel a').all()) {
        const bounds = await link.boundingBox();
        expect(bounds?.height, await link.textContent()).toBeGreaterThanOrEqual(44);
      }

      await close.tap();
      await expect(nav).toBeHidden();
      await expect(nav.locator('details')).not.toHaveAttribute('open', '');
      await page.getByRole('button', { name: 'Hap menunë' }).tap();
      await nav.locator('summary').tap();
      await nav.locator('a[href="/zgjidhje/sisteme-parkimi/"]').tap();
      await expect(page).toHaveURL(/\/zgjidhje\/sisteme-parkimi\/$/);
      await expect(page.locator('[data-menu-toggle]')).toHaveAttribute('aria-expanded', 'false');
      await expect(nav).toBeHidden();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(errors).toEqual([]);
    });
  }
});

test('keyboard opens menu and dropdown, Escape returns focus, and Tab can leave', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 });
  await page.goto('/');
  const toggle = page.locator('[data-menu-toggle]');
  const nav = page.locator('#main-nav');
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Tab');
  await expect(nav.locator('a.nav-link[href="/"]')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(nav.locator('a.nav-link[href="/rreth-nesh/"]')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(nav.locator('summary')).toBeFocused();
  await page.keyboard.press('Space');
  await expect(nav.locator('details')).toHaveAttribute('open', '');
  await page.keyboard.press('Tab');
  await expect(nav.locator('.dropdown-overview')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(nav).toBeHidden();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toBeFocused();
  await page.keyboard.press('Space');
  await expect(nav).toBeVisible();
  await nav.locator('.mobile-contact').focus();
  await page.keyboard.press('Tab');
  await expect(nav).toBeHidden();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(await page.evaluate(() => document.querySelector('main')?.contains(document.activeElement))).toBe(true);
});

test('outside click and breakpoint changes reset menu without leaving focus hidden', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const toggle = page.locator('[data-menu-toggle]');
  const nav = page.locator('#main-nav');
  await toggle.click();
  await page.mouse.click(4, 800);
  await expect(nav).toBeHidden();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');

  await page.setViewportSize({ width: 900, height: 1000 });
  await toggle.click();
  await expect(nav).toBeVisible();
  await page.setViewportSize({ width: 901, height: 1000 });
  await expect(toggle).toBeHidden();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(nav).toBeVisible();
  await expect(nav.locator('a.nav-link[href="/"]')).toBeFocused();

  await nav.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(nav.locator('details')).toHaveAttribute('open', '');
  await page.setViewportSize({ width: 900, height: 1000 });
  await expect(nav).toBeHidden();
  await expect(nav.locator('details')).not.toHaveAttribute('open', '');
  await expect(toggle).toBeFocused();
});

for (const width of [375, 768]) {
  test(`expanded dropdown remains scrollable in a short ${width}x320 viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 320 });
    await page.goto('/');
    const nav = page.locator('#main-nav');
    await page.locator('[data-menu-toggle]').click();
    await nav.locator('summary').click();
    await expect(nav.locator('details')).toHaveAttribute('open', '');
    await assertNoHorizontalOverflow(page);
    const bounds = await nav.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(321);
    expect(await nav.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
    for (const link of await nav.locator('a, summary').all()) {
      const target = await link.boundingBox();
      expect(target?.height, await link.textContent()).toBeGreaterThanOrEqual(44);
    }
    const contact = nav.locator('.mobile-contact');
    await contact.scrollIntoViewIfNeeded();
    const target = await contact.boundingBox();
    expect(target!.y).toBeGreaterThanOrEqual(bounds!.y);
    expect(target!.y + target!.height).toBeLessThanOrEqual(321);
    await contact.click();
    await expect(page).toHaveURL(/\/kontakt\/$/);
    await expect(nav).toBeHidden();
  });
}

for (const width of [1024, 1440]) {
  test(`desktop navigation keeps its horizontal layout and native dropdown at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    const nav = page.locator('#main-nav');
    await expect(page.locator('[data-menu-toggle]')).toBeHidden();
    await expect(nav).toBeVisible();
    await expect(nav.locator('.mobile-contact')).toBeHidden();
    expect(await nav.evaluate(element => getComputedStyle(element).flexDirection)).toBe('row');
    const topPositions = await nav.locator(':scope > .nav-link, :scope > details > summary').evaluateAll(elements =>
      elements.map(element => element.getBoundingClientRect().top));
    expect(Math.max(...topPositions) - Math.min(...topPositions)).toBeLessThanOrEqual(1);
    await nav.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(nav.locator('details')).toHaveAttribute('open', '');
    expect(await nav.locator('.dropdown-panel').evaluate(element => getComputedStyle(element).position)).toBe('absolute');
    await page.keyboard.press('Escape');
    await expect(nav.locator('details')).not.toHaveAttribute('open', '');
    await expect(nav.locator('summary')).toBeFocused();
    await assertNoHorizontalOverflow(page);
  });
}

test('expanded mobile menu and solution dropdown pass automated accessibility checks', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.locator('[data-menu-toggle]').click();
  await page.locator('#main-nav summary').click();
  await assertAccessible(page);
});
