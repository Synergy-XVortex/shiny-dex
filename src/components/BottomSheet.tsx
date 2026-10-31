import { useEffect, useRef, type ReactNode } from 'react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/**
 * Modal panel sliding from the bottom of the screen. Built on the native
 * <dialog> element, which provides focus trapping, Escape to close and an
 * inert background without extra code.
 */
export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal?.();
    if (!open && dialog.open) dialog.close?.();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-label={title}
      onClose={onClose}
      // A click on the backdrop lands on the <dialog> itself, not on its content.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="bg-surface-raised text-ink fixed inset-x-0 top-auto bottom-0 m-0 mx-auto max-h-[88dvh] w-full max-w-3xl rounded-t-[32px] p-0 backdrop:bg-black/45"
    >
      <div className="flex flex-col gap-4 px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+20px)]">
        <div aria-hidden="true" className="bg-line h-1.5 w-10 self-center rounded-full" />
        <div className="flex items-center justify-between">
          <h2 className="text-[22px] font-extrabold tracking-tight">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="bg-surface-sunken flex size-11 cursor-pointer items-center justify-center rounded-2xl"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        {/* Content is mounted only while open, so it is not computed or
            found by assistive technology when the sheet is closed. */}
        {open && children}
      </div>
    </dialog>
  );
}
