"use client";

import React, { useState } from "react";
import { Eye, Users, TrendingUp, BarChart2 } from "lucide-react";
import { useAnalyticsData, type AnalyticsTimeRange } from "@/hooks/useAnalyticsData";
import { AnalyticsTrendChart } from "./AnalyticsTrendChart";
import { AnalyticsStatCard } from "./AnalyticsStatCard";

interface EntityAnalyticsWidgetProps {
  resourceType: string;
  resourceId: string | number;
  title?: string;
}

export function EntityAnalyticsWidget({
  resourceType,
  resourceId,
  title = "สถิติการเข้าชมหน้านี้ (Pageview & Engagement)",
}: EntityAnalyticsWidgetProps) {
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>("30d");

  const {
    resourceStats,
    trends,
    isLoading,
  } = useAnalyticsData({
    resourceType,
    resourceId,
    timeRange,
    enabled: Boolean(resourceType && resourceId),
  });

  return (
    <div className="bg-admin-surface border border-admin-border p-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-admin-border pb-3">
        <div className="flex items-center gap-2">
          <BarChart2 size={18} className="text-admin-action" />
          <h4 className="text-sm font-semibold text-admin-foreground">{title}</h4>
        </div>
        <div className="inline-flex border border-admin-border bg-admin-surface p-0.5">
          {(["7d", "30d", "90d"] as AnalyticsTimeRange[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setTimeRange(r)}
              className={`px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                timeRange === r
                  ? "bg-admin-action text-admin-on-action"
                  : "text-admin-muted hover:text-admin-foreground"
              }`}
            >
              {r === "7d" ? "7 วัน" : r === "30d" ? "30 วัน" : "90 วัน"}
            </button>
          ))}
        </div>
      </div>

      {/* Mini KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <AnalyticsStatCard
          label="ยอดเข้าชมทั้งหมด"
          value={resourceStats?.total_views ?? 0}
          icon={Eye}
          variant="primary"
          isLoading={isLoading}
        />
        <AnalyticsStatCard
          label="ผู้เข้าชม (Unique)"
          value={resourceStats?.unique_visitors ?? 0}
          icon={Users}
          variant="info"
          isLoading={isLoading}
        />
        <div className="bg-admin-surface border border-admin-border p-3 flex flex-col justify-center">
          <span className="text-[11px] text-admin-muted">ภาษาที่เปิดดูสูงสุด</span>
          <div className="text-sm font-bold text-admin-foreground mt-1 flex items-center gap-2 font-mono">
            {resourceStats?.locale_breakdown
              ? Object.entries(resourceStats.locale_breakdown)
                  .sort((a, b) => b[1] - a[1])
                  .map(([lang, count]) => (
                    <span
                      key={lang}
                      className="px-1.5 py-0.5 bg-admin-surface-muted border border-admin-border text-xs uppercase"
                    >
                      {lang}: {count}
                    </span>
                  ))
              : "—"}
          </div>
        </div>
      </div>

      {/* Compact Recharts Trend Chart */}
      <AnalyticsTrendChart
        data={resourceStats?.daily_trends || trends}
        title="แนวโน้มผู้เข้าชมตามช่วงเวลา"
        description=""
        height={220}
        isLoading={isLoading}
      />
    </div>
  );
}
