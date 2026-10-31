import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { CloseIcon } from './icons';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Controls shown next to the close button. */
  actions?: ReactNode;
  /**
   * Opens at about two thirds of the screen, leaving the page visible behind;
   * dragging the handle up expands it to full height, dragging it down
   * shrinks it, then closes it.
   */
  expandable?: boolean;
  children: ReactNode;
}

/** Finger travel, in pixels, that counts as a deliberate drag rather than a wobble. */
const DRAG_THRESHOLD = 60;

/**
 * Modal panel sliding from the bottom of the screen. Built on the native
 * <dialog> element, which provides focus trapping, Escape to close and an
 * inert background without extra code.
 */
export function BottomSheet({ open, onClose, title, actions, expandable = false, children }: BottomSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStart = useRef<number | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal?.();
    if (!open && dialog.open) dialog.close?.();
  }, [open]);

  const close = () => {
    setExpanded(false);
    onClose();
  };

  const onDragStart = (event: PointerEvent<HTMLDivElement>) => {
    if (!expandable) return;
    // No pointer capture: it would retarget the click of the buttons in the
    // header. Touch pointers stay attached to their first target anyway.
    dragStart.current = event.clientY;
  };
  const onDragMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStart.current === null) return;
    // Only downward moves follow the finger; an upward drag expands on release.
    setDragOffset(Math.max(0, event.clientY - dragStart.current));
  };
  const onDragEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStart.current === null) return;
    const distance = event.clientY - dragStart.current;
    dragStart.current = null;
    setDragOffset(0);
    if (distance > DRAG_THRESHOLD) {
      if (expanded) setExpanded(false);
      else close();
    } else if (distance < -DRAG_THRESHOLD) {
      setExpanded(true);
    }
  };

  const height = expandable ? (expanded ? 'h-[94dvh]' : 'h-[64dvh]') : 'max-h-[88dvh]';

  return (
    <dialog
      ref={dialogRef}
      aria-label={title}
      onClose={close}
      // A click on the backdrop lands on the <dialog> itself, not on its content.
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      style={{ transform: dragOffset ? `translateY(${dragOffset}px)` : undefined }}
      className={`bg-surface-raised text-ink fixed inset-x-0 top-auto bottom-0 m-0 mx-auto w-full max-w-3xl flex-col overflow-hidden rounded-t-[32px] p-0 backdrop:bg-black/40 open:flex ${height} ${
        dragOffset ? '' : 'transition-[height,transform] duration-200'
      }`}
    >
      <div
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerCancel={onDragEnd}
        className={`flex shrink-0 flex-col gap-3 px-5 pt-3 pb-3 ${expandable ? 'cursor-grab touch-none' : ''}`}
      >
        {expandable ? (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-label={expanded ? 'Réduire le panneau' : 'Agrandir le panneau'}
            className="flex h-4 cursor-pointer items-center justify-center self-stretch"
          >
            <span aria-hidden="true" className="bg-line h-1.5 w-10 rounded-full" />
          </button>
        ) : (
          <div aria-hidden="true" className="bg-line h-1.5 w-10 self-center rounded-full" />
        )}
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex-1 text-[22px] font-extrabold tracking-tight">{title}</h2>
          {open && actions}
          <button
            type="button"
            onClick={close}
            aria-label="Fermer"
            className="bg-surface-sunken flex size-11 cursor-pointer items-center justify-center rounded-2xl"
          >
            <CloseIcon width={20} height={20} />
          </button>
        </div>
      </div>
      {/* Content is mounted only while open, so it is not computed or
          found by assistive technology when the sheet is closed. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-5 pb-[calc(env(safe-area-inset-bottom)+20px)]">
        {open && children}
      </div>
    </dialog>
  );
}
