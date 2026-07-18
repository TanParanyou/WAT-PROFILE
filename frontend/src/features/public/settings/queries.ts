import { useQuery } from "@tanstack/react-query";
import { shouldRetryPublicQuery } from "../shared/query-error";
import { fetchPublicSiteSettings } from "./api";

export const publicSiteSettingsKeys = {
  all: ["public", "site-settings"] as const,
  current: () => [...publicSiteSettingsKeys.all, "current"] as const,
};

export function usePublicSiteSettingsQuery() {
  return useQuery({
    queryKey: publicSiteSettingsKeys.current(),
    queryFn: fetchPublicSiteSettings,
    staleTime: 300_000,
    retry: shouldRetryPublicQuery,
  });
}
