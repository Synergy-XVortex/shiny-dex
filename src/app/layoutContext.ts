import type { RefObject } from 'react';
import { useOutletContext } from 'react-router-dom';

export interface LayoutContext {
  /** The scrolling element of the page, needed by virtualized lists. */
  scrollElementRef: RefObject<HTMLElement | null>;
}

export function useLayoutScrollElement(): RefObject<HTMLElement | null> {
  return useOutletContext<LayoutContext>().scrollElementRef;
}
