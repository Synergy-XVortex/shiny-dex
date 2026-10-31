import { createContext, useContext } from 'react';
import type { DexId, ListFilters } from './listQuery';

export interface ListQueryContextValue {
  dexId: DexId;
  setDexId: (id: DexId) => void;
  filters: ListFilters;
  setFilters: (filters: ListFilters) => void;
  resetFilters: () => void;
  search: string;
  setSearch: (search: string) => void;
}

export const ListQueryContext = createContext<ListQueryContextValue | null>(null);

export function useListQuery(): ListQueryContextValue {
  const context = useContext(ListQueryContext);
  if (!context) {
    throw new Error('useListQuery must be used inside <ListQueryProvider>.');
  }
  return context;
}
