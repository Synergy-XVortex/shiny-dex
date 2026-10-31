import { CATEGORY_BADGES } from '../catalog';
import type { EntryCategory, PokemonType } from '../model';
import { typeLabel } from '../typePalette';

/** Type label pill; colours come from the surrounding card's palette variables. */
export function TypePill({ type, compact = false }: { type: PokemonType; compact?: boolean }) {
  return (
    <span
      className={`type-pill inline-flex h-6 items-center rounded-full font-bold tracking-wide uppercase ${
        compact ? 'px-2 text-[10px]' : 'px-2.5 text-[11px]'
      }`}
    >
      {typeLabel(type)}
    </span>
  );
}

/** Outlined badge naming the region of a regional form; nothing for other categories. */
export function CategoryBadge({ category }: { category: EntryCategory }) {
  const label = CATEGORY_BADGES[category];
  if (!label) return null;
  return (
    <span className="inline-flex h-6 items-center rounded-full border-[1.5px] border-current px-2.5 text-[11px] font-bold tracking-wide uppercase">
      {label}
    </span>
  );
}
