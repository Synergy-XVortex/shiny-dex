/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

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
        // Sprites are part of the precache so the whole Pokédex works offline
        // (~26 MB, downloaded once in the background after installation; on
        // updates only changed files are fetched again).
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,webp}'],
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
