import { useRef, type MouseEvent, type PointerEvent } from 'react';

/** Long enough not to fire while tapping quickly through filters. */
const LONG_PRESS_MS = 450;

interface LongPressHandlers {
  onPointerDown: (event: PointerEvent) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
  onPointerCancel: () => void;
  onContextMenu: (event: MouseEvent) => void;
  onClick: (event: MouseEvent) => void;
}

/**
 * Tap and long press on the same button. The long press also answers to a
 * right click and to Shift + click or Shift + Enter, so it stays reachable
 * on a PC and from the keyboard.
 */
export function useLongPress(onTap: () => void, onLongPress: () => void): LongPressHandlers {
  const timer = useRef<number | undefined>(undefined);
  // Set once the long press has run, so the click that follows is ignored.
  const handled = useRef(false);

  const cancel = () => window.clearTimeout(timer.current);

  return {
    onPointerDown: (event) => {
      handled.current = false;
      cancel();
      if (event.button !== 0) return;
      timer.current = window.setTimeout(() => {
        handled.current = true;
        navigator.vibrate?.(15);
        onLongPress();
      }, LONG_PRESS_MS);
    },
    onPointerUp: cancel,
    onPointerLeave: cancel,
    // Fired when the finger starts scrolling the panel: not a press.
    onPointerCancel: cancel,
    onContextMenu: (event) => {
      event.preventDefault();
      cancel();
      if (handled.current) return;
      handled.current = true;
      onLongPress();
    },
    onClick: (event) => {
      if (handled.current) {
        handled.current = false;
        return;
      }
      if (event.shiftKey) onLongPress();
      else onTap();
    },
  };
}
