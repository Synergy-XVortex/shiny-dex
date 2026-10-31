import type { EntryCategory, PokedexEntry, PokemonType, ShinyStatus } from './model';

/**
 * What the Pokédex list shows: one "Pokédex" (the whole collection, one
 * generation or one form category), narrowed by filters and a search text.
 * Pure functions only, so the rules are unit-tested without rendering.
 */

export type DexId = 'global' | `gen-${number}` | Exclude<EntryCategory, 'national'>;

export interface DexDefinition {
  id: DexId;
  label: string;
  shortLabel: string;
  includes: (entry: PokedexEntry) => boolean;
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

/** Generations of the bundled data; the catalog adds later ones when species are added. */
export const BUNDLED_GENERATIONS: readonly number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function romanGeneration(generation: number): string {
  return ROMAN[generation - 1] ?? String(generation);
}

const FORM_DEXES: ReadonlyArray<[Exclude<EntryCategory, 'national'>, string]> = [
  ['unown', 'Zarbi'],
  ['alola', 'Alola'],
  ['galar', 'Galar'],
  ['hisui', 'Hisui'],
  ['paldea', 'Paldea'],
  ['alternate', 'Alternatives'],
];

/**
 * Every Pokédex of a catalog, in display order: global, one per generation,
 * then one per form category. Generation Pokédexes hold the national entries
 * of that generation only, like the Sheet's generation tabs; forms have their
 * own Pokédexes.
 */
export function buildDexes(generations: readonly number[]): DexDefinition[] {
  return [
    { id: 'global', label: 'Pokédex global', shortLabel: 'Global', includes: () => true },
    ...generations.map<DexDefinition>((generation) => ({
      id: `gen-${generation}`,
      label: `Génération ${romanGeneration(generation)}`,
      shortLabel: `Gén. ${romanGeneration(generation)}`,
      includes: (entry) => entry.category === 'national' && entry.generation === generation,
    })),
    ...FORM_DEXES.map<DexDefinition>(([category, label]) => ({
      id: category,
      label: `Formes ${label}`,
      shortLabel: label,
      includes: (entry) => entry.category === category,
    })),
  ];
}

/** The requested Pokédex, or the global one when it does not exist (yet) in this catalog. */
export function findDex(dexes: readonly DexDefinition[], id: DexId): DexDefinition {
  return dexes.find((dex) => dex.id === id) ?? dexes[0];
}

const FORM_DEX_IDS = new Set<string>(FORM_DEXES.map(([category]) => category));

/** Validates a stored selection; generation numbers are checked against the catalog by findDex. */
export function isDexId(value: unknown): value is DexId {
  return typeof value === 'string' && (value === 'global' || /^gen-\d+$/.test(value) || FORM_DEX_IDS.has(value));
}

/**
 * - `multiple`: at least one of the selected types;
 * - `double`: two types, both selected;
 * - `unique`: a single type, which is selected.
 */
export type TypeMatchMode = 'unique' | 'double' | 'multiple';

/**
 * One filter group. `included` keeps only matching entries (empty: no
 * constraint); `excluded` hides matching entries. A value is in at most one
 * of the two sets.
 */
export interface FilterGroup<T> {
  included: ReadonlySet<T>;
  excluded: ReadonlySet<T>;
}

export interface ListFilters {
  statuses: FilterGroup<ShinyStatus>;
  types: FilterGroup<PokemonType>;
  /** How included types are matched; excluded types hide any entry having one of them. */
  typeMode: TypeMatchMode;
  generations: FilterGroup<number>;
  categories: FilterGroup<EntryCategory>;
}

export type FilterGroupKey = 'statuses' | 'types' | 'generations' | 'categories';

const EMPTY_GROUP: FilterGroup<never> = { included: new Set(), excluded: new Set() };

export const EMPTY_FILTERS: ListFilters = {
  statuses: EMPTY_GROUP,
  types: EMPTY_GROUP,
  typeMode: 'multiple',
  generations: EMPTY_GROUP,
  categories: EMPTY_GROUP,
};

export const FILTER_GROUP_KEYS: readonly FilterGroupKey[] = ['statuses', 'types', 'generations', 'categories'];

export type FilterState = 'neutral' | 'included' | 'excluded';

export function filterState<T>(group: FilterGroup<T>, value: T): FilterState {
  if (group.included.has(value)) return 'included';
  if (group.excluded.has(value)) return 'excluded';
  return 'neutral';
}

/** Moves a value to the given state, removing it from the other set. */
export function withFilterState<T>(group: FilterGroup<T>, value: T, state: FilterState): FilterGroup<T> {
  const included = new Set(group.included);
  const excluded = new Set(group.excluded);
  included.delete(value);
  excluded.delete(value);
  if (state === 'included') included.add(value);
  if (state === 'excluded') excluded.add(value);
  return { included, excluded };
}

/** Tap: keep only these (or stop filtering on it). */
export function tapFilter<T>(group: FilterGroup<T>, value: T): FilterGroup<T> {
  return withFilterState(group, value, filterState(group, value) === 'neutral' ? 'included' : 'neutral');
}

/** Long press: hide these (or stop hiding them). */
export function longPressFilter<T>(group: FilterGroup<T>, value: T): FilterGroup<T> {
  return withFilterState(group, value, filterState(group, value) === 'excluded' ? 'neutral' : 'excluded');
}

function isGroupActive(group: FilterGroup<unknown>): boolean {
  return group.included.size > 0 || group.excluded.size > 0;
}

/** Number of filter groups in use, for the badge on the filter button. */
export function countActiveFilters(filters: ListFilters): number {
  return FILTER_GROUP_KEYS.filter((key) => isGroupActive(filters[key])).length;
}

function matchesIncludedTypes(entry: PokedexEntry, selected: ReadonlySet<PokemonType>, mode: TypeMatchMode): boolean {
  if (selected.size === 0) return true;
  switch (mode) {
    case 'unique':
      return entry.types.length === 1 && selected.has(entry.types[0]);
    case 'double':
      return entry.types.length === 2 && entry.types.every((type) => selected.has(type));
    case 'multiple':
      return entry.types.some((type) => selected.has(type));
  }
}

/** Lower case without accents, so "eclair" finds "Éclair" and "pecha" finds "Pêchaminus". */
export function normalizeSearchText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

/**
 * Matches the French or English name anywhere, or the National Pokédex
 * number when the query is a number ("25", "#025", "0025").
 */
export function matchesSearch(entry: PokedexEntry, rawQuery: string): boolean {
  const query = normalizeSearchText(rawQuery);
  if (query === '') return true;
  const number = /^#?0*(\d+)$/.exec(query);
  if (number) {
    return entry.dex === Number(number[1]);
  }
  return normalizeSearchText(entry.nameFr).includes(query) || normalizeSearchText(entry.nameEn).includes(query);
}

function matchesGroup<T>(group: FilterGroup<T>, value: T): boolean {
  return (group.included.size === 0 || group.included.has(value)) && !group.excluded.has(value);
}

/** Entries matching every filter group and the search text, in Pokédex order. */
export function applyFilters(
  entries: readonly PokedexEntry[],
  statuses: ReadonlyMap<string, ShinyStatus>,
  filters: ListFilters,
  search = '',
): PokedexEntry[] {
  const query = normalizeSearchText(search);
  return entries.filter(
    (entry) =>
      matchesGroup(filters.statuses, statuses.get(entry.id) ?? 'to-farm') &&
      matchesIncludedTypes(entry, filters.types.included, filters.typeMode) &&
      !entry.types.some((type) => filters.types.excluded.has(type)) &&
      matchesGroup(filters.generations, entry.generation) &&
      matchesGroup(filters.categories, entry.category) &&
      matchesSearch(entry, query),
  );
}

/** Picks a random entry still to farm, or null when everything is obtained or locked. */
export function pickRandomToFarm(
  entries: readonly PokedexEntry[],
  statuses: ReadonlyMap<string, ShinyStatus>,
  random: () => number = Math.random,
): PokedexEntry | null {
  const candidates = entries.filter((entry) => (statuses.get(entry.id) ?? 'to-farm') === 'to-farm');
  if (candidates.length === 0) return null;
  return candidates[Math.floor(random() * candidates.length)] ?? null;
}
