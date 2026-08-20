"use client";

import React, { useState } from "react";
import { UserCheck, Calendar, Eye, Image as ImageIcon, Award, Circle } from "lucide-react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { useTranslations } from "next-intl";

type PartialMultiLangText = { th?: string; en?: string; de?: string } | null;

function getLangText(text?: PartialMultiLangText, lang: "th" | "en" | "de" = "th", fallback: string = ""): string {
  if (!text) return fallback;
  if (typeof text === "string") return text;
  return text[lang] || text.th || text.en || text.de || fallback;
}

import { calculatePansa } from "@/utils/monk";

export function MonkCardPreview({
  name,
  title,
  dharmaName,
  education,
  position,
  ordinationDate,
  imageUrl,
  isActive,
}: {
  name?: PartialMultiLangText;
  title?: PartialMultiLangText;
  dharmaName?: PartialMultiLangText;
  education?: PartialMultiLangText;
  position?: string;
  ordinationDate?: string | null;
  imageUrl?: string | File | null;
  isActive?: boolean;
}) {
  const t = useTranslations("Admin.previews");
  const tMonk = useTranslations("Admin.monks");
  const [lang, setLang] = useState<"th" | "en" | "de">("th");
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const displayName = getLangText(name, lang, t("monkDefaultName"));
  const displayTitle = getLangText(title, lang, t("monkDefaultTitle"));
  const displayDharmaName = getLangText(dharmaName, lang, "");
  const displayEducation = getLangText(education, lang, "");
  const previewSrc = typeof imageUrl === "string" ? imageUrl : "";
  const pansaYears = calculatePansa(ordinationDate);

  const positionKey = position as string | undefined;
  const positionLabel = positionKey && tMonk.raw(`positions.${positionKey}`)
    ? tMonk(`positions.${positionKey}`)
    : tMonk("positions.monk");

  return (
    <div className="space-y-4 border border-admin-border p-5 bg-admin-surface rounded-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-admin-border pb-3">
        <div className="flex items-center gap-2">
          <UserCheck size={18} className="text-admin-action" />
          <h4 className="text-sm font-semibold text-admin-foreground">
            {t("monkTitle")}
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
                  ? "bg-admin-action text-admin-on-action hover:bg-admin-action-hover"
                  : "bg-admin-surface text-admin-muted hover:bg-admin-surface-muted"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Public Monk Card Mockup */}
      <div className="border border-admin-border bg-admin-surface-muted rounded-none p-5 max-w-lg space-y-4">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          {previewSrc && previewSrc.trim() ? (
            <div className="relative group/monk flex-shrink-0 border border-admin-border bg-admin-surface">
              <img
                src={previewSrc.trim()}
                alt="Monk Profile"
                className="w-28 h-36 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://placehold.co/200x260?text=Invalid+Image+URL";
                }}
              />
              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                className="absolute inset-0 bg-admin-action/60 text-admin-on-action flex flex-col items-center justify-center opacity-0 group-hover/monk:opacity-100 transition-opacity"
              >
                <Eye size={20} />
                <span className="text-[11px] mt-1">{t("expandImage")}</span>
              </button>
            </div>
          ) : (
            <div className="w-28 h-36 bg-admin-surface border border-admin-border flex flex-col items-center justify-center text-admin-muted text-xs text-center p-2 flex-shrink-0">
              <ImageIcon size={24} className="mb-1" />
              <span>{t("noImage")}</span>
            </div>
          )}

          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-admin-on-action bg-admin-action px-2 py-0.5">
                <Award size={12} /> {positionLabel}
              </span>

              {isActive ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-admin-success font-medium">
                  <Circle size={7} className="fill-current" />
                  <span>{tMonk("status.active")}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] text-admin-muted">
                  <Circle size={7} className="fill-current" />
                  <span>{tMonk("status.inactive")}</span>
                </span>
              )}
            </div>

            <div>
              <h3 className="text-base font-bold text-admin-foreground leading-snug">
                {displayName}
              </h3>
              {displayDharmaName && (
                <p className="text-xs text-admin-muted font-medium italic">
                  ({displayDharmaName})
                </p>
              )}
            </div>

            {displayTitle && (
              <p className="text-xs text-admin-action font-medium">
                {displayTitle}
              </p>
            )}

            {displayEducation && (
              <p className="text-xs text-admin-muted">
                {displayEducation}
              </p>
            )}

            {ordinationDate && (
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 text-xs text-admin-muted pt-1">
                <Calendar size={13} className="text-admin-action flex-shrink-0" />
                <span>{t("monkOrdinationLabel", { date: ordinationDate })}</span>
                {pansaYears !== null && (
                  <span className="bg-admin-action-surface text-admin-action px-1.5 py-0.2 rounded text-[11px] font-medium">
                    {tMonk("form.pansaCount", { count: pansaYears })}
                  </span>
                )}
              </div>
            )}
          </div>
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
