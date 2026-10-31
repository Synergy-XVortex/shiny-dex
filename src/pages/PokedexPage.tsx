import { useMemo, useRef, useState } from 'react';
import { BottomSheet } from '../components/BottomSheet';
import { CloseIcon, FilterIcon, SearchIcon } from '../components/icons';
import { NewSpeciesBanner } from '../features/newPokemon/NewSpeciesBanner';
import { countStatuses } from '../features/pokedex/catalog';
import { useCatalog } from '../features/pokedex/catalogContext';
import { DexSelector } from '../features/pokedex/components/DexSelector';
import { FilterPanel } from '../features/pokedex/components/FilterPanel';
import { PokedexToolbar } from '../features/pokedex/components/PokedexToolbar';
import { UndoToast } from '../features/pokedex/components/UndoToast';
import { VirtualEntryList } from '../features/pokedex/components/VirtualEntryList';
import { countActiveFilters } from '../features/pokedex/listQuery';
import { useListQuery } from '../features/pokedex/listQueryContext';
import { useStatuses } from '../features/pokedex/statusContext';
import { listSelectionKey, useListEntries, useStatusToggle } from '../features/pokedex/useListEntries';
import { useViewMode } from '../features/pokedex/useViewMode';

function results(count: number): string {
  return count === 0 ? 'Aucun résultat' : `${count} résultat${count > 1 ? 's' : ''}`;
}

/**
 * The collection, with everything that narrows it on the same screen:
 * Pokédex selector and progress at the top, a search field opened from the
 * bottom bar, and the filter panel sliding over the list.
 */
