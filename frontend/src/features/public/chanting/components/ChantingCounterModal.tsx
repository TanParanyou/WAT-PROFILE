"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { SiteModal } from "@/components/public/modal/SiteModal";
import { RotateCcw, Sparkles, CheckCircle2 } from "lucide-react";

interface ChantingCounterModalProps {
  isOpen: boolean;
  onClose: () => void;
  chantTitle: string;
}

const PRESET_TARGETS = [3, 9, 21, 108];

export function ChantingCounterModal({
  isOpen,
  onClose,
  chantTitle,
}: ChantingCounterModalProps) {
  const t = useTranslations("Chanting");
  const [target, setTarget] = useState<number>(3);
  const [count, setCount] = useState<number>(0);
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [customInput, setCustomInput] = useState<string>("");

  const handleIncrement = () => {
    // Optional haptic feedback on devices that support it
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(35);
      } catch {
        // Ignore devices that block vibration without permission
      }
    }
    setCount((prev) => prev + 1);
  };

  const handleReset = () => {
    setCount(0);
  };

  const handleSelectPreset = (val: number) => {
    setTarget(val);
    setIsCustom(false);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customInput, 10);
    if (!isNaN(val) && val > 0) {
      setTarget(val);
    }
  };

  const isCompleted = count >= target;
  const progressPercent = Math.min(100, Math.round((count / target) * 100));

  return (
    <SiteModal
      open={isOpen}
      onClose={onClose}
      title={t("counterTitle")}
      size="md"
      closeLabel={t("close")}
    >
      <div className="space-y-6">
        {/* Chant Title Banner */}
        <div className="border border-site-border bg-site-surface/50 p-4">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-site-accent">
            <Sparkles size={13} aria-hidden />
            <span>{t("counterSubtitle")}</span>
          </div>
          <h4 className="mt-1 font-heading text-base font-bold text-site-foreground">
            {chantTitle}
          </h4>
        </div>

        {/* Target Presets */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-site-muted mb-2">
            {t("customTarget")}
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {PRESET_TARGETS.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleSelectPreset(val)}
                className={`min-h-10 px-4 text-xs font-mono font-bold uppercase transition-colors border ${
                  target === val && !isCustom
                    ? "border-site-action bg-site-action text-site-on-action"
                    : "border-site-border bg-site-canvas text-site-foreground hover:bg-site-surface"
                } focus-visible:outline-2 focus-visible:outline-site-focus`}
              >
                {val} จบ
              </button>
            ))}
            <button
              type="button"
              onClick={() => setIsCustom(true)}
              className={`min-h-10 px-4 text-xs font-mono font-bold uppercase transition-colors border ${
                isCustom
                  ? "border-site-action bg-site-action text-site-on-action"
                  : "border-site-border bg-site-canvas text-site-foreground hover:bg-site-surface"
              } focus-visible:outline-2 focus-visible:outline-site-focus`}
            >
              {t("customTarget")}
            </button>
          </div>

          {isCustom && (
            <form onSubmit={handleCustomSubmit} className="mt-3 flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={9999}
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="เช่น 108"
                className="h-10 w-28 border border-site-border bg-site-canvas px-3 font-mono text-sm text-site-foreground focus-visible:outline-2 focus-visible:outline-site-focus"
              />
              <button
                type="submit"
                className="h-10 border border-site-border bg-site-surface px-4 text-xs font-semibold hover:bg-site-surface/80 transition-colors focus-visible:outline-2 focus-visible:outline-site-focus"
              >
                ตั้งค่า
              </button>
            </form>
          )}
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs font-mono text-site-muted mb-1.5">
            <span>{t("currentRound", { current: count, target })}</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-2 w-full border border-site-border bg-site-surface overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isCompleted ? "bg-site-accent" : "bg-site-action"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Big Tap Counter Area */}
        <div className="text-center py-2">
          {isCompleted && (
            <div className="mb-4 inline-flex items-center gap-2 border border-site-accent/60 bg-site-accent/10 px-3 py-1.5 text-xs font-bold text-site-accent">
              <CheckCircle2 size={16} />
              <span>{t("targetReached")}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleIncrement}
            aria-label={t("tapToCount")}
            className="group relative flex w-full flex-col items-center justify-center border-2 border-site-border bg-site-canvas p-8 sm:p-12 hover:bg-site-surface/70 active:scale-[0.98] transition-all focus-visible:outline-3 focus-visible:outline-site-focus"
          >
            <span className="font-mono text-5xl sm:text-6xl font-bold tracking-tight text-site-foreground tabular-nums">
              {count}
            </span>
            <span className="mt-2 text-xs font-semibold uppercase tracking-widest text-site-muted group-hover:text-site-foreground transition-colors">
              {t("tapToCount")}
            </span>
          </button>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between border-t border-site-border pt-4">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 border border-site-border bg-site-canvas px-3.5 py-2 text-xs font-semibold text-site-muted hover:text-site-foreground hover:bg-site-surface transition-colors focus-visible:outline-2 focus-visible:outline-site-focus"
          >
            <RotateCcw size={14} />
            <span>{t("resetCounter")}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="border border-site-border bg-site-action px-5 py-2 text-xs font-bold text-site-on-action hover:bg-site-action-hover transition-colors focus-visible:outline-2 focus-visible:outline-site-focus"
          >
            {t("close")}
          </button>
        </div>
      </div>
    </SiteModal>
  );
}
