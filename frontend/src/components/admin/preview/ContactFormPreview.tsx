"use client";

import React, { useState } from "react";
import { Mail, CheckCircle2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { MultiLangText } from "@/types/api";

function getLangText(text?: MultiLangText | null, lang: "th" | "en" | "de" = "th", fallback: string = ""): string {
  if (!text) return fallback;
  return text[lang] || text.th || text.en || text.de || fallback;
}

export function ContactFormPreview({
  enabled,
  successMessage,
  privacyPageLink,
}: {
  enabled?: boolean;
  successMessage?: MultiLangText;
  privacyPageLink?: string;
}) {
  const t = useTranslations("Admin.previews");
  const [lang, setLang] = useState<"th" | "en" | "de">("th");
  const sMsg = getLangText(successMessage, lang, t("defaultSuccessMsg"));

  return (
    <div className="space-y-4 border border-admin-border p-5 bg-admin-surface rounded-none">
      <div className="flex items-center justify-between border-b border-admin-border pb-3">
        <div className="flex items-center gap-2">
          <Mail size={18} className="text-admin-action" />
          <h4 className="text-sm font-semibold text-admin-foreground">
            {t("formTitle")}
          </h4>
        </div>

        <div className="flex items-center gap-3">
          {enabled ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-admin-success bg-admin-success-surface px-2 py-0.5 border border-admin-border">
              <CheckCircle2 size={12} /> {t("formEnabled")}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-admin-muted bg-admin-surface-muted px-2 py-0.5 border border-admin-border">
              <X size={12} /> {t("formDisabled")}
            </span>
          )}

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
      </div>

      {!enabled ? (
        <div className="p-6 bg-admin-surface-muted border border-dashed border-admin-border text-center text-xs text-admin-muted">
          {t("formDisabledNotice")}
        </div>
      ) : (
        <div className="p-5 bg-admin-surface-muted border border-admin-border space-y-4 max-w-lg rounded-none">
          <div className="p-3 bg-admin-success-surface text-admin-success border border-admin-border text-xs flex items-start gap-2">
            <CheckCircle2 size={16} className="text-admin-success flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">{t("successMsgTitle")}</span>
              <p className="mt-0.5">{sMsg}</p>
            </div>
          </div>

          <div className="space-y-3 opacity-80 pointer-events-none">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="h-9 bg-admin-surface border border-admin-border px-3 py-2 text-admin-muted">
                {t("namePlaceholder")}
              </div>
              <div className="h-9 bg-admin-surface border border-admin-border px-3 py-2 text-admin-muted">
                {t("emailPlaceholder")}
              </div>
            </div>
            <div className="h-9 bg-admin-surface border border-admin-border px-3 py-2 text-xs text-admin-muted">
              {t("subjectPlaceholder")}
            </div>
            <div className="h-20 bg-admin-surface border border-admin-border px-3 py-2 text-xs text-admin-muted">
              {t("messagePlaceholder")}
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px] text-admin-muted">
              <span>{t("privacyAcceptText", { link: privacyPageLink || "/privacy" })}</span>
              <button type="button" className="px-4 py-1.5 bg-admin-action text-admin-on-action text-xs font-medium">
                {t("submitForm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
