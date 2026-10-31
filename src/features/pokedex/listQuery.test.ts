import { describe, expect, it } from 'vitest';
import { ENTRIES, INITIAL_STATUSES, countStatuses } from './catalog';
import {
  EMPTY_FILTERS,
  applyFilters,
  countActiveFilters,
  getDex,
  matchesSearch,
  pickRandomToFarm,
  searchEntries,
  type ListFilters,
} from './listQuery';
import type { PokedexEntry, ShinyStatus } from './model';

const statuses = new Map(Object.entries(INITIAL_STATUSES)) as Map<string, ShinyStatus>;
const byId = (id: string) => ENTRIES.find((entry) => entry.id === id) as PokedexEntry;
const filters = (patch: Partial<ListFilters>): ListFilters => ({ ...EMPTY_FILTERS, ...patch });

describe('dexes', () => {
  it('reproduce the totals of the Sheet tabs', () => {
    const totals = (id: Parameters<typeof getDex>[0]) =>
      countStatuses(ENTRIES.filter(getDex(id).includes), statuses);
    expect(totals('gen-5')).toEqual({ total: 156, obtained: 117, toFarm: 38, locked: 1 });
    expect(totals('gen-9')).toEqual({ total: 120, obtained: 108, toFarm: 0, locked: 12 });
    expect(totals('unown')).toEqual({ total: 27, obtained: 9, toFarm: 18, locked: 0 });
    expect(totals('alternate')).toEqual({ total: 111, obtained: 82, toFarm: 28, locked: 1 });
    expect(totals('global').total).toBe(1220);
  });
});

describe('applyFilters', () => {
  it('keeps everything without filters', () => {
    expect(applyFilters(ENTRIES, statuses, EMPTY_FILTERS)).toHaveLength(1220);
  });

  it('filters by status', () => {
    expect(applyFilters(ENTRIES, statuses, filters({ statuses: new Set(['locked']) }))).toHaveLength(25);
  });

  it('applies the three type modes', () => {
    const fireOrFlying = new Set(['fire', 'flying'] as const);
    const ids = (mode: ListFilters['typeMode']) =>
      new Set(applyFilters(ENTRIES, statuses, filters({ types: fireOrFlying, typeMode: mode })).map((entry) => entry.id));

    expect(ids('multiple').has('charmander')).toBe(true); // Fire only
    expect(ids('multiple').has('pidgey')).toBe(true); // Normal/Flying
    expect(ids('unique').has('charmander')).toBe(true);
    expect(ids('unique').has('charizard')).toBe(false); // Fire/Flying has two types
    expect(ids('double').has('charizard')).toBe(true);
    expect(ids('double').has('pidgey')).toBe(false); // Normal is not selected
  });

  it('combines filter groups', () => {
    const result = applyFilters(
      ENTRIES,
      statuses,
      filters({ statuses: new Set(['to-farm']), generations: new Set([3]), categories: new Set(['national']) }),
    );
    expect(result).toHaveLength(20);
    expect(countActiveFilters(filters({ statuses: new Set(['to-farm']), generations: new Set([3]) }))).toBe(2);
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

describe('searchEntries', () => {
  it('lists names starting with the query before names containing it', () => {
    const results = searchEntries(ENTRIES, 'sabl');
    const names = results.map((entry) => entry.nameFr);
    // Names starting with the query come first; names only containing it ("Tauros (Eau)") follow.
    expect(names[0]).toBe('Sablaireau');
    const firstContaining = searchEntries(ENTRIES, 'eau').findIndex((entry) => !entry.nameFr.toLowerCase().startsWith('eau'));
    const lastStarting = searchEntries(ENTRIES, 'eau').findLastIndex((entry) => entry.nameFr.toLowerCase().startsWith('eau'));
    expect(lastStarting).toBeLessThan(firstContaining);
    expect(searchEntries(ENTRIES, '  ')).toEqual([]);
  });
});

describe('pickRandomToFarm', () => {
  it('only draws entries still to farm', () => {
    const entry = pickRandomToFarm(ENTRIES, statuses, () => 0.5);
    expect(entry && statuses.get(entry.id)).toBe('to-farm');
  });

  it('returns null when nothing is left to farm', () => {
    expect(pickRandomToFarm([byId('bulbasaur')], statuses)).toBeNull();
  });
});
