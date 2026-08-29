"use client";

import React, { useState, useEffect } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import type { LucideIcon } from "lucide-react";
import { Loading } from "@/components/ui/Loading";

export interface DonutDataItem {
  name: string;
  value: number;
  color: string;
  icon?: LucideIcon;
}

interface AnalyticsDonutChartProps {
  data: DonutDataItem[];
  title: string;
  icon?: LucideIcon;
  height?: number;
  isLoading?: boolean;
}

function CustomDonutTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: DonutDataItem; value: number }>;
}) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0].payload;

  return (
    <div className="bg-zinc-900 text-zinc-100 border border-zinc-700 p-2.5 shadow-xl text-xs space-y-1 z-50">
      <div className="flex items-center gap-2">
        <span
          className="w-2.5 h-2.5 inline-block shrink-0"
          style={{ backgroundColor: item.color }}
        />
        <span className="font-semibold">{item.name}</span>
      </div>
      <div className="font-mono text-zinc-300">
        {item.value.toLocaleString()} ครั้ง
      </div>
    </div>
  );
}

export function AnalyticsDonutChart({
  data,
  title,
  icon: HeaderIcon,
  height = 200,
  isLoading = false,
}: AnalyticsDonutChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-admin-surface border border-admin-border p-6 space-y-4 shadow-sm flex flex-col justify-between">
      <h3 className="text-sm font-semibold text-admin-foreground flex items-center gap-2">
        {HeaderIcon && <HeaderIcon size={16} className="text-admin-muted" />}
        <span>{title}</span>
      </h3>

      {isLoading || !mounted ? (
        <div style={{ height }} className="flex items-center justify-center">
          <Loading size="sm" />
        </div>
      ) : total === 0 ? (
        <div
          style={{ height }}
          className="flex items-center justify-center text-admin-muted text-xs"
        >
          ยังไม่มีข้อมูล
        </div>
      ) : (
        <div className="space-y-4">
          <div style={{ height, width: "100%" }} className="relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomDonutTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-base font-bold font-mono text-admin-foreground">
                {total.toLocaleString()}
              </span>
              <span className="text-[10px] text-admin-muted uppercase">รวม</span>
            </div>
          </div>

          {/* Breakdown Items with Progress Bars */}
          <div className="space-y-2.5 pt-2 border-t border-admin-border">
            {data.map((item) => {
              const ItemIcon = item.icon;
              const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;

              return (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-medium text-admin-foreground">
                      {ItemIcon ? (
                        <ItemIcon size={14} className="text-admin-muted shrink-0" />
                      ) : (
                        <span
                          className="w-2.5 h-2.5 inline-block shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                      )}
                      <span>{item.name}</span>
                    </span>
                    <span className="font-mono text-admin-muted">
                      {item.value.toLocaleString()} ({pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-admin-surface-muted border border-admin-border/40 overflow-hidden">
                    <div
                      style={{ width: `${pct}%`, backgroundColor: item.color }}
                      className="h-full transition-all"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
