import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { applyTheme, readStoredPreference, resolveTheme, writeStoredPreference, type ThemePreference } from './theme';
import { ThemeContext, type ThemeContextValue } from './themeContext';

const DARK_QUERY = '(prefers-color-scheme: dark)';

function getStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => readStoredPreference(getStorage()));
  const [systemPrefersDark, setSystemPrefersDark] = useState(() => window.matchMedia(DARK_QUERY).matches);

  // Follow the phone's setting live, so "Automatique" switches at sunset without a reload.
  useEffect(() => {
    const query = window.matchMedia(DARK_QUERY);
    const onChange = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const resolvedTheme = resolveTheme(preference, systemPrefersDark);

  useEffect(() => {
    applyTheme(document.documentElement, resolvedTheme);
  }, [resolvedTheme]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    writeStoredPreference(getStorage(), next);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ preference, resolvedTheme, setPreference }),
    [preference, resolvedTheme, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
