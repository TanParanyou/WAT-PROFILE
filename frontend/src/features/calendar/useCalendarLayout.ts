"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { CalendarView } from "./core/types";
import type { CalendarLayout, CalendarResponsiveLayouts } from "./presets/types";

function subscribeToMediaQuery(query: string, callback: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => undefined;

  const mediaQuery = window.matchMedia(query);
  const listener = () => callback();
  mediaQuery.addEventListener("change", listener);

  return () => mediaQuery.removeEventListener("change", listener);
}

export function useCalendarLayout(
  view: CalendarView,
  layouts: CalendarResponsiveLayouts,
): CalendarLayout {
  const query = useMemo(
    () => `(max-width: ${layouts.mobileBreakpoint - 1}px)`,
    [layouts.mobileBreakpoint],
  );
  const subscribe = useCallback(
    (callback: () => void) => subscribeToMediaQuery(query, callback),
    [query],
  );
  const getSnapshot = useCallback(
    () => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(query).matches,
    [query],
  );
  const isMobile = useSyncExternalStore(subscribe, getSnapshot, () => false);

  return isMobile ? layouts.mobile[view] : layouts.desktop[view];
}
