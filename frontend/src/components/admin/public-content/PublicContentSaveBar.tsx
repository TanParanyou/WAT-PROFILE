"use client";

import React from "react";
import { Link } from "@/navigation";
import { ExternalLink, Loader2, Save } from "lucide-react";
import { useTranslations } from "next-intl";

interface PublicContentSaveBarProps {
  isDirty: boolean;
  isPending: boolean;
  updatedAt?: string | null;
  publicUrl: string;
}

export function PublicContentSaveBar({
  isDirty,
  isPending,
  updatedAt,
  publicUrl,
}: PublicContentSaveBarProps) {
  const t = useTranslations("Admin.publicContent");

  return (
    <div className="sticky bottom-0 z-40 -mx-4 -mb-4 mt-8 flex items-center justify-between border-t border-admin-border bg-admin-surface/80 px-4 py-4 backdrop-blur-md sm:-mx-6 sm:-mb-6 sm:px-6">
      <div className="flex items-center gap-3">
        {isDirty && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-admin-warning">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-admin-warning opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-admin-warning"></span>
            </span>
            {t("unsavedChanges")}
          </span>
        )}
        {updatedAt && (
          <span className="text-xs text-admin-muted">
            {t("lastSaved", { time: new Date(updatedAt).toLocaleString("th-TH") })}
          </span>
        )}
      </div>

      <div className="flex gap-3 w-full sm:w-auto justify-end items-center">
        <Link
          href={publicUrl}
          target="_blank"
          className="flex items-center gap-1.5 px-4 py-2 min-h-11 border border-admin-control-border rounded-none text-sm text-admin-body bg-admin-surface hover:bg-admin-surface-muted font-medium transition-colors w-full sm:w-auto justify-center focus-visible:outline-2 focus-visible:outline-admin-focus"
        >
          <span>{t("viewLiveSite")}</span>
          <ExternalLink size={16} />
        </Link>

        <button
          type="submit"
          disabled={isPending || !isDirty}
          className="flex items-center gap-2 px-6 py-2 min-h-11 bg-admin-action hover:bg-admin-action-hover disabled:opacity-50 text-admin-on-action rounded-none text-sm font-medium transition-colors disabled:cursor-not-allowed w-full sm:w-auto justify-center focus-visible:outline-2 focus-visible:outline-admin-focus"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{t("saveData")}</span>
        </button>
      </div>
    </div>
  );
}
export default PublicContentSaveBar;
