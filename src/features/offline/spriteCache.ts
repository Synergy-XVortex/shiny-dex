import { SPRITE_CACHE_NAME } from './spriteCacheConfig';

/**
 * Downloads every sprite into the Cache Storage in the background, so the
 * whole Pokédex works offline without making app updates wait for 26 MB of
 * images (which is what precaching them in the service worker did).
 *
 * The service worker serves `/sprites/*` cache-first from the same cache,
 * so sprites stored here are used offline, and sprites viewed before the
 * download finishes are cached on the fly.
 */

export interface SpriteCacheProgress {
  cached: number;
  total: number;
  /** True while the background download runs. */
  running: boolean;
  /** Set when the download stopped on an error (typically: connection lost). */
  error: string | null;
}

type Listener = (progress: SpriteCacheProgress) => void;

const CONCURRENCY = 4;

let progress: SpriteCacheProgress = { cached: 0, total: 0, running: false, error: null };
const listeners = new Set<Listener>();
let currentRun: Promise<void> | null = null;

function update(patch: Partial<SpriteCacheProgress>): void {
  progress = { ...progress, ...patch };
  listeners.forEach((listener) => listener(progress));
}

export function getSpriteCacheProgress(): SpriteCacheProgress {
  return progress;
}

export function subscribeToSpriteCache(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Cache Storage is missing in insecure contexts and in some test environments. */
function getCacheStorage(): CacheStorage | null {
  return typeof caches === 'undefined' ? null : caches;
}

/** The user asked the browser to limit data usage: do not download in the background. */
function prefersReducedData(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return connection?.saveData === true;
}

/**
 * Stores the missing sprites among `urls`. Safe to call on every launch:
 * already cached sprites are skipped, and concurrent calls share one run.
 */
export function warmSpriteCache(
  urls: readonly string[],
  { cacheStorage = getCacheStorage(), startDelayMs = 0 }: { cacheStorage?: CacheStorage | null; startDelayMs?: number } = {},
): Promise<void> {
  if (currentRun) return currentRun;
  if (!cacheStorage) return Promise.resolve();

  currentRun = (async () => {
    // Counting what is already stored is cheap and done at once, so the
    // settings page shows the real figure; only the downloads wait.
    const cache = await cacheStorage.open(SPRITE_CACHE_NAME);
    const cachedPaths = new Set((await cache.keys()).map((request) => new URL(request.url).pathname));
    const missing = urls.filter((url) => !cachedPaths.has(new URL(url, location.href).pathname));
    update({ total: urls.length, cached: urls.length - missing.length, error: null });

    if (missing.length === 0 || prefersReducedData()) return;
    if (startDelayMs > 0) {
      await new Promise((done) => setTimeout(done, startDelayMs));
    }

    update({ running: true });
    const queue = [...missing];
    try {
      await Promise.all(
        Array.from({ length: CONCURRENCY }, async () => {
          for (let url = queue.shift(); url; url = queue.shift()) {
            await cache.add(url);
            update({ cached: progress.cached + 1 });
          }
        }),
      );
    } catch (error) {
      // Usually the connection dropped; the next launch resumes where this one stopped.
      queue.length = 0;
      update({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      update({ running: false });
    }
  })().finally(() => {
    currentRun = null;
  });

  return currentRun;
}
