import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, type ReactNode } from 'react';
import { buildCatalog } from './catalog';
import { CatalogContext } from './catalogContext';
import type { AddedEntry } from './model';
import { db as defaultDatabase, type ShinyDexDatabase } from './statusDb';

const NO_ADDED_ENTRIES: readonly AddedEntry[] = [];

/** Catalog of the bundled data plus the given added species. */
export function CatalogProvider({ added, children }: { added: readonly AddedEntry[]; children: ReactNode }) {
  const catalog = useMemo(() => buildCatalog(added), [added]);
  return <CatalogContext.Provider value={catalog}>{children}</CatalogContext.Provider>;
}

/** Private app: added species come from this device's IndexedDB, kept in step by the sync. */
export function LocalCatalogProvider({
  children,
  database = defaultDatabase,
}: {
  children: ReactNode;
  database?: ShinyDexDatabase;
}) {
  const added = useLiveQuery(() => database.addedEntries.toArray(), [database]) ?? NO_ADDED_ENTRIES;
  return <CatalogProvider added={added}>{children}</CatalogProvider>;
}
