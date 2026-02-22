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
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white rounded-lg shadow-xl px-6 py-4 flex items-center justify-between gap-6 min-w-[320px] max-w-[90vw] animate-in slide-in-from-bottom-5">
      <div className="flex items-center gap-3">
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-sm font-medium">
          {selectedCount}
        </span>
        <span className="text-sm font-medium">
          {t("common.selectedItems", { count: selectedCount })}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {children}
        <div className="w-px h-6 bg-white/20 mx-2" />
        <button
          onClick={onClear}
          className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-gray-300 hover:text-white"
          title={t("common.clear")}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
