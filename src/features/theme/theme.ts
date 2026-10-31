/**
 * Theme preference handling, kept free of React so it can be shared with the
 * inline boot script in index.html and unit-tested in isolation.
 */

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

/** Must stay in sync with the boot script in index.html. */
export const THEME_STORAGE_KEY = 'shinydex.theme';

/** Browser chrome colour per theme; mirrors --color-surface in index.css. */
export const THEME_COLORS: Record<ResolvedTheme, string> = {
  light: '#f5f6f8',
  dark: '#111317',
};

const PREFERENCES: readonly ThemePreference[] = ['light', 'dark', 'system'];

export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === 'string' && (PREFERENCES as readonly string[]).includes(value);
}

export function resolveTheme(preference: ThemePreference, systemPrefersDark: boolean): ResolvedTheme {
  if (preference === 'system') {
    return systemPrefersDark ? 'dark' : 'light';
  }
  return preference;
}

/**
 * Storage access can throw (private browsing, blocked site data), so every
 * read and write degrades to the default instead of breaking the app.
 */
export function readStoredPreference(storage: Pick<Storage, 'getItem'> | undefined): ThemePreference {
  try {
    const value = storage?.getItem(THEME_STORAGE_KEY);
    return isThemePreference(value) ? value : 'system';
  } catch {
    return 'system';
  }
}

export function writeStoredPreference(
  storage: Pick<Storage, 'setItem'> | undefined,
  preference: ThemePreference,
): void {
  try {
    storage?.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // The preference simply won't survive a reload; nothing else depends on it.
  }
}

export function applyTheme(root: HTMLElement, theme: ResolvedTheme): void {
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  const meta = root.ownerDocument.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  meta?.setAttribute('content', THEME_COLORS[theme]);
}
