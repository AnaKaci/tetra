# TETRA website

Complete 16-page Albanian Tetra website built with Astro, TypeScript, Manrope, and custom CSS. The existing blue/white homepage design is preserved and extended to company, solution, project, partner, and contact pages. All normal site navigation stays inside this frontend.

## Run and deploy

Use Node.js 22.12 or newer (the deployment workflow uses Node.js 22).

```sh
npm ci
npm run dev
```

Open http://localhost:4321. `npm run build` generates the static site in `dist/`; `npm run preview` serves the production build locally. Deploy `dist/` to a static host with directory-index support.

Set the build environment variable `SITE_URL` to the final public origin. It defaults to `https://tetra.al`; the shared layout uses it for each page's canonical URL, OpenGraph URL, and Organization schema. For subdirectory hosting, also set `BASE_PATH` to the path prefix, for example `/tetra`; it defaults to `/`. Navigation, assets, and metadata include this prefix.

## GitHub Pages demo

The [Pages workflow](.github/workflows/deploy-pages.yml) builds and publishes the demo on pushes to `main`, or manually through **Actions > Deploy GitHub Pages demo > Run workflow** on `main`. It installs locked dependencies, runs the Astro checks, builds the site, and verifies the generated files before deployment.

1. Create an empty GitHub repository and push this project to its `main` branch. Include `.github/`, `src/`, `public/`, `scripts/`, the configuration files, and `package-lock.json`; generated `dist/` and `node_modules/` are not needed. For a first push from this folder, replace `OWNER/REPOSITORY` below with your repository:

   ```sh
   git init -b main
   git add .github .gitignore astro.config.mjs package.json package-lock.json tsconfig.json playwright.config.ts README.md src public scripts tests docs MOBILE_COMPATIBILITY_REPORT.md
   git commit -m "Prepare GitHub Pages demo"
   git remote add origin https://github.com/OWNER/REPOSITORY.git
   git push -u origin main
   ```

