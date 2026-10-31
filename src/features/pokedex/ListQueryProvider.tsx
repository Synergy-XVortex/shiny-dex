import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { EMPTY_FILTERS, isDexId, type DexId, type ListFilters } from './listQuery';
import { ListQueryContext } from './listQueryContext';

const DEX_STORAGE_KEY = 'shinydex.dex';

function readStoredDex(): DexId {
  try {
    const stored = localStorage.getItem(DEX_STORAGE_KEY);
    return isDexId(stored) ? stored : 'global';
  } catch {
    return 'global';
  }
}

/**
 * Holds the list's selected Pokédex, filters and search text above the
 * router, so they survive moving between the list, a detail page and the
 * filter screen. The selected Pokédex is remembered across launches;
 * filters and search reset when the app restarts.
 */
export function ListQueryProvider({ children }: { children: ReactNode }) {
  const [dexId, setDexIdState] = useState<DexId>(readStoredDex);
  const [filters, setFilters] = useState<ListFilters>(EMPTY_FILTERS);
  const [search, setSearch] = useState('');

  const setDexId = useCallback((id: DexId) => {
    setDexIdState(id);
    try {
      localStorage.setItem(DEX_STORAGE_KEY, id);
    } catch {
      // Not remembered across launches; the selection still applies now.
    }
  }, []);

  const resetFilters = useCallback(() => setFilters(EMPTY_FILTERS), []);

  const value = useMemo(
    () => ({ dexId, setDexId, filters, setFilters, resetFilters, search, setSearch }),
    [dexId, setDexId, filters, resetFilters, search],
  );
  return <ListQueryContext.Provider value={value}>{children}</ListQueryContext.Provider>;
}
