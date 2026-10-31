import { useCallback, useMemo } from 'react';
import { useLayoutScrollElement } from '../app/layoutContext';
import { CardsViewIcon, GridViewIcon } from '../components/icons';
import { ENTRIES, countStatuses, toggledStatus } from '../features/pokedex/catalog';
import { VirtualEntryList } from '../features/pokedex/components/VirtualEntryList';
import type { PokedexEntry } from '../features/pokedex/model';
import { useStatuses } from '../features/pokedex/statusContext';
import { useViewMode, type ViewMode } from '../features/pokedex/useViewMode';

const VIEW_OPTIONS: ReadonlyArray<{ mode: ViewMode; label: string; Icon: typeof CardsViewIcon }> = [
  { mode: 'cards', label: 'Vue cartes', Icon: CardsViewIcon },
  { mode: 'grid', label: 'Vue grille', Icon: GridViewIcon },
];

export function PokedexPage() {
  const scrollElementRef = useLayoutScrollElement();
  const { statuses, setStatus } = useStatuses();
  const [mode, setMode] = useViewMode();

  // Step 4 narrows this list with the Pokédex selector, filters and search.
  const entries = ENTRIES;
  const counts = useMemo(() => (statuses ? countStatuses(entries, statuses) : null), [entries, statuses]);
  const percent = counts ? Math.round((counts.obtained / counts.total) * 100) : 0;

  const handleToggle = useCallback(
    (entry: PokedexEntry) => {
      const current = statuses?.get(entry.id) ?? 'to-farm';
      void setStatus(entry, toggledStatus(current));
    },
    [statuses, setStatus],
  );

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
          <span className="bg-inverse text-on-inverse flex h-10 items-center rounded-full px-4 text-sm font-bold">
            Pokédex global
          </span>
          <div className="flex flex-1 flex-col gap-1.5">
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
      </header>

      {statuses ? (
        <VirtualEntryList
          entries={entries}
          statuses={statuses}
          mode={mode}
          onToggle={handleToggle}
          scrollElementRef={scrollElementRef}
        />
      ) : (
        <p className="text-ink-subtle px-5 py-10 text-center text-sm">Chargement de ta collection…</p>
      )}
    </>
  );
}
