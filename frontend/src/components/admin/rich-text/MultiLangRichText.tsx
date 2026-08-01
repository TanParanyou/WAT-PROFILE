"use client";

import React, { useMemo, useState } from "react";
import type { LocalizedRichText, RichTextDocument } from "@/lib/rich-text/document";
import { getLocalizedRichText } from "@/lib/rich-text/document";
import { RichTextEditor } from "./RichTextEditor";

type RichTextLocale = { code: string; label: string };

const DEFAULT_RICH_TEXT_PLACEHOLDERS: Record<string, string> = {
  th: "เขียนคำอธิบาย...",
  en: "Write description...",
  de: "Beschreibung schreiben...",
};

type MultiLangRichTextProps = {
  label: string;
  locales: RichTextLocale[];
  defaultLocale: string;
  value?: LocalizedRichText;
  onChange: (value: LocalizedRichText) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string | Record<string, string>;
  error?: string;
};

export function MultiLangRichText({
  label,
  locales,
  defaultLocale,
  value,
  onChange,
  disabled = false,
  required = false,
  placeholder,
  error,
}: MultiLangRichTextProps) {
  const [selectedLocale, setSelectedLocale] = useState(defaultLocale);
  const safeValue = useMemo(() => value || {}, [value]);

  const activeLocale = locales.some((l) => l.code === selectedLocale) ? selectedLocale : defaultLocale;

  const activeDocument = useMemo(
    () => getLocalizedRichText(safeValue, activeLocale, defaultLocale),
    [activeLocale, defaultLocale, safeValue],
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
    <div className="space-y-2 font-sans">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-admin-foreground flex items-center">
          {label}
          {required && <span className="text-admin-danger ml-1">*</span>}
        </label>
        <div className="flex border border-admin-control-border rounded overflow-hidden">
          {locales.map((loc) => (
            <button
              key={loc.code}
              type="button"
              onClick={() => setSelectedLocale(loc.code)}
              className={`px-3 py-1 text-xs font-medium uppercase transition-colors focus-visible:outline-2 focus-visible:outline-admin-focus ${
                activeLocale === loc.code
                  ? "bg-admin-action text-admin-on-action"
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
