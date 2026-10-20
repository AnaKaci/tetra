# Solution detail pages

All six `/zgjidhje/:slug/` routes use an editorial, product-focused layout. The logo, brand colors, Manrope typography, navigation, contact route and static deployment remain shared with the existing site.

## Implementation

- `src/data/solution-details.ts` contains typed presentation copy, image choices, technical tables and section order. The original WordPress/manufacturer snapshot remains in `tetra.json` and `curated-solutions.json`.
- `src/components/solutions/` contains the hero, section shell, content renderer, technical table, project references and contact component.
- `src/styles/solutions.css` owns the solution styling. `BaseLayout` accepts an optional body class to scope it to solution details. The shared hero uses the existing `background.png` with a contrast overlay; Vite includes the configured deployment base in the asset URL.
- `src/pages/zgjidhje/[slug].astro` keeps the existing static routes and supplies the presentation to these components. All internal links use `withBase`; Astro's image pipeline retains responsive WebP output.

The former sidebar is removed. Existing section IDs remain available for incoming fragment links. The original shared hero and detail components remain in place for unrelated pages.

The subsequent visual refinement preserves the current component markup, content, section order and responsive layouts. It removes the white `background` shorthand that reset the inherited image, restores the landscape in all six heroes, and adds restrained blue surfaces, image shadows and a navy contact section. A mobile table specificity fix lets EV model names use their existing grid column without unnecessary wrapping. It does not change the homepage, navigation, footer or other routes.

## Page composition

| Solution | Presentation |
| --- | --- |
| Parking | Existing SKIDATA equipment image; ticket/ticketless comparison; payment table; operator features; environments; four real project links |
| EV charging | Text-led AC/DC power overview; separate model tables; COSMOS and DLM; QSUT and TEG references |
| Access control | Existing access-gate photograph; attendance and shift management; data integration; environments; Air Albania reference |
| High security | Air Albania project photograph; existing Albanian project references first; Gunnebo equipment categories; access planning |
| Parking guidance | Existing LED installation photograph; counting, detection and guidance explained separately; directional-sign photograph; documented project capacities |
| Paid access | Full, uncropped TRINITY product photograph; three-step visitor flow; specification table; payment-unit detail and options; use cases |

Charging intentionally uses a typographic hero: the local charging illustrations do not document specific CIRCONTROL models. No replacement or generated assets were introduced. Existing project photographs identify the project, not a particular charger model. The source's dated TEG project status remains unchanged on its project page.

## Content and technical decisions

Copy is shortened and Albanian spelling/diacritics corrected without adding product capabilities. Presentation facts come from the matching source solution sections and linked project equipment records. TRINITY specifications remain limited to the existing manufacturer-sourced record. The security references retain all five named locations.

The source's charging power values incorrectly use `kWh`. Displayed power is corrected to `kW`; model names and numeric values remain unchanged. Manufacturer documents confirming units:

- [Wallbox range, 7.4–22 kW](https://circontrol.com/solutions/pdf/leaflet-domestic-eng.pdf)
- [Post eVolve installation manual](https://circontrol.com/wp-content/uploads/2025/03/CC-EN-Post_eVolve_Series-Installation_Manual-v4.4.pdf)
- [Raption 50 technical sheet](https://circontrol.com/wp-content/uploads/2023/09/raption50-eng.pdf)
- [Raption 100 manufacturer announcement](https://circontrol.com/category/emobility/)
- [Raption 150 and 350 manufacturer announcement](https://circontrol.com/circontrol-expands-its-range-of-high-power-chargers/)
- [DLM operating principle](https://circontrol.com/ev-chargers/dynamic-load-management-dlm/)

The generic source claim linking battery longevity to calibration certification is omitted: it does not establish that claim for every listed model. Dated manufacturer headcounts, installation totals and the unqualified parking-time reduction percentage are also omitted. The original source records are retained for provenance.

Presentation edits are deliberately separate from the CMS importer. After a manufacturer or CMS update, review the presentation tables against the refreshed source; they are curated copy, not automatically refreshed specifications.

## Verification

```sh
npm run check
npm run build
npm run verify:static
npm run test:content
npm run test:solutions
```

`test:solutions` serves the production output and checks every solution at 320, 390, 768, 1024 and 1440 px, with accessibility checks at 390 and 1440 px. It covers key technical content, preserved fragments, loading images, readable geometry, links, metadata, mobile navigation and keyboard contact navigation. Desktop and mobile screenshots are written under `test-results/solution-previews/`.

For GitHub Pages verification, build and test with `SITE_URL=https://anakaci.github.io` and `BASE_PATH=/tetra` in the same shell. The test suite applies the prefix to navigation and expected destinations. Clear these overrides and rebuild before preparing a domain-root/cPanel package.
