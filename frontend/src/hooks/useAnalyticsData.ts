"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { analyticsAdminService } from "@/services/analyticsAdminService";

export type AnalyticsTimeRange = "7d" | "30d" | "90d" | "custom";

export interface UseAnalyticsOptions {
  timeRange?: AnalyticsTimeRange;
  resourceType?: string;
  resourceId?: string | number;
  from?: string;
  to?: string;
  topLimit?: number;
  enabled?: boolean;
}

export function useAnalyticsData(options: UseAnalyticsOptions = {}) {
  const {
    timeRange = "30d",
    resourceType,
    resourceId,
    from: customFrom,
    to: customTo,
    topLimit = 10,
    enabled = true,
  } = options;

  const dateParams = useMemo(() => {
    if (timeRange === "custom" && customFrom && customTo) {
      return { from: customFrom, to: customTo };
    }

    const to = new Date().toISOString().split("T")[0];
    const d = new Date();
    if (timeRange === "7d") d.setDate(d.getDate() - 6);
    else if (timeRange === "30d") d.setDate(d.getDate() - 29);
    else if (timeRange === "90d") d.setDate(d.getDate() - 89);
    const from = d.toISOString().split("T")[0];

    return { from, to };
  }, [timeRange, customFrom, customTo]);

  // Query 1: Overview
  const overviewQuery = useQuery({
    queryKey: ["admin", "analytics", "overview", dateParams],
    queryFn: () => analyticsAdminService.getOverview(dateParams),
    enabled,
    staleTime: 60 * 1000, // 1 minute
  });

  // Query 2: Trends
  const trendsQuery = useQuery({
    queryKey: ["admin", "analytics", "trends", resourceType, dateParams],
    queryFn: () =>
      analyticsAdminService.getTrends({
        resource_type: resourceType,
        ...dateParams,
      }),
    enabled,
    staleTime: 60 * 1000,
  });

  // Query 3: Top Resources
  const topResourcesQuery = useQuery({
    queryKey: ["admin", "analytics", "top-resources", resourceType, topLimit, dateParams],
    queryFn: () =>
      analyticsAdminService.getTopResources({
        resource_type: resourceType,
        limit: topLimit,
        ...dateParams,
      }),
    enabled,
    staleTime: 60 * 1000,
  });

  // Query 4: Resource Specific Stats (if resourceType and resourceId provided)
  const resourceStatsQuery = useQuery({
    queryKey: ["admin", "analytics", "resource", resourceType, resourceId, dateParams],
    queryFn: () =>
      analyticsAdminService.getResourceStats(resourceType!, resourceId!, dateParams),
    enabled: enabled && Boolean(resourceType && resourceId),
    staleTime: 60 * 1000,
  });

  const isLoading =
    overviewQuery.isLoading ||
    trendsQuery.isLoading ||
    topResourcesQuery.isLoading ||
    (Boolean(resourceType && resourceId) && resourceStatsQuery.isLoading);

  const isFetching =
    overviewQuery.isFetching ||
    trendsQuery.isFetching ||
    topResourcesQuery.isFetching ||
    resourceStatsQuery.isFetching;

  const isError =
    overviewQuery.isError ||
    trendsQuery.isError ||
    topResourcesQuery.isError ||
    resourceStatsQuery.isError;

  const refetch = async () => {
    await Promise.all([
      overviewQuery.refetch(),
      trendsQuery.refetch(),
      topResourcesQuery.refetch(),
      Boolean(resourceType && resourceId) ? resourceStatsQuery.refetch() : Promise.resolve(),
    ]);
  };

  return {
    overview: overviewQuery.data ?? null,
    trends: trendsQuery.data ?? [],
    topItems: topResourcesQuery.data ?? [],
    resourceStats: resourceStatsQuery.data ?? null,
    isLoading,
    isFetching,
    isError,
    refetch,
    dateParams,
  };
}
