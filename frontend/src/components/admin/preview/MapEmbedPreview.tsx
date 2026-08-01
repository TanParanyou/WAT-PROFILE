"use client";

import React from "react";
import { MapPin, CheckCircle2, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { MultiLangText } from "@/types/api";
import { TestLinkButton } from "./TestLinkButton";

function getLangText(text?: MultiLangText | null, lang: "th" | "en" | "de" = "th", fallback: string = ""): string {
  if (!text) return fallback;
  return text[lang] || text.th || text.en || text.de || fallback;
}

export function MapEmbedPreview({
  embedUrl,
  directionsUrl,
  mapName,
}: {
  embedUrl?: string;
  directionsUrl?: string;
  mapName?: MultiLangText;
}) {
  const t = useTranslations("Admin.previews");
  let cleanSrc = (embedUrl || "").trim();

  // Extract src if user pasted full <iframe ...> snippet
  if (cleanSrc.includes("<iframe") && cleanSrc.includes('src="')) {
    const match = cleanSrc.match(/src=["']([^"']+)["']/);
    if (match && match[1]) {
      cleanSrc = match[1];
    }
  }

  const isValidUrl = cleanSrc.startsWith("http://") || cleanSrc.startsWith("https://");
  const nameText = getLangText(mapName, "th", t("mapDefaultName"));

  return (
    <div className="space-y-3 border border-admin-border p-4 bg-admin-surface rounded-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-admin-action" />
          <h4 className="text-sm font-semibold text-admin-foreground">
            {t("mapTitle", { name: nameText })}
          </h4>
        </div>
        {isValidUrl ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-admin-success bg-admin-success-surface px-2 py-0.5 border border-admin-border">
            <CheckCircle2 size={12} /> {t("mapValid")}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-admin-warning bg-admin-warning-surface px-2 py-0.5 border border-admin-border">
            <AlertCircle size={12} /> {t("mapNoUrl")}
          </span>
        )}
      </div>

      {isValidUrl ? (
        <div className="relative border border-admin-border bg-admin-surface-muted overflow-hidden">
          <iframe
            src={cleanSrc}
            width="100%"
            height="280"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Google Maps Preview"
            className="w-full h-[280px]"
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-admin-surface-muted border border-dashed border-admin-border space-y-2">
          <MapPin size={32} className="text-admin-muted" />
          <p className="text-sm font-medium text-admin-foreground">{t("mapPlaceholderTitle")}</p>
          <p className="text-xs text-admin-muted max-w-md">{t("mapPlaceholderDesc")}</p>
        </div>
      )}

      {directionsUrl && directionsUrl.trim() && (
        <div className="flex justify-end pt-1">
          <TestLinkButton href={directionsUrl} label={t("testDirections")} />
        </div>
      )}
    </div>
  );
}
