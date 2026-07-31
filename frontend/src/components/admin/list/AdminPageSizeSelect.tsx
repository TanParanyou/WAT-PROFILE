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
      <label htmlFor={selectId} className="text-xs text-gray-500 font-medium">
        {t("rowsPerPage")}
      </label>
      <select
        id={selectId}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) as AdminPageSize)}
        className="h-8 rounded border border-gray-300 bg-white px-2 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
