import { createContext, useContext } from 'react';
import type { PokedexEntry, ShinyStatus } from './model';

export interface StatusChange {
  entry: PokedexEntry;
  previous: ShinyStatus;
  next: ShinyStatus;
}

export interface StatusContextValue {
  /** Undefined until IndexedDB has answered once (first render only). */
  statuses: ReadonlyMap<string, ShinyStatus> | undefined;
  /** Changes a status; returns once it is stored locally. */
  setStatus: (entry: PokedexEntry, next: ShinyStatus) => Promise<void>;
  /** Latest change made from a list, offered for undo; null when none or expired. */
  lastChange: StatusChange | null;
  undoLastChange: () => Promise<void>;
  dismissLastChange: () => void;
}

export const StatusContext = createContext<StatusContextValue | null>(null);

export function useStatuses(): StatusContextValue {
  const context = useContext(StatusContext);
  if (!context) {
    throw new Error('useStatuses must be used inside <StatusProvider>.');
  }
  return context;
}
