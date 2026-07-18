import { useQuery } from "@tanstack/react-query";
import { fetchPublicEventBySlug, fetchPublicEvents, fetchPublicSchedules } from "./api";
import { shouldRetryPublicQuery } from "../shared/query-error";
import type { PublicEventDto } from "./types";

export const publicEventsKeys = {
  all: ["public", "events"] as const,
  list: (limit?: number) => [...publicEventsKeys.all, "list", limit ?? "all"] as const,
  detail: (slug: string) => [...publicEventsKeys.all, "detail", slug] as const,
  schedules: (type?: string) => [...publicEventsKeys.all, "schedules", type ?? "all"] as const,
};

export function usePublicEventsQuery(limit?: number) {
  return useQuery({
    queryKey: publicEventsKeys.list(limit),
    queryFn: () => fetchPublicEvents(limit),
    staleTime: 60_000,
    retry: shouldRetryPublicQuery,
  });
}

export function usePublicEventQuery(slug: string, initialData?: PublicEventDto) {
  return useQuery({
    queryKey: publicEventsKeys.detail(slug),
    queryFn: () => fetchPublicEventBySlug(slug),
    enabled: Boolean(slug),
    retry: shouldRetryPublicQuery,
    initialData,
    staleTime: 60_000,
  });
}

export function usePublicSchedulesQuery(type?: string) {
  return useQuery({
    queryKey: publicEventsKeys.schedules(type),
    queryFn: () => fetchPublicSchedules(type),
    staleTime: 60_000,
    retry: shouldRetryPublicQuery,
  });
}
