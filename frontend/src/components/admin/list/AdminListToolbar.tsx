"use client";

import React, { useState, useId } from "react";
import { Filter, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";

export interface AdminListToolbarProps {
  search: React.ReactNode;
  primaryFilters?: React.ReactNode;
  activeFilters?: React.ReactNode;
  children?: React.ReactNode;
  activeFilterCount: number;
}

export function AdminListToolbar({
  search,
  primaryFilters,
  activeFilters,
  children,
  activeFilterCount,
}: AdminListToolbarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const filterPanelId = useId();
  const t = useTranslations("admin.list");

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[280px]">
          {search}
          {primaryFilters}
        </div>

        {children && (
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-expanded={isExpanded}
            aria-controls={filterPanelId}
            className="flex items-center gap-2 h-11 px-4 text-sm font-medium border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
          >
            <Filter className="h-4 w-4 text-gray-500" />
            <span>{t("moreFilters")}</span>
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-xs font-semibold text-white">
                {activeFilterCount}
              </span>
            )}
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </button>
        )}
      </div>

      {children && isExpanded && (
        <div
          id={filterPanelId}
          className="pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {children}
        </div>
      )}

      {activeFilters}
    </div>
  );
}
