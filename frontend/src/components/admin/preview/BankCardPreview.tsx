"use client";

import React, { useState } from "react";
import { Landmark, Eye } from "lucide-react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { useTranslations } from "next-intl";
import type { MultiLangText } from "@/types/api";

function getLangText(text?: MultiLangText | null, lang: "th" | "en" | "de" = "th", fallback: string = ""): string {
  if (!text) return fallback;
  return text[lang] || text.th || text.en || text.de || fallback;
}

export function BankCardPreview({
  bankName,
  accountName,
  accountNumber,
  iban,
  bic,
  qrImageUrl,
}: {
  bankName?: MultiLangText;
  accountName?: MultiLangText;
  accountNumber?: string;
  iban?: string;
  bic?: string;
  qrImageUrl?: string;
}) {
  const t = useTranslations("Admin.previews");
  const [lang, setLang] = useState<"th" | "en" | "de">("th");
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const bName = getLangText(bankName, lang, t("bankDefaultName"));
  const aName = getLangText(accountName, lang, t("accountDefaultName"));

  return (
    <div className="space-y-4 border border-admin-border p-5 bg-admin-surface rounded-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-admin-border pb-3">
        <div className="flex items-center gap-2">
          <Landmark size={18} className="text-admin-action" />
          <h4 className="text-sm font-semibold text-admin-foreground">
            {t("bankTitle")}
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

      {/* Simulated Bank Card */}
      <div className="p-5 border border-admin-border bg-admin-surface-muted rounded-none space-y-4 max-w-lg">
        <div className="flex items-start justify-between gap-4 border-b border-admin-border pb-3">
          <div>
            <span className="text-xs text-admin-muted block">{t("bankNameLabel")}</span>
            <p className="text-base font-semibold text-admin-foreground">{bName}</p>
          </div>
          <Landmark size={24} className="text-admin-action flex-shrink-0 mt-1" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-admin-muted block">{t("accountNameLabel")}</span>
            <span className="font-medium text-admin-foreground">{aName}</span>
          </div>

          {accountNumber && (
            <div>
              <span className="text-admin-muted block">{t("accountNoLabel")}</span>
              <span className="font-mono font-semibold text-admin-foreground">{accountNumber}</span>
            </div>
          )}

          {iban && (
            <div>
              <span className="text-admin-muted block">IBAN</span>
              <span className="font-mono font-semibold text-admin-foreground">{iban}</span>
            </div>
          )}

          {bic && (
            <div>
              <span className="text-admin-muted block">BIC / SWIFT</span>
              <span className="font-mono font-semibold text-admin-foreground">{bic}</span>
            </div>
          )}
        </div>

        {/* QR Code Section */}
        {qrImageUrl && qrImageUrl.trim() ? (
          <div className="pt-2 border-t border-admin-border flex flex-col items-center">
            <span className="text-xs text-admin-muted mb-2">{t("scanQrText")}</span>
            <div className="relative group/qr border border-admin-border p-2 bg-admin-surface cursor-pointer">
              <img
                src={qrImageUrl.trim()}
                alt="Bank QR Code"
                className="w-36 h-36 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://placehold.co/200x200?text=Invalid+QR+URL";
                }}
              />
              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                className="absolute inset-0 bg-admin-action/60 text-admin-on-action flex flex-col items-center justify-center opacity-0 group-hover/qr:opacity-100 transition-opacity"
              >
                <Eye size={20} />
                <span className="text-[11px] mt-1">{t("expandQr")}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="pt-2 border-t border-admin-border text-center text-xs text-admin-muted">
            {t("noQrImage")}
          </div>
        )}
      </div>

      {qrImageUrl && qrImageUrl.trim() && (
        <Lightbox
          open={isLightboxOpen}
          close={() => setIsLightboxOpen(false)}
          slides={[{ src: qrImageUrl.trim() }]}
        />
      )}
    </div>
  );
}
