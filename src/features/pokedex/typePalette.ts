import type { CSSProperties } from 'react';
import type { PokemonType, ShinyStatus } from './model';

/**
 * Card colours derived from each type's hue and saturation, so all 18 types
 * share the same lightness steps and stay readable in both themes. The values
 * are exposed as CSS custom properties; `.type-surface` and friends in
 * index.css pick the light or dark set according to the active theme.
 */
interface TypeDefinition {
  label: string;
  hue: number;
  saturation: number;
}

export const TYPE_DEFINITIONS: Record<PokemonType, TypeDefinition> = {
  normal: { label: 'Normal', hue: 45, saturation: 16 },
  fighting: { label: 'Combat', hue: 5, saturation: 60 },
  flying: { label: 'Vol', hue: 225, saturation: 60 },
  poison: { label: 'Poison', hue: 285, saturation: 45 },
  ground: { label: 'Sol', hue: 35, saturation: 55 },
  rock: { label: 'Roche', hue: 50, saturation: 32 },
  bug: { label: 'Insecte', hue: 75, saturation: 55 },
  ghost: { label: 'Spectre', hue: 262, saturation: 32 },
  steel: { label: 'Acier', hue: 200, saturation: 18 },
  fire: { label: 'Feu', hue: 22, saturation: 85 },
  water: { label: 'Eau', hue: 213, saturation: 80 },
  grass: { label: 'Plante', hue: 110, saturation: 48 },
  electric: { label: 'Électrik', hue: 48, saturation: 90 },
  psychic: { label: 'Psy', hue: 340, saturation: 70 },
  ice: { label: 'Glace', hue: 185, saturation: 55 },
  dragon: { label: 'Dragon', hue: 250, saturation: 60 },
  dark: { label: 'Ténèbres', hue: 270, saturation: 10 },
  fairy: { label: 'Fée', hue: 320, saturation: 60 },
};

/** Neutral grey used for shiny-locked entries (design option A). */
const LOCKED: TypeDefinition = { label: 'Shiny lock', hue: 220, saturation: 6 };

function paletteVariables({ hue, saturation }: TypeDefinition): CSSProperties {
  const hsl = (s: number, l: number) => `hsl(${hue} ${Math.round(s)}% ${l}%)`;
  return {
    '--type-bg': hsl(saturation, 90),
    '--type-ink': hsl(saturation * 0.8, 24),
    '--type-pill': hsl(saturation, 82),
    '--type-sprite': hsl(saturation, 96),
    '--type-bg-dark': hsl(saturation * 0.45, 17),
    '--type-ink-dark': hsl(saturation * 0.9, 86),
    '--type-pill-dark': hsl(saturation * 0.45, 26),
    '--type-sprite-dark': hsl(saturation * 0.45, 22),
  } as CSSProperties;
}

const STYLE_CACHE = new Map<string, CSSProperties>();

/** CSS variables for an entry's card: its primary type's palette, or grey when shiny-locked. */
export function entryPaletteStyle(primaryType: PokemonType | undefined, status: ShinyStatus | undefined): CSSProperties {
  const key = status === 'locked' ? 'locked' : (primaryType ?? 'normal');
  let style = STYLE_CACHE.get(key);
  if (!style) {
    style = paletteVariables(key === 'locked' ? LOCKED : TYPE_DEFINITIONS[key as PokemonType]);
    STYLE_CACHE.set(key, style);
  }
  return style;
}

export function typeLabel(type: PokemonType): string {
  return TYPE_DEFINITIONS[type].label;
}
