import { describe, expect, it } from 'vitest';
import { BUNDLED_CATALOG, BUNDLED_ENTRIES, INITIAL_STATUSES, buildCatalog, countStatuses } from './catalog';
import {
  EMPTY_FILTERS,
  applyFilters,
  countActiveFilters,
  isDexId,
  matchesSearch,
  pickRandomToFarm,
  longPressFilter,
  tapFilter,
  type ListFilters,
} from './listQuery';
import type { AddedEntry, PokedexEntry, ShinyStatus } from './model';

const statuses = new Map(Object.entries(INITIAL_STATUSES)) as Map<string, ShinyStatus>;
const byId = (id: string) => BUNDLED_ENTRIES.find((entry) => entry.id === id) as PokedexEntry;
const filters = (patch: Partial<ListFilters>): ListFilters => ({ ...EMPTY_FILTERS, ...patch });
/** A filter group keeping only the given values. */
const only = <T,>(...values: T[]) => ({ included: new Set(values), excluded: new Set<T>() });
/** A filter group hiding the given values. */
const hide = <T,>(...values: T[]) => ({ included: new Set<T>(), excluded: new Set(values) });

describe('dexes', () => {
  it('reproduce the totals of the Sheet tabs', () => {
    const totals = (id: Parameters<typeof BUNDLED_CATALOG.getDex>[0]) =>
      countStatuses(BUNDLED_ENTRIES.filter(BUNDLED_CATALOG.getDex(id).includes), statuses);
    expect(totals('gen-5')).toEqual({ total: 156, obtained: 117, toFarm: 38, locked: 1 });
    expect(totals('gen-9')).toEqual({ total: 120, obtained: 108, toFarm: 0, locked: 12 });
    expect(totals('unown')).toEqual({ total: 27, obtained: 9, toFarm: 18, locked: 0 });
    expect(totals('alternate')).toEqual({ total: 111, obtained: 82, toFarm: 28, locked: 1 });
    expect(totals('global').total).toBe(1220);
  });

  it('accept stored generation ids even before the catalog has that generation', () => {
    expect(isDexId('gen-10')).toBe(true);
    expect(isDexId('alola')).toBe(true);
    expect(isDexId('mega')).toBe(false);
    expect(BUNDLED_CATALOG.getDex('gen-10').id).toBe('global');
  });
});

describe('catalog with added species', () => {
  const added: AddedEntry = {
    id: 'newmon',
    dex: 1026,
    nameFr: 'Nouveaumon',
    nameEn: 'Newmon',
    genusFr: '',
    generation: 10,
    category: 'national',
    types: ['fire'],
    spriteUrls: { normal: 'https://example.test/newmon.png', shiny: null },
  };
  const catalog = buildCatalog([added]);

  it('appends them after the bundled entries, with a Pokédex for their generation', () => {
    expect(catalog.entries).toHaveLength(1221);
    expect(catalog.entries.at(-1)?.id).toBe('newmon');
    expect(catalog.maxDex).toBe(1026);
    expect(catalog.getNeighbours('newmon').previous?.id).toBe(BUNDLED_ENTRIES.at(-1)?.id);
    expect(catalog.getDex('gen-10').label).toBe('Génération X');
    expect(catalog.entries.filter(catalog.getDex('gen-10').includes)).toEqual([added]);
  });

  it('uses their remote sprites, or none when PokéAPI has none yet', () => {
    expect(catalog.spriteSrc('newmon', 'normal')).toBe('https://example.test/newmon.png');
    expect(catalog.spriteSrc('newmon', 'shiny')).toBeNull();
    expect(catalog.spriteSrc('bulbasaur', 'shiny')).toMatch(/\/sprites\/shiny\/bulbasaur\.webp$/);
  });

  it('ignores an added species once the bundled data contains it', () => {
    expect(buildCatalog([{ ...added, id: 'bulbasaur', dex: 1 }]).entries).toHaveLength(1220);
  });
});

