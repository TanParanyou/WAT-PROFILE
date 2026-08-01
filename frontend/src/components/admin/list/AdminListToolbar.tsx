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
    <div className="flex flex-col gap-3 rounded-none border border-admin-border bg-admin-surface p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-end gap-3 min-w-[280px]">
          {search}
          {primaryFilters}
        </div>

        {children && (
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-expanded={isExpanded}
            aria-controls={filterPanelId}
            className="flex items-center gap-2 h-11 px-4 text-sm font-medium border border-admin-control-border rounded-none bg-admin-surface text-admin-body hover:bg-admin-surface-muted focus-visible:outline-2 focus-visible:outline-admin-focus transition-colors"
          >
            <Filter className="h-4 w-4 text-admin-muted" />
            <span>{t("moreFilters")}</span>
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-none bg-admin-action text-xs font-semibold text-admin-on-action">
                {activeFilterCount}
              </span>
            )}
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-admin-muted" />
            ) : (
              <ChevronDown className="h-4 w-4 text-admin-muted" />
            )}
          </button>
        )}
      </div>

      {children && isExpanded && (
        <div
          id={filterPanelId}
          className="pt-3 border-t border-admin-border grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end"
        >
          {children}
        </div>
      )}

      {activeFilters}
    </div>
  );
}
