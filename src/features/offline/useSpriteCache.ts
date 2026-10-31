import { useEffect, useSyncExternalStore } from 'react';
import { BUNDLED_ENTRIES, spriteUrl } from '../pokedex/catalog';
import {
  getSpriteCacheProgress,
  subscribeToSpriteCache,
  warmSpriteCache,
  type SpriteCacheProgress,
} from './spriteCache';

const ALL_SPRITE_URLS = BUNDLED_ENTRIES.flatMap((entry) => [spriteUrl(entry.id, 'normal'), spriteUrl(entry.id, 'shiny')]);

/** Delay before starting, so the background download never competes with the first screen. */
const START_DELAY_MS = 3000;

/** Starts the background sprite download once per launch. Mount it once, near the root. */
export function useSpriteCacheWarmup(): void {
  useEffect(() => {
    void warmSpriteCache(ALL_SPRITE_URLS, { startDelayMs: START_DELAY_MS });
  }, []);
}

export function useSpriteCacheProgress(): SpriteCacheProgress {
  return useSyncExternalStore(subscribeToSpriteCache, getSpriteCacheProgress);
}
