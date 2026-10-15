# Homepage hero reference

Implemented on 30 September 2026, scoped to the homepage hero.

The user's `ChatGPT Image Sep 30, 2026, 09_55_38 AM.png` is the visual reference. Its continuous photographic scene, left-aligned hierarchy, white text, blue highlighted GREEN, rounded primary/outlined secondary buttons, and compact line-icon row inform the new `src/components/Hero.astro`.

The original company mission paragraph and existing internal CTA destinations are preserved. The header, remaining homepage sections, content snapshot, importer, and internal pages keep their existing behavior. Hero styling is scoped to its component; superseded hero styles were removed from the global stylesheet.

## Background asset

- File: `public/images/tetra-hero-infrastructure.png` (1774 × 887).
- Method: built-in imagegen, using the supplied generated concept as the edit reference.
- Purpose: illustrative smart-infrastructure scene; it is not used as evidence of any actual Tetra premises or project.
- The generated background contains no website text or buttons. Website copy, CTAs, and feature icons are semantic HTML/SVG.
- Astro builds optimized WebP variants. Responsive image sizing accounts for the larger source area required by the portrait crop, preventing a low-resolution mobile background.
- The original reference and generated output outside the workspace are preserved.

## Generation prompt

Verification: `npm run check` passed with zero diagnostics; `npm run build` generated all 16 pages. All 12 homepage Playwright tests passed, covering 1920, 1440, 1024, 768, 430, 390, and 375 px, loaded images, internal links, mobile menu, reduced motion, and desktop/mobile axe accessibility. Desktop/tablet/mobile screenshots were visually reviewed. Final previews: `docs/previews/hero-1440.png` and `docs/previews/hero-390.png`.

```text
Use case: precise-object-edit. Asset type: clean photographic background for an implemented Tetra website hero. Input image is the approved visual reference and edit target. Recreate its EXACT photorealistic scene and premium blue cinematic atmosphere: forested Albanian-style mountainous valley at left and distance, a modern corporate building at right, smart parking entry barriers and dark modern electric car viewed from rear at middle-right, elegant parking terminal and an electric vehicle charger at far right. Preserve the scene's relative horizontal composition and realistic polished materials as closely as possible. REMOVE ALL OVERLAID WEBSITE/UI CONTENT: remove all headline and eyebrow text, paragraph, buttons, icons, feature labels, divider lines, and graphic overlays. Reconstruct natural background behind them. Also remove all words and company marks on the building, display panel and car plate; a simple blue parking P symbol may remain on the physical parking terminal. Do not invent any extra branding. Outpaint/reframe VERTICALLY to create a high-resolution landscape 2:1 image, ideally 2560x1280: natural sky/mountains above and continuous dark asphalt below. Main car and equipment occupy RIGHT 45 percent; left 55 percent stays uncluttered dark navy forest/valley negative space suitable for real HTML heading. Keep all key right-side equipment fully visible and safely inset from the outer edges, not cut off. Clean daylight blue atmosphere, cool blue/natural gray/white color grade, restrained natural greenery, no green lighting or UI glow. Scene fills the image edge-to-edge, no white borders, no cards, no typography, no buttons, no watermarks. The deliverable is ONLY the photographic scene, NOT a rendered webpage. High fidelity to reference geometry, cinematic but believable, architectural commercial photography quality.
```
