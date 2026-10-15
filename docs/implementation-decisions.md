# Tetra website implementation

The multipage extension keeps the approved Astro/TypeScript/Manrope homepage, blue/white tokens, reusable components, imagery, animation, and low-JavaScript approach. It has 14 internal pages around that foundation. A subsequent hero-only update follows the user's generated reference supplied on 30 September 2026; the rest of the website retains the existing design. See [hero reference notes](hero-reference.md).

## Frontend decisions

1. Static Astro generation produces searchable HTML without a client framework. Five solution and four project detail pages share data-driven templates.
2. `BaseLayout.astro` owns the document, metadata, Header, Footer, shared CSS, and progressive enhancement script. Each page supplies a meaningful title, source-based description, image, and canonical path.
3. `Astro.site` comes from the `SITE_URL` build environment variable, defaulting to `https://tetra.al`. Set it to the actual deployed origin. Canonicals and OpenGraph URLs include each page's path; they do not all target the homepage.
4. Internal `href` values and source provenance are separate. All normal frontend navigation stays on the redesigned site. The native solution disclosure contains an overview link and the five detail routes.
5. Header active states follow `Astro.url.pathname`; scrolling cannot override them. Mobile toggle, dropdown, Escape/focus restoration, sticky behavior, and reduced-motion support remain shared.
6. Page templates reuse the homepage's cards, photos, buttons, purpose cards, and CTA. Internal styles use existing tokens and do not replace the homepage layout.
7. The existing 30 KB gzip first-party JavaScript budget is enforced per rendered page, including referenced imports. Assets and fonts remain local.
8. WordPress is the editorial source, with a validated local snapshot for network-independent development and builds. The adapter parses complete published content and rejects unexpected structures. A publish webhook can run `npm run build:fresh`.
9. The internal contact page provides only verified telephone, cities, and social actions. No submission backend or email address is fabricated.

## Quality targets

Mobile on 4G is the performance baseline; desktop preserves the approved composition. Field targets are p75 LCP ≤ 2000 ms, INP ≤ 200 ms, and CLS ≤ 0.1. These are targets, not measured field results.

Accessibility aims at WCAG AA with semantic landmarks/headings, keyboard operation, visible focus, reduced motion, and meaningful alt text. Automated axe WCAG 2 A/AA and 2.1 AA checks complement responsive browser tests; they do not constitute complete certification. Lighthouse and field Core Web Vitals have not been measured.

The live WordPress installation remains unchanged. The deliverable is the local frontend, source adapter, documentation, and deployable static build.
