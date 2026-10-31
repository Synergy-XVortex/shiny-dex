import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { AddedEntry } from '../pokedex/model';
import { ShinyDexDatabase } from '../pokedex/statusDb';
import type { AddedEntriesStore } from './addedEntriesStore';
import { addSpecies, checkSpeciesCount, completeAddedEntries, pullAddedEntries, META_POKEAPI_SPECIES_COUNT } from './newSpecies';
import { parseGeneration, toAddedEntry, type FetchJson, type PokemonResponse, type SpeciesResponse } from './pokeApi';

class FakeStore implements AddedEntriesStore {
  rows = new Map<string, AddedEntry>();
  async fetchAll() {
    return [...this.rows.values()];
  }
  async upsert(entries: readonly AddedEntry[]) {
    for (const entry of entries) this.rows.set(entry.id, structuredClone(entry));
  }
}

function species(dex: number, name: string, options: { fr?: boolean } = {}): SpeciesResponse {
  const { fr = true } = options;
  return {
    id: dex,
    name,
    names: [
      { name: name[0].toUpperCase() + name.slice(1), language: { name: 'en' } },
      ...(fr ? [{ name: `${name}-fr`, language: { name: 'fr' } }] : []),
    ],
    genera: fr ? [{ genus: 'Pokémon Test', language: { name: 'fr' } }] : [],
    generation: { name: 'generation-x' },
    varieties: [{ is_default: true, pokemon: { name } }],
  };
}

function pokemon(name: string, options: { sprites?: boolean } = {}): PokemonResponse {
  const { sprites = true } = options;
  return {
    name,
    types: [
      { slot: 2, type: { name: 'flying' } },
      { slot: 1, type: { name: 'fire' } },
    ],
    sprites: {
      other: {
        home: sprites
          ? { front_default: `https://img.test/${name}.png`, front_shiny: `https://img.test/shiny/${name}.png` }
          : { front_default: null, front_shiny: null },
      },
    },
  };
}

/** Fake PokéAPI: the answers per URL path, editable between calls. */
function fakeApi(responses: Record<string, unknown>): { fetchFn: FetchJson; responses: Record<string, unknown> } {
  const fetchFn: FetchJson = async <T,>(url: string) => {
    const path = url.replace('https://pokeapi.co/api/v2/', '');
    if (!(path in responses)) throw new Error(`Réseau indisponible pour ${path}`);
    return structuredClone(responses[path]) as T;
  };
  return { fetchFn, responses };
}

let database: ShinyDexDatabase;
let store: FakeStore;

beforeEach(() => {
  database = new ShinyDexDatabase(`new-species-${crypto.randomUUID()}`);
  store = new FakeStore();
});

afterEach(async () => {
  await database.delete();
});

describe('PokéAPI mapping', () => {
  it('reads names, generation, ordered types and HOME sprites', () => {
    expect(toAddedEntry(species(1026, 'newmon'), pokemon('newmon'))).toEqual({
      id: 'newmon',
      dex: 1026,
      nameFr: 'newmon-fr',
      nameEn: 'Newmon',
      genusFr: 'Pokémon Test',
      generation: 10,
      category: 'national',
      types: ['fire', 'flying'],
      spriteUrls: { normal: 'https://img.test/newmon.png', shiny: 'https://img.test/shiny/newmon.png' },
    });
  });

  it('parses generation names', () => {
    expect([parseGeneration('generation-i'), parseGeneration('generation-iv'), parseGeneration('generation-ix')]).toEqual([1, 4, 9]);
    expect(parseGeneration('generation-xii')).toBe(12);
  });
});

describe('new species', () => {
  it('remembers how many species PokéAPI knows', async () => {
    const { fetchFn } = fakeApi({ 'pokemon-species?limit=1': { count: 1027 } });
    expect(await checkSpeciesCount(database, fetchFn)).toBe(1027);
    expect((await database.meta.get(META_POKEAPI_SPECIES_COUNT))?.value).toBe(1027);
  });

  it('adds species online and locally, as "à farm" queued for sync', async () => {
    const { fetchFn } = fakeApi({
      'pokemon-species/1026': species(1026, 'newmon'),
      'pokemon/newmon': pokemon('newmon'),
      'pokemon-species/1027': species(1027, 'othermon'),
      'pokemon/othermon': pokemon('othermon'),
    });
    const progress: number[] = [];
    await addSpecies(database, store, { fromDex: 1026, toDex: 1027 }, { fetchFn, onProgress: ({ done }) => progress.push(done) });

    expect(progress).toEqual([1, 2]);
    expect([...store.rows.keys()]).toEqual(['newmon', 'othermon']);
    expect(await database.addedEntries.count()).toBe(2);
    expect((await database.statuses.get('newmon'))?.status).toBe('to-farm');
    expect(await database.pendingChanges.get('othermon')).toBeDefined();
  });

  it('adds nothing when PokéAPI fails half-way', async () => {
    const { fetchFn } = fakeApi({
      'pokemon-species/1026': species(1026, 'newmon'),
      'pokemon/newmon': pokemon('newmon'),
    });
    await expect(addSpecies(database, store, { fromDex: 1026, toDex: 1027 }, { fetchFn })).rejects.toThrow();
    expect(store.rows.size).toBe(0);
    expect(await database.addedEntries.count()).toBe(0);
  });

  it('keeps a status another device already set', async () => {
    await database.statuses.put({ id: 'newmon', status: 'obtained', updatedAt: 5 });
    const { fetchFn } = fakeApi({ 'pokemon-species/1026': species(1026, 'newmon'), 'pokemon/newmon': pokemon('newmon') });
    await addSpecies(database, store, { fromDex: 1026, toDex: 1026 }, { fetchFn });
    expect((await database.statuses.get('newmon'))?.status).toBe('obtained');
  });

  it('completes French texts and sprites once PokéAPI publishes them', async () => {
    const { fetchFn, responses } = fakeApi({
      'pokemon-species/1026': species(1026, 'newmon', { fr: false }),
      'pokemon/newmon': pokemon('newmon', { sprites: false }),
    });
    await addSpecies(database, store, { fromDex: 1026, toDex: 1026 }, { fetchFn });
    expect(await completeAddedEntries(database, store, fetchFn)).toBe(0);

    responses['pokemon-species/1026'] = species(1026, 'newmon');
    responses['pokemon/newmon'] = pokemon('newmon');
    expect(await completeAddedEntries(database, store, fetchFn)).toBe(1);
    expect((await database.addedEntries.get('newmon'))?.nameFr).toBe('newmon-fr');
    expect(store.rows.get('newmon')?.spriteUrls.shiny).toBe('https://img.test/shiny/newmon.png');
  });

  it('copies species added from another device', async () => {
    const { fetchFn } = fakeApi({ 'pokemon-species/1026': species(1026, 'newmon'), 'pokemon/newmon': pokemon('newmon') });
    await addSpecies(new ShinyDexDatabase(`other-${crypto.randomUUID()}`), store, { fromDex: 1026, toDex: 1026 }, { fetchFn });

    await pullAddedEntries(database, store);
    expect((await database.addedEntries.toArray()).map((entry) => entry.id)).toEqual(['newmon']);
  });
});
