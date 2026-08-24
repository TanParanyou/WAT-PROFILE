"use client";

import { createContext, useContext, useMemo } from "react";
import { getFallbackPublicSiteSettings, mapPublicSiteSettings } from "./mapper";
import { usePublicSiteSettingsQuery } from "./queries";
import type { PublicSiteSettings } from "./types";

const PublicSiteSettingsContext = createContext<PublicSiteSettings | null>(null);

export function PublicSiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const query = usePublicSiteSettingsQuery();
  const settings = useMemo(
    () => mapPublicSiteSettings(query.data ?? {}, getFallbackPublicSiteSettings()),
    [query.data],
  );

  return <PublicSiteSettingsContext.Provider value={settings}>{children}</PublicSiteSettingsContext.Provider>;
}

export function usePublicSiteSettings(): PublicSiteSettings {
  const settings = useContext(PublicSiteSettingsContext);
  return settings ?? getFallbackPublicSiteSettings();
}
