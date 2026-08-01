"use client";

import React, { useState } from "react";
import { Calendar, Clock, MapPin, Tag, CheckCircle2, Eye, ListOrdered, Image as ImageIcon } from "lucide-react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { useTranslations } from "next-intl";

type PartialMultiLangText = { th?: string; en?: string; de?: string } | null;

function getLangText(text?: PartialMultiLangText, lang: "th" | "en" | "de" = "th", fallback: string = ""): string {
  if (!text) return fallback;
  if (typeof text === "string") return text;
  return text[lang] || text.th || text.en || text.de || fallback;
}

export function EventCardPreview({
  title,
  description,
  location,
  startDate,
  endDate,
  startTime,
  endTime,
  eventType,
  imageUrl,
  registrationEnabled,
  schedule,
}: {
  title?: PartialMultiLangText;
  description?: unknown;
  location?: PartialMultiLangText;
  startDate?: string | null;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  eventType?: string;
  imageUrl?: string | File | null;
  registrationEnabled?: boolean;
  schedule?: Array<{
    start_time?: string | null;
    end_time?: string | null;
    activity?: PartialMultiLangText;
  }>;
}) {
  const t = useTranslations("Admin.previews");
  const [lang, setLang] = useState<"th" | "en" | "de">("th");
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const displayTitle = getLangText(title, lang, t("eventDefaultTitle"));
  const displayLocation = getLangText(location, lang, t("eventDefaultLocation"));
  const previewSrc = typeof imageUrl === "string" ? imageUrl : "";

  return (
    <div className="space-y-4 border border-admin-border p-5 bg-admin-surface rounded-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-admin-border pb-3">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-admin-action" />
          <h4 className="text-sm font-semibold text-admin-foreground">
            {t("eventTitle")}
          </h4>
        </div>

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

      {/* Public Event Card Mockup */}
      <div className="border border-admin-border bg-admin-surface-muted rounded-none overflow-hidden max-w-lg space-y-0">
        {previewSrc && previewSrc.trim() ? (
          <div className="relative group/evt border-b border-admin-border bg-admin-surface">
            <img
              src={previewSrc.trim()}
              alt="Event Cover"
              className="w-full h-44 object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://placehold.co/600x300?text=Invalid+Image+URL";
              }}
            />
            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              className="absolute inset-0 bg-admin-action/60 text-admin-on-action flex flex-col items-center justify-center opacity-0 group-hover/evt:opacity-100 transition-opacity"
            >
              <Eye size={22} />
              <span className="text-xs font-medium mt-1">{t("expandImage")}</span>
            </button>
          </div>
        ) : (
          <div className="w-full h-32 bg-admin-surface border-b border-admin-border flex flex-col items-center justify-center text-admin-muted text-xs">
            <ImageIcon size={24} className="mb-1" />
            <span>{t("noImage")}</span>
          </div>
        )}

        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-admin-action bg-admin-action/10 px-2 py-0.5 uppercase tracking-wider">
              <Tag size={12} /> {eventType || "Event"}
            </span>

            {registrationEnabled ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-admin-success bg-admin-success-surface px-2 py-0.5 border border-admin-border">
                <CheckCircle2 size={11} /> {t("eventRegOpen")}
              </span>
            ) : (
              <span className="text-[11px] text-admin-muted">
                {t("eventRegClosed")}
              </span>
            )}
          </div>

          <h3 className="text-base font-bold text-admin-foreground leading-snug">
            {displayTitle}
          </h3>

          <div className="space-y-1.5 text-xs text-admin-body pt-1">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-admin-action flex-shrink-0" />
              <span>
                {startDate || "YYYY-MM-DD"} {endDate && endDate !== startDate ? ` - ${endDate}` : ""}
              </span>
            </div>

            {(startTime || endTime) && (
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-admin-action flex-shrink-0" />
                <span className="font-mono">{startTime || "00:00"} {endTime ? `- ${endTime}` : ""}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-admin-action flex-shrink-0" />
              <span>{displayLocation}</span>
            </div>
          </div>

          {/* Schedule List Timeline Preview */}
          {schedule && schedule.length > 0 && (
            <div className="pt-3 border-t border-admin-border space-y-2">
              <span className="text-xs font-semibold text-admin-foreground flex items-center gap-1.5">
                <ListOrdered size={14} className="text-admin-action" />
                {t("eventScheduleCount", { count: schedule.length })}
              </span>

              <div className="space-y-1.5 pl-2 border-l-2 border-admin-action/30">
                {schedule.map((item, idx) => (
                  <div key={idx} className="text-xs flex items-baseline justify-between gap-2">
                    <span className="font-mono text-admin-action text-[11px] flex-shrink-0">
                      {item.start_time || "00:00"} {item.end_time ? `- ${item.end_time}` : ""}
                    </span>
                    <span className="text-admin-foreground font-medium flex-1 truncate">
                      {getLangText(item.activity, lang, `กิจกรรมลำดับที่ ${idx + 1}`)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {typeof imageUrl === "string" && imageUrl.trim() && (
        <Lightbox
          open={isLightboxOpen}
          close={() => setIsLightboxOpen(false)}
          slides={[{ src: imageUrl.trim() }]}
        />
      )}
    </div>
  );
}
