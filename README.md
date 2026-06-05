# SpaceX IPO landing — Astro

Astro port of the static `spacex-ipo-landing` site. Goal: ~95 Lighthouse mobile score (current static site sits at 34).

## Why Astro?

| Static site problem | Astro fix |
|---|---|
| Tailwind CDN (3 MB JIT runtime, render-blocking) | Tailwind compiled at build → ~10 KB |
| Three.js + GLTFLoader on every page load | Dynamic `import()` inside an IntersectionObserver — Three.js loads only when the moon container scrolls near |
| GSAP on the critical path | Dynamic-imported into its own chunk |
| Google Fonts CSS render-blocks | Self-hosted via `@fontsource/*` — bundled, preloaded |
| `<script>` tags block render | Astro auto-defers + module-bundles all `<script>` blocks |

## Prerequisites

**Node.js 18.20.8+ or 22.0.0+** — install from https://nodejs.org (LTS .msi for Windows).

Verify after install:
```bash
node --version
npm --version
```

## Getting started

```bash
# Install dependencies (run once)
npm install

# Start the dev server — opens at http://localhost:4321
npm run dev

# Build for production — output to ./dist
npm run build

# Preview the production build locally
npm run preview
```

## Project layout

```
spacex-ipo-astro/
├── astro.config.mjs        # Astro + Tailwind + manual chunk splitting
├── tailwind.config.mjs     # Brand colors + display font
├── tsconfig.json
├── public/
│   └── assets/             # moon.glb, Group 430.svg, logo.png (served as-is)
└── src/
    ├── pages/
    │   └── index.astro     # The whole landing page
    ├── styles/
    │   └── global.css      # Ported styles.css 1:1
    └── scripts/
        ├── moon.ts         # Three.js — lazy-loaded via IntersectionObserver
        └── hero.ts         # Starfield, nav, GSAP, sticky CTA, toggle
```

## Performance tactics baked in

1. **Tailwind compiled** via `@astrojs/tailwind` — only used classes ship, ~10 KB instead of 3 MB CDN.
2. **Lazy Three.js** — `await import('three')` inside an IntersectionObserver. The hero paints first, Three.js loads only when the moon section is ~300 px from the viewport.
3. **GSAP in its own chunk** — `manualChunks` in `astro.config.mjs` splits gsap + three so they don't block the hero render.
4. **Self-hosted fonts** — `@fontsource/inter|barlow-condensed|space-mono` replace the render-blocking Google Fonts CSS.
5. **Astro auto-defers** all `<script>` tags it processes (which is the default in `.astro` files).
6. **`lightningcss` minification** for tiny CSS output.
7. **Explicit `width` + `height`** on all `<img>` tags to silence Lighthouse and stabilize CLS.

## Deploying to GitHub Pages

The config already sets `base: '/spacex-ipo-landing/'`. To publish:

```bash
npm run build
# Then push the contents of ./dist to the `gh-pages` branch of your repo, or set up
# the official Astro GitHub Pages workflow:
# https://docs.astro.build/en/guides/deploy/github/
```

## Migration notes

- `script.js` was split into `hero.ts` (starfield, GSAP, toggle, sticky CTA) and `moon.ts` (Three.js).
- The Three.js loader was rewritten to use ESM imports from the npm `three` package (not the CDN importmap) so the bundler can tree-shake.
- `styles.css` is imported as a global stylesheet — every class still works.
- The old cache-busting query strings (`?v=73`) are gone — Astro fingerprints emitted assets automatically.
