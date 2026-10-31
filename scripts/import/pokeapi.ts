import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseCsv } from './csv.ts';

/** PokéAPI language ids used by the import. */
const LANGUAGE_FR = '5';
const LANGUAGE_EN = '9';

export interface PokemonForm {
  /** Form identifier, e.g. `rattata-alola`, `unown-b`, `pyroar-female`. */
  identifier: string;
  /** Suffix part only (`alola`, `b`, `female`), empty for most default forms. */
  formIdentifier: string;
  /** The PokéAPI "pokemon" this form belongs to (stats, types, own sprite for non-cosmetic forms). */
  pokemonId: number;
  speciesId: number;
  isDefault: boolean;
  nameFr: string;
  nameEn: string;
  formNameFr: string;
}

export interface Species {
  id: number;
  identifier: string;
  generation: number;
  nameFr: string;
  nameEn: string;
  genusFr: string;
}

/** Indexed view of the PokéAPI CSV tables the import needs. */
export interface PokeApiData {
  speciesById: Map<number, Species>;
  speciesByIdentifier: Map<string, Species>;
  formsByIdentifier: Map<string, PokemonForm>;
  /** Default form of each species' default pokemon. */
  defaultFormBySpecies: Map<number, PokemonForm>;
  /** Type identifiers per pokemon id, primary type first. */
  typesByPokemonId: Map<number, string[]>;
}

export function loadPokeApiData(csvDirectory: string): PokeApiData {
  const read = (file: string) => parseCsv(readFileSync(join(csvDirectory, file), 'utf-8'));

  const speciesNames = new Map<string, { fr?: Record<string, string>; en?: Record<string, string> }>();
  for (const row of read('pokemon_species_names.csv')) {
    const entry = speciesNames.get(row.pokemon_species_id) ?? {};
    if (row.local_language_id === LANGUAGE_FR) entry.fr = row;
    if (row.local_language_id === LANGUAGE_EN) entry.en = row;
    speciesNames.set(row.pokemon_species_id, entry);
  }

  const speciesById = new Map<number, Species>();
  const speciesByIdentifier = new Map<string, Species>();
  for (const row of read('pokemon_species.csv')) {
    const names = speciesNames.get(row.id);
    const species: Species = {
      id: Number(row.id),
      identifier: row.identifier,
      generation: Number(row.generation_id),
      nameFr: names?.fr?.name ?? '',
      nameEn: names?.en?.name ?? row.identifier,
      genusFr: names?.fr?.genus ?? '',
    };
    speciesById.set(species.id, species);
    speciesByIdentifier.set(species.identifier, species);
  }

  const pokemonRows = read('pokemon.csv');
  const speciesIdByPokemonId = new Map(pokemonRows.map((row) => [Number(row.id), Number(row.species_id)]));
  const defaultPokemonBySpecies = new Map(
    pokemonRows.filter((row) => row.is_default === '1').map((row) => [Number(row.species_id), Number(row.id)]),
  );

  const formNames = new Map<string, { fr?: Record<string, string>; en?: Record<string, string> }>();
  for (const row of read('pokemon_form_names.csv')) {
    const entry = formNames.get(row.pokemon_form_id) ?? {};
    if (row.local_language_id === LANGUAGE_FR) entry.fr = row;
    if (row.local_language_id === LANGUAGE_EN) entry.en = row;
    formNames.set(row.pokemon_form_id, entry);
  }

  const formsByIdentifier = new Map<string, PokemonForm>();
  const defaultFormBySpecies = new Map<number, PokemonForm>();
  for (const row of read('pokemon_forms.csv')) {
    const pokemonId = Number(row.pokemon_id);
    const speciesId = speciesIdByPokemonId.get(pokemonId);
    if (speciesId === undefined) {
      continue;
    }
    const species = speciesById.get(speciesId);
    const names = formNames.get(row.id);
    const form: PokemonForm = {
      identifier: row.identifier,
      formIdentifier: row.form_identifier,
      pokemonId,
      speciesId,
      isDefault: row.is_default === '1',
      nameFr: names?.fr?.pokemon_name || species?.nameFr || '',
      nameEn: names?.en?.pokemon_name || species?.nameEn || row.identifier,
      formNameFr: names?.fr?.form_name ?? '',
    };
    formsByIdentifier.set(form.identifier, form);
    if (form.isDefault && defaultPokemonBySpecies.get(speciesId) === pokemonId) {
      defaultFormBySpecies.set(speciesId, form);
    }
  }

  const typeIdentifiers = new Map(read('types.csv').map((row) => [row.id, row.identifier]));
  const typesByPokemonId = new Map<number, string[]>();
  const typeRows = read('pokemon_types.csv').sort((a, b) => Number(a.slot) - Number(b.slot));
  for (const row of typeRows) {
    const pokemonId = Number(row.pokemon_id);
    const types = typesByPokemonId.get(pokemonId) ?? [];
    types.push(typeIdentifiers.get(row.type_id) ?? row.type_id);
    typesByPokemonId.set(pokemonId, types);
  }

  return { speciesById, speciesByIdentifier, formsByIdentifier, defaultFormBySpecies, typesByPokemonId };
}
