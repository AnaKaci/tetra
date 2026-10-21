import { test, expect } from '@playwright/test';

test('homepage WhatsApp supports keyboard opening, closing and the correct quote destination', async ({ page }) => {
  await page.goto('/');
  const launcher = page.getByRole('button', { name: 'Na kontaktoni në WhatsApp' });
  const panel = page.getByRole('dialog', { name: 'Keni nevojë për ndihmë?' });
  const quote = page.getByRole('link', { name: 'Kërko ofertë' });

  await expect(launcher).toHaveAttribute('aria-expanded', 'false');
  await expect(panel).not.toBeVisible();
  await launcher.focus();
  await page.keyboard.press('Enter');
  await expect(panel).toBeVisible();
  await expect(launcher).toHaveAttribute('aria-expanded', 'true');
  await expect(quote).toBeFocused();

  const destination = new URL((await quote.getAttribute('href'))!);
  expect(destination.origin).toBe('https://wa.me');
  expect(destination.pathname).toBe('/355695599385');
  expect(destination.searchParams.get('text')).toContain('zgjidhjet e Tetra');
  await expect(quote).toHaveAttribute('target', '_blank');
  await expect(quote).toHaveAttribute('rel', /noopener/);

  await page.keyboard.press('Escape');
  await expect(panel).not.toBeVisible();
  await expect(launcher).toBeFocused();
  await expect(launcher).toHaveAttribute('aria-expanded', 'false');
  await page.keyboard.press('Space');
  await expect(panel).toBeVisible();
  await page.getByRole('button', { name: 'Mbyll WhatsApp' }).click();
  await expect(panel).not.toBeVisible();
  await expect(launcher).toBeFocused();

  await launcher.click();
  await launcher.click();
  await expect(panel).not.toBeVisible();
  await launcher.click();
  await page.locator('.hero h1').click();
  await expect(panel).not.toBeVisible();
});

test('WhatsApp stays inside a narrow mobile viewport and is limited to the homepage', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const launcher = page.getByRole('button', { name: 'Na kontaktoni në WhatsApp' });
  await expect(launcher).toHaveCSS('color', 'rgb(0, 107, 255)');
  await launcher.click();
  const panel = page.getByRole('dialog', { name: 'Keni nevojë për ndihmë?' });
  await expect(panel).toBeVisible();
  const bounds = await panel.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(568);
  await expect(panel).toHaveCSS('animation-name', 'none');
  await page.goto('/zgjidhje/');
  await expect(page.locator('[data-whatsapp-contact]')).toHaveCount(0);
});

test('WhatsApp provides a direct contact link without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto('/');
  const contact = page.getByRole('link', { name: 'Na kontaktoni në WhatsApp' });
  await expect(contact).toBeVisible();
  await expect(contact).toHaveAttribute('href', /^https:\/\/wa\.me\/355695599385\?text=/);
  await expect(page.getByRole('button', { name: 'Na kontaktoni në WhatsApp' })).not.toBeVisible();
  await context.close();
});