export function PokedexPage() {
  const scrollElementRef = useRef<HTMLElement>(null);
  const { statuses } = useStatuses();
  const { dexId, setDexId, filters, resetFilters, search, setSearch } = useListQuery();
  const { dexEntries, visibleEntries } = useListEntries();
  const handleToggle = useStatusToggle();
  const [mode, setMode] = useViewMode();
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  // The field stays open while it holds a search, e.g. back from a detail page.
  const [searchRequested, setSearchRequested] = useState(false);
  const searchOpen = searchRequested || search !== '';

  const dex = useCatalog().getDex(dexId);
  const activeFilters = countActiveFilters(filters);
  const narrowed = activeFilters > 0 || search.trim() !== '';
  // Progress describes the selected Pokédex as a whole, filters or not.
  const counts = useMemo(() => (statuses ? countStatuses(dexEntries, statuses) : null), [dexEntries, statuses]);
  const percent = counts ? Math.round((counts.obtained / Math.max(counts.total, 1)) * 100) : 0;

  const closeSearch = () => {
    setSearch('');
    setSearchRequested(false);
  };

  return (
    <div className="mx-auto flex h-dvh max-w-3xl flex-col pt-[env(safe-area-inset-top)]">
      <main ref={scrollElementRef} className="relative flex-1 overflow-y-auto overscroll-contain">
        <header className="bg-surface sticky top-0 z-20 flex flex-col gap-3.5 px-5 pt-5 pb-3">
          <h1 className="text-[26px] font-extrabold tracking-tight">Shiny Dex</h1>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectorOpen(true)}
              aria-haspopup="dialog"
              className="bg-inverse text-on-inverse flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-full pr-3 pl-4 text-sm font-bold"
            >
              {dex.label}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="text-ink-muted flex justify-between text-xs font-semibold">
                <span>{counts ? `${counts.obtained} / ${counts.total}` : '…'}</span>
                <span>{percent} %</span>
              </div>
              <div
                role="progressbar"
                aria-label="Shiny obtenus"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
                className="bg-surface-sunken h-1.5 overflow-hidden rounded-full"
              >
                <div className="bg-shiny h-full rounded-full transition-[width]" style={{ width: `${percent}%` }} />
              </div>
            </div>
          </div>

          {searchOpen && (
            <div className="bg-surface-raised border-line focus-within:border-ink flex h-12 items-center gap-2.5 rounded-2xl border-[1.5px] pr-1 pl-3.5">
              <SearchIcon width={20} height={20} className="text-ink-subtle shrink-0" />
              <input
                type="search"
                aria-label="Rechercher dans ce Pokédex"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nom (FR ou EN) ou numéro"
                autoFocus
                autoComplete="off"
                enterKeyHint="search"
                className="placeholder:text-ink-subtle min-w-0 flex-1 bg-transparent text-base outline-none [&::-webkit-search-cancel-button]:hidden"
              />
              <button
                type="button"
                onClick={closeSearch}
                aria-label="Fermer la recherche"
                className="text-ink-muted flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl"
              >
                <CloseIcon width={20} height={20} />
              </button>
            </div>
          )}

          <NewSpeciesBanner />

          {narrowed && (
            <div className="flex items-center gap-2 text-sm">
              {activeFilters > 0 ? (
                <button
                  type="button"
                  onClick={() => setFiltersOpen(true)}
                  className="bg-shiny-soft text-shiny-ink flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-3 font-bold"
                >
                  <FilterIcon width={16} height={16} />
                  {activeFilters} filtre{activeFilters > 1 ? 's' : ''} · {results(visibleEntries.length)}
                </button>
              ) : (
                <p role="status" className="text-ink-muted px-1 font-semibold">
                  {results(visibleEntries.length)}
                </p>
              )}
              {activeFilters > 0 && (
                <button type="button" onClick={resetFilters} className="text-ink-muted h-9 cursor-pointer px-2 font-semibold underline">
                  Effacer les filtres
                </button>
              )}
            </div>
          )}
        </header>

        {!statuses ? (
          <p className="text-ink-subtle px-5 py-10 text-center text-sm">Chargement de ta collection…</p>
        ) : visibleEntries.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <p className="text-ink-muted text-sm">Aucun Pokémon ne correspond dans ce Pokédex.</p>
            <div className="flex flex-wrap justify-center gap-2">
              {activeFilters > 0 && (
                <button type="button" onClick={resetFilters} className="bg-inverse text-on-inverse h-11 cursor-pointer rounded-2xl px-5 text-sm font-bold">
                  Effacer les filtres
                </button>
              )}
              {search.trim() !== '' && (
                <button type="button" onClick={closeSearch} className="bg-surface-sunken h-11 cursor-pointer rounded-2xl px-5 text-sm font-bold">
                  Effacer la recherche
                </button>
              )}
            </div>
          </div>
        ) : (
          <VirtualEntryList
            entries={visibleEntries}
            statuses={statuses}
            mode={mode}
            onToggle={handleToggle}
            scrollElementRef={scrollElementRef}
            scrollKey={`pokedex|${listSelectionKey(dexId, filters, search)}`}
          />
        )}
      </main>

      <UndoToast />
      <PokedexToolbar
        searchOpen={searchOpen}
        onToggleSearch={() => (searchOpen ? closeSearch() : setSearchRequested(true))}
        onOpenFilters={() => setFiltersOpen(true)}
        activeFilters={activeFilters}
      />

      <BottomSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filtres"
        expandable
        actions={
          <span className="flex items-center gap-1">
            <span role="status" className="text-ink-muted text-sm font-semibold">
              {results(visibleEntries.length)}
            </span>
            {activeFilters > 0 && (
              <button type="button" onClick={resetFilters} className="text-ink-muted h-11 cursor-pointer px-2 text-sm font-bold underline">
                Réinitialiser
              </button>
            )}
          </span>
        }
      >
        <FilterPanel viewMode={mode} onViewModeChange={setMode} />
      </BottomSheet>

      {statuses && (
        <DexSelector
          open={selectorOpen}
          onClose={() => setSelectorOpen(false)}
          selected={dexId}
          onSelect={setDexId}
          statuses={statuses}
        />
      )}
    </div>
  );
}
