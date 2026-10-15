# Tetra.al mobile compatibility report

Updated: **14 October 2026**. Scope: the local Astro website and its cPanel deployment archive. The live WordPress installation has not been changed or deployed to.

The missing mobile navigation control has been restored, compact touch targets have been enlarged, menu focus/scrolling behavior has been corrected, and solution/project grid rules have been made reliable in the production CSS bundle. Existing content, image files, branding, colors, hero composition, and animation behavior were preserved.

## Test results and evidence

| Check | Result | Evidence |
| --- | --- | --- |
| Production Chromium suite | **PASS** — 228 passed, 0 failed, 0 skipped, 0 flaky; completed in 321.9 seconds on 13 October. Includes all 112 route/viewport combinations. | [Completed JSON](tests/mobile/results.json), [HTML report](tests/mobile/playwright-report/index.html), [run log](tests/mobile/run.log). |
| Astro checks | **PASS** — 28 files; 0 errors, 0 warnings, 0 hints. | [check.log](tests/mobile/check.log), executed 12 October. |
| Content regression tests | **PASS** — 7 tests, 0 failures. | [content-tests.log](tests/mobile/content-tests.log), executed 12 October. |
| Production build | **PASS** — 16 static pages generated. Largest first-party JavaScript payload: 0.69 KB gzip, below the 30 KB per-page budget. | [build.log](tests/mobile/build.log). |
| Generated static output | **PASS** — 16 routes, 142 files, 540 internal link references, 75 unique referenced local assets; no verification errors. | [static-verification.json](tests/mobile/static-verification.json). |
| Desktop visual preservation | **PASS** — all 16 full-page captures at 1440px have matching dimensions and no color-channel difference greater than 1/255. Header pixels are identical. | [desktop-comparison.json](tests/mobile/desktop-comparison.json), comparison refreshed 14 October against [original captures](tests/mobile/baseline/). |
| External social destinations | **PASS for HTTP reachability** — Facebook, LinkedIn, and Instagram each returned HTTP 200 to one read-only request on 9 October, with unchanged destination URLs. | Destinations recorded in the static verification and [link inventory](tests/mobile/link-inventory.json). Account interactions were not tested. |
| cPanel ZIP | **PASS** — 142 files, every entry SHA-256 matched to `dist/`, `index.html` at the root. Size: 46,465,752 bytes (44.31 MiB). | [tetra-cpanel-ready.zip](tetra-cpanel-ready.zip), [archive verification](tests/mobile/archive-verification.json). |

The desktop comparison permits one color level of rasterization variation. It does **not** claim byte-identical screenshots: the detailed comparison retains exact changed-pixel counts. No desktop layout movement or header appearance change was detected by this comparison.

## Pages, viewports, and screenshots

All **16 routes** were exercised at each of **320, 375, 390, 430, 768, 1024, and 1440 CSS pixels**: **112 route/viewport combinations**. The corresponding heights were 844px below 768px wide and 1000px otherwise. Additional checks cover short 320px-high menus, touch input, keyboard interaction, and the existing 1920px layout coverage.

Every route below has full-page evidence at 320px, 390px, and 1440px. The screenshot directory contains **48 full-page captures**, plus separate menu and hero details. The same seven-width test matrix applies to every row.

