import type { SupabaseClient } from '@supabase/supabase-js';
import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useCatalog } from '../pokedex/catalogContext';
import { db as defaultDatabase, type ShinyDexDatabase } from '../pokedex/statusDb';
import { supabase as defaultClient } from '../sync/supabaseClient';
import { useSync } from '../sync/syncContext';
import { createSupabaseAddedEntriesStore } from './addedEntriesStore';
import {
  META_NEW_SPECIES_CHECKED_AT,
  META_POKEAPI_SPECIES_COUNT,
  addSpecies,
  checkSpeciesCount,
  completeAddedEntries,
  type AddProgress,
} from './newSpecies';
import { NewSpeciesContext, type NewSpeciesContextValue } from './newSpeciesContext';
import type { FetchJson } from './pokeApi';

/** PokéAPI is asked at most this often; new species appear a few times a year. */
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

interface NewSpeciesProviderProps {
  children: ReactNode;
  /** Injected in tests. */
  client?: SupabaseClient | null;
  database?: ShinyDexDatabase;
  fetchFn?: FetchJson;
}

async function readNumber(database: ShinyDexDatabase, key: string): Promise<number | null> {
  const value = (await database.meta.get(key))?.value;
  return typeof value === 'number' ? value : null;
}

/**
 * Detects species released after the bundled data, once a day while the owner
 * is signed in and synchronised, and adds them when asked.
 */
export function NewSpeciesProvider({
  children,
  client = defaultClient,
  database = defaultDatabase,
  fetchFn,
}: NewSpeciesProviderProps) {
  const { phase } = useSync();
  const { maxDex } = useCatalog();
  const [activity, setActivity] = useState<NewSpeciesContextValue['activity']>('idle');
  const [progress, setProgress] = useState<AddProgress | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const busy = useRef(false);

  const store = useMemo(() => (client ? createSupabaseAddedEntriesStore(client) : null), [client]);
  const speciesCount = useLiveQuery(() => readNumber(database, META_POKEAPI_SPECIES_COUNT), [database]) ?? null;
  // Undefined while IndexedDB has not answered, so the daily check does not fire on a stale "never".
  const storedCheckedAt = useLiveQuery(() => readNumber(database, META_NEW_SPECIES_CHECKED_AT), [database]);
  const checkedAt = storedCheckedAt ?? null;

  // Derived from the catalog, so the count drops as soon as species are
  // added, here or on another device.
  const newCount = speciesCount === null ? 0 : Math.max(0, speciesCount - maxDex);
  // "idle" means signed in, online, and last sync accepted by the server.
  const canAdd = store !== null && phase === 'idle';

  const run = useCallback(async (kind: 'checking' | 'adding', task: () => Promise<void>) => {
    if (busy.current) return;
    busy.current = true;
    setActivity(kind);
    setErrorMessage(null);
    try {
      await task();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      busy.current = false;
      setActivity('idle');
      setProgress(null);
    }
  }, []);

  const checkNow = useCallback(
    () =>
      run('checking', async () => {
        await checkSpeciesCount(database, fetchFn);
        if (store && canAdd) await completeAddedEntries(database, store, fetchFn);
      }),
    [run, database, store, canAdd, fetchFn],
  );

  const addNewSpecies = useCallback(
    () =>
      run('adding', async () => {
        if (!store || speciesCount === null) return;
        await addSpecies(database, store, { fromDex: maxDex + 1, toDex: speciesCount }, { fetchFn, onProgress: setProgress });
      }),
    [run, database, store, speciesCount, maxDex, fetchFn],
  );

  // Daily check, once signed in and synchronised.
  useEffect(() => {
    if (!canAdd || storedCheckedAt === undefined) return;
    if (storedCheckedAt !== null && Date.now() - storedCheckedAt < CHECK_INTERVAL_MS) return;
    const timer = window.setTimeout(() => void checkNow(), 0);
    return () => window.clearTimeout(timer);
  }, [canAdd, storedCheckedAt, checkNow]);

  const value = useMemo<NewSpeciesContextValue>(
    () => ({ newCount, canAdd, activity, progress, errorMessage, checkedAt, checkNow, addNewSpecies }),
    [newCount, canAdd, activity, progress, errorMessage, checkedAt, checkNow, addNewSpecies],
  );

  return <NewSpeciesContext.Provider value={value}>{children}</NewSpeciesContext.Provider>;
}
