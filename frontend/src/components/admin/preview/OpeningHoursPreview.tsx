"use client";

import React, { useState } from "react";
import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import type { MultiLangText } from "@/types/api";

function getLangText(text?: MultiLangText | null, lang: "th" | "en" | "de" = "th", fallback: string = ""): string {
  if (!text) return fallback;
  return text[lang] || text.th || text.en || text.de || fallback;
}

export function OpeningHoursPreview({
  openingHours,
}: {
  openingHours?: {
    days?: MultiLangText;
    time?: MultiLangText;
    notice?: MultiLangText;
  };
}) {
  const t = useTranslations("Admin.previews");
  const [lang, setLang] = useState<"th" | "en" | "de">("th");

  const daysText = getLangText(openingHours?.days, lang, t("defaultDays"));
  const timeText = getLangText(openingHours?.time, lang, t("defaultTime"));
  const noticeText = getLangText(openingHours?.notice, lang);

  return (
    <div className="space-y-4 border border-admin-border p-5 bg-admin-surface rounded-none">
      <div className="flex items-center justify-between border-b border-admin-border pb-3">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-admin-action" />
          <h4 className="text-sm font-semibold text-admin-foreground">
            {t("hoursTitle")}
          </h4>
        </div>

        <div className="flex border border-admin-control-border rounded overflow-hidden">
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

      <div className="p-4 bg-admin-surface-muted border border-admin-border space-y-3 max-w-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-admin-action/10 text-admin-action rounded-none">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-xs text-admin-muted block">{t("hoursLabel")}</span>
            <span className="text-sm font-bold text-admin-foreground block">{daysText}</span>
            <span className="text-xs font-semibold text-admin-action font-mono">{timeText}</span>
          </div>
        </div>

        {noticeText ? (
          <div className="p-2.5 bg-admin-warning-surface text-admin-warning border border-admin-border text-xs rounded-none">
            <span className="font-semibold block mb-0.5">{t("noticeLabel")}</span>
            <span>{noticeText}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
