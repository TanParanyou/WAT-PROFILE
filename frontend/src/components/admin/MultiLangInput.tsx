"use client";

import React, { useState } from "react";
import { Sparkles, Copy, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/utils/cn";
import type { MultiLangText } from "@/types/api";
import { useAiTranslate } from "@/hooks/useAiTranslate";
import { useToast } from "@/hooks/useToast";

interface MultiLangInputProps {
  label: string;
  value?: MultiLangText;
  onChange: (value: MultiLangText) => void;
  type?: "input" | "textarea";
  required?: boolean;
  placeholder?: string | MultiLangText;
  error?: string;
  disableAiTranslate?: boolean;
}

const langs = [
  { key: "th" as const, label: "TH" },
  { key: "en" as const, label: "EN" },
  { key: "de" as const, label: "DE" },
];

export function MultiLangInput({
  label,
  value,
  onChange,
  type = "input",
  required = false,
  placeholder,
  error,
  disableAiTranslate = false,
}: MultiLangInputProps) {
  const [activeLang, setActiveLang] = useState<"th" | "en" | "de">("th");
  const t = useTranslations("Admin.aiTranslate");
  const { toast } = useToast();
  const { translateDraft, isTranslating } = useAiTranslate();

  const safeValue = value || { th: "", en: "", de: "" };

  const handleChange = (text: string) => {
    onChange({ ...safeValue, [activeLang]: text });
  };

  const handleCopySource = () => {
    const source = safeValue.th?.trim();
    if (!source) {
      toast.warning(t("emptySource"));
      return;
    }
    onChange({
      ...safeValue,
      en: safeValue.en ? safeValue.en : source,
      de: safeValue.de ? safeValue.de : source,
    });
    toast.success(t("success"));
  };

  const handleAiTranslate = async () => {
    const sourceText = safeValue.th?.trim();
    if (!sourceText) {
      toast.warning(t("emptySource"));
      return;
    }

    const hasExistingTargets = Boolean(safeValue.en?.trim() || safeValue.de?.trim());
    if (hasExistingTargets) {
      const confirmed = window.confirm(t("overwriteConfirmMessage"));
      if (!confirmed) return;
    }

    try {
      const res = await translateDraft({
        text: sourceText,
        source_lang: "th",
        target_langs: ["en", "de"],
      });

      if (res?.translations) {
        onChange({
          ...safeValue,
          en: res.translations.en || safeValue.en || "",
          de: res.translations.de || safeValue.de || "",
        });
      }
    } catch {
      // Error toast is handled inside useAiTranslate hook
    }
  };

  const currentPlaceholder = React.useMemo(() => {
    if (typeof placeholder === "object" && placeholder !== null) {
      return placeholder[activeLang] || placeholder.th || `${label} (${activeLang.toUpperCase()})`;
    }
    if (typeof placeholder === "string" && placeholder) {
      return placeholder;
    }
    return `${label} (${activeLang.toUpperCase()})`;
  }, [placeholder, activeLang, label]);

  return (
    <div className="space-y-1 font-sans">
      <div className="flex items-center justify-between min-h-[24px]">
        <label className="text-sm font-medium text-admin-body flex items-center">
          {label}
          {required && <span className="text-admin-danger ml-1">*</span>}
        </label>
        <div className="flex items-center gap-1.5">
          {!disableAiTranslate && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleAiTranslate}
                disabled={isTranslating || !safeValue.th?.trim()}
                title={isTranslating ? t("translating") : t("button")}
                aria-label={isTranslating ? t("translating") : t("button")}
                className="h-6 w-6 border border-admin-control-border bg-admin-surface hover:bg-admin-surface-muted text-admin-foreground disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-admin-focus"
              >
                {isTranslating ? (
                  <Loader2 size={13} className="animate-spin text-admin-action" />
                ) : (
                  <Sparkles size={13} className="text-admin-warning" />
                )}
              </button>
              <button
                type="button"
                onClick={handleCopySource}
                disabled={!safeValue.th?.trim()}
                title={t("copySource")}
                aria-label={t("copySource")}
                className="h-6 w-6 border border-admin-control-border bg-admin-surface hover:bg-admin-surface-muted text-admin-muted hover:text-admin-foreground disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-admin-focus"
              >
                <Copy size={13} />
              </button>
            </div>
          )}

          <div className="inline-flex border border-admin-control-border rounded-none overflow-hidden h-6">
            {langs.map((lang) => (
              <button
                key={lang.key}
                type="button"
                onClick={() => setActiveLang(lang.key)}
                className={cn(
                  "px-2.5 h-full text-xs font-medium uppercase transition-colors inline-flex items-center justify-center focus-visible:outline-2 focus-visible:outline-admin-focus",
                  activeLang === lang.key
                    ? "bg-admin-action text-admin-on-action hover:bg-admin-action-hover"
                    : "bg-admin-surface text-admin-muted hover:bg-admin-surface-muted hover:text-admin-foreground",
                )}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {type === "textarea" ? (
        <textarea
          value={safeValue[activeLang] || ""}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={currentPlaceholder}
          required={required && activeLang === "th"}
          rows={4}
          className={cn(
            "w-full rounded-none border border-admin-control-border bg-admin-surface px-3 py-2 text-sm text-admin-foreground placeholder:text-admin-muted focus-visible:border-admin-focus focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-admin-focus",
            error && "border-admin-danger focus-visible:border-admin-danger focus-visible:outline-admin-danger",
          )}
        />
      ) : (
        <input
          type="text"
          value={safeValue[activeLang] || ""}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={currentPlaceholder}
          required={required && activeLang === "th"}
          className={cn(
            "min-h-11 w-full rounded-none border border-admin-control-border bg-admin-surface px-3 py-2 text-sm text-admin-foreground placeholder:text-admin-muted focus-visible:border-admin-focus focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-admin-focus",
            error && "border-admin-danger focus-visible:border-admin-danger focus-visible:outline-admin-danger",
          )}
        />
      )}
      {error && <p className="text-sm text-admin-danger mt-1">{error}</p>}
    </div>
  );
}
