import { CheckedIcon, LockIcon, UncheckedIcon } from '../../../components/icons';
import type { PokedexEntry, ShinyStatus } from '../model';

interface StatusToggleProps {
  entry: PokedexEntry;
  status: ShinyStatus;
  onToggle: () => void;
  /** Visual size of the icon; the touch target stays at least 44 px. */
  iconSize?: number;
  className?: string;
}

/**
 * The list's one-tap action: switches between "à farm" and "obtenu".
 * Shiny-locked entries show a padlock that is not a control; their status is
 * changed from the detail page only.
 */
export function StatusToggle({ entry, status, onToggle, iconSize = 30, className = '' }: StatusToggleProps) {
  if (status === 'locked') {
    return (
      <span role="img" aria-label="Shiny lock" className={`flex size-11 items-center justify-center ${className}`}>
        <LockIcon width={iconSize * 0.85} height={iconSize * 0.85} />
      </span>
    );
  }

  const obtained = status === 'obtained';
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={obtained}
      aria-label={`${entry.nameFr} : shiny obtenu`}
      className={`flex size-11 cursor-pointer items-center justify-center rounded-full transition-transform active:scale-90 motion-reduce:transition-none ${className}`}
    >
      {obtained ? (
        <CheckedIcon width={iconSize} height={iconSize} />
      ) : (
        <UncheckedIcon width={iconSize} height={iconSize} className="opacity-60" />
      )}
    </button>
  );
}
