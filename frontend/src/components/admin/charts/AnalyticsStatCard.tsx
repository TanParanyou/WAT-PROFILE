"use client";

import React from "react";
import type { LucideIcon } from "lucide-react";
import { Loading } from "@/components/ui/Loading";

interface AnalyticsStatCardProps {
  label: string;
  value: number | string;
  subValue?: string;
  icon: LucideIcon;
  variant?: "primary" | "info" | "warning" | "success";
  isLoading?: boolean;
}

export function AnalyticsStatCard({
  label,
  value,
  subValue,
  icon: Icon,
  variant = "primary",
  isLoading = false,
}: AnalyticsStatCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "info":
        return "text-sky-500 bg-sky-500/10 border-sky-500/20";
      case "warning":
        return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      case "success":
        return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
      default:
        return "text-admin-action bg-admin-selected border-admin-border";
    }
  };

  return (
    <div className="bg-admin-surface border border-admin-border p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-admin-muted truncate">{label}</span>
        <div
          className={`h-8 w-8 flex items-center justify-center border ${getVariantStyles()}`}
        >
          <Icon size={16} />
        </div>
      </div>
      {isLoading ? (
        <Loading size="sm" />
      ) : (
        <>
          <div className="text-2xl font-bold font-mono text-admin-foreground">
            {typeof value === "number" ? value.toLocaleString() : value}
          </div>
          {subValue && (
            <p className="text-[11px] text-admin-muted mt-1 truncate">{subValue}</p>
          )}
        </>
      )}
    </div>
  );
}
