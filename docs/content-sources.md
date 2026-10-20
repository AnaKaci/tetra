# Verified Tetra source content

The current snapshot was retrieved on 28 September 2026 from the company's public WordPress API. It records each page's source URL, WordPress ID and modified date, plus every original media URL. No external stock photography or generated business claims are used.

| Content | Authoritative page |
| --- | --- |
| Tagline, history, mission, vision, values, five card introductions | https://tetra.al/ (WP page 5004) |
| Full five solution bodies, features, equipment and advantages | https://tetra.al/our-solution/ (WP page 5647) |
| AIR ALBANIA, QSUT, TEG, KOMPLEKSI KIKA; facts, requirements, solutions, equipment | https://tetra.al/projektet/ (WP page 5651) |
| Five partner descriptions and original logos | https://tetra.al/partneret/ (WP page 5649) |
| Original empty contact page | https://tetra.al/kontakt-2/ (WP page 5663) |
| Published telephone and Facebook, LinkedIn, Instagram links | https://tetra.al/tetra-solution-logo-2/ (indexed original footer) |
| Original wordmark | https://tetra.al/wp-content/uploads/2023/04/logo-blue.svg |
| Original favicon | https://tetra.al/wp-content/uploads/2023/05/T-blue-1.svg |

## Content presentation

- The homepage hero introduction is the exact company mission paragraph. On 30 September 2026, the user supplied an approved generated hero reference and requested its immersive composition. The hero alone now uses a clean illustrative background derived from that reference, with real HTML text and controls. It is not presented as a photograph of a specific Tetra project or location. See [hero asset provenance and prompt](hero-reference.md). All service and project images remain the original source assets.
- Interface labels and section headings follow the supplied brief. CTA value labels are phrases from the mission. Company copy is not replaced by new marketing text.
- History retains the source's dated phrase “këto 16 vite”. TEG retains `2023 (në proces)`. Source records remain intact. The solution detail presentation corrects Albanian copy and charging power units against manufacturer documentation; see [solution presentation and source decisions](solution-redesign.md).
- History verifies 2007. On 5 October 2026, the user requested removal of Durrës as a company location. The displayed locations are now Tiranë and Prishtinë; the history paragraph and location count are updated to two. The importer preserves this explicit correction on future refreshes. The source fixture and references to projects at Autoriteti Portual Durres are unchanged. The vision verifies the markets Shqipëri and Kosovë.
- The old homepage's “TEGAIR ALBANIA” is concatenated carousel text. TEG and AIR ALBANIA are separate records. The homepage keeps three featured projects; the internal project overview displays all four.
- Original line breaks become readable paragraphs or lists. Whitespace is normalized. Source spellings are generally retained. An empty duplicate mobile accordion and plain-text catalogue download prompts without actual URLs are excluded.
- Project fields are split on their original labels, including TEG's merged location/year paragraph. Commas inside values such as `1,000` are preserved.
- Partner descriptions retain the additional CIRCONTROL parking guidance section. Partner/service relationships are stated in the source. Project/service relationships follow the published requirements, supplied systems, and equipment.
- On 6 October 2026, the user requested removal of “Menaxhimi i qendrave multifunksionale” as a solution. It is excluded from the snapshot and importer mappings, leaving five published solutions. Gymgest remains a partner without a link to the removed solution. The captured source fixture is unchanged.
- Original SVG artwork is unchanged. CSS crops only the wordmark's blank canvas for readable display; logos keep their proportions. Astro handles photographic WebP resizing and compression.
- `/kontakt/` uses the verified phone, cities, and social profiles. No email, street address, hours, fake form, privacy policy, or terms URL is invented. The footer contact link also stays internal.
- Phone and social profiles are a documented fixed source snapshot because the page API does not expose that older footer. Review them if Tetra publishes changes.

## Navigation and provenance

`href` is always the redesigned site's internal route. `sourceUrl`, `sourcePageId`, `source.pages`, and original media URLs preserve provenance only. No normal frontend anchor uses the original Tetra content pages. Social and telephone links remain functional external/contact actions.

## CMS updates

`npm run sync:content` refreshes the mapped WordPress content and downloads missing assets. `npm run build:fresh` then rebuilds. The importer validates structured content before replacing the snapshot and preserves a valid fallback on a normal failed refresh. `--strict` makes failure explicit; `--offline` validates and uses the snapshot without network access. Parser changes require review when the source structure changes.

A hosting rebuild hook is needed for automatic publishing; the implementation does not modify WordPress. The captured source response in `tests/fixtures/tetra-wordpress-pages.json` supports regression tests and is not the frontend's runtime content source.
