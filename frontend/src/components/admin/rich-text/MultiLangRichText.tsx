"use client";

import React, { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import type { LocalizedRichText, RichTextDocument } from "@/lib/rich-text/document";
import { getLocalizedRichText } from "@/lib/rich-text/document";
import { DEFAULT_RICH_TEXT_LOCALE_CONFIGS, DEFAULT_LOCALE, type RichTextLocaleConfig } from "@/constants";
import { RichTextEditor } from "./RichTextEditor";

export type RichTextLocale = RichTextLocaleConfig;

const DEFAULT_RICH_TEXT_PLACEHOLDERS: Record<string, string> = {
  th: "เขียนคำอธิบาย...",
  en: "Write description...",
  de: "Beschreibung schreiben...",
};

export type MultiLangRichTextProps = {
  label: string;
  locales?: readonly RichTextLocale[] | RichTextLocale[];
  defaultLocale?: string;
  value?: LocalizedRichText;
  onChange: (value: LocalizedRichText) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string | Record<string, string>;
  error?: string;
};

export function MultiLangRichText({
  label,
  locales = DEFAULT_RICH_TEXT_LOCALE_CONFIGS,
  defaultLocale,
  value,
  onChange,
  disabled = false,
  required = false,
  placeholder,
  error,
}: MultiLangRichTextProps) {
  const systemLocale = useLocale();
  const [selectedLocale, setSelectedLocale] = useState<string | null>(null);

  const fallbackLocale = defaultLocale || (locales.some((l) => l.code === systemLocale) ? systemLocale : DEFAULT_LOCALE);
  const activeLocale = selectedLocale && locales.some((l) => l.code === selectedLocale)
    ? selectedLocale
    : fallbackLocale;

  const safeValue = useMemo(() => value || {}, [value]);

  const activeDocument = useMemo(
    () => getLocalizedRichText(safeValue, activeLocale, fallbackLocale),
    [activeLocale, fallbackLocale, safeValue],
  );

  const activePlaceholder = useMemo(() => {
    if (typeof placeholder === "object" && placeholder !== null) {
      return placeholder[activeLocale] || placeholder.th || placeholder.en || "";
    }
    if (typeof placeholder === "string" && placeholder) {
      return placeholder;
    }
    return DEFAULT_RICH_TEXT_PLACEHOLDERS[activeLocale] || `${label} (${activeLocale.toUpperCase()})`;
  }, [placeholder, activeLocale, label]);

  const handleEditorChange = (doc: RichTextDocument) => {
    onChange({
      ...safeValue,
      [activeLocale]: doc,
    });
  };

  return (
    <div className="space-y-1 font-sans">
      <div className="flex items-center justify-between min-h-[24px]">
        <label className="text-sm font-medium text-admin-body flex items-center">
          {label}
          {required && <span className="text-admin-danger ml-1">*</span>}
        </label>
        <div className="inline-flex border border-admin-control-border rounded-none overflow-hidden h-6">
          {locales.map((loc) => (
            <button
              key={loc.code}
              type="button"
              onClick={() => setSelectedLocale(loc.code)}
              className={`px-2.5 h-full text-xs font-medium uppercase transition-colors inline-flex items-center justify-center focus-visible:outline-2 focus-visible:outline-admin-focus ${
                activeLocale === loc.code
                  ? "bg-admin-action text-admin-on-action hover:bg-admin-action-hover"
                  : "bg-admin-surface text-admin-muted hover:bg-admin-surface-muted hover:text-admin-foreground"
              }`}
            >
              {loc.label}
            </button>
          ))}
        </div>
      </div>

      <RichTextEditor
        value={activeDocument}
        onChange={handleEditorChange}
        disabled={disabled}
        placeholder={activePlaceholder}
        error={error}
      />
    </div>
  );
}
