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
      className="inline-flex items-center gap-2 h-11 px-4 text-sm font-medium border border-admin-control-border rounded-lg bg-admin-surface text-admin-body hover:bg-admin-surface-muted disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-admin-focus transition-colors"
    >
      {isExporting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-admin-action" />
          <span>
            {t("exporting", { completed, total })}
          </span>
        </>
      ) : (
        <>
          <Download className="h-4 w-4 text-admin-muted" />
          <span>ส่งออก CSV</span>
        </>
      )}
    </button>
  );
}
