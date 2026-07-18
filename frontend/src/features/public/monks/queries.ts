import { useQuery } from "@tanstack/react-query";
import { fetchPublicMonkBySlug, fetchPublicMonks } from "./api";
import { shouldRetryPublicQuery } from "../shared/query-error";
import type { PublicMonkDto } from "./types";

export const publicMonksKeys = {
  all: ["public", "monks"] as const,
  list: () => [...publicMonksKeys.all, "list"] as const,
  detail: (slug: string) => [...publicMonksKeys.all, "detail", slug] as const,
};

export function usePublicMonksQuery() {
  return useQuery({
    queryKey: publicMonksKeys.list(),
    queryFn: fetchPublicMonks,
    staleTime: 60_000,
    retry: shouldRetryPublicQuery,
  });
}

export function usePublicMonkQuery(slug: string, initialData?: PublicMonkDto) {
  return useQuery({
    queryKey: publicMonksKeys.detail(slug),
    queryFn: () => fetchPublicMonkBySlug(slug),
    enabled: Boolean(slug),
    initialData,
    staleTime: 60_000,
    retry: shouldRetryPublicQuery,
  });
}