2. In the repository, open **Settings > Pages > Build and deployment > Source** and select **GitHub Actions**. This follows [GitHub's Pages setup instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
3. Run the workflow on `main` after enabling Pages (or push another commit). Open the published URL shown by the deployment job or the Pages settings.

The workflow reads the origin and path from GitHub Pages and passes them as `SITE_URL` and `BASE_PATH`. A project repository typically publishes at `https://OWNER.github.io/REPOSITORY/`; an `OWNER.github.io` repository publishes at the root. No repository-specific code edits, custom domain, or deployment secrets are required.

To check the project-path build locally in PowerShell, replace the sample origin and repository path:

```powershell
$env:SITE_URL = 'https://OWNER.github.io'
$env:BASE_PATH = '/REPOSITORY'
npm run check
npm run build
npm run verify:static
npm run preview
```

Open `http://localhost:4321/REPOSITORY/`. After stopping preview, remove the overrides before building for the production domain or creating a cPanel archive:

```powershell
Remove-Item Env:SITE_URL, Env:BASE_PATH -ErrorAction SilentlyContinue
```

## Internal routes

| Page | Routes |
| --- | --- |
| Home and company | `/`, `/rreth-nesh/` |
| Solutions overview | `/zgjidhje/` |
| Solution details | `/zgjidhje/sisteme-parkimi/`, `/zgjidhje/karikues-per-automjete-elektrike/`, `/zgjidhje/sisteme-akses-kontrolli/`, `/zgjidhje/akses-siguri-te-larte/`, `/zgjidhje/sinjalistike-inteligjente-parkimi/`, `/zgjidhje/akses-me-pagese/` |
| Projects overview | `/projekte/` |
| Project details | `/projekte/air-albania/`, `/projekte/qsut/`, `/projekte/teg/`, `/projekte/kompleksi-kika/` |
| Partners and contact | `/partnere/`, `/kontakt/` |

Trailing slashes are consistent. Partner links target sections such as `/partnere/#circontrol`. The solution dropdown includes an overview link and all six detail pages. Header active states follow the current pathname, including detail routes.

## cPanel package

After completing the browser checks, create and verify a fresh production archive locally:

```sh
npm run build
npm run verify:static
npm run package:cpanel
```

`verify-static.mjs` checks all 16 generated routes, local links and fragments, image/style/font references, document metadata, and mobile menu markup without network requests. `package-cpanel.ps1` creates `tetra-cpanel-ready.zip` from the contents of `dist/`, with `index.html` at the archive root and forward-slash paths. Every archived file is SHA-256 checked against its source before the archive replaces an older deliverable. The script includes hidden files such as `.htaccess`. Optional `-DistPath` and `-ArchivePath` parameters select other local paths; the static validator accepts `--dist=path`.

The archive is intended for the site's domain document root, not a subdirectory. Its minimal `.htaccess` sets `DirectoryIndex index.html`; review and merge any existing WordPress routing and hosting rules when arranging the frontend replacement. Preserve the existing WordPress installation and backups according to the chosen deployment plan. Neither command uploads files or changes the live site. A cPanel/Apache staging check remains necessary to verify the hosting configuration before the final switch.

## WordPress content

The public Tetra WordPress site remains the editorial source for the five original solutions, projects, partners, company history, mission, vision, and values. The additional TRINITY paid-access solution is maintained in `src/data/curated-solutions.json`, with manufacturer source references. `src/data/tetra.json` stores the combined structured content and `public/images/` stores its original assets. Astro generates responsive WebP images locally during builds.

```sh
npm run sync:content
npm run build:fresh
node scripts/sync-tetra-content.mjs --offline
node scripts/sync-tetra-content.mjs --strict
node scripts/sync-tetra-content.mjs --refresh-assets
```

The importer retrieves public WordPress pages, validates their structure and relationships, and reuses local images. A failed normal refresh retains the last valid snapshot. `--offline` validates that snapshot without network calls; `--strict` exits unsuccessfully when the source cannot be refreshed. `--refresh-assets` redownloads the existing original assets. Normal development and `npm run build` do not contact WordPress.

Each content record separates its internal `href` and `slug` from its original `sourceUrl` and `sourcePageId`. Source URLs are provenance, never frontend navigation. The snapshot also records retrieval and source modification times. If WordPress structure changes, review `scripts/lib/tetra-content.mjs` before refreshing the mapping; do not fill missing content with invented copy.

For automatic editorial updates, connect WordPress publishing to your host's rebuild hook and use `npm run build:fresh`. This project does not install or modify a WordPress theme or plugin. A static rebuild is required to publish updated content.

Read [content sources](docs/content-sources.md) for provenance and omissions. The contact page uses only the verified phone, cities, and social profiles. No unverified email, street address, opening hours, legal links, or submission form is supplied.

## Architecture

- `src/layouts/BaseLayout.astro`: common document, metadata, navigation, footer, and scripts.
- `src/pages/index.astro`: preserved homepage composition.
- `src/pages/zgjidhje/[slug].astro` and `src/pages/projekte/[slug].astro`: `getStaticPaths()` generates detail pages from the snapshot.
- `src/components/`: shared heroes, breadcrumbs, content sections, cards, purpose cards, CTA, and existing design components.
- `src/styles/global.css`: existing design tokens, homepage, navigation, and shared visual styles.
- `src/styles/pages.css` and `company-pages.css`: internal-page layouts using those tokens.
- `src/scripts/interactions.ts`: mobile menu, Escape/focus handling, sticky header, and reduced-motion-aware reveals.
- `scripts/sync-tetra-content.mjs` and `scripts/lib/tetra-content.mjs`: read-only WordPress adapter, validation, and source-specific parsers.

## Verify

```sh
npm run check
npm run build
npm run test:content
npx playwright install chromium
npm run test:mobile
npm run verify:static
```

`npm run test:mobile` runs the complete Chromium suite against the production build using a dedicated Astro preview on port 4322. Run `npm run build` first and leave that port available. Browser checks cover all 16 routes, real content, internal link destinations and anchors, images, metadata, console/resource errors, mobile menus, reduced motion, and axe accessibility. The mobile audit covers 320, 375, 390, 430, 768, 1024, and 1440 pixels; the existing layout checks also include 1920 pixels. Recorded results and full-page evidence are in `MOBILE_COMPATIBILITY_REPORT.md` and `tests/mobile/screenshots/`. Content tests use a captured public source fixture to check parsing edge cases, validation, offline builds, failure fallback, and strict mode without relying on the network.

The production audit writes `tests/mobile/results.json`, `tests/mobile/playwright-report/`, and failure screenshots/traces under `tests/mobile/test-results/`. `npm test` retains the development-server workflow on port 4321 with reports in `playwright-report/` and `test-results/`. The production build enforces the existing 30 KB gzip first-party JavaScript budget per page, including referenced module imports. See [verification notes](docs/qa-notes.md) for earlier recorded results and `docs/previews/` for earlier reviewed screenshots.

The live tetra.al installation has not been changed or deployed to.
