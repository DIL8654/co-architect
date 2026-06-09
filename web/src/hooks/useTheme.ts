import { useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

const storageKey = 'coarchitect.theme';

function getInitialTheme(): ThemeMode {
  try {
    const stored = window.localStorage.getItem(storageKey);
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'dark';
  } catch {
    return 'dark';
  }
}

function applyTheme(mode: ThemeMode) {
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
  const useDark = mode === 'dark' || (mode === 'system' && prefersDark);
  document.documentElement.classList.toggle('dark', useDark);
  document.documentElement.dataset.theme = mode;
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
    try {
      window.localStorage.setItem(storageKey, theme);
    } catch {
      // Theme still applies for the current session when storage is unavailable.
    }
  }, [theme]);

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!media) {
      return undefined;
    }

    const listener = () => {
      if (theme === 'system') {
        applyTheme(theme);
      }
    };

    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [theme]);

  return { theme, setTheme: setThemeState };
}
