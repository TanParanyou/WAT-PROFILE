"use client";

import React, { useState } from "react";
import { Search, AlertCircle, Image as ImageIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { MultiLangText } from "@/types/api";

function getLangText(text?: MultiLangText | null, lang: "th" | "en" | "de" = "th", fallback: string = ""): string {
  if (!text) return fallback;
  return text[lang] || text.th || text.en || text.de || fallback;
}

export function GoogleSearchPreview({
  seoTitle,
  pageTitle,
  seoDescription,
  pageDescription,
  canonicalUrl,
  noindex,
  ogImage,
}: {
  seoTitle?: MultiLangText;
  pageTitle?: MultiLangText;
  seoDescription?: MultiLangText;
  pageDescription?: MultiLangText;
  canonicalUrl?: string;
  noindex?: boolean;
  ogImage?: string;
}) {
  const t = useTranslations("Admin.previews");
  const [lang, setLang] = useState<"th" | "en" | "de">("th");

  const displayTitle = getLangText(seoTitle, lang) || getLangText(pageTitle, lang) || t("defaultTitle");
  const displayDesc = getLangText(seoDescription, lang) || getLangText(pageDescription, lang) || t("defaultDesc");
  const displayUrl = `https://watloungporsai.de${canonicalUrl || "/contact"}`;

  return (
    <div className="space-y-4 border border-admin-border p-5 bg-admin-surface rounded-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-admin-border pb-3">
        <div className="flex items-center gap-2">
          <Search size={18} className="text-admin-action" />
          <h4 className="text-sm font-semibold text-admin-foreground">
            {t("seoTitle")}
          </h4>
        </div>

        {/* Language switcher */}
        <div className="flex border border-admin-control-border rounded overflow-hidden self-start sm:self-auto">
          {(["th", "en", "de"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={`px-2.5 py-0.5 text-xs font-medium uppercase transition-colors ${
                lang === l
                  ? "bg-admin-action text-admin-on-action"
                  : "bg-admin-surface text-admin-muted hover:bg-admin-surface-muted"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {noindex && (
        <div className="flex items-center gap-2 p-3 bg-admin-warning-surface text-admin-warning border border-admin-border text-xs font-medium">
          <AlertCircle size={15} className="flex-shrink-0" />
          <span>{t("seoNoindexAlert")}</span>
        </div>
      )}

      {/* Google Search Card Mockup */}
      <div className="space-y-2 p-4 bg-admin-surface border border-admin-border rounded-none font-sans">
        <div className="flex items-center gap-2 text-xs text-admin-muted">
          <div className="w-4 h-4 rounded-full bg-admin-action text-admin-on-action flex items-center justify-center text-[10px] font-bold">
            W
          </div>
          <span className="truncate text-admin-foreground font-medium">Wat Loungpor Sai</span>
          <span className="text-admin-muted font-mono text-[11px] truncate">{displayUrl}</span>
        </div>

        <h3 className="text-lg font-normal text-admin-info hover:underline cursor-pointer leading-snug truncate">
          {displayTitle}
        </h3>

        <p className="text-xs text-admin-body line-clamp-2 leading-relaxed">
          {displayDesc}
        </p>
      </div>

      {/* Social Share Card Mockup (OG Image) */}
      <div className="pt-2">
        <span className="text-xs font-semibold text-admin-muted uppercase tracking-wider block mb-2">
          {t("socialShareHeading")}
        </span>

        <div className="max-w-md border border-admin-border bg-admin-surface rounded-none overflow-hidden">
          {ogImage && ogImage.trim() ? (
            <img
              src={ogImage.trim()}
              alt="OG Share Preview"
              className="w-full h-44 object-cover border-b border-admin-border bg-admin-surface-muted"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://placehold.co/600x315?text=Invalid+OG+Image+URL";
              }}
            />
          ) : (
            <div className="w-full h-36 bg-admin-surface-muted border-b border-admin-border flex flex-col items-center justify-center text-admin-muted text-xs">
              <ImageIcon size={24} className="mb-1" />
              <span>{t("noOgImage")}</span>
            </div>
          )}

          <div className="p-3 space-y-1 bg-admin-surface-muted">
            <span className="text-[11px] text-admin-muted uppercase font-mono block truncate">
              WATLOUNGPORSAI.DE
            </span>
            <p className="text-sm font-semibold text-admin-foreground line-clamp-1">
              {displayTitle}
            </p>
            <p className="text-xs text-admin-body line-clamp-2">
              {displayDesc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
