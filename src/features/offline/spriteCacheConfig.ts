/**
 * Shared between the service worker configuration (vite.config.ts) and the
 * app code that fills the cache, so both always use the same cache.
 * Bump the version suffix to discard every cached sprite after a re-import.
 */
export const SPRITE_CACHE_NAME = 'shiny-dex-sprites-v1';

/** Matches sprite requests: /sprites/normal/<id>.webp and /sprites/shiny/<id>.webp. */
export const SPRITE_URL_PATTERN = /\/sprites\/(normal|shiny)\/[^/]+\.webp$/;
