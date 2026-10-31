import { Link } from 'react-router-dom';
import { FilterIcon, SearchIcon, SettingsIcon, StatsIcon } from '../../../components/icons';

interface PokedexToolbarProps {
  searchOpen: boolean;
  onToggleSearch: () => void;
  onOpenFilters: () => void;
  /** Number of filter groups in use, shown on the filter button. */
  activeFilters: number;
}

const iconButton = 'text-ink-muted flex size-12 cursor-pointer items-center justify-center rounded-2xl';

/** Bottom bar of the Pokédex, as in dataDex: shortcuts on the left, filters on the right. */
export function PokedexToolbar({ searchOpen, onToggleSearch, onOpenFilters, activeFilters }: PokedexToolbarProps) {
  return (
    <nav
      aria-label="Outils du Pokédex"
      className="border-line bg-surface-raised flex shrink-0 items-center gap-2 border-t px-4 pt-2.5 pb-[calc(env(safe-area-inset-bottom)+10px)]"
    >
      <Link to="/stats" aria-label="Statistiques" className={iconButton}>
        <StatsIcon width={26} height={26} />
      </Link>
      <button
        type="button"
        aria-label="Recherche"
        aria-pressed={searchOpen}
        onClick={onToggleSearch}
        className={`${iconButton} ${searchOpen ? 'bg-shiny-soft text-shiny-ink' : ''}`}
      >
        <SearchIcon width={26} height={26} />
      </button>
      <Link to="/reglages" aria-label="Réglages" className={iconButton}>
        <SettingsIcon width={26} height={26} />
      </Link>
      <button
        type="button"
        onClick={onOpenFilters}
        aria-haspopup="dialog"
        aria-label={activeFilters > 0 ? `Filtres, ${activeFilters} actif${activeFilters > 1 ? 's' : ''}` : 'Filtres'}
        className="bg-inverse text-on-inverse relative ml-auto flex size-14 cursor-pointer items-center justify-center rounded-[20px] shadow-md"
      >
        <FilterIcon width={26} height={26} />
        {activeFilters > 0 && (
          <span
            aria-hidden="true"
            className="bg-shiny absolute text-black -top-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full text-xs font-extrabold"
          >
            {activeFilters}
          </span>
        )}
      </button>
    </nav>
  );
}
