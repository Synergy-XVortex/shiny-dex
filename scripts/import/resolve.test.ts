import { describe, expect, it } from 'vitest';
import { parseCsv } from './csv.ts';
import type { PokeApiData, PokemonForm, Species } from './pokeapi.ts';
import { entryIdFor, normalizeCode, resolveSheetRow } from './resolve.ts';
import { resolveSpriteSource } from './sprites.ts';

function species(id: number, identifier: string): Species {
  return { id, identifier, generation: 1, nameFr: identifier, nameEn: identifier, genusFr: '' };
}

function form(identifier: string, speciesId: number, pokemonId: number, formIdentifier = '', isDefault = true): PokemonForm {
  return { identifier, formIdentifier, pokemonId, speciesId, isDefault, nameFr: '', nameEn: '', formNameFr: '' };
}

/** A tiny slice of PokéAPI covering each resolution rule. */
function buildData(): PokeApiData {
  const speciesList = [
    species(19, 'rattata'),
    species(128, 'tauros'),
    species(201, 'unown'),
    species(415, 'combee'),
    species(668, 'pyroar'),
    species(774, 'minior'),
    species(916, 'oinkologne'),
  ];
  const forms = [
    form('rattata', 19, 19),
    form('rattata-alola', 19, 10091, 'alola'),
    form('tauros', 128, 128),
    form('tauros-paldea-blaze-breed', 128, 10251, 'paldea-blaze-breed'),
    form('unown', 201, 201, 'a'),
    form('unown-exclamation', 201, 201, 'exclamation', false),
    form('combee', 415, 415),
    form('pyroar-male', 668, 668, 'male'),
    form('pyroar-female', 668, 668, 'female', false),
    form('minior-red-meteor', 774, 774, 'red-meteor'),
    form('minior-orange', 774, 10137, 'orange'),
    form('oinkologne-male', 916, 916, 'male'),
    form('oinkologne-female', 916, 10254, 'female'),
  ];
  return {
    speciesById: new Map(speciesList.map((entry) => [entry.id, entry])),
    speciesByIdentifier: new Map(speciesList.map((entry) => [entry.identifier, entry])),
    formsByIdentifier: new Map(forms.map((entry) => [entry.identifier, entry])),
    defaultFormBySpecies: new Map(
      forms
        .filter((entry) => entry.isDefault && entry.pokemonId === entry.speciesId)
        .map((entry) => [entry.speciesId, entry]),
    ),
    typesByPokemonId: new Map(),
  };
}

describe('normalizeCode', () => {
  it('converts pokemondb regional suffixes to PokéAPI ones', () => {
    expect(normalizeCode('Rattata-Alolan')).toBe('rattata-alola');
    expect(normalizeCode('Darmanitan-Galarian-Standard')).toBe('darmanitan-galar-standard');
    expect(normalizeCode('Wooper-Paldean')).toBe('wooper-paldea');
  });

  it('applies the documented aliases and patterns', () => {
    expect(normalizeCode('Unown-Em')).toBe('unown-exclamation');
    expect(normalizeCode('Minior-Orange-Core')).toBe('minior-orange');
    expect(normalizeCode('Alcremie-love')).toBe('alcremie-vanilla-cream-love-sweet');
  });
});

describe('resolveSheetRow', () => {
  const data = buildData();

  it('matches a regional form by its code', () => {
    const resolved = resolveSheetRow({ dex: 19, nameFr: 'Rattata', code: 'Rattata-Alolan' }, data);
    expect(resolved?.form.identifier).toBe('rattata-alola');
  });

  it('tells apart rows that share a code by their French name', () => {
    const resolved = resolveSheetRow({ dex: 128, nameFr: 'Tauros (Feu)', code: 'Tauros-Paldean' }, data);
    expect(resolved?.form.identifier).toBe('tauros-paldea-blaze-breed');
  });

  it('maps a bare species name to its default form', () => {
    const resolved = resolveSheetRow({ dex: 916, nameFr: 'Fragroin Mâle', code: 'Oinkologne' }, data);
    expect(resolved?.form.identifier).toBe('oinkologne-male');
  });

  it('prefers a real female form when PokéAPI has one', () => {
    const resolved = resolveSheetRow({ dex: 668, nameFr: 'Némelios Femelle', code: 'Pyroar-F' }, data);
    expect(resolved).toMatchObject({ form: { identifier: 'pyroar-female' }, isGenderVariant: false });
  });

  it('falls back to a gender variant of the default form otherwise', () => {
    const resolved = resolveSheetRow({ dex: 415, nameFr: 'Apitrini Femelle', code: 'Combee-f' }, data);
    expect(resolved).toMatchObject({ form: { identifier: 'combee' }, isGenderVariant: true });
    expect(resolved && entryIdFor(resolved)).toBe('combee-female');
  });

  it('rejects a code that belongs to another species', () => {
    expect(resolveSheetRow({ dex: 20, nameFr: 'Rattatac', code: 'Rattata-Alolan' }, data)).toBeNull();
  });

  it('returns null for an unknown code', () => {
    expect(resolveSheetRow({ dex: 19, nameFr: 'Rattata', code: 'Rattata-Plaid' }, data)).toBeNull();
  });
});

describe('resolveSpriteSource', () => {
  const data = buildData();
  const files = new Set([
    '19.png', 'shiny/19.png', '10091.png', 'shiny/10091.png',
    '201.png', 'shiny/201.png', '201-exclamation.png', 'shiny/201-exclamation.png',
    '415.png', 'shiny/415.png', 'female/415.png', 'shiny/female/415.png',
    '774.png', 'shiny/774.png', '10254.png',
  ]);
  const spriteFor = (dex: number, code: string, nameFr = '') => {
    const resolved = resolveSheetRow({ dex, nameFr, code }, data);
    if (!resolved) throw new Error(`Fixture does not resolve ${code}`);
    return resolveSpriteSource(resolved, files);
  };

  it('uses the pokemon sprite for non-cosmetic forms', () => {
    expect(spriteFor(19, 'Rattata-Alolan')).toEqual({ normal: '10091.png', shiny: 'shiny/10091.png', exact: true });
  });

  it('uses the species-form sprite for cosmetic forms', () => {
    expect(spriteFor(201, 'Unown-Em').normal).toBe('201-exclamation.png');
  });

  it('uses the female folder for gender variants', () => {
    expect(spriteFor(415, 'Combee-f').normal).toBe('female/415.png');
  });

  it('falls back to the species sprite when the form has no complete pair', () => {
    // 10254.png exists but its shiny does not, so the pair is incomplete.
    expect(spriteFor(916, 'Oinkologne-Female')).toEqual({ normal: '916.png', shiny: 'shiny/916.png', exact: false });
  });
});

describe('parseCsv', () => {
  it('handles quoted fields with commas, quotes and newlines', () => {
    const rows = parseCsv('id,name,genus\r\n1,"Mr. ""Mime""","Barrier, Pokémon"\n2,"Line\nbreak",\n');
    expect(rows).toEqual([
      { id: '1', name: 'Mr. "Mime"', genus: 'Barrier, Pokémon' },
      { id: '2', name: 'Line\nbreak', genus: '' },
    ]);
  });
});
