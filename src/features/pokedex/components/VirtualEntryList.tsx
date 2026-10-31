import { useVirtualizer } from '@tanstack/react-virtual';
import { useCallback, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import type { PokedexEntry, ShinyStatus } from '../model';
import type { ViewMode } from '../useViewMode';
import { CARD_ROW_HEIGHT, PokemonCard, PokemonTile } from './PokemonCard';

interface VirtualEntryListProps {
  entries: readonly PokedexEntry[];
  statuses: ReadonlyMap<string, ShinyStatus>;
  mode: ViewMode;
  onToggle: (entry: PokedexEntry) => void;
  scrollElementRef: RefObject<HTMLElement | null>;
}

const GRID_MIN_TILE = 80;
const GRID_GAP = 10;
/** Number label under each tile plus the row gap. */
const GRID_LABEL_AND_GAP = 30;

/**
 * Scroll offset of each view, kept for the session so coming back from a
 * detail page lands where the user left the list.
 */
const savedOffsets: Partial<Record<ViewMode, number>> = {};

/**
 * Renders only the rows near the viewport: 1 220 entries with images would
 * otherwise make scrolling sluggish on a phone. Grid rows hold as many tiles
 * as fit the available width (4 on a phone, more on a tablet or PC).
 */
export function VirtualEntryList({ entries, statuses, mode, onToggle, scrollElementRef }: VirtualEntryListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(358);
  const [scrollMargin, setScrollMargin] = useState(0);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const measure = () => {
      setWidth(container.clientWidth || 358);
      setScrollMargin(container.offsetTop);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const columns = mode === 'grid' ? Math.max(4, Math.floor((width + GRID_GAP) / (GRID_MIN_TILE + GRID_GAP))) : 1;
  const tileWidth = (width - GRID_GAP * (columns - 1)) / columns;
  const rowHeight = mode === 'grid' ? tileWidth + GRID_LABEL_AND_GAP : CARD_ROW_HEIGHT;
  const rowCount = Math.ceil(entries.length / columns);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: () => rowHeight,
    overscan: 6,
    scrollMargin,
    initialOffset: () => savedOffsets[mode] ?? 0,
    // jsdom and the very first paint have no layout yet; assume a phone viewport.
    initialRect: { width: 390, height: 844 },
  });

  // Row height depends on the measured width in grid mode.
  useLayoutEffect(() => {
    virtualizer.measure();
  }, [virtualizer, rowHeight]);

  const saveOffset = useCallback(() => {
    savedOffsets[mode] = scrollElementRef.current?.scrollTop ?? 0;
  }, [mode, scrollElementRef]);

  useLayoutEffect(() => {
    const element = scrollElementRef.current;
    if (!element) return;
    element.scrollTop = savedOffsets[mode] ?? 0;
    element.addEventListener('scroll', saveOffset, { passive: true });
    return () => element.removeEventListener('scroll', saveOffset);
  }, [mode, saveOffset, scrollElementRef]);

  const Item = mode === 'grid' ? PokemonTile : PokemonCard;

  return (
    <div ref={containerRef} className="relative px-4 pb-6" style={{ height: virtualizer.getTotalSize() + 24 }}>
      {virtualizer.getVirtualItems().map((row) => {
        const rowEntries = entries.slice(row.index * columns, row.index * columns + columns);
        return (
          <div
            key={row.key}
            className={mode === 'grid' ? 'absolute inset-x-4 grid' : 'absolute inset-x-4'}
            style={{
              top: row.start - scrollMargin,
              height: rowHeight,
              gridTemplateColumns: mode === 'grid' ? `repeat(${columns}, minmax(0, 1fr))` : undefined,
              columnGap: GRID_GAP,
            }}
          >
            {rowEntries.map((entry) => (
              <Item key={entry.id} entry={entry} status={statuses.get(entry.id) ?? 'to-farm'} onToggle={onToggle} />
            ))}
          </div>
        );
      })}
    </div>
  );
}
