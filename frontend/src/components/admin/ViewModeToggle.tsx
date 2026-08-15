"use client";

import React from "react";
import { LayoutGrid, LayoutList } from "lucide-react";
import { useTranslations } from "next-intl";

export type ViewMode = "grid" | "table";

interface ViewModeToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
}

export function ViewModeToggle({
  value,
  onChange,
  className = "",
}: ViewModeToggleProps) {
  const t = useTranslations("Admin");

  return (
    <div
      className={`flex items-center rounded-none border border-admin-border bg-admin-surface p-0.5 ${className}`}
      role="group"
      aria-label="View mode toggle"
    >
      <button
        type="button"
        onClick={() => onChange("grid")}
        className={`p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-none transition-colors ${
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
        className={`p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-none transition-colors ${
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
