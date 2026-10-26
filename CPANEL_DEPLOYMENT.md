# Tetra.al — cPanel static deployment and rollback

## Scope and safety
The website is a **static Astro build** served from tetra.al's actual document root. This does not convert the site to a WordPress theme. **These instructions do not authorize or perform any change to the live server.** Do not remove WordPress until backup and staging acceptance are complete. Do not change mailboxes, MX/DNS records, SSL certificates, cron jobs, or unrelated directories. Never store hosting passwords in repository files, shell history, build output, ZIP archives, or screenshots. Log in using credentials from your password manager; rotate any password disclosed in chat or elsewhere.

## 1. Prepare and package on your workstation
Use Node.js 22.12+ and a local checkout of this repository. The normal build uses checked-in structured content and local images; **do not run** `npm run sync:content` or `npm run build:fresh` during a WordPress retirement. The old WordPress API will not be available afterwards.

```bash
npm ci
npm run deploy:cpanel
```

This command runs Astro type checking, builds the site, checks route and asset references, and creates/verifies `tetra-cpanel-ready.zip` from **only** `dist/` contents. `index.html`, `_astro/`, `images/`, route folders and `.htaccess` are placed directly at the archive root. Do not upload `src/`, `node_modules/`, `.env`, or the repository itself. If any check fails, stop.

Inspect `dist/` locally with `npm run preview`, and execute browser tests as needed before deployment. Confirm on mobile and desktop, including navigation, dropdowns, WhatsApp, images and motion.

## 2. Access hosting and locate the domain
Open https://secure1.inmotionhosting.com/ and sign in **using the account's securely stored credentials**. Open cPanel through the InMotion dashboard. In cPanel's **Domains** section, locate `tetra.al` and record its assigned **Document Root**. Do **not** assume `public_html`; addon domains may have another root. Confirm the intended subdomain/staging root is not shared with email or unrelated sites.

## 3. Back up the existing WordPress site
In cPanel File Manager (enable **Show Hidden Files**), archive all files of the identified WordPress document root, including existing `.htaccess`, `wp-config.php`, and `wp-content/uploads/`. Record file ownership and permissions and any custom Apache directives. Export the correct WordPress database using **phpMyAdmin** (identify database from `wp-config.php`). Include any additional content/assets referenced by the original WordPress site.

Download both the files archive and database export to encrypted storage **outside the public web root** and independently verify they can be opened. Record their timestamps and a restoration contact. Preserve the original archive unchanged until the new site has been accepted.

## 4. Test with staging before any switch
Create a separate cPanel-supported staging subdomain or isolated staging directory; do not point the production domain there yet. Deploy the generated `dist/` contents into staging. Because this build has production-root absolute links and canonical URLs, test staging preferably through a local hosts-file override for `tetra.al` directed at a staging IP with a valid HTTPS setup, or use a separate staging build configured for its staging origin/base; **do not treat a mismatched-path preview as complete validation**. Verify all 16 pages, direct route reloads, mobile and desktop UI, menu/WhatsApp, CSS, fonts, pictures, JS, and HTTP status codes. Check the browser console and network panel. Ensure every route shows a real HTML page, not a WordPress fallback.

## 5. Switch the document root (manual, after approval)
1. Confirm verified backups and staging sign-off. Schedule a maintenance window.
2. Using File Manager, **move** existing WordPress files to a private backup location outside the public document root, or preserve a full copy already safely downloaded. Never move unrelated hosting files or modify mail/SSL/DNS.
3. Review the live `.htaccess` first. Remove only WordPress-specific `RewriteRule` / `RewriteBase` / WordPress-managed blocks that would interfere with static routes. Preserve unrelated security, headers, redirects, HTTPS and hosting settings. Do not blindly overwrite the previous `.htaccess` with the package's minimal `DirectoryIndex index.html`. Merge it where appropriate.
4. Upload `tetra-cpanel-ready.zip` to **the confirmed document root** using cPanel File Manager, then extract **there**, not into an extra `dist` or `tetra-cpanel-ready` folder. Confirm `index.html` is at the document root and `_astro/`, `images/`, `kontakt/`, `projekte/`, and `zgjidhje/` are siblings. Remove only the uploaded ZIP afterwards if desired.
5. Confirm HTTPS for `https://tetra.al` and `https://www.tetra.al` if configured; check TLS certificate coverage and existing canonical redirects.
6. Test a direct request to `/kontakt/`, `/projekte/air-albania/`, and `/zgjidhje/sisteme-parkimi/`, plus every other route, with browser refresh. Validate SEO tags, images, CSS, JS, fonts, mobile and desktop layouts, and absence of requests to `/wp-json/` or `/wp-content/`. Check `404` and redirect behavior, access/error logs and search console.
7. Review historical WordPress URLs and introduce **explicit, reviewed 301 redirects** for important changed paths, e.g. `/our-solution/` → `/zgjidhje/` and `/partneret/` → `/partnere/`, when they do not conflict with existing routes. Review robots.txt and sitemap availability; the repository currently has no dedicated sitemap integration.
8. Do not cancel or delete the WordPress backup, database or server-side configuration until acceptance is completed.

## 6. Rollback
If any critical feature fails, temporarily remove or move the Astro files from the document root (retain the deployment ZIP and logs), then restore the backed-up WordPress file tree **including its original .htaccess**. If WordPress data changed, import the saved database using phpMyAdmin into the original database (verify exact database name and credentials before overwrite) and check `wp-config.php` permissions. Restore original Apache/redirect settings if changed. Verify the homepage, WordPress admin, media links and representative pages over HTTPS. Keep DNS, mail and SSL unchanged. Rollback must be rehearsed or separately authorized before production cutover.

## 7. Future updates
Edit Astro source and local `src/data/` content, then:
```bash
npm ci
npm run deploy:cpanel
```
Back up the currently deployed static site, test the new ZIP on staging, and manually replace the document-root contents during an approved release. Do not rely on WordPress for future editing. The `sync:content` importer is historical and requires retiring or changing if its source disappears.

## Known limitations
- The verified local content snapshot dates from 28 September 2026; check all company facts and contact details before publication.
- The repository's WordPress importer remains a developer-only command; normal `npm run build` and `deploy:cpanel` do not invoke it.
- This website has no server-side submission form or active CMS. Contact actions use phone, social and WhatsApp external links.
- The live cPanel document root, .htaccess, historical redirects and SSL cannot be verified from the source checkout.
- The existing GitHub Pages demo workflow remains separate from cPanel production and may publish previews automatically.
