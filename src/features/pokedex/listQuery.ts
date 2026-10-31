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

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];

export const GENERATION_NUMBERS = ROMAN.map((_, index) => index + 1);

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
 * Generation Pokédexes hold the national entries of that generation only,
 * like the Sheet's generation tabs; forms have their own Pokédexes.
 */
export const DEXES: readonly DexDefinition[] = [
  { id: 'global', label: 'Pokédex global', shortLabel: 'Global', includes: () => true },
  ...GENERATION_NUMBERS.map<DexDefinition>((generation) => ({
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

const DEX_BY_ID = new Map(DEXES.map((dex) => [dex.id, dex]));

export function getDex(id: DexId): DexDefinition {
  return DEX_BY_ID.get(id) ?? DEXES[0];
}

export function isDexId(value: unknown): value is DexId {
  return typeof value === 'string' && DEX_BY_ID.has(value as DexId);
}

/**
 * - `multiple`: at least one of the selected types;
 * - `double`: two types, both selected;
 * - `unique`: a single type, which is selected.
 */
export type TypeMatchMode = 'unique' | 'double' | 'multiple';

export interface ListFilters {
  statuses: ReadonlySet<ShinyStatus>;
  types: ReadonlySet<PokemonType>;
  typeMode: TypeMatchMode;
  generations: ReadonlySet<number>;
  categories: ReadonlySet<EntryCategory>;
}

export const EMPTY_FILTERS: ListFilters = {
  statuses: new Set(),
  types: new Set(),
  typeMode: 'multiple',
  generations: new Set(),
  categories: new Set(),
};

/** Number of filter groups in use, for the badge on the list. */
export function countActiveFilters(filters: ListFilters): number {
  return [filters.statuses, filters.types, filters.generations, filters.categories].filter((set) => set.size > 0).length;
}

function matchesTypes(entry: PokedexEntry, selected: ReadonlySet<PokemonType>, mode: TypeMatchMode): boolean {
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

/**
 * Search results, best matches first: names starting with the query, then
 * names containing it. Within each group the Pokédex order is kept.
 */
export function searchEntries(entries: readonly PokedexEntry[], rawQuery: string): PokedexEntry[] {
  const query = normalizeSearchText(rawQuery);
  if (query === '') return [];
  const matches = entries.filter((entry) => matchesSearch(entry, query));
  const startsWithQuery = (entry: PokedexEntry) =>
    normalizeSearchText(entry.nameFr).startsWith(query) || normalizeSearchText(entry.nameEn).startsWith(query);
  return [...matches.filter(startsWithQuery), ...matches.filter((entry) => !startsWithQuery(entry))];
}

export function applyFilters(
  entries: readonly PokedexEntry[],
  statuses: ReadonlyMap<string, ShinyStatus>,
  filters: ListFilters,
): PokedexEntry[] {
  return entries.filter(
    (entry) =>
      (filters.statuses.size === 0 || filters.statuses.has(statuses.get(entry.id) ?? 'to-farm')) &&
      matchesTypes(entry, filters.types, filters.typeMode) &&
      (filters.generations.size === 0 || filters.generations.has(entry.generation)) &&
      (filters.categories.size === 0 || filters.categories.has(entry.category)),
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