| Route | Small phone: 320px | Mobile: 390px | Desktop: 1440px |
| --- | --- | --- | --- |
| `/` | [Screenshot](tests/mobile/screenshots/home-320.png) | [Screenshot](tests/mobile/screenshots/home-390.png) | [Screenshot](tests/mobile/screenshots/home-1440.png) |
| `/rreth-nesh/` | [Screenshot](tests/mobile/screenshots/rreth-nesh-320.png) | [Screenshot](tests/mobile/screenshots/rreth-nesh-390.png) | [Screenshot](tests/mobile/screenshots/rreth-nesh-1440.png) |
| `/zgjidhje/` | [Screenshot](tests/mobile/screenshots/zgjidhje-320.png) | [Screenshot](tests/mobile/screenshots/zgjidhje-390.png) | [Screenshot](tests/mobile/screenshots/zgjidhje-1440.png) |
| `/zgjidhje/sisteme-parkimi/` | [Screenshot](tests/mobile/screenshots/zgjidhje-sisteme-parkimi-320.png) | [Screenshot](tests/mobile/screenshots/zgjidhje-sisteme-parkimi-390.png) | [Screenshot](tests/mobile/screenshots/zgjidhje-sisteme-parkimi-1440.png) |
| `/zgjidhje/karikues-per-automjete-elektrike/` | [Screenshot](tests/mobile/screenshots/zgjidhje-karikues-per-automjete-elektrike-320.png) | [Screenshot](tests/mobile/screenshots/zgjidhje-karikues-per-automjete-elektrike-390.png) | [Screenshot](tests/mobile/screenshots/zgjidhje-karikues-per-automjete-elektrike-1440.png) |
| `/zgjidhje/sisteme-akses-kontrolli/` | [Screenshot](tests/mobile/screenshots/zgjidhje-sisteme-akses-kontrolli-320.png) | [Screenshot](tests/mobile/screenshots/zgjidhje-sisteme-akses-kontrolli-390.png) | [Screenshot](tests/mobile/screenshots/zgjidhje-sisteme-akses-kontrolli-1440.png) |
| `/zgjidhje/akses-siguri-te-larte/` | [Screenshot](tests/mobile/screenshots/zgjidhje-akses-siguri-te-larte-320.png) | [Screenshot](tests/mobile/screenshots/zgjidhje-akses-siguri-te-larte-390.png) | [Screenshot](tests/mobile/screenshots/zgjidhje-akses-siguri-te-larte-1440.png) |
| `/zgjidhje/sinjalistike-inteligjente-parkimi/` | [Screenshot](tests/mobile/screenshots/zgjidhje-sinjalistike-inteligjente-parkimi-320.png) | [Screenshot](tests/mobile/screenshots/zgjidhje-sinjalistike-inteligjente-parkimi-390.png) | [Screenshot](tests/mobile/screenshots/zgjidhje-sinjalistike-inteligjente-parkimi-1440.png) |
| `/zgjidhje/akses-me-pagese/` | [Screenshot](tests/mobile/screenshots/zgjidhje-akses-me-pagese-320.png) | [Screenshot](tests/mobile/screenshots/zgjidhje-akses-me-pagese-390.png) | [Screenshot](tests/mobile/screenshots/zgjidhje-akses-me-pagese-1440.png) |
| `/projekte/` | [Screenshot](tests/mobile/screenshots/projekte-320.png) | [Screenshot](tests/mobile/screenshots/projekte-390.png) | [Screenshot](tests/mobile/screenshots/projekte-1440.png) |
| `/projekte/air-albania/` | [Screenshot](tests/mobile/screenshots/projekte-air-albania-320.png) | [Screenshot](tests/mobile/screenshots/projekte-air-albania-390.png) | [Screenshot](tests/mobile/screenshots/projekte-air-albania-1440.png) |
| `/projekte/qsut/` | [Screenshot](tests/mobile/screenshots/projekte-qsut-320.png) | [Screenshot](tests/mobile/screenshots/projekte-qsut-390.png) | [Screenshot](tests/mobile/screenshots/projekte-qsut-1440.png) |
| `/projekte/kompleksi-kika/` | [Screenshot](tests/mobile/screenshots/projekte-kompleksi-kika-320.png) | [Screenshot](tests/mobile/screenshots/projekte-kompleksi-kika-390.png) | [Screenshot](tests/mobile/screenshots/projekte-kompleksi-kika-1440.png) |
| `/projekte/teg/` | [Screenshot](tests/mobile/screenshots/projekte-teg-320.png) | [Screenshot](tests/mobile/screenshots/projekte-teg-390.png) | [Screenshot](tests/mobile/screenshots/projekte-teg-1440.png) |
| `/partnere/` | [Screenshot](tests/mobile/screenshots/partnere-320.png) | [Screenshot](tests/mobile/screenshots/partnere-390.png) | [Screenshot](tests/mobile/screenshots/partnere-1440.png) |
| `/kontakt/` | [Screenshot](tests/mobile/screenshots/kontakt-320.png) | [Screenshot](tests/mobile/screenshots/kontakt-390.png) | [Screenshot](tests/mobile/screenshots/kontakt-1440.png) |

Menu details: [open at 320px](tests/mobile/screenshots/menu-open-320.png), [expanded dropdown at 320px](tests/mobile/screenshots/menu-dropdown-320.png), [open at 390px](tests/mobile/screenshots/menu-open-390.png), and [expanded dropdown at 390px](tests/mobile/screenshots/menu-dropdown-390.png). Hero details: [320px](tests/mobile/screenshots/home-hero-320.png) and [390px](tests/mobile/screenshots/home-hero-390.png).

## Problems confirmed and corrections

| Problem | Correction |
| --- | --- |
| `.main-nav` was hidden below 901px, while `Header.astro` had no button to invoke the existing menu handlers. | Added a native 44px hamburger/close button with an accessible Albanian label, `aria-controls="main-nav"`, and synchronized `aria-expanded`. It stays hidden on desktop. |
| Closing or resizing the mobile navigation could leave focus inside a hidden control. | Escape restores toggle focus; outside-click and breakpoint transitions preserve usable focus. Tab can leave the disclosure and closes it without a focus trap. Selecting any navigation link closes the menu and dropdown. |
| Expanded navigation needed to remain usable with limited vertical space and the shrinking sticky header. | The menu scroll area uses the remaining dynamic viewport height and contains overscroll. The native solution disclosure supports touch, Enter/Space, and Escape. |
| Mobile footer, breadcrumb, section, partner, brand, and telephone links had compact hit areas below the audit's 44 × 44px target. | Added mobile-only minimum target sizes and alignment rules while retaining the established desktop layout. |
| Generic grid styles could override solution/project variants after production CSS bundling. | Qualified variant selectors so solution overview, project overview, and related project columns follow their intended breakpoints. Added computed-column assertions. |
| Content validation expected five solutions, rejected the sixth solution's manufacturer provenance, and a successful source refresh could discard that curated record. | Merge the approved curated solution explicitly; validate exact expected IDs and provenance; retain its optional hero asset. A fixture-only regression verifies successful refresh and failure fallback without writing the real snapshot. |
| The browser runner could finish its test entries but hang during Windows preview-process shutdown. | Added a runner that owns the Astro preview API and closes it after Playwright exits. Final suite status requires a completed report and successful process exit. |

