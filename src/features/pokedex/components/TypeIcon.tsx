import type { PokemonType } from '../model';

/**
 * Simple original glyphs for the 18 types (not the official game icons),
 * drawn with strokes so they follow the surrounding text colour.
 */
const TYPE_ICON_PATHS: Record<PokemonType, string> = {
  normal: 'M12 4a8 8 0 1 0 0 16a8 8 0 1 0 0-16z',
  fighting:
    'M7 12V8a1.5 1.5 0 0 1 3 0v3M10 11V6.5a1.5 1.5 0 0 1 3 0V11M13 11V7.5a1.5 1.5 0 0 1 3 0V14c0 3-2 6-5 6s-5-2-5-5v-1.5a1.5 1.5 0 0 1 3 0',
  flying: 'M4 17c7 0 13-4 16-12c-1 8-6 14-13 14M8 15c3-1 6-3 8-6',
  poison: 'M12 4c3.9 0 7 2.7 7 6c0 2-1.2 3.7-3 4.8V18H8v-3.2C6.2 13.7 5 12 5 10c0-3.3 3.1-6 7-6zM10 18v2M14 18v2',
  ground: 'M3 19h18M6 15h12M9 11h6M11 7h2',
  rock: 'M7 5h8l4 6-3 8H8l-4-7z',
  bug: 'M12 8a4 5.5 0 1 0 .01 0zM12 8v11M9 4l2 3M15 4l-2 3M8 13h8',
  ghost: 'M6 20v-9a6 6 0 0 1 12 0v9l-2-2-2 2-2-2-2 2-2-2zM10 10h.01M14 10h.01',
  steel: 'M12 3l7.8 4.5v9L12 21l-7.8-4.5v-9zM12 9.5a2.5 2.5 0 1 0 .01 0z',
  fire: 'M12 3c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2.5 1.5-4 2.5-6c1 1.5 1.5 3 1.5 4.5',
  water: 'M12 3c3 4.5 6 8 6 11a6 6 0 0 1-12 0c0-3 3-6.5 6-11z',
  grass: 'M5 19c0-8 5-14 14-14c0 9-6 14-14 14zM5 19l8-8',
  electric: 'M13 3L5 14h6l-1 7 8-11h-6z',
  psychic: 'M12 12a2 2 0 1 1 2-2a4 4 0 1 1-4 4a6 6 0 1 1 6-6',
  ice: 'M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9',
  dragon: 'M5 19c0-7 4-13 12-14c-2 2-3 4-3 6c2-1 4-1 5 0c-3 1-5 3-6 8z',
  dark: 'M15 4a8 8 0 1 0 5 13A7 7 0 0 1 15 4z',
  fairy: 'M12 3l2.2 6.3L21 9.5l-5.4 4.1 2 6.4-5.6-3.7L6.4 20l2-6.4L3 9.5l6.8-.2z',
};

export function TypeIcon({ type, size = 16 }: { type: PokemonType; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={TYPE_ICON_PATHS[type]} />
    </svg>
  );
}
