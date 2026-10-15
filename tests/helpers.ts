import { expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

export const widths = [1920, 1440, 1024, 768, 430, 390, 375];

export async function assertNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    page: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
  }));
  expect(dimensions.page, `${page.url()}: page width ${dimensions.page}px exceeds viewport ${dimensions.viewport}px`).toBeLessThanOrEqual(dimensions.viewport + 1);
}

export function trackBrowserErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('response', (response) => {
    if (response.status() >= 400 && ['localhost', '127.0.0.1'].includes(new URL(response.url()).hostname)) {
      errors.push(`${response.status()} ${response.url()}`);
    }
  });
  return errors;
}

export async function loadVisibleImages(page: Page, minimum = 1) {
  await page.evaluate(async () => {
    for (let top = 0; top < document.documentElement.scrollHeight; top += window.innerHeight * 0.8) {
      window.scrollTo({ top, behavior: 'instant' });
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    }
  });
  const images = page.locator('img');
  expect(await images.count()).toBeGreaterThanOrEqual(minimum);
  for (const image of await images.all()) {
    expect(await image.getAttribute('alt'), 'Every image needs an alt attribute, including decorative images').not.toBeNull();
    if (!(await image.isVisible())) continue;
    await image.scrollIntoViewIfNeeded();
    await expect(image, `Image did not load: ${await image.getAttribute('src')}`).toHaveJSProperty('complete', true);
    await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);
  }
}

export async function assertAccessible(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(results.violations.map(violation => ({
    rule: violation.id,
    nodes: violation.nodes.map(node => ({ target: node.target, issue: node.failureSummary })),
  }))).toEqual([]);
}

export const normalizedText = (value: string) => value.replace(/\s+/g, ' ').trim();
