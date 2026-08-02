"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

type PublicThemeMode = "system" | "light" | "dark";
type PublicResolvedTheme = "light" | "dark";

interface PublicThemeContextValue {
  theme: PublicThemeMode;
  resolvedTheme: PublicResolvedTheme;
  mounted: boolean;
  setTheme: (theme: PublicThemeMode) => void;
}

const STORAGE_KEY = "wat-public-theme";
const THEME_ATTRIBUTE = "data-public-theme";
const SYSTEM_DARK_QUERY = "(prefers-color-scheme: dark)";

const PublicThemeContext = createContext<PublicThemeContextValue | null>(null);

function isThemeMode(value: string | null): value is PublicThemeMode {
  return value === "system" || value === "light" || value === "dark";
}

function getStoredTheme(): PublicThemeMode {
  if (typeof window === "undefined") return "system";

  try {
    const storedTheme = window.localStorage.getItem(STORAGE_KEY);
    return isThemeMode(storedTheme) ? storedTheme : "system";
  } catch {
    return "system";
  }
}

function getSystemTheme(): PublicResolvedTheme {
  return window.matchMedia(SYSTEM_DARK_QUERY).matches ? "dark" : "light";
}

function applyTheme(theme: PublicResolvedTheme) {
  const root = document.documentElement;
  root.setAttribute(THEME_ATTRIBUTE, theme);
  root.style.colorScheme = theme;
}

export function PublicThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<PublicThemeMode>(getStoredTheme);
  const [resolvedTheme, setResolvedTheme] = useState<PublicResolvedTheme>(() => {
    const initialTheme = getStoredTheme();
    if (initialTheme === "system") return typeof window !== "undefined" ? getSystemTheme() : "light";
    return initialTheme;
  });
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!mounted || theme !== "system") return;

    const mediaQuery = window.matchMedia(SYSTEM_DARK_QUERY);
    const handleSystemThemeChange = () => setResolvedTheme(mediaQuery.matches ? "dark" : "light");

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, [mounted, theme]);

  useEffect(() => {
    if (!mounted) return;
    applyTheme(resolvedTheme);
  }, [mounted, resolvedTheme]);

  const setTheme = useCallback((nextTheme: PublicThemeMode) => {
    setThemeState(nextTheme);
    setResolvedTheme(nextTheme === "system" ? getSystemTheme() : nextTheme);
    try {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // Keep the in-memory choice when browser storage is unavailable.
    }
  }, []);

  const value = useMemo(
    () => ({ theme, resolvedTheme, mounted, setTheme }),
    [mounted, resolvedTheme, setTheme, theme],
  );

  return (
    <PublicThemeContext.Provider value={value}>
      {children}
    </PublicThemeContext.Provider>
  );
}

export function usePublicTheme() {
  const context = useContext(PublicThemeContext);
  if (!context) throw new Error("usePublicTheme must be used within PublicThemeProvider");
  return context;
}

export type { PublicResolvedTheme, PublicThemeContextValue, PublicThemeMode };
