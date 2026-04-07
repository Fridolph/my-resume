import { render, screen, cleanup } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  THEME_STORAGE_KEY,
  ThemeModeProvider,
  applyThemeToDocument,
  normalizeThemeMode,
  readDocumentTheme,
  readStoredTheme,
  useThemeMode,
  writeStoredTheme,
} from './theme';

describe('theme helpers', () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    document.documentElement.dataset.theme = 'light';
    document.documentElement.classList.remove('dark');
  });

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

  it('should read an existing document theme before client hydration', () => {
    expect(
      readDocumentTheme({
        documentElement: {
          dataset: {
            theme: 'dark',
          } as DOMStringMap,
        },
      }),
    ).toBe('dark');

    expect(
      readDocumentTheme({
        documentElement: {
          dataset: {
            theme: 'system',
          } as DOMStringMap,
        },
      }),
    ).toBeNull();
  });

  it('should initialize the provider from stored theme before the first effect', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    document.documentElement.dataset.theme = 'light';

    function ThemeReader() {
      const { theme } = useThemeMode();

      return createElement('div', { 'data-testid': 'theme-mode' }, theme);
    }

    render(createElement(ThemeModeProvider, null, createElement(ThemeReader)));

    expect(screen.getByTestId('theme-mode')).toHaveTextContent('dark');
  });
});
