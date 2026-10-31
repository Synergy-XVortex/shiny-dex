import { useMemo } from 'react';
import { useLayoutScrollElement } from '../app/layoutContext';
import { SearchIcon } from '../components/icons';
import { useCatalog } from '../features/pokedex/catalogContext';
import { VirtualEntryList } from '../features/pokedex/components/VirtualEntryList';
import { searchEntries } from '../features/pokedex/listQuery';
import { useListQuery } from '../features/pokedex/listQueryContext';
import { useStatuses } from '../features/pokedex/statusContext';
import { useStatusToggle } from '../features/pokedex/useListEntries';

/**
 * Looks up any entry by name or number across the whole collection,
 * regardless of the Pokédex and filters selected on the list.
 */
export function SearchPage() {
  const scrollElementRef = useLayoutScrollElement();
  const { statuses } = useStatuses();
  const { search, setSearch } = useListQuery();
  const handleToggle = useStatusToggle();
  const { entries } = useCatalog();
  const results = useMemo(() => searchEntries(entries, search), [entries, search]);

  return (
    <>
      <header className="bg-surface sticky top-0 z-20 flex flex-col gap-3 px-5 pt-5 pb-3">
        <h1 className="text-[26px] font-extrabold tracking-tight">Recherche</h1>
        <label className="bg-surface-raised border-line focus-within:border-ink flex h-12 items-center gap-2.5 rounded-2xl border-[1.5px] px-3.5">
          <SearchIcon width={20} height={20} className="text-ink-subtle shrink-0" />
          <span className="sr-only">Nom ou numéro</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nom (FR ou EN) ou numéro"
            autoFocus
            autoComplete="off"
            enterKeyHint="search"
            className="placeholder:text-ink-subtle min-w-0 flex-1 bg-transparent text-base outline-none"
          />
        </label>
        {search.trim() && (
          <p role="status" className="text-ink-subtle text-xs">
            {results.length === 0 ? 'Aucun résultat.' : `${results.length} résultat${results.length > 1 ? 's' : ''}`}
          </p>
        )}
      </header>

      {statuses && results.length > 0 && (
        <VirtualEntryList
          entries={results}
          statuses={statuses}
          mode="cards"
          onToggle={handleToggle}
          scrollElementRef={scrollElementRef}
          scrollKey={`search|${search}`}
        />
      )}
    </>
  );
}
