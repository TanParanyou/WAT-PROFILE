"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import {
  ArrowLeft,
  Languages,
  Eye,
  EyeOff,
  Copy,
  Check,
  Printer,
  Hash,
} from "lucide-react";
import type { Chanting, PaliScript } from "@/types/chanting";
import { MiniAudioPlayer } from "./MiniAudioPlayer";
import { ChantingCounterModal } from "./ChantingCounterModal";

interface ChantingReaderProps {
  chanting: Chanting;
  locale: "th" | "en" | "de";
}

type FontSizeOption = "base" | "lg" | "xl";

export function ChantingReader({ chanting, locale }: ChantingReaderProps) {
  const t = useTranslations("Chanting");
  const [script, setScript] = useState<PaliScript>("thai");
  const [showTranslation, setShowTranslation] = useState(true);
  const [fontSize, setFontSize] = useState<FontSizeOption>("lg");
  const [isCopied, setIsCopied] = useState(false);
  const [isCounterOpen, setIsCounterOpen] = useState(false);

  const title =
    chanting.title?.[locale] ||
    chanting.title?.th ||
    chanting.title?.en ||
    chanting.slug;

  const subtitle =
    chanting.subtitle?.[locale] ||
    chanting.subtitle?.th ||
    chanting.subtitle?.en;

  const translation =
    chanting.translation?.[locale] ||
    chanting.translation?.th ||
    chanting.translation?.en ||
    "";

  const rawPali = script === "thai" ? chanting.pali_thai : chanting.pali_roman;

  // Split lines / verses for easy verse-by-verse reading
  const paliLines = rawPali
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const fontSizeClasses: Record<FontSizeOption, string> = {
    base: "text-base sm:text-lg leading-relaxed",
    lg: "text-lg sm:text-xl md:text-2xl leading-relaxed sm:leading-loose",
    xl: "text-xl sm:text-2xl md:text-3xl leading-loose",
  };

  const handleCopy = async () => {
    const textToCopy = `${title}\n${subtitle ? subtitle + "\n\n" : "\n"}${rawPali}${
      translation ? `\n\n--- ${t("meaningHeader")} (${locale.toUpperCase()}) ---\n` + translation : ""
    }`;

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(textToCopy);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
      }
    } catch {
      // Fallback
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="min-h-screen pb-28">
      {/* Navigation Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6 border-b border-site-border pb-4 print:hidden">
        <Link
          href="/chanting"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-site-muted hover:text-site-foreground transition-colors focus-visible:outline-2 focus-visible:outline-site-focus"
        >
          <ArrowLeft size={15} />
          <span>{t("backToCatalog")}</span>
        </Link>
      </nav>

      {/* Header Section */}
      <header className="border border-site-border bg-site-surface/40 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="border border-site-border bg-site-surface px-2.5 py-1 text-xs font-mono font-semibold uppercase tracking-wider text-site-muted">
              {t(`categories.${chanting.category}`)}
            </span>
            {chanting.audio_url && (
              <span className="border border-site-accent/40 bg-site-accent/10 px-2.5 py-1 text-xs font-mono font-semibold text-site-accent print:hidden">
                {t("hasAudio")}
              </span>
            )}
          </div>

          {/* Reader Controls Toolbar */}
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            {/* Script Toggle */}
            <div className="inline-flex border border-site-border bg-site-canvas p-0.5" role="group" aria-label="Pali Script">
              <button
                type="button"
                onClick={() => setScript("thai")}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                  script === "thai"
                    ? "bg-site-action text-site-on-action"
                    : "text-site-muted hover:text-site-foreground"
                }`}
              >
                {t("scriptThai")}
              </button>
              <button
                type="button"
                onClick={() => setScript("roman")}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                  script === "roman"
                    ? "bg-site-action text-site-on-action"
                    : "text-site-muted hover:text-site-foreground"
                }`}
              >
                {t("scriptRoman")}
              </button>
            </div>

            {/* Translation Toggle */}
            <button
              type="button"
              onClick={() => setShowTranslation(!showTranslation)}
              className={`inline-flex items-center gap-1.5 border border-site-border px-3 py-1.5 text-xs font-semibold transition-colors ${
                showTranslation
                  ? "bg-site-surface text-site-foreground border-site-accent/50"
                  : "bg-site-canvas text-site-muted hover:text-site-foreground"
              }`}
              title={showTranslation ? t("hideTranslation") : t("showTranslation")}
            >
              {showTranslation ? <Eye size={14} /> : <EyeOff size={14} />}
              <span className="hidden sm:inline">{t("translation")}</span>
            </button>

            {/* Font Size Adjusters */}
            <div className="inline-flex border border-site-border bg-site-canvas p-0.5">
              <button
                type="button"
                onClick={() => setFontSize("base")}
                className={`px-2.5 py-1 text-xs font-mono font-bold transition-colors ${
                  fontSize === "base"
                    ? "bg-site-action text-site-on-action"
                    : "text-site-muted hover:text-site-foreground"
                }`}
                title="Font normal"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setFontSize("lg")}
                className={`px-2.5 py-1 text-xs font-mono font-bold transition-colors ${
                  fontSize === "lg"
                    ? "bg-site-action text-site-on-action"
                    : "text-site-muted hover:text-site-foreground"
                }`}
                title="Font large"
              >
                A+
              </button>
              <button
                type="button"
                onClick={() => setFontSize("xl")}
                className={`px-2.5 py-1 text-xs font-mono font-bold transition-colors ${
                  fontSize === "xl"
                    ? "bg-site-action text-site-on-action"
                    : "text-site-muted hover:text-site-foreground"
                }`}
                title="Font extra large"
              >
                A++
              </button>
            </div>

            {/* Chanting Mala Counter Trigger */}
            <button
              type="button"
              onClick={() => setIsCounterOpen(true)}
              className="inline-flex items-center gap-1.5 border border-site-border bg-site-canvas px-3 py-1.5 text-xs font-semibold text-site-foreground hover:bg-site-surface transition-colors focus-visible:outline-2 focus-visible:outline-site-focus"
              title={t("counter")}
            >
              <Hash size={14} className="text-site-accent" />
              <span>{t("counter")}</span>
            </button>

            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              className={`inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-site-focus ${
                isCopied
                  ? "border-site-accent bg-site-accent/15 text-site-accent"
                  : "border-site-border bg-site-canvas text-site-muted hover:text-site-foreground hover:bg-site-surface"
              }`}
              title={isCopied ? t("chantCopied") : t("copyChant")}
            >
              {isCopied ? <Check size={14} /> : <Copy size={14} />}
              <span className="hidden sm:inline">
                {isCopied ? t("chantCopied") : t("copyChant")}
              </span>
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 border border-site-border bg-site-canvas px-3 py-1.5 text-xs font-semibold text-site-muted hover:text-site-foreground hover:bg-site-surface transition-colors focus-visible:outline-2 focus-visible:outline-site-focus"
              title={t("print")}
            >
              <Printer size={14} />
              <span className="hidden md:inline">{t("print")}</span>
            </button>
          </div>
        </div>

        <h1 className="mt-4 font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-site-foreground leading-snug">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-sm sm:text-base text-site-muted leading-relaxed">
            {subtitle}
          </p>
        )}
      </header>

      {/* Chanting Content Body */}
      <main className="mt-8 space-y-6">
        <article className="border border-site-border bg-site-canvas p-6 sm:p-10 shadow-sm">
          {/* Pali Recitation Section */}
          <div className="space-y-4">
            {paliLines.map((line, idx) => (
              <p
                key={idx}
                className={`font-heading font-medium tracking-wide text-site-foreground ${fontSizeClasses[fontSize]}`}
              >
                {line}
              </p>
            ))}
          </div>

          {/* Translation Section */}
          {showTranslation && translation && (
            <div className="mt-10 border-t-2 border-dashed border-site-border/80 pt-6">
              <div className="mb-3 flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-site-accent">
                <Languages size={14} />
                <span>
                  {t("meaningHeader")} ({locale.toUpperCase()})
                </span>
              </div>
              <div className="text-site-muted leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                {translation}
              </div>
            </div>
          )}
        </article>
      </main>

      {/* Chanting Loop Counter Modal */}
      <ChantingCounterModal
        isOpen={isCounterOpen}
        onClose={() => setIsCounterOpen(false)}
        chantTitle={title}
      />

      {/* Floating Audio Player */}
      {chanting.audio_url && (
        <MiniAudioPlayer
          audioUrl={chanting.audio_url}
          title={title}
          subtitle={subtitle}
          labels={{
            play: t("player.play"),
            pause: t("player.pause"),
            speed: t("player.speed"),
            mute: t("player.mute"),
            unmute: t("player.unmute"),
            restart: t("player.restart"),
            loop: t("player.loop"),
            loopOff: t("player.loopOff"),
          }}
        />
      )}
    </div>
  );
}
