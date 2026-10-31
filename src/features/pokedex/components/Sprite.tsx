import { useState } from 'react';
import { spriteUrl } from '../catalog';
import type { ShinyStatus } from '../model';

interface SpriteProps {
  id: string;
  variant: 'normal' | 'shiny';
  size: number;
  /** Shiny-locked entries are drawn in greyscale (design option A). */
  status?: ShinyStatus;
  /** Load immediately (detail page) instead of when scrolled into view (lists). */
  eager?: boolean;
  className?: string;
}

/**
 * Decorative HOME sprite: the entry's name is always rendered next to it, so
 * the image carries an empty alt. Entries added later without a sprite file
 * show a neutral placeholder instead of a broken image.
 */
export function Sprite({ id, variant, size, status, eager = false, className = '' }: SpriteProps) {
  const [failed, setFailed] = useState(false);
  const greyscale = status === 'locked' ? 'grayscale opacity-80' : '';

  if (failed) {
    return (
      <span
        aria-hidden="true"
        className={`bg-current/10 inline-block rounded-full ${className}`}
        style={{ width: size * 0.6, height: size * 0.6 }}
      />
    );
  }

  return (
    <img
      src={spriteUrl(id, variant)}
      alt=""
      width={size}
      height={size}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
      onError={() => setFailed(true)}
      className={`select-none ${greyscale} ${className}`}
    />
  );
}
