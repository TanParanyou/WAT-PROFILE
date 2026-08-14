"use client";

import React from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

interface BulkActionToolbarProps {
  selectedCount: number;
  onClear: () => void;
  children: React.ReactNode;
}

export function BulkActionToolbar({
  selectedCount,
  onClear,
  children,
}: BulkActionToolbarProps) {
  const t = useTranslations("Admin");

  if (selectedCount === 0) return null;

  return (
    <div
      role="region"
      aria-label="Bulk actions"
      className="fixed bottom-3 sm:bottom-5 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 z-50 bg-admin-action text-admin-on-action rounded-none border border-admin-control-border shadow-2xl p-3 sm:px-5 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6 sm:w-auto sm:max-w-4xl animate-in fade-in-0 slide-in-from-bottom-4 duration-200 backdrop-blur-md"
    >
      {/* Selection Info + Clear Button (Top row on mobile, left side on desktop) */}
      <div className="flex items-center justify-between sm:justify-start gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center justify-center min-w-6 h-6 px-1.5 rounded-none bg-admin-on-action/20 text-admin-on-action text-xs font-mono font-bold">
            {selectedCount}
          </span>
          <span className="text-xs sm:text-sm font-medium tracking-tight whitespace-nowrap">
            {t("common.selectedItems", { count: selectedCount })}
          </span>
        </div>

        {/* Clear button on mobile */}
        <button
          type="button"
          onClick={onClear}
          className="sm:hidden flex items-center justify-center w-10 h-10 -mr-1 rounded-none hover:bg-admin-on-action/15 text-admin-on-action/80 hover:text-admin-on-action transition-colors active:scale-95"
          title={t("common.clear")}
          aria-label={t("common.clear")}
        >
          <X size={18} />
        </button>
      </div>

      {/* Action Buttons + Desktop Clear Button */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5 sm:pb-0 scrollbar-none w-full sm:w-auto">
        <div className="flex items-center gap-2 shrink-0">
          {children}
        </div>

        {/* Desktop Divider & Clear Button */}
        <div className="hidden sm:flex items-center pl-2 ml-2 border-l border-admin-on-action/25 shrink-0">
          <button
            type="button"
            onClick={onClear}
            className="flex items-center justify-center w-8 h-8 rounded-none hover:bg-admin-on-action/15 transition-colors text-admin-on-action/80 hover:text-admin-on-action focus-visible:outline-2 focus-visible:outline-admin-focus"
            title={t("common.clear")}
            aria-label={t("common.clear")}
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
