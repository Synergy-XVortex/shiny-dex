import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { BUNDLED_ENTRIES, INITIAL_STATUSES } from './catalog';
import type { PokedexEntry, ShinyStatus } from './model';
import { StatusContext, type StatusChange, type StatusContextValue } from './statusContext';
import { db as defaultDatabase, seedMissingStatuses, writeStatus, type ShinyDexDatabase } from './statusDb';

const ENTRY_IDS = BUNDLED_ENTRIES.map((entry) => entry.id);

interface StatusProviderProps {
  children: ReactNode;
  /** Injected in tests to isolate each test's IndexedDB. */
  database?: ShinyDexDatabase;
}

export function StatusProvider({ children, database = defaultDatabase }: StatusProviderProps) {
  const [lastChange, setLastChange] = useState<StatusChange | null>(null);
  const [seededDatabase, setSeededDatabase] = useState<ShinyDexDatabase | null>(null);

  useEffect(() => {
    let cancelled = false;
    void seedMissingStatuses(database, ENTRY_IDS, INITIAL_STATUSES).then(() => {
      if (!cancelled) setSeededDatabase(database);
    });
    return () => {
      cancelled = true;
    };
  }, [database]);

  // Live query: every write to the table re-renders consumers, including writes
  // made from another tab of the app.
  const records = useLiveQuery(() => database.statuses.toArray(), [database]);
  // Until seeding has finished the table may be empty or partial; exposing it
  // would briefly show every entry as "à farm" on first launch.
  const isReady = records !== undefined && seededDatabase === database;
  const statuses = useMemo(
    () => (isReady ? new Map(records.map((record) => [record.id, record.status])) : undefined),
    [isReady, records],
  );

  const setStatus = useCallback(
    async (entry: PokedexEntry, next: ShinyStatus) => {
      const previous = statuses?.get(entry.id) ?? 'to-farm';
      if (previous === next) return;
      await writeStatus(database, entry.id, next);
      setLastChange({ entry, previous, next });
    },
    [database, statuses],
  );

  const undoLastChange = useCallback(async () => {
    if (!lastChange) return;
    await writeStatus(database, lastChange.entry.id, lastChange.previous);
    setLastChange(null);
  }, [database, lastChange]);

  const dismissLastChange = useCallback(() => setLastChange(null), []);

  const value = useMemo<StatusContextValue>(
    () => ({ statuses, setStatus, lastChange, undoLastChange, dismissLastChange }),
    [statuses, setStatus, lastChange, undoLastChange, dismissLastChange],
  );

  return <StatusContext.Provider value={value}>{children}</StatusContext.Provider>;
}
