/**
 * Domain model of the Pokédex, shared by the app and by the import scripts
 * that generate `src/data/pokedex.json`. Keep this file free of browser or
 * Node.js specifics.
 */

export type ShinyStatus = 'obtained' | 'to-farm' | 'locked';

export const SHINY_STATUSES: readonly ShinyStatus[] = ['obtained', 'to-farm', 'locked'];

/**
 * Which list an entry belongs to. `national` is the one-per-species National
 * Pokédex; every other value is a form tracked in addition to its species.
 */
export type EntryCategory = 'national' | 'alola' | 'galar' | 'hisui' | 'paldea' | 'unown' | 'alternate';

/** Display order of categories when forms follow their base species. */
export const ENTRY_CATEGORIES: readonly EntryCategory[] = [
  'national',
  'alola',
  'galar',
  'hisui',
  'paldea',
  'unown',
  'alternate',
];

/** PokéAPI type identifiers; French labels and colours live in the UI layer. */
export type PokemonType =
  | 'normal'
  | 'fighting'
  | 'flying'
  | 'poison'
  | 'ground'
  | 'rock'
  | 'bug'
  | 'ghost'
  | 'steel'
  | 'fire'
  | 'water'
  | 'grass'
  | 'electric'
  | 'psychic'
  | 'ice'
  | 'dragon'
  | 'dark'
  | 'fairy';

export interface PokedexEntry {
  /**
   * Stable identifier, also the sprite file name: the PokéAPI form identifier
   * (`rattata-alola`, `unown-b`), suffixed with `-female` for gender variants
   * that PokéAPI does not model as forms (`combee-female`).
   */
  id: string;
  /** National Pokédex number of the species. */
  dex: number;
  nameFr: string;
  nameEn: string;
  /** French species category, e.g. "Pokémon Graine". Empty when PokéAPI has none yet. */
  genusFr: string;
  /** Generation that introduced the species (1–9 in the bundled data, higher for later additions). */
  generation: number;
  category: EntryCategory;
  /** One or two types, primary first. */
  types: PokemonType[];
}

/**
 * A species released after the bundled data was generated, added from
 * PokéAPI from within the app. Its sprites are remote HOME images rather than
 * bundled files; null while PokéAPI has none yet.
 */
export interface AddedEntry extends PokedexEntry {
  spriteUrls: { normal: string | null; shiny: string | null };
}

export type StatusMap = Record<string, ShinyStatus>;
