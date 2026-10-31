/**
 * Renders the app icon (option A: golden sparkle on a dark tile) to every
 * file the PWA manifest and the browsers need. Run after changing the design:
 *
 *   npm run icons
 *
 * The generated files are committed, so builds do not depend on a browser.
 */
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const PUBLIC_DIR = fileURLToPath(new URL('../public/', import.meta.url));
const TILE_COLOR = '#1b1d22';
const SPARKLE_COLOR = '#f2c94c';
const SPARKLE_PATHS = [
  'M11 2l2.3 6.2L19.5 10.5l-6.2 2.3L11 19l-2.3-6.2L2.5 10.5l6.2-2.3z',
  'M18.5 14.5l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z',
];

/**
 * @param {object} options
 * @param {number} options.cornerRadius Fraction of the size; 0 for full-bleed maskable icons.
 * @param {number} options.sparkleScale Fraction of the tile occupied by the sparkle.
 */
function buildSvg({ cornerRadius, sparkleScale }) {
  const size = 512;
  const sparkleSize = size * sparkleScale;
  const offset = (size - sparkleSize) / 2;
  const scale = sparkleSize / 24;
  const paths = SPARKLE_PATHS.map((d) => `<path d="${d}" fill="${SPARKLE_COLOR}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" rx="${size * cornerRadius}" fill="${TILE_COLOR}"/><g transform="translate(${offset} ${offset}) scale(${scale})">${paths}</g></svg>`;
}

// Maskable icons are cropped by the launcher to a circle or squircle; the
// sparkle stays inside the 80 % safe zone and the tile fills the whole square.
const TARGETS = [
  { file: 'pwa-192x192.png', size: 192, cornerRadius: 0.22, sparkleScale: 0.7 },
  { file: 'pwa-512x512.png', size: 512, cornerRadius: 0.22, sparkleScale: 0.7 },
  { file: 'maskable-icon-512x512.png', size: 512, cornerRadius: 0, sparkleScale: 0.56 },
  { file: 'apple-touch-icon-180x180.png', size: 180, cornerRadius: 0, sparkleScale: 0.62 },
];

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  for (const target of TARGETS) {
    await page.setViewportSize({ width: target.size, height: target.size });
    const svg = buildSvg(target);
    await page.setContent(
      `<html><body style="margin:0;background:transparent"><img src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}" width="${target.size}" height="${target.size}" style="display:block"></body></html>`,
    );
    await page.screenshot({ path: `${PUBLIC_DIR}${target.file}`, omitBackground: true });
    console.log(`wrote public/${target.file}`);
  }
} finally {
  await browser.close();
}

writeFileSync(`${PUBLIC_DIR}favicon.svg`, buildSvg({ cornerRadius: 0.22, sparkleScale: 0.7 }));
console.log('wrote public/favicon.svg');
