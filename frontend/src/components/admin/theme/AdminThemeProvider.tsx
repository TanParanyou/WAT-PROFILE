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

export type AdminThemeMode = "system" | "light" | "dark";
export type AdminResolvedTheme = "light" | "dark";

interface AdminThemeContextValue {
  theme: AdminThemeMode;
  resolvedTheme: AdminResolvedTheme;
  mounted: boolean;
  setTheme: (theme: AdminThemeMode) => void;
}

const STORAGE_KEY = "wat-admin-theme";
const THEME_ATTRIBUTE = "data-admin-theme";
const SYSTEM_DARK_QUERY = "(prefers-color-scheme: dark)";
const AdminThemeContext = createContext<AdminThemeContextValue | null>(null);

function isThemeMode(value: string | null): value is AdminThemeMode {
  return value === "system" || value === "light" || value === "dark";
}

function getStoredTheme(): AdminThemeMode {
  if (typeof window === "undefined") return "system";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isThemeMode(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

function getSystemTheme(): AdminResolvedTheme {
  return window.matchMedia(SYSTEM_DARK_QUERY).matches ? "dark" : "light";
}

function applyTheme(theme: AdminResolvedTheme) {
  const root = document.documentElement;
  root.setAttribute(THEME_ATTRIBUTE, theme);
  root.style.colorScheme = theme;
}

export function AdminThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AdminThemeMode>(getStoredTheme);
  const [resolvedTheme, setResolvedTheme] = useState<AdminResolvedTheme>(() => {
    const initialTheme = getStoredTheme();
    if (initialTheme === "system") {
      return typeof window === "undefined" ? "light" : getSystemTheme();
    }
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
    const handleSystemThemeChange = () =>
      setResolvedTheme(mediaQuery.matches ? "dark" : "light");
    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, [mounted, theme]);

  useEffect(() => {
    if (mounted) applyTheme(resolvedTheme);
  }, [mounted, resolvedTheme]);

  const setTheme = useCallback((nextTheme: AdminThemeMode) => {
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
    <AdminThemeContext.Provider value={value}>
      <AdminThemeScope>{children}</AdminThemeScope>
    </AdminThemeContext.Provider>
  );
}

function AdminThemeScope({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useAdminTheme();
  return (
    <div
      data-admin-theme={resolvedTheme}
      className="contents"
      suppressHydrationWarning
    >
      {children}
    </div>
  );
}

export function useAdminTheme() {
  const context = useContext(AdminThemeContext);
  if (!context) throw new Error("useAdminTheme must be used within AdminThemeProvider");
  return context;
}