No hero redesign or content/image replacement was needed. The initial inspection is retained in [baseline.log](tests/mobile/baseline.log); original desktop screenshots remain in `tests/mobile/baseline/`.

## What the browser checks cover

The responsive checks verify page HTTP status, one H1, horizontal page overflow, text extending outside the viewport, overflowing text containers, intersecting grid/card/hero/footer boxes, image loading and aspect ratios, mobile touch-target sizes, production grid columns, menu/dropdown behavior, JavaScript console/runtime errors, and failed asset requests. Lazy images are loaded before full-page capture.

Navigation checks exercise touch taps, keyboard activation, Escape, link selection, outside clicks, focus movement, breakpoint changes, and short-height menu scrolling. Link checks inventory rendered destinations and verify local routes and fragments, including solution contents, partner anchors, and back-to-top links. Existing content, metadata, reduced-motion, and subpage-hero tests are included.

Automated axe checks cover every route at 320px and 1440px with WCAG A/AA tags through 2.2, plus an expanded mobile menu. Intentional card excerpts, image crops using `object-fit`, and the established wordmark crop are preserved; they are not treated as accidental clipping or image distortion.

## Files added or updated

| Area | Files |
| --- | --- |
| Navigation and responsive presentation | `src/components/Header.astro`, `src/scripts/interactions.ts`, `src/styles/global.css`, `src/styles/pages.css`, `src/styles/company-pages.css` |
| Content refresh correctness | `scripts/lib/tetra-content.mjs`, `scripts/sync-tetra-content.mjs`, `tests/content-sync.test.mjs` |
| Production verification and packaging | `scripts/verify-static.mjs`, `scripts/package-cpanel.ps1`, `scripts/package-cpanel.mjs`, `public/.htaccess`, `package.json` |
| Browser checks and evidence | `tests/mobile/responsive.spec.ts`, `tests/mobile/navigation.spec.ts`, `tests/mobile/playwright.config.ts`, `tests/mobile/run.mjs`, `tests/mobile/inspect.mjs`, `scripts/compare-desktop.mjs`, `tests/subpage-hero.spec.ts`, screenshots, logs, link inventory, desktop comparison; test expectations were corrected for hidden navigation and the current hero images. |
| Documentation | `README.md`, `MOBILE_COMPATIBILITY_REPORT.md` |

Source content JSON and original image files were not changed by this audit.

## Deployment and remaining limits

The site builds as static directory-index pages. The packaging script places the **contents of `dist/` at the archive root**, including `index.html`, optimized assets, page directories, and `.htaccess`. It compares every archived file's SHA-256 with its source and replaces the deliverable only after successful verification. The minimal `.htaccess` sets `DirectoryIndex index.html`.

Archive SHA-256: `586DFEC5A96CB62F41C0FC9B8E167DF7813EFA7C0318CA361CB02965F001FE3D`. The hash was rechecked on 14 October. The ZIP contains only deployable static files; tests, source code, and reports remain in the workspace.

No unresolved responsive failures were detected in the requested Chromium matrix. There were no browser console/runtime errors or failed image/asset requests in the completed responsive checks. All 70 distinct local route/fragment destinations in the 74-destination link inventory passed HTTP and fragment verification.

No cPanel upload, live-domain cutover, or WordPress modification was performed. Existing Apache/WordPress routing and any legacy-URL redirects must be reviewed when arranging the replacement; the local Astro preview does not validate Apache configuration. The archive targets the domain document root, not a subdirectory.

Chromium viewport and touch emulation were used; physical phones, Safari/WebKit, Firefox, and screen-reader sessions were not tested. Automated accessibility checks are not complete WCAG certification. Social-account actions and actual telephone dialing were not performed. The contact page intentionally has phone/social links and city information, with no form or embedded map to submit or test. Lighthouse and field Core Web Vitals were not measured.

Reproduction commands:

```sh
npm run check
npm run test:content
npm run build
npm run test:mobile
npm run verify:static
npm run package:cpanel
```

The production browser audit uses port 4322. Preserve the completed JSON/report and archive-verification output with the release evidence.
