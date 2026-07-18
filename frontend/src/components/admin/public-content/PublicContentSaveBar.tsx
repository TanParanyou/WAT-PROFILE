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
    <div className="sticky bottom-0 z-40 -mx-4 -mb-4 mt-8 flex items-center justify-between border-t border-zinc-200 bg-white/80 px-4 py-4 backdrop-blur-md sm:-mx-6 sm:-mb-6 sm:px-6 shadow-sm">
      <div className="flex items-center gap-3">
        {isDirty && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
            </span>
            {t("unsavedChanges")}
          </span>
        )}
        {updatedAt && (
          <span className="text-xs text-zinc-500">
            {t("lastSaved", { time: new Date(updatedAt).toLocaleString("th-TH") })}
          </span>
        )}
      </div>

      <div className="flex gap-3 w-full sm:w-auto justify-end items-center">
        <Link
          href={publicUrl}
          target="_blank"
          className="flex items-center gap-1.5 px-4 py-2 border border-zinc-200 rounded-lg text-sm text-zinc-600 bg-white hover:bg-zinc-50 font-medium transition-colors w-full sm:w-auto justify-center"
        >
          <span>{t("viewLiveSite")}</span>
          <ExternalLink size={16} />
        </Link>

        <button
          type="submit"
          disabled={isPending || !isDirty}
          className="flex items-center gap-2 px-6 py-2 bg-amber-700 hover:bg-amber-800 disabled:bg-amber-700/50 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:cursor-not-allowed w-full sm:w-auto justify-center"
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
