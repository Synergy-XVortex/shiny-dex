import type { AddedEntry } from '../pokedex/model';
import type { ShinyDexDatabase } from '../pokedex/statusDb';
import type { AddedEntriesStore } from './addedEntriesStore';
import { fetchJson, fetchSpecies, fetchSpeciesCount, isIncomplete, type FetchJson } from './pokeApi';

/**
 * New species: detected by comparing PokéAPI's species count with the highest
 * number the app knows, added after the owner confirms, then completed on
 * later checks as PokéAPI publishes French texts and HOME sprites.
 */

/** PokéAPI species count at the last check; with the catalog it gives the number of new species. */
export const META_POKEAPI_SPECIES_COUNT = 'pokeApiSpeciesCount';
export const META_NEW_SPECIES_CHECKED_AT = 'newSpeciesCheckedAt';

/** Copies the online list into this device, so added species also show offline. */
export async function pullAddedEntries(database: ShinyDexDatabase, store: AddedEntriesStore): Promise<void> {
  const remote = await store.fetchAll();
  await database.transaction('rw', database.addedEntries, async () => {
    await database.addedEntries.clear();
    await database.addedEntries.bulkPut(remote);
  });
}

/** Asks PokéAPI how many species exist and remembers it. */
export async function checkSpeciesCount(database: ShinyDexDatabase, fetchFn: FetchJson = fetchJson): Promise<number> {
  const count = await fetchSpeciesCount(fetchFn);
  await database.meta.bulkPut([
    { key: META_POKEAPI_SPECIES_COUNT, value: count },
    { key: META_NEW_SPECIES_CHECKED_AT, value: Date.now() },
  ]);
  return count;
}

export interface AddProgress {
  done: number;
  total: number;
}

/**
 * Adds species fromDex…toDex. Everything is read from PokéAPI before anything
 * is stored, so a network failure half-way leaves no partial addition. New
 * species start as "à farm", unless another device already gave them a status.
 */
export async function addSpecies(
  database: ShinyDexDatabase,
  store: AddedEntriesStore,
  range: { fromDex: number; toDex: number },
  options: { fetchFn?: FetchJson; onProgress?: (progress: AddProgress) => void } = {},
): Promise<AddedEntry[]> {
  const { fetchFn = fetchJson, onProgress } = options;
  const total = Math.max(0, range.toDex - range.fromDex + 1);
  const entries: AddedEntry[] = [];
  for (let dex = range.fromDex; dex <= range.toDex; dex += 1) {
    entries.push(await fetchSpecies(dex, fetchFn));
    onProgress?.({ done: entries.length, total });
  }

  await store.upsert(entries);

  const now = Date.now();
  await database.transaction('rw', database.addedEntries, database.statuses, database.pendingChanges, async () => {
    await database.addedEntries.bulkPut(entries);
    for (const entry of entries) {
      if (await database.statuses.get(entry.id)) continue;
      const record = { id: entry.id, status: 'to-farm' as const, updatedAt: now };
      await database.statuses.put(record);
      await database.pendingChanges.put(record);
    }
  });
  return entries;
}

/** Re-reads added species that still miss a French text or a sprite; returns how many changed. */
export async function completeAddedEntries(
  database: ShinyDexDatabase,
  store: AddedEntriesStore,
  fetchFn: FetchJson = fetchJson,
): Promise<number> {
  const incomplete = (await database.addedEntries.toArray()).filter(isIncomplete);
  const changed: AddedEntry[] = [];
  for (const entry of incomplete) {
    const fresh = await fetchSpecies(entry.dex, fetchFn);
    if (JSON.stringify(fresh) !== JSON.stringify(entry)) changed.push(fresh);
  }
  if (changed.length > 0) {
    await store.upsert(changed);
    await database.addedEntries.bulkPut(changed);
  }
  return changed.length;
}
