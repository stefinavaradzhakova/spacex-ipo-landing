import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  // GitHub Pages deploy: change `site` + `base` if you host under a subpath.
  site: 'https://stefinavaradzhakova.github.io',
  base: '/spacex-ipo-landing/',
  trailingSlash: 'ignore',

  integrations: [
    tailwind({
      applyBaseStyles: false, // We bring our own global.css
    }),
  ],

  build: {
    // Inline small stylesheets to save round-trips, link the big ones.
    inlineStylesheets: 'auto',
    assets: '_astro',
  },

  vite: {
    build: {
      // Aggressive minification + lightningcss for tiny CSS.
      cssMinify: 'lightningcss',
      // Split big vendor chunks (three.js / gsap) so the hero doesn't wait on them.
      rollupOptions: {
        output: {
          manualChunks: {
            three: ['three'],
            gsap: ['gsap'],
          },
        },
      },
    },
  },
});
