import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const baseURL = process.env.AUDIT_URL || 'http://127.0.0.1:4322';
await mkdir('tests/mobile/screenshots', { recursive: true });
const browser = await chromium.launch();
try {
  for (const width of [320, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 844 }, hasTouch: true, reducedMotion: 'reduce' });
    await page.goto(baseURL);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `tests/mobile/screenshots/home-hero-${width}.png`, animations: 'disabled' });
    await page.locator('[data-menu-toggle]').tap();
    await page.screenshot({ path: `tests/mobile/screenshots/menu-open-${width}.png`, animations: 'disabled' });
    await page.locator('#main-nav summary').tap();
    await page.screenshot({ path: `tests/mobile/screenshots/menu-dropdown-${width}.png`, animations: 'disabled' });
    console.log(`Captured homepage hero, open menu and dropdown at ${width}px`);
    await page.close();
  }
} finally {
  await browser.close();
}
