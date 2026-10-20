import { test, expect } from '@playwright/test';
import data from '../src/data/tetra.json' with { type: 'json' };
import { assertNoHorizontalOverflow, trackBrowserErrors } from './helpers';

const parkingImage = data.solutions.find(solution => solution.id === 'parkim')!.image;
const standardRoutes: { path: string; title: string; intro?: string; imageAlt?: string; imageFit?: string }[] = [
  { path: '/rreth-nesh/', title: 'Rreth nesh', intro: data.history.paragraphs[1], imageAlt: data.company.image.alt },
  { path: '/zgjidhje/', title: 'Zgjidhjet tona', intro: data.overviews.solutions.intro, imageAlt: data.charger.image.alt },
  { path: '/partnere/', title: data.overviews.partners.title, intro: data.overviews.partners.intro, imageAlt: parkingImage.alt },
  { path: '/kontakt/', title: 'Na kontaktoni' },
];

for (const width of [1440, 390]) {
  test(`shared subpage heroes retain their content and adapt composition at ${width}px`, async ({ page, request }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors = trackBrowserErrors(page);
    const background = await request.get('/images/background.png');
    expect(background.ok(), 'The decorative mountain background must load locally').toBe(true);
    expect(background.headers()['content-type']).toContain('image/');

    for (const route of standardRoutes) {
      await test.step(route.path, async () => {
        const response = await page.goto(route.path);
        expect(response?.status()).toBe(200);
        await page.evaluate(() => document.fonts.ready);
        const hero = page.locator('.page-hero--standard');
        await expect(hero).toHaveCount(1);
        await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
        await expect(hero.getByRole('heading', { level: 1 })).toHaveText(route.title);
        if ('intro' in route && route.intro) await expect(hero.locator('.page-intro')).toHaveText(route.intro);

        const image = hero.locator('.page-hero-image img');
        await expect(image).toHaveCount(route.imageAlt ? 1 : 0);
        if (route.imageAlt) {
          await expect(image).toHaveJSProperty('complete', true);
          await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);
          expect((await image.getAttribute('alt'))?.trim(), 'Hero photographs need meaningful alternate text').toBeTruthy();
          expect(await image.getAttribute('src'), 'Brand logos must not replace hero photographs').not.toMatch(/wordmark|logo|\.svg(?:\?|$)/i);
          await expect(image).toHaveAttribute('alt', route.imageAlt);
          await expect(image).toHaveCSS('object-fit', route.imageFit ?? 'cover');
        }

        const backgroundImage = await hero.evaluate(element => getComputedStyle(element).backgroundImage);
        expect(backgroundImage, 'The mountain landscape belongs to the hero section').toContain('/images/background.png');
        const breadcrumb = hero.locator('nav.breadcrumbs');
        await expect(breadcrumb).toHaveAttribute('aria-label', /\S/);
        await expect(breadcrumb.locator('[aria-current="page"]')).toHaveCount(1);
        await expect(breadcrumb.getByRole('link', { name: 'Kreu', exact: true })).toHaveAttribute('href', '/');
        const links = await breadcrumb.locator('a').evaluateAll(elements => elements.map(element => element.getAttribute('href')));
        for (const href of links) expect(href, 'Breadcrumbs must stay within the rebuilt website').toMatch(/^\/(?!\/)/);

        const copyBox = await hero.locator('.page-hero-copy').boundingBox();
        const breadcrumbBox = await breadcrumb.boundingBox();
        const headingBox = await hero.locator('h1').boundingBox();
        expect(copyBox).not.toBeNull();
        expect(breadcrumbBox).not.toBeNull();
        expect(headingBox).not.toBeNull();
        expect(breadcrumbBox!.y + breadcrumbBox!.height).toBeLessThanOrEqual(headingBox!.y);
        if (route.imageAlt) {
          const imageBox = await hero.locator('.page-hero-image').boundingBox();
          expect(imageBox).not.toBeNull();
          if (width > 900) {
            expect(imageBox!.x, 'Desktop photo must be alongside the content').toBeGreaterThanOrEqual(copyBox!.x + copyBox!.width - 1);
          } else {
            expect(imageBox!.y, 'Mobile photo must follow the complete content').toBeGreaterThanOrEqual(copyBox!.y + copyBox!.height - 1);
          }
        }
        await assertNoHorizontalOverflow(page);
      });
    }
    expect(errors).toEqual([]);
  });
}

test('homepage and every project retain their separate hero presentation', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const excludedRoutes = ['/', '/projekte/', ...data.projects.map(project => project.href)];
  for (const path of excludedRoutes) {
    await test.step(path, async () => {
      await page.goto(path);
      await expect(page.locator('.page-hero--standard')).toHaveCount(0);
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      if (path !== '/') {
        const projectHero = page.locator('.page-hero--project');
        await expect(projectHero).toHaveCount(1);
        expect(await projectHero.evaluate(element => getComputedStyle(element).backgroundImage)).not.toContain('/images/background.png');
      }
      await assertNoHorizontalOverflow(page);
    });
  }
});
