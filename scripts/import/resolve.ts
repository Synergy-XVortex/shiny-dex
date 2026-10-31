import type { PokeApiData, PokemonForm } from './pokeapi.ts';

/**
 * Maps a row of the Google Sheet (national number, French name, English code)
 * to a PokéAPI form. The Sheet's English codes follow pokemondb.net naming
 * ("Rattata-Alolan", "Unown-Em"), which differs from PokéAPI identifiers
 * ("rattata-alola", "unown-exclamation"); the rules below bridge the two.
 */

export interface SheetRowIdentity {
  dex: number;
  nameFr: string;
  code: string;
}

export interface ResolvedForm {
  form: PokemonForm;
  /**
   * True when the row is a female variant that PokéAPI does not model as a
   * separate form (Combee, Hippopotas…): only the sprite differs.
   */
  isGenderVariant: boolean;
}

const REGIONAL_SUFFIXES: ReadonlyArray<[RegExp, string]> = [
  [/-alolan(?=-|$)/, '-alola'],
  [/-galarian(?=-|$)/, '-galar'],
  [/-hisuian(?=-|$)/, '-hisui'],
  [/-paldean(?=-|$)/, '-paldea'],
];

/** pokemondb codes whose PokéAPI identifier cannot be derived by a rule. */
const CODE_ALIASES: Readonly<Record<string, string>> = {
  'unown-em': 'unown-exclamation',
  'unown-qm': 'unown-question',
  'minior-core': 'minior-red',
  'ogerpon-teal': 'ogerpon',
  'floette-eternal-flower': 'floette-eternal',
  'maushold-family3': 'maushold-family-of-three',
  'squawkabilly-blue': 'squawkabilly-blue-plumage',
  'squawkabilly-yellow': 'squawkabilly-yellow-plumage',
  'squawkabilly-white': 'squawkabilly-white-plumage',
};

/**
 * Rows whose English code is shared with another row in the Sheet, so only
 * the French label tells them apart. Keyed by `${dex}|${French name}`.
 */
const ROW_OVERRIDES: Readonly<Record<string, string>> = {
  '128|Tauros': 'tauros-paldea-combat-breed',
  '128|Tauros (Feu)': 'tauros-paldea-blaze-breed',
  '128|Tauros (Eau)': 'tauros-paldea-aqua-breed',
  '854|Théffroi Authentique': 'sinistea-antique',
  '855|Polthégeist Authentique': 'polteageist-antique',
  '1012|Poltchageist Onéreuse': 'poltchageist-artisan',
  '1013|Théffroyable Exceptionnelle': 'sinistcha-masterpiece',
};

export function normalizeCode(code: string): string {
  let identifier = code.trim().toLowerCase();
  for (const [pattern, replacement] of REGIONAL_SUFFIXES) {
    identifier = identifier.replace(pattern, replacement);
  }
  identifier = CODE_ALIASES[identifier] ?? identifier;

  // Minior cores: "Minior-Orange-Core" → "minior-orange" (the meteor shell is a separate form).
  const minior = /^minior-([a-z]+)-core$/.exec(identifier);
  if (minior) {
    return `minior-${minior[1]}`;
  }
  // Alcremie sweets on the default vanilla cream: "Alcremie-love" → "alcremie-vanilla-cream-love-sweet".
  const alcremie = /^alcremie-(flower|star|clover|berry|ribbon|love)$/.exec(identifier);
  if (alcremie) {
    return `alcremie-vanilla-cream-${alcremie[1]}-sweet`;
  }
  return identifier;
}

const GENDER_SUFFIX = /-(f|female)$/;

export function resolveSheetRow(row: SheetRowIdentity, data: PokeApiData): ResolvedForm | null {
  const belongsToSpecies = (form: PokemonForm | undefined): form is PokemonForm => form?.speciesId === row.dex;

  const override = ROW_OVERRIDES[`${row.dex}|${row.nameFr}`];
  if (override) {
    const form = data.formsByIdentifier.get(override);
    return belongsToSpecies(form) ? { form, isGenderVariant: false } : null;
  }

  const identifier = normalizeCode(row.code);

  const exactForm = data.formsByIdentifier.get(identifier);
  if (belongsToSpecies(exactForm)) {
    return { form: exactForm, isGenderVariant: false };
  }

  // A bare species name ("Oinkologne", "Sinistea") means its default form.
  const species = data.speciesByIdentifier.get(identifier);
  if (species?.id === row.dex) {
    const form = data.defaultFormBySpecies.get(species.id);
    return form ? { form, isGenderVariant: false } : null;
  }

  if (GENDER_SUFFIX.test(identifier)) {
    const base = identifier.replace(GENDER_SUFFIX, '');
    const femaleForm = data.formsByIdentifier.get(`${base}-female`);
    if (belongsToSpecies(femaleForm)) {
      return { form: femaleForm, isGenderVariant: false };
    }
    const baseSpecies = data.speciesByIdentifier.get(base);
    const baseForm = baseSpecies?.id === row.dex ? data.defaultFormBySpecies.get(baseSpecies.id) : undefined;
    if (baseForm) {
      return { form: baseForm, isGenderVariant: true };
    }
  }

  return null;
}

export function entryIdFor(resolved: ResolvedForm): string {
  return resolved.isGenderVariant ? `${resolved.form.identifier}-female` : resolved.form.identifier;
}
