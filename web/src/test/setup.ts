const ensureLocalStorage = () => {
  const current = (globalThis as { localStorage?: unknown }).localStorage as {
    getItem?: (key: string) => string | null;
    setItem?: (key: string, value: string) => void;
    removeItem?: (key: string) => void;
    clear?: () => void;
  } | undefined;

  if (current && typeof current.getItem === 'function' && typeof current.setItem === 'function' && typeof current.removeItem === 'function' && typeof current.clear === 'function') {
    return;
  }

  const state = new Map<string, string>();

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => state.get(key) ?? null,
      setItem: (key: string, value: string) => {
        state.set(key, value);
      },
      removeItem: (key: string) => {
        state.delete(key);
      },
      clear: () => {
        state.clear();
      },
    },
  });
};

ensureLocalStorage();
