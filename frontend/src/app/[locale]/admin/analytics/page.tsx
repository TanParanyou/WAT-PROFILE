"use client";

import React, { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  BarChart3,
  Users,
  Eye,
  Calendar,
  Sparkles,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  TrendingUp,
  RefreshCw,
  Clock,
  Layers,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Loading } from "@/components/ui/Loading";
import {
  useAnalyticsData,
  type AnalyticsTimeRange,
} from "@/hooks/useAnalyticsData";
import {
  AnalyticsTrendChart,
  AnalyticsDonutChart,
  AnalyticsStatCard,
  type DonutDataItem,
} from "@/components/admin/charts";

type ResourceTab = "all" | "event" | "news" | "chanting" | "monk" | "page";

export default function AnalyticsPage() {
  const t = useTranslations("Admin");

  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>("30d");
  const [activeTab, setActiveTab] = useState<ResourceTab>("all");

  const {
    overview,
    trends,
    topItems,
    isLoading,
    isFetching,
    refetch,
  } = useAnalyticsData({
    timeRange,
    resourceType: activeTab === "all" ? undefined : activeTab,
    topLimit: 10,
  });

  // Prepare Donut Data for Devices
  const deviceDonutData: DonutDataItem[] = useMemo(() => {
    const bd = overview?.device_breakdown || {};
    return [
      {
        name: "Desktop / PC",
        value: bd.desktop || 0,
        color: "#d97706",
        icon: Monitor,
      },
      {
        name: "Mobile / Phone",
        value: bd.mobile || 0,
        color: "#0ea5e9",
        icon: Smartphone,
      },
      {
        name: "Tablet / iPad",
        value: bd.tablet || 0,
        color: "#8b5cf6",
        icon: Tablet,
      },
    ].filter((item) => item.value > 0);
  }, [overview]);

  // Prepare Donut Data for Languages
  const localeDonutData: DonutDataItem[] = useMemo(() => {
    const bd = overview?.locale_breakdown || {};
    return [
      {
        name: "ภาษาไทย (TH)",
        value: bd.th || 0,
        color: "#10b981",
        icon: Globe,
      },
      {
        name: "English (EN)",
        value: bd.en || 0,
        color: "#3b82f6",
        icon: Globe,
      },
      {
        name: "Deutsch (DE)",
        value: bd.de || 0,
        color: "#f59e0b",
        icon: Globe,
      },
    ].filter((item) => item.value > 0);
  }, [overview]);

  const getResourceBadge = (type: string) => {
    switch (type) {
      case "event":
        return {
          label: t("analytics.tabs.events") || "กิจกรรม",
          color:
            "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200",
        };
      case "news":
        return {
          label: t("analytics.tabs.news") || "ข่าวสาร",
          color:
            "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200",
        };
      case "chanting":
        return {
          label: t("analytics.tabs.chanting") || "บทสวดมนต์",
          color:
            "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200",
        };
      case "monk":
        return {
          label: t("analytics.tabs.monks") || "พระสงฆ์",
          color:
            "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200",
        };
      default:
        return {
          label: t("analytics.tabs.pages") || "หน้าเว็บ",
          color:
            "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border-zinc-200",
        };
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("analytics.title") || "สถิติผู้เข้าชมเว็บไซต์ (Visitor Analytics)"}
        breadcrumbs={[
          { label: t("dashboard.title") || "Dashboard", href: "/admin" },
          { label: t("analytics.title") || "สถิติผู้เข้าชม" },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Time Range Selector */}
            <div className="inline-flex border border-admin-border bg-admin-surface p-0.5 shadow-sm">
              {(["7d", "30d", "90d"] as AnalyticsTimeRange[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setTimeRange(r)}
                  className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                    timeRange === r
                      ? "bg-admin-action text-admin-on-action"
                      : "text-admin-muted hover:text-admin-foreground"
                  }`}
                >
                  {r === "7d" ? "7 วัน" : r === "30d" ? "30 วัน" : "90 วัน"}
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex min-h-10 items-center gap-1.5 border border-admin-border bg-admin-surface px-3 py-1.5 text-xs font-semibold text-admin-foreground hover:bg-admin-surface-muted transition-colors disabled:opacity-50 shadow-sm"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
              <span className="hidden sm:inline">รีเฟรช</span>
            </button>
          </div>
        }
      />

      {/* Summary KPI Cards using Reusable AnalyticsStatCard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsStatCard
          label={t("analytics.periodViews") || "ยอดเข้าชม (ช่วงเวลานี้)"}
          value={overview?.period_views ?? 0}
          subValue={`ทั้งหมดตลอดกาล: ${(overview?.total_views ?? 0).toLocaleString()} ครั้ง`}
          icon={Eye}
          variant="primary"
          isLoading={isLoading}
        />
        <AnalyticsStatCard
          label={t("analytics.periodUniqueVisitors") || "ผู้เข้าชมที่ไม่ซ้ำ (ช่วงนี้)"}
          value={overview?.period_unique_visitors ?? 0}
          subValue={`ทั้งหมดตลอดกาล: ${(overview?.unique_visitors ?? 0).toLocaleString()} คน`}
          icon={Users}
          variant="info"
          isLoading={isLoading}
        />
        <AnalyticsStatCard
          label={t("analytics.todayViews") || "ยอดเข้าชมวันนี้"}
          value={overview?.today_views ?? 0}
          subValue="อัปเดตแบบ Real-time"
          icon={TrendingUp}
          variant="warning"
          isLoading={isLoading}
        />
        <AnalyticsStatCard
          label={t("analytics.todayUnique") || "ผู้เข้าชมวันนี้ (ไม่ซ้ำ)"}
          value={overview?.today_unique_visitors ?? 0}
          subValue="เข้ารหัสตามมาตรฐาน GDPR/PDPA"
          icon={Sparkles}
          variant="success"
          isLoading={isLoading}
        />
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 border-b border-admin-border overflow-x-auto pb-px">
        {[
          { key: "all", label: t("analytics.tabs.all") || "ภาพรวมทั้งหมด", icon: Layers },
          { key: "event", label: t("analytics.tabs.events") || "กิจกรรม (Events)", icon: Calendar },
          { key: "news", label: t("analytics.tabs.news") || "ข่าวสาร (News)", icon: BarChart3 },
          { key: "chanting", label: t("analytics.tabs.chanting") || "บทสวดมนต์", icon: Globe },
          { key: "monk", label: t("analytics.tabs.monks") || "พระสงฆ์", icon: Users },
          { key: "page", label: t("analytics.tabs.pages") || "หน้าเว็บทั่วไป", icon: Globe },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as ResourceTab)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? "border-admin-action text-admin-action bg-admin-surface"
                  : "border-transparent text-admin-muted hover:text-admin-foreground hover:border-admin-border"
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Interactive Recharts Trend Chart */}
      <AnalyticsTrendChart
        data={trends}
        title={t("analytics.trendTitle") || "แนวโน้มจำนวนผู้เข้าชม (Daily Visitor Trends)"}
        description="กราฟเส้น Area Curve แสดงจำนวนการเปิดหน้า (Pageviews) และผู้เข้าชมที่ไม่ซ้ำ (Unique Visitors) รายวัน"
        height={320}
        isLoading={isLoading}
      />

      {/* 2-Column Section: Top Content & Recharts Donut Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Top Content Table (7 Cols) */}
        <div className="lg:col-span-7 bg-admin-surface border border-admin-border flex flex-col shadow-sm">
          <div className="px-6 py-4 border-b border-admin-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-admin-foreground">
                {t("analytics.topContentTitle") || "หน้าที่ได้รับความนิยมสูงสุด (Top Visited Content)"}
              </h3>
              <p className="text-xs text-admin-muted mt-0.5">
                เรียงตามจำนวนครั้งที่เปิดดูในช่วงเวลานี้
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            {isLoading ? (
              <div className="py-16 flex justify-center">
                <Loading size="md" />
              </div>
            ) : topItems.length === 0 ? (
              <div className="py-16 text-center text-admin-muted text-sm">
                ยังไม่มีข้อมูลการเข้าชม
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-admin-surface-muted border-b border-admin-border text-admin-muted uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">หมวดหมู่</th>
                    <th className="py-3 px-4">ชื่อหน้า / Path</th>
                    <th className="py-3 px-4 text-right">ยอดเข้าชม (Views)</th>
                    <th className="py-3 px-4 text-right">ผู้เข้าชม (Unique)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border">
                  {topItems.map((item, idx) => {
                    const badge = getResourceBadge(item.resource_type);
                    const displayName = item.title || item.path;

                    return (
                      <tr key={idx} className="hover:bg-admin-surface-muted/50 transition-colors">
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 text-[10px] font-semibold border ${badge.color}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-[220px] truncate">
                          <div className="font-medium text-admin-foreground truncate" title={displayName}>
                            {displayName}
                          </div>
                          <div className="text-[10px] text-admin-muted font-mono truncate" title={item.path}>
                            {item.path}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-admin-foreground">
                          {item.views.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-admin-muted">
                          {item.unique_visitors.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Col: 2 Recharts Donut Charts (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <AnalyticsDonutChart
            title={t("analytics.devicesTitle") || "อุปกรณ์ที่ใช้เข้าชม (Devices)"}
            data={deviceDonutData}
            icon={Monitor}
            height={160}
            isLoading={isLoading}
          />

          <AnalyticsDonutChart
            title={t("analytics.localesTitle") || "ภาษาที่เปิดดู (Languages)"}
            data={localeDonutData}
            icon={Globe}
            height={160}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
