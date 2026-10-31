import type { AddedEntry, PokemonType } from '../pokedex/model';

/**
 * Reads species released after the bundled data from PokéAPI, which the
 * browser can query directly (it allows cross-origin requests).
 */

const API_ROOT = 'https://pokeapi.co/api/v2';

const POKEMON_TYPES: ReadonlySet<string> = new Set<PokemonType>([
  'normal', 'fighting', 'flying', 'poison', 'ground', 'rock', 'bug', 'ghost', 'steel',
  'fire', 'water', 'grass', 'electric', 'psychic', 'ice', 'dragon', 'dark', 'fairy',
]);

const ROMAN_VALUES: Record<string, number> = { i: 1, v: 5, x: 10 };

/** Only the fields we read from /pokemon-species/{dex}. */
export interface SpeciesResponse {
  id: number;
  name: string;
  names: Array<{ name: string; language: { name: string } }>;
  genera: Array<{ genus: string; language: { name: string } }>;
  generation: { name: string };
  varieties: Array<{ is_default: boolean; pokemon: { name: string } }>;
}

/** Only the fields we read from /pokemon/{name}. */
export interface PokemonResponse {
  name: string;
  types: Array<{ slot: number; type: { name: string } }>;
  sprites: { other?: { home?: { front_default: string | null; front_shiny: string | null } } };
}

export type FetchJson = <T>(url: string) => Promise<T>;

export const fetchJson: FetchJson = async <T,>(url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`PokéAPI a répondu ${response.status} pour ${url}.`);
  }
  return (await response.json()) as T;
};

/** "generation-ix" → 9. */
export function parseGeneration(name: string): number {
  const roman = name.replace(/^generation-/, '');
  let total = 0;
  for (let index = 0; index < roman.length; index += 1) {
    const value = ROMAN_VALUES[roman[index]];
    const next = ROMAN_VALUES[roman[index + 1]] ?? 0;
    if (value === undefined) throw new Error(`Génération inconnue : ${name}.`);
    total += value < next ? -value : value;
  }
  return total;
}

function localized<T extends { language: { name: string } }>(items: T[], language: string): T | undefined {
  return items.find((item) => item.language.name === language);
}

/** Maps PokéAPI's answers to an entry; missing French texts stay empty until a later check. */
export function toAddedEntry(species: SpeciesResponse, pokemon: PokemonResponse): AddedEntry {
  const types = [...pokemon.types]
    .sort((a, b) => a.slot - b.slot)
    .map((item) => item.type.name)
    .filter((type): type is PokemonType => POKEMON_TYPES.has(type));
  if (types.length === 0) {
    throw new Error(`Aucun type connu pour ${pokemon.name}.`);
  }
  if (!/^[a-z0-9-]+$/.test(pokemon.name)) {
    throw new Error(`Identifiant inattendu : ${pokemon.name}.`);
  }
  const home = pokemon.sprites.other?.home;
  return {
    id: pokemon.name,
    dex: species.id,
    nameFr: localized(species.names, 'fr')?.name ?? '',
    nameEn: localized(species.names, 'en')?.name ?? species.name,
    genusFr: localized(species.genera, 'fr')?.genus ?? '',
    generation: parseGeneration(species.generation.name),
    category: 'national',
    types: types.slice(0, 2),
    spriteUrls: { normal: home?.front_default ?? null, shiny: home?.front_shiny ?? null },
  };
}

/** Number of species PokéAPI knows; species are numbered 1…count without gaps. */
export async function fetchSpeciesCount(fetchFn: FetchJson = fetchJson): Promise<number> {
  const { count } = await fetchFn<{ count: number }>(`${API_ROOT}/pokemon-species?limit=1`);
  return count;
}

export async function fetchSpecies(dex: number, fetchFn: FetchJson = fetchJson): Promise<AddedEntry> {
  const species = await fetchFn<SpeciesResponse>(`${API_ROOT}/pokemon-species/${dex}`);
  const variety = species.varieties.find((item) => item.is_default) ?? species.varieties[0];
  if (!variety) {
    throw new Error(`Aucune forme par défaut pour l'espèce ${dex}.`);
  }
  const pokemon = await fetchFn<PokemonResponse>(`${API_ROOT}/pokemon/${variety.pokemon.name}`);
  return toAddedEntry(species, pokemon);
}

/** True while PokéAPI still lacks something it usually publishes later. */
export function isIncomplete(entry: AddedEntry): boolean {
  return entry.nameFr === '' || entry.genusFr === '' || entry.spriteUrls.normal === null || entry.spriteUrls.shiny === null;
}
