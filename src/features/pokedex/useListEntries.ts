import { useCallback, useMemo } from 'react';
import { ENTRIES, toggledStatus } from './catalog';
import { applyFilters, getDex, type DexId, type ListFilters } from './listQuery';
import { useListQuery } from './listQueryContext';
import type { PokedexEntry, ShinyStatus } from './model';
import { useStatuses } from './statusContext';

/** Entries of the selected Pokédex, before and after filters. */
export function useListEntries(): {
  dexEntries: PokedexEntry[];
  visibleEntries: PokedexEntry[];
} {
  const { dexId, filters } = useListQuery();
  const { statuses } = useStatuses();
  return useMemo(() => {
    const dexEntries = ENTRIES.filter(getDex(dexId).includes);
    return { dexEntries, visibleEntries: statuses ? applyFilters(dexEntries, statuses, filters) : dexEntries };
  }, [dexId, filters, statuses]);
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
export function listSelectionKey(dexId: DexId, filters: ListFilters): string {
  const sorted = (set: ReadonlySet<unknown>) => [...set].map(String).sort().join(',');
  return [
    dexId,
    sorted(filters.statuses),
    sorted(filters.types),
    filters.typeMode,
    sorted(filters.generations),
    sorted(filters.categories),
  ].join('|');
}
