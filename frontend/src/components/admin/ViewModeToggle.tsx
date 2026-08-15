"use client";

import React from "react";
import { LayoutGrid, LayoutList } from "lucide-react";
import { useTranslations } from "next-intl";

export type ViewMode = "grid" | "table";

interface ViewModeToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
  size?: "sm" | "md";
}

export function ViewModeToggle({
  value,
  onChange,
  className = "",
  size = "md",
}: ViewModeToggleProps) {
  const t = useTranslations("Admin");

  const heightClass = size === "sm" ? "h-9 min-h-9" : "h-11 min-h-11";
  const btnPadding = size === "sm" ? "px-2.5 min-w-[34px]" : "px-3 min-w-10";

  return (
    <div
      className={`inline-flex items-stretch rounded-none border border-admin-border bg-admin-surface p-0.5 ${heightClass} ${className}`}
      role="group"
      aria-label="View mode toggle"
    >
      <button
        type="button"
        onClick={() => onChange("grid")}
        className={`h-full flex items-center justify-center rounded-none transition-colors focus-visible:outline-2 focus-visible:outline-admin-focus ${btnPadding} ${
          value === "grid"
            ? "bg-admin-action text-admin-on-action font-medium"
            : "text-admin-muted hover:text-admin-foreground hover:bg-admin-surface-muted"
        }`}
        title={t("gallery.gridView")}
        aria-pressed={value === "grid"}
      >
        <LayoutGrid size={16} />
      </button>
      <button
        type="button"
        onClick={() => onChange("table")}
        className={`h-full flex items-center justify-center rounded-none transition-colors focus-visible:outline-2 focus-visible:outline-admin-focus ${btnPadding} ${
          value === "table"
            ? "bg-admin-action text-admin-on-action font-medium"
            : "text-admin-muted hover:text-admin-foreground hover:bg-admin-surface-muted"
        }`}
        title={t("gallery.tableView")}
        aria-pressed={value === "table"}
      >
        <LayoutList size={16} />
      </button>
    </div>
  );
}
