import { useCallback, useState } from 'react';

export type ViewMode = 'cards' | 'grid';

const STORAGE_KEY = 'shinydex.view';

function readViewMode(): ViewMode {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'grid' ? 'grid' : 'cards';
  } catch {
    return 'cards';
  }
}

/** Cards or grid, remembered on this device. */
export function useViewMode(): [ViewMode, (mode: ViewMode) => void] {
  const [mode, setModeState] = useState<ViewMode>(readViewMode);
  const setMode = useCallback((next: ViewMode) => {
    setModeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not remembered across launches; the toggle still works for this session.
    }
  }, []);
  return [mode, setMode];
}