describe('applyFilters', () => {
  it('keeps everything without filters', () => {
    expect(applyFilters(BUNDLED_ENTRIES, statuses, EMPTY_FILTERS)).toHaveLength(1220);
  });

  it('filters by status', () => {
    expect(applyFilters(BUNDLED_ENTRIES, statuses, filters({ statuses: only('locked') }))).toHaveLength(25);
  });

  it('applies the three type modes', () => {
    const fireOrFlying = only<'fire' | 'flying'>('fire', 'flying');
    const ids = (mode: ListFilters['typeMode']) =>
      new Set(applyFilters(BUNDLED_ENTRIES, statuses, filters({ types: fireOrFlying, typeMode: mode })).map((entry) => entry.id));

    expect(ids('multiple').has('charmander')).toBe(true); // Fire only
    expect(ids('multiple').has('pidgey')).toBe(true); // Normal/Flying
    expect(ids('unique').has('charmander')).toBe(true);
    expect(ids('unique').has('charizard')).toBe(false); // Fire/Flying has two types
    expect(ids('double').has('charizard')).toBe(true);
    expect(ids('double').has('pidgey')).toBe(false); // Normal is not selected
  });

  it('combines filter groups', () => {
    const result = applyFilters(
      BUNDLED_ENTRIES,
      statuses,
      filters({ statuses: only('to-farm'), generations: only(3), categories: only('national') }),
    );
    expect(result).toHaveLength(20);
    expect(countActiveFilters(filters({ statuses: only('to-farm'), generations: hide(3) }))).toBe(2);
  });

  it('hides excluded values, including entries whose second type is excluded', () => {
    expect(applyFilters(BUNDLED_ENTRIES, statuses, filters({ statuses: hide('obtained') }))).toHaveLength(187);
    const withoutFlying = applyFilters(BUNDLED_ENTRIES, statuses, filters({ types: hide('flying') })).map((entry) => entry.id);
    expect(withoutFlying).toContain('charmander');
    expect(withoutFlying).not.toContain('charizard'); // Fire/Flying
    const gen1WithoutRegional = applyFilters(
      BUNDLED_ENTRIES,
      statuses,
      filters({ generations: only(1), categories: hide('alola', 'galar') }),
    );
    expect(gen1WithoutRegional.some((entry) => entry.category === 'alola')).toBe(false);
  });

  it('narrows the list with the search text, keeping the Pokédex order', () => {
    const results = applyFilters(BUNDLED_ENTRIES, statuses, EMPTY_FILTERS, 'eau').map((entry) => entry.dex);
    expect(results.length).toBeGreaterThan(1);
    expect(results).toEqual([...results].sort((a, b) => a - b));
    expect(applyFilters(BUNDLED_ENTRIES, statuses, filters({ generations: only(1) }), '25').map((entry) => entry.id)).toEqual(['pikachu']);
  });
});

describe('filter taps', () => {
  it('cycle between kept, neutral and hidden', () => {
    const empty = only<string>();
    const kept = tapFilter(empty, 'fire');
    expect([...kept.included]).toEqual(['fire']);
    expect(tapFilter(kept, 'fire').included.size).toBe(0);

    const hidden = longPressFilter(kept, 'fire');
    expect([...hidden.excluded]).toEqual(['fire']);
    expect(hidden.included.size).toBe(0);
    expect(tapFilter(hidden, 'fire').excluded.size).toBe(0);
    expect(longPressFilter(hidden, 'fire').excluded.size).toBe(0);
  });
});

describe('matchesSearch', () => {
  it('matches names regardless of accents and case', () => {
    expect(matchesSearch(byId('pecharunt'), 'pecha')).toBe(true);
    expect(matchesSearch(byId('pecharunt'), 'PÊCHA')).toBe(true);
    expect(matchesSearch(byId('bulbasaur'), 'bulba')).toBe(true); // English name
  });

  it('matches the national number in any format', () => {
    expect(matchesSearch(byId('pikachu'), '25')).toBe(true);
    expect(matchesSearch(byId('pikachu'), '#025')).toBe(true);
    expect(matchesSearch(byId('raichu'), '25')).toBe(false);
  });
});

describe('pickRandomToFarm', () => {
  it('only draws entries still to farm', () => {
    const entry = pickRandomToFarm(BUNDLED_ENTRIES, statuses, () => 0.5);
    expect(entry && statuses.get(entry.id)).toBe('to-farm');
  });

  it('returns null when nothing is left to farm', () => {
    expect(pickRandomToFarm([byId('bulbasaur')], statuses)).toBeNull();
  });
});
