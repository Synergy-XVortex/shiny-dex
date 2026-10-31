import { useCallback, useMemo } from 'react';
import { toggledStatus } from './catalog';
import { useCatalog } from './catalogContext';
import { FILTER_GROUP_KEYS, applyFilters, type DexId, type ListFilters } from './listQuery';
import { useListQuery } from './listQueryContext';
import type { PokedexEntry, ShinyStatus } from './model';
import { useStatuses } from './statusContext';

/** Entries of the selected Pokédex, before and after filters and search. */
export function useListEntries(): {
  dexEntries: PokedexEntry[];
  visibleEntries: PokedexEntry[];
} {
  const { dexId, filters, search } = useListQuery();
  const { statuses } = useStatuses();
  const { entries, getDex } = useCatalog();
  return useMemo(() => {
    const dexEntries = entries.filter(getDex(dexId).includes);
    return { dexEntries, visibleEntries: statuses ? applyFilters(dexEntries, statuses, filters, search) : dexEntries };
  }, [entries, getDex, dexId, filters, search, statuses]);
}

/** One-tap toggle shared by every list. */
export function useStatusToggle(): (entry: PokedexEntry) => void {
  const { statuses, setStatus } = useStatuses();
  return useCallback(
    (entry: PokedexEntry) => {
      const current: ShinyStatus = statuses?.get(entry.id) ?? 'to-farm';
      void setStatus(entry, toggledStatus(current));
    },
    [statuses, setStatus],
  );
}

/** Stable text describing a list selection, used to remember its scroll position. */
export function listSelectionKey(dexId: DexId, filters: ListFilters, search: string): string {
  const sorted = (set: ReadonlySet<unknown>) => [...set].map(String).sort().join(',');
  const groups = FILTER_GROUP_KEYS.map((key) => `${sorted(filters[key].included)}/${sorted(filters[key].excluded)}`);
  return [dexId, ...groups, filters.typeMode, search.trim()].join('|');
}
