'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export const THEME_STORAGE_KEY = 'my-resume-theme-mode';

export type ThemeMode = 'light' | 'dark';

export function normalizeThemeMode(value?: string | null): ThemeMode {
  return value === 'dark' ? 'dark' : 'light';
}

export function readStoredTheme(
  storage: Pick<Storage, 'getItem'> | null | undefined,
  storageKey = THEME_STORAGE_KEY,
): ThemeMode | null {
  const rawValue = storage?.getItem(storageKey);

  if (!rawValue) {
    return null;
  }

  return normalizeThemeMode(rawValue);
}

export function writeStoredTheme(
  storage: Pick<Storage, 'setItem'> | null | undefined,
  theme: ThemeMode,
  storageKey = THEME_STORAGE_KEY,
): void {
  storage?.setItem(storageKey, theme);
}

export function applyThemeToDocument(
  documentNode:
    | {
        documentElement: {
          dataset: DOMStringMap;
          style: Pick<CSSStyleDeclaration, 'colorScheme'>;
          classList?: Pick<DOMTokenList, 'add' | 'remove'>;
        };
      }
    | null
    | undefined,
  theme: ThemeMode,
): void {
  if (!documentNode) {
    return;
  }

  documentNode.documentElement.dataset.theme = theme;
  documentNode.documentElement.style.colorScheme = theme;
  if (theme === 'dark') {
    documentNode.documentElement.classList?.add('dark');
    return;
  }

  documentNode.documentElement.classList?.remove('dark');
}

interface ThemeModeContextValue {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

export function ThemeModeProvider({
  children,
  defaultTheme = 'light',
  storageKey = THEME_STORAGE_KEY,
}: {
  children: ReactNode;
  defaultTheme?: ThemeMode;
  storageKey?: string;
}) {
  const [theme, setTheme] = useState<ThemeMode>(defaultTheme);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const resolvedTheme =
      readStoredTheme(window.localStorage, storageKey) ??
      normalizeThemeMode(document.documentElement.dataset.theme) ??
      defaultTheme;

    setTheme(resolvedTheme);
    applyThemeToDocument(document, resolvedTheme);
    setReady(true);
  }, [defaultTheme, storageKey]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    applyThemeToDocument(document, theme);
    writeStoredTheme(window.localStorage, theme, storageKey);
  }, [ready, storageKey, theme]);

  const contextValue = useMemo<ThemeModeContextValue>(
    () => ({
      theme,
      setTheme,
    }),
    [theme],
  );

  return (
    <ThemeModeContext.Provider value={contextValue}>
      {children}
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode(): ThemeModeContextValue {
  const contextValue = useContext(ThemeModeContext);

  if (!contextValue) {
    throw new Error('useThemeMode must be used within ThemeModeProvider');
  }

  return contextValue;
}
