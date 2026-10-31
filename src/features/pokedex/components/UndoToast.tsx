import { useEffect } from 'react';
import { useStatuses } from '../statusContext';

const VISIBLE_MS = 5000;

/** Confirms the last one-tap change and offers to revert it for a few seconds. */
export function UndoToast() {
  const { lastChange, undoLastChange, dismissLastChange } = useStatuses();

  useEffect(() => {
    if (!lastChange) return;
    const timer = window.setTimeout(dismissLastChange, VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [lastChange, dismissLastChange]);

  const message = lastChange
    ? `${lastChange.entry.nameFr} ${lastChange.next === 'obtained' ? 'marqué comme obtenu' : 'repassé à farm'}`
    : '';

  return (
    // The live region stays mounted so screen readers announce each new message.
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[92px] z-20 flex justify-center px-4">
      {lastChange && (
        <div className="bg-inverse text-on-inverse pointer-events-auto flex h-13 w-full max-w-md items-center justify-between gap-3 rounded-2xl pr-2 pl-4 text-sm font-semibold shadow-lg">
          <span className="truncate">{message}</span>
          <button
            type="button"
            onClick={() => void undoLastChange()}
            className="text-on-inverse-accent h-10 shrink-0 cursor-pointer rounded-xl px-3 font-extrabold"
          >
            Annuler
          </button>
        </div>
      )}
    </div>
  );
}
