import { memo } from 'react';
import { Link } from 'react-router-dom';
import { formatDexNumber } from '../catalog';
import type { PokedexEntry, ShinyStatus } from '../model';
import { entryPaletteStyle } from '../typePalette';
import { CategoryBadge, TypePill } from './Badges';
import { Sprite } from './Sprite';
import { StatusToggle } from './StatusToggle';

interface EntryViewProps {
  entry: PokedexEntry;
  status: ShinyStatus;
  onToggle: (entry: PokedexEntry) => void;
}

/** Height of a card row including the gap below it; used by the virtualized list. */
export const CARD_ROW_HEIGHT = 102;

/**
 * List card. The whole card links to the detail page; the status toggle sits
 * above that link so a tap on it never navigates.
 */
export const PokemonCard = memo(function PokemonCard({ entry, status, onToggle }: EntryViewProps) {
  return (
    <article
      style={entryPaletteStyle(entry.types[0], status)}
      className="type-surface relative grid h-[92px] grid-cols-[minmax(0,1fr)_44px_84px] items-center gap-2.5 rounded-[22px] py-2 pr-2 pl-4"
    >
      <div className="flex min-w-0 flex-col gap-2">
        <h2 className="flex min-w-0 items-baseline gap-2">
          <span className="text-[13px] font-semibold opacity-75">{formatDexNumber(entry.dex)}</span>
          <Link
            to={`/pokemon/${entry.id}`}
            className="truncate text-lg font-extrabold outline-none after:absolute after:inset-0 after:rounded-[22px] focus-visible:after:outline-2 focus-visible:after:outline-current"
          >
            {entry.nameFr}
          </Link>
        </h2>
        <div className="flex flex-wrap gap-1.5">
          <CategoryBadge category={entry.category} />
          {entry.types.map((type) => (
            <TypePill key={type} type={type} />
          ))}
        </div>
      </div>
      <StatusToggle entry={entry} status={status} onToggle={() => onToggle(entry)} className="relative z-10" />
      <div className="type-sprite-well flex h-[76px] w-[84px] items-center justify-center rounded-[18px]">
        <Sprite id={entry.id} variant={status === 'obtained' ? 'shiny' : 'normal'} size={72} status={status} />
      </div>
    </article>
  );
});

/** Grid tile, HOME-box style: sprite and number, with the status in the corner. */
export const PokemonTile = memo(function PokemonTile({ entry, status, onToggle }: EntryViewProps) {
  return (
    <div style={entryPaletteStyle(entry.types[0], status)} className="relative flex flex-col items-center gap-1.5">
      <div className="type-surface relative flex aspect-square w-full items-center justify-center rounded-[20px]">
        <Sprite id={entry.id} variant={status === 'obtained' ? 'shiny' : 'normal'} size={64} status={status} className="size-[78%]" />
        <Link
          to={`/pokemon/${entry.id}`}
          aria-label={`${entry.nameFr} ${formatDexNumber(entry.dex)}`}
          className="absolute inset-0 rounded-[20px] outline-none focus-visible:outline-2 focus-visible:outline-current"
        />
        <StatusToggle
          entry={entry}
          status={status}
          onToggle={() => onToggle(entry)}
          iconSize={20}
          className="absolute -top-2.5 -right-2.5 z-10 [&>svg]:bg-surface-raised [&>svg]:rounded-full [&>svg]:shadow-sm"
        />
      </div>
      <span className="text-ink-muted text-[11px] font-bold">{formatDexNumber(entry.dex)}</span>
    </div>
  );
});
