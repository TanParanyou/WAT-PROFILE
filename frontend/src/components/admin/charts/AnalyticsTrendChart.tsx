"use client";

import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { TrendingUp, Eye, Users } from "lucide-react";
import type { TrendDataPoint } from "@/types/analytics";
import { Loading } from "@/components/ui/Loading";

interface AnalyticsTrendChartProps {
  data: TrendDataPoint[];
  title?: string;
  description?: string;
  height?: number;
  isLoading?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-zinc-900 text-zinc-100 border border-zinc-700 p-3 shadow-xl rounded-none text-xs space-y-1.5 min-w-[170px] z-50">
      <div className="font-semibold text-zinc-300 border-b border-zinc-800 pb-1 font-mono">
        {label}
      </div>
      <div className="space-y-1 pt-0.5">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <span
                className="w-2.5 h-2.5 rounded-none inline-block"
                style={{ backgroundColor: entry.color }}
              />
              <span>{entry.name}:</span>
            </span>
            <span className="font-mono font-bold text-white">
              {entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnalyticsTrendChart({
  data,
  title = "แนวโน้มจำนวนผู้เข้าชม (Visitor Trends)",
  description = "สถิติเปรียบเทียบระหว่างจำนวนการเปิดหน้า (Pageviews) และผู้เข้าชมที่ไม่ซ้ำ (Unique Visitors)",
  height = 300,
  isLoading = false,
}: AnalyticsTrendChartProps) {
  // Prevent SSR layout shift / hydration issues with ResponsiveContainer
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="bg-admin-surface border border-admin-border p-6 space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-admin-border pb-4">
        <div>
          <h3 className="text-base font-semibold text-admin-foreground flex items-center gap-2">
            <TrendingUp size={18} className="text-admin-action" />
            <span>{title}</span>
          </h3>
          {description && (
            <p className="text-xs text-admin-muted mt-0.5">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 bg-amber-600 inline-block" />
            <span className="text-admin-foreground">Pageviews</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 bg-sky-500 inline-block" />
            <span className="text-admin-foreground">Unique Visitors</span>
          </span>
        </div>
      </div>

      {isLoading || !mounted ? (
        <div style={{ height }} className="flex items-center justify-center">
          <Loading size="md" />
        </div>
      ) : data.length === 0 ? (
        <div
          style={{ height }}
          className="flex flex-col items-center justify-center text-admin-muted text-sm"
        >
          <TrendingUp size={32} className="opacity-30 mb-2" />
          <p>ยังไม่มีข้อมูลสถิติในช่วงเวลานี้</p>
        </div>
      ) : (
        <div style={{ height, width: "100%" }} className="pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                {/* Gradient for Pageviews */}
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d97706" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#d97706" stopOpacity={0.0} />
                </linearGradient>
                {/* Gradient for Unique Visitors */}
                <linearGradient id="colorUnique" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#888888"
                opacity={0.15}
              />
              <XAxis
                dataKey="date"
                tickFormatter={(val: string) => val.slice(5)} // MM-DD
                tick={{ fontSize: 11, fill: "#888888" }}
                axisLine={{ stroke: "#888888", opacity: 0.2 }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#888888" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="views"
                name="Pageviews"
                stroke="#d97706"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorViews)"
                activeDot={{ r: 5, fill: "#d97706", stroke: "#fff", strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="unique_visitors"
                name="Unique Visitors"
                stroke="#0ea5e9"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorUnique)"
                activeDot={{ r: 5, fill: "#0ea5e9", stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
