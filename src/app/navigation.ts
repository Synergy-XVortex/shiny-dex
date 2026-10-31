import type { ComponentType, SVGProps } from 'react';
import { FilterIcon, PokedexIcon, SearchIcon, SettingsIcon, StatsIcon } from '../components/icons';

export interface NavigationItem {
  path: string;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

/**
 * Bottom navigation entries, in display order. Search and Filters are routes
 * for now; step 4 turns them into overlays on top of the Pokédex list.
 */
export const NAVIGATION_ITEMS: readonly NavigationItem[] = [
  { path: '/', label: 'Pokédex', Icon: PokedexIcon },
  { path: '/stats', label: 'Stats', Icon: StatsIcon },
  { path: '/recherche', label: 'Recherche', Icon: SearchIcon },
  { path: '/filtres', label: 'Filtres', Icon: FilterIcon },
  { path: '/reglages', label: 'Réglages', Icon: SettingsIcon },
];
