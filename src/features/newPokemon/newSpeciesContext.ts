import { createContext, useContext } from 'react';
import type { AddProgress } from './newSpecies';

export interface NewSpeciesContextValue {
  /** Species PokéAPI has and the app does not; 0 when unknown or none. */
  newCount: number;
  /** False when signed out or not allowed to write: new species cannot be added from this device. */
  canAdd: boolean;
  activity: 'idle' | 'checking' | 'adding';
  /** Progress of the running addition, null otherwise. */
  progress: AddProgress | null;
  errorMessage: string | null;
  /** Epoch milliseconds of the last PokéAPI check, null before the first one. */
  checkedAt: number | null;
  checkNow: () => Promise<void>;
  addNewSpecies: () => Promise<void>;
}

export const NewSpeciesContext = createContext<NewSpeciesContextValue | null>(null);

export function useNewSpecies(): NewSpeciesContextValue {
  const context = useContext(NewSpeciesContext);
  if (!context) {
    throw new Error('useNewSpecies must be used inside <NewSpeciesProvider>.');
  }
  return context;
}
