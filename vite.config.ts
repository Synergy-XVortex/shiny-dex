/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { SPRITE_CACHE_NAME, SPRITE_URL_PATTERN } from './src/features/offline/spriteCacheConfig.ts';

const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as {
  version: string;
};

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // A personal app with a single user: silently taking the newest version
      // on next launch is simpler than an "update available" prompt.
      registerType: 'autoUpdate',
      // Registered from src/main.tsx so the page reloads itself onto a new version.
      injectRegister: false,
      includeAssets: ['favicon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Shiny Dex',
        short_name: 'Shiny Dex',
        description: "Suivi personnel d'un Shiny Living Dex.",
        lang: 'fr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#1b1d22',
        background_color: '#1b1d22',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // The app shell only (~400 kB), so a new version installs in seconds.
        // Sprites are deliberately excluded: precaching 26 MB made every
        // update wait for them. They are cached at runtime instead, and filled
        // in the background by src/features/offline/spriteCache.ts.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            // A RegExp, not a function: workbox copies functions into sw.js as
            // source text, where imported constants do not exist.
            urlPattern: SPRITE_URL_PATTERN,
            handler: 'CacheFirst',
            options: {
              cacheName: SPRITE_CACHE_NAME,
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
        // Take over as soon as installed, without waiting for every tab to
        // close or for a message from the page: pages served by an older
        // worker cannot send one, which left updates stuck as "waiting".
        skipWaiting: true,
        clientsClaim: true,
        // Client-side routes (/stats, /vitrine…) must resolve to the app shell offline.
        navigateFallback: '/index.html',
      },
    }),
  ],
  build: {
    // The bundled Pokédex reference data (src/data/pokedex.json, ~200 kB raw)
    // accounts for most of the main chunk; it is needed on first paint anyway.
    chunkSizeWarningLimit: 800,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
