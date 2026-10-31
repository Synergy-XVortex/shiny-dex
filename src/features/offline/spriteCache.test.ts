import { describe, expect, it, vi } from 'vitest';
import { getSpriteCacheProgress, warmSpriteCache } from './spriteCache';
import { SPRITE_CACHE_NAME, SPRITE_URL_PATTERN } from './spriteCacheConfig';

/** In-memory stand-in for the Cache Storage API, recording what gets downloaded. */
function fakeCacheStorage(alreadyCached: string[], failOn?: string) {
  const stored = new Set(alreadyCached.map((path) => new URL(path, location.href).href));
  const add = vi.fn(async (url: string) => {
    if (url === failOn) throw new Error('Network error');
    stored.add(new URL(url, location.href).href);
  });
  const cache = {
    keys: async () => [...stored].map((url) => new Request(url)),
    add,
  };
  const storage = { open: vi.fn(async () => cache) } as unknown as CacheStorage;
  return { storage, add, stored };
}

const URLS = ['/sprites/normal/bulbasaur.webp', '/sprites/shiny/bulbasaur.webp', '/sprites/normal/ivysaur.webp'];

describe('warmSpriteCache', () => {
  it('downloads only the sprites that are not cached yet, into the shared cache', async () => {
    const { storage, add } = fakeCacheStorage(['/sprites/normal/bulbasaur.webp']);

    await warmSpriteCache(URLS, { cacheStorage: storage });

    expect(storage.open).toHaveBeenCalledWith(SPRITE_CACHE_NAME);
    expect(add.mock.calls.map(([url]) => url).sort()).toEqual([
      '/sprites/normal/ivysaur.webp',
      '/sprites/shiny/bulbasaur.webp',
    ]);
    expect(getSpriteCacheProgress()).toMatchObject({ cached: 3, total: 3, running: false, error: null });
  });

  it('stops on a network error and reports it, keeping what was stored', async () => {
    const { storage } = fakeCacheStorage([], '/sprites/shiny/bulbasaur.webp');

    await warmSpriteCache(URLS, { cacheStorage: storage });

    const progress = getSpriteCacheProgress();
    expect(progress.running).toBe(false);
    expect(progress.error).toBe('Network error');
    expect(progress.cached).toBeLessThan(3);
  });

  it('does nothing without Cache Storage', async () => {
    await expect(warmSpriteCache(URLS, { cacheStorage: null })).resolves.toBeUndefined();
  });
});

describe('SPRITE_URL_PATTERN', () => {
  it('matches sprite files only', () => {
    expect(SPRITE_URL_PATTERN.test('/sprites/shiny/rattata-alola.webp')).toBe(true);
    expect(SPRITE_URL_PATTERN.test('/sprites/other/rattata.webp')).toBe(false);
    expect(SPRITE_URL_PATTERN.test('/assets/index.js')).toBe(false);
  });
});
