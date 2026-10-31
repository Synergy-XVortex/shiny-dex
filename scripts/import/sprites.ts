import type { ResolvedForm } from './resolve.ts';

/**
 * HOME sprites from the PokeAPI/sprites repository. Paths are relative to
 * `sprites/pokemon/other/home/`; shiny variants live under `shiny/`.
 *
 * File naming in that repository:
 * - `<pokemonId>.png` for every PokéAPI "pokemon", including non-cosmetic forms (`10091.png`);
 * - `<speciesId>-<form>.png` for cosmetic forms without their own pokemon (`201-b.png`, `666-polar.png`);
 * - `female/<pokemonId>.png` for visible gender differences.
 */
export const SPRITE_BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/';

export interface SpriteSource {
  normal: string;
  shiny: string;
  /** False when no file specific to this form exists and the species sprite is used instead. */
  exact: boolean;
}

export function resolveSpriteSource(resolved: ResolvedForm, availableFiles: ReadonlySet<string>): SpriteSource {
  const { form, isGenderVariant } = resolved;
  const candidates: string[] = [];

  if (isGenderVariant || form.formIdentifier === 'female') {
    candidates.push(`female/${form.pokemonId}.png`);
  }
  if (form.formIdentifier) {
    candidates.push(`${form.speciesId}-${form.formIdentifier}.png`);
  }
  candidates.push(`${form.pokemonId}.png`);

  const match = candidates.find((file) => availableFiles.has(file) && availableFiles.has(`shiny/${file}`));
  if (match) {
    return { normal: match, shiny: `shiny/${match}`, exact: true };
  }
  return { normal: `${form.speciesId}.png`, shiny: `shiny/${form.speciesId}.png`, exact: false };
}
