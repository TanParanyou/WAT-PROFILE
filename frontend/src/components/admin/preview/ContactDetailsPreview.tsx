"use client";

import React, { useState } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import type { MultiLangText } from "@/types/api";

function getLangText(text?: MultiLangText | null, lang: "th" | "en" | "de" = "th", fallback: string = ""): string {
  if (!text) return fallback;
  return text[lang] || text.th || text.en || text.de || fallback;
}

export function ContactDetailsPreview({
  title,
  description,
  address,
  phone,
  email,
}: {
  title?: MultiLangText;
  description?: MultiLangText;
  address?: MultiLangText;
  phone?: string;
  email?: string;
}) {
  const t = useTranslations("Admin.previews");
  const [lang, setLang] = useState<"th" | "en" | "de">("th");

  const tTitle = getLangText(title, lang, t("defaultTitle"));
  const tDesc = getLangText(description, lang, t("defaultDesc"));
  const tAddr = getLangText(address, lang, t("noAddress"));

  return (
    <div className="space-y-4 border border-admin-border p-5 bg-admin-surface rounded-none">
      <div className="flex items-center justify-between border-b border-admin-border pb-3">
        <div className="flex items-center gap-2">
          <Mail size={18} className="text-admin-action" />
          <h4 className="text-sm font-semibold text-admin-foreground">
            {t("contactInfoTitle")}
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
                  ? "bg-admin-action text-admin-on-action hover:bg-admin-action-hover"
                  : "bg-admin-surface text-admin-muted hover:bg-admin-surface-muted"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 bg-admin-surface-muted border border-admin-border space-y-4 rounded-none">
        <div>
          <h3 className="text-lg font-bold text-admin-foreground">{tTitle}</h3>
          <p className="text-xs text-admin-muted mt-1 leading-relaxed">{tDesc}</p>
        </div>

        <div className="space-y-3 text-xs pt-2 border-t border-admin-border">
          <div className="flex items-start gap-2.5">
            <MapPin size={16} className="text-admin-action flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-admin-foreground block">{t("addressLabel")}</span>
              <p className="text-admin-body whitespace-pre-line mt-0.5">{tAddr}</p>
            </div>
          </div>

          {phone && phone.trim() && (
            <div className="flex items-center gap-2.5">
              <Phone size={16} className="text-admin-action flex-shrink-0" />
              <div>
                <span className="font-semibold text-admin-foreground">{t("phoneLabel")}: </span>
                <span className="text-admin-body font-mono">{phone}</span>
              </div>
            </div>
          )}

          {email && email.trim() && (
            <div className="flex items-center gap-2.5">
              <Mail size={16} className="text-admin-action flex-shrink-0" />
              <div>
                <span className="font-semibold text-admin-foreground">{t("emailLabel")}: </span>
                <span className="text-admin-body font-mono">{email}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
