"use client";

import React from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

export interface AdminActiveFilterChip {
  key: string;
  value: string;
  label: string;
}

export interface AdminActiveFilterChipsProps {
  filters: AdminActiveFilterChip[];
  onRemove(key: string, value: string): void;
  onClear(): void;
}

export function AdminActiveFilterChips({
  filters,
  onRemove,
  onClear,
}: AdminActiveFilterChipsProps) {
  const t = useTranslations("admin.list");

  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-admin-border">
      {filters.map((chip, index) => (
        <span
          key={`${chip.key}-${chip.value}-${index}`}
          className="inline-flex items-center gap-1.5 rounded-none bg-admin-selected px-3 py-1 text-xs font-medium text-admin-selected-foreground border border-admin-control-border"
        >
          <span>{chip.label}</span>
          <button
            type="button"
            onClick={() => onRemove(chip.key, chip.value)}
            aria-label={`ลบ ตัวกรอง ${chip.label}`}
            className="flex items-center justify-center w-4 h-4 rounded-none hover:bg-admin-surface-muted text-admin-selected-foreground transition-colors focus-visible:outline-2 focus-visible:outline-admin-focus"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onClear}
        className="text-xs font-medium text-admin-muted hover:text-admin-foreground hover:underline px-2 py-1 transition-colors"
      >
        {t("clearAll")}
      </button>
    </div>
  );
}
