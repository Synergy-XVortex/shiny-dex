import { describe, expect, it } from 'vitest';
import {
  THEME_STORAGE_KEY,
  applyTheme,
  isThemePreference,
  readStoredPreference,
  resolveTheme,
  writeStoredPreference,
} from './theme';

describe('resolveTheme', () => {
  it('honours an explicit choice regardless of the system setting', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  it('follows the system setting in automatic mode', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
  });
});

describe('isThemePreference', () => {
  it('accepts only the three known values', () => {
    expect(isThemePreference('system')).toBe(true);
    expect(isThemePreference('auto')).toBe(false);
    expect(isThemePreference(null)).toBe(false);
  });
});

describe('stored preference', () => {
  it('defaults to automatic when nothing valid is stored', () => {
    expect(readStoredPreference({ getItem: () => null })).toBe('system');
    expect(readStoredPreference({ getItem: () => 'purple' })).toBe('system');
    expect(readStoredPreference(undefined)).toBe('system');
  });

  it('falls back instead of throwing when storage is blocked', () => {
    const blocked = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };
    expect(readStoredPreference(blocked)).toBe('system');
    expect(() => writeStoredPreference(blocked, 'dark')).not.toThrow();
  });

  it('round-trips through localStorage', () => {
    writeStoredPreference(localStorage, 'dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(readStoredPreference(localStorage)).toBe('dark');
  });
});

describe('applyTheme', () => {
  it('sets the theme attribute, colour scheme and browser chrome colour', () => {
    document.head.innerHTML = '<meta name="theme-color" content="">';
    applyTheme(document.documentElement, 'dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe('#111317');
  });
});
