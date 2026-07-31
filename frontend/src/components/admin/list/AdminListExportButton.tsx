"use client";

import React from "react";
import { Download, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

export interface AdminListExportButtonProps {
  isExporting: boolean;
  completed: number;
  total: number;
  onExport(): void;
}

export function AdminListExportButton({
  isExporting,
  completed,
  total,
  onExport,
}: AdminListExportButtonProps) {
  const t = useTranslations("admin.list");

  return (
    <button
      type="button"
      onClick={onExport}
      disabled={isExporting}
      className="inline-flex items-center gap-2 h-11 px-4 text-sm font-medium border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
    >
      {isExporting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
          <span>
            {t("exporting", { completed, total })}
          </span>
        </>
      ) : (
        <>
          <Download className="h-4 w-4 text-gray-500" />
          <span>ส่งออก CSV</span>
        </>
      )}
    </button>
  );
}
