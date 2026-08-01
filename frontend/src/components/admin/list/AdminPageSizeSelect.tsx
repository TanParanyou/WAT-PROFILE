"use client";

import React, { useId } from "react";
import { ADMIN_PAGE_SIZES, type AdminPageSize } from "@/features/admin-list/types";
import { useTranslations } from "next-intl";

export interface AdminPageSizeSelectProps {
  value: AdminPageSize;
  onChange(value: AdminPageSize): void;
}

export function AdminPageSizeSelect({
  value,
  onChange,
}: AdminPageSizeSelectProps) {
  const selectId = useId();
  const t = useTranslations("admin.list");

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={selectId} className="text-xs text-admin-muted font-medium">
        {t("rowsPerPage")}
      </label>
      <select
        id={selectId}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) as AdminPageSize)}
        className="h-8 rounded border border-admin-control-border bg-admin-surface px-2 text-xs font-medium text-admin-body hover:bg-admin-surface-muted focus-visible:outline-2 focus-visible:outline-admin-focus"
      >
        {ADMIN_PAGE_SIZES.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
    </div>
  );
}
