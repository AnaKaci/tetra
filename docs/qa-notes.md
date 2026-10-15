# Delivery verification

Final verification: 30 September 2026.

- `npm run check`: 27 files checked; zero errors, warnings, or hints.
- `npm run build`: all 16 static pages generated, with optimized local WebP imagery.
- `npx playwright test`: all 67 Chromium tests passed against the production build served with Astro preview.
- `npm run test:content`: all five importer regression tests passed. They verify full service details, merged project labels, comma-separated numbers, both Circontrol descriptions, structural validation, offline mode, fallback, and strict failure behavior.
- Source synchronization: the expanded adapter successfully retrieved six solutions, four projects, and five partners from the public WordPress API. Source retrieval timestamps remain in the snapshot.
- Responsive checks: 1920, 1440, 1024, 768, 430, 390, and 375 px. All 16 routes were checked at desktop and mobile widths; all internal page templates received additional intermediate/large-width checks.
- All routes return HTTP 200, have one H1, render their expected source content, and load their images. No horizontal overflow, missing image resources, page errors, or console errors were detected.
- Every rendered internal navigation destination and section anchor resolves. No normal frontend anchor links back to the original tetra.al content pages. Telephone and external social links remain functional actions; social links retain their security attributes.
- Pathname-based active navigation remains correct while scrolling. Mobile opening, dropdown use, Escape/focus restoration, contact navigation, and menu closing pass.
- Per-page canonical and OpenGraph URLs, title, description, and image metadata are present. The production origin is configurable with `SITE_URL`.
- Accessibility: axe WCAG 2 A/AA and 2.1 A/AA automated checks passed at 1440 and 375 px for the homepage and eight internal-page templates. Reduced-motion behavior passes. This is automated coverage, not complete WCAG certification.
- Visual review: the homepage was compared with its pre-extension capture. Its composition, sections, cards, typography, and blue/white identity remain intact. About, solution, project, partner, and contact layouts were reviewed, including mobile captures with loaded images.
- First-party JavaScript is at most 0.62 KB gzip per page, below the preserved 30 KB per-route budget.
- Lighthouse and field Core Web Vitals have not been measured. Performance figures in implementation-decisions.md are targets, not audit claims.

The local production preview is available at http://localhost:4321 while its process is running. The deployment artifact is `dist/`. This work has not modified or published to the live WordPress installation.
