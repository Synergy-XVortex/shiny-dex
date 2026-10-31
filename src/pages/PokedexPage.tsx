import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLayoutScrollElement } from '../app/layoutContext';
import { CardsViewIcon, FilterIcon, GridViewIcon } from '../components/icons';
import { countStatuses } from '../features/pokedex/catalog';
import { DexSelector } from '../features/pokedex/components/DexSelector';
import { VirtualEntryList } from '../features/pokedex/components/VirtualEntryList';
import { NewSpeciesBanner } from '../features/newPokemon/NewSpeciesBanner';
import { useCatalog } from '../features/pokedex/catalogContext';
import { countActiveFilters } from '../features/pokedex/listQuery';
import { useListQuery } from '../features/pokedex/listQueryContext';
import { useStatuses } from '../features/pokedex/statusContext';
import { listSelectionKey, useListEntries, useStatusToggle } from '../features/pokedex/useListEntries';
import { useViewMode, type ViewMode } from '../features/pokedex/useViewMode';

const VIEW_OPTIONS: ReadonlyArray<{ mode: ViewMode; label: string; Icon: typeof CardsViewIcon }> = [
  { mode: 'cards', label: 'Vue cartes', Icon: CardsViewIcon },
  { mode: 'grid', label: 'Vue grille', Icon: GridViewIcon },
];

export function PokedexPage() {
  const scrollElementRef = useLayoutScrollElement();
  const { statuses } = useStatuses();
  const { dexId, setDexId, filters, resetFilters } = useListQuery();
  const { dexEntries, visibleEntries } = useListEntries();
  const handleToggle = useStatusToggle();
  const [mode, setMode] = useViewMode();
  const [selectorOpen, setSelectorOpen] = useState(false);

  const dex = useCatalog().getDex(dexId);
  const activeFilters = countActiveFilters(filters);
  // Progress describes the selected Pokédex as a whole, filters or not.
  const counts = useMemo(() => (statuses ? countStatuses(dexEntries, statuses) : null), [dexEntries, statuses]);
  const percent = counts ? Math.round((counts.obtained / Math.max(counts.total, 1)) * 100) : 0;

  return (
    <>
      <header className="bg-surface sticky top-0 z-20 flex flex-col gap-3.5 px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <h1 className="text-[26px] font-extrabold tracking-tight">Shiny Dex</h1>
          <div role="group" aria-label="Affichage" className="bg-surface-sunken flex gap-1 rounded-[14px] p-1">
            {VIEW_OPTIONS.map(({ mode: option, label, Icon }) => (
              <button
                key={option}
                type="button"
                aria-label={label}
                aria-pressed={mode === option}
                onClick={() => setMode(option)}
                className={`flex h-9 w-10 cursor-pointer items-center justify-center rounded-[10px] ${
                  mode === option ? 'bg-surface-raised text-ink shadow-sm' : 'text-ink-subtle'
                }`}
              >
                <Icon width={20} height={20} />
              </button>
            ))}
          </div>
        </div>
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
        <NewSpeciesBanner />
        {activeFilters > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Link
              to="/filtres"
              className="bg-shiny-soft text-shiny-ink flex h-9 items-center gap-1.5 rounded-full px-3 font-bold"
            >
              <FilterIcon width={16} height={16} />
              {activeFilters} filtre{activeFilters > 1 ? 's' : ''} · {visibleEntries.length} résultat
              {visibleEntries.length > 1 ? 's' : ''}
            </Link>
            <button type="button" onClick={resetFilters} className="text-ink-muted h-9 cursor-pointer px-2 font-semibold underline">
              Effacer
            </button>
          </div>
        )}
      </header>

      {!statuses ? (
        <p className="text-ink-subtle px-5 py-10 text-center text-sm">Chargement de ta collection…</p>
      ) : visibleEntries.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <p className="text-ink-muted text-sm">Aucun Pokémon ne correspond à ces filtres dans ce Pokédex.</p>
          <button
            type="button"
            onClick={resetFilters}
            className="bg-inverse text-on-inverse h-11 cursor-pointer rounded-2xl px-5 text-sm font-bold"
          >
            Effacer les filtres
          </button>
        </div>
      ) : (
        <VirtualEntryList
          entries={visibleEntries}
          statuses={statuses}
          mode={mode}
          onToggle={handleToggle}
          scrollElementRef={scrollElementRef}
          scrollKey={`pokedex|${listSelectionKey(dexId, filters)}`}
        />
      )}

      {statuses && (
        <DexSelector
          open={selectorOpen}
          onClose={() => setSelectorOpen(false)}
          selected={dexId}
          onSelect={setDexId}
          statuses={statuses}
        />
      )}
    </>
  );
}
