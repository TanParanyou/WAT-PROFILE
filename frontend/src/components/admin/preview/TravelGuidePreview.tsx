"use client";

import React, { useState } from "react";
import { Navigation, Car } from "lucide-react";
import { useTranslations } from "next-intl";
import type { MultiLangText } from "@/types/api";

function getLangText(text?: MultiLangText | null, lang: "th" | "en" | "de" = "th", fallback: string = ""): string {
  if (!text) return fallback;
  return text[lang] || text.th || text.en || text.de || fallback;
}

export function TravelGuidePreview({
  transport,
}: {
  transport?: {
    parking?: MultiLangText;
    driving?: MultiLangText;
    public_transport?: MultiLangText[];
  };
}) {
  const t = useTranslations("Admin.previews");
  const [lang, setLang] = useState<"th" | "en" | "de">("th");

  const parkingText = getLangText(transport?.parking, lang);
  const drivingText = getLangText(transport?.driving, lang);
  const steps = transport?.public_transport || [];

  return (
    <div className="space-y-4 border border-admin-border p-5 bg-admin-surface rounded-none">
      <div className="flex items-center justify-between border-b border-admin-border pb-3">
        <div className="flex items-center gap-2">
          <Navigation size={18} className="text-admin-action" />
          <h4 className="text-sm font-semibold text-admin-foreground">
            {t("travelTitle")}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Parking */}
        <div className="p-3.5 bg-admin-surface-muted border border-admin-border space-y-1">
          <div className="flex items-center gap-2 font-semibold text-admin-foreground">
            <Car size={15} className="text-admin-action" />
            <span>{t("parkingLabel")}</span>
          </div>
          <p className="text-admin-muted leading-relaxed">
            {parkingText || t("noParking")}
          </p>
        </div>

        {/* Driving */}
        <div className="p-3.5 bg-admin-surface-muted border border-admin-border space-y-1">
          <div className="flex items-center gap-2 font-semibold text-admin-foreground">
            <Navigation size={15} className="text-admin-action" />
            <span>{t("drivingLabel")}</span>
          </div>
          <p className="text-admin-muted leading-relaxed whitespace-pre-line">
            {drivingText || t("noDriving")}
          </p>
        </div>
      </div>

      {/* Public Transport */}
      <div className="p-4 bg-admin-surface-muted border border-admin-border space-y-2 text-xs">
        <span className="font-semibold text-admin-foreground block">
          {t("publicTransportLabel", { count: steps.length })}
        </span>
        {steps.length > 0 ? (
          <ol className="space-y-2 list-decimal list-inside text-admin-body">
            {steps.map((step, idx) => (
              <li key={idx} className="leading-relaxed">
                <span className="font-medium text-admin-foreground">
                  {getLangText(step, lang, `Step ${idx + 1}`)}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-admin-muted italic">{t("noTransport")}</p>
        )}
      </div>
    </div>
  );
}
