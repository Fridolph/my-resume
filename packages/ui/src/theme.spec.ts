import { describe, expect, it } from 'vitest';

import {
  THEME_STORAGE_KEY,
  applyThemeToDocument,
  normalizeThemeMode,
  readStoredTheme,
  writeStoredTheme,
} from './theme';

describe('theme helpers', () => {
  it('should normalize any unknown value to light', () => {
    expect(normalizeThemeMode('dark')).toBe('dark');
    expect(normalizeThemeMode('light')).toBe('light');
    expect(normalizeThemeMode('system')).toBe('light');
    expect(normalizeThemeMode()).toBe('light');
  });

  it('should read and write theme mode from storage', () => {
    const storage = new Map<string, string>();

    writeStoredTheme(
      {
        setItem(key, value) {
          storage.set(key, value);
        },
      },
      'dark',
    );

    expect(storage.get(THEME_STORAGE_KEY)).toBe('dark');
    expect(
      readStoredTheme({
        getItem(key) {
          return storage.get(key) ?? null;
        },
      }),
    ).toBe('dark');
  });

  it('should apply the theme to documentElement dataset and colorScheme', () => {
    const documentNode = {
      documentElement: {
        dataset: {} as DOMStringMap,
        style: {
          colorScheme: 'light',
        },
      },
    };

    applyThemeToDocument(documentNode, 'dark');

    expect(documentNode.documentElement.dataset.theme).toBe('dark');
    expect(documentNode.documentElement.style.colorScheme).toBe('dark');
  });
});
