"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { LocalizedRichText, RichTextDocument } from "@/lib/rich-text/document";
import { getLocalizedRichText } from "@/lib/rich-text/document";
import { RichTextEditor } from "./RichTextEditor";

type RichTextLocale = { code: string; label: string };

type MultiLangRichTextProps = {
  label: string;
  locales: RichTextLocale[];
  defaultLocale: string;
  value?: LocalizedRichText;
  onChange: (value: LocalizedRichText) => void;
  disabled?: boolean;
  required?: boolean;
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
  error,
}: MultiLangRichTextProps) {
  const [activeLocale, setActiveLocale] = useState(defaultLocale);
  const safeValue = useMemo(() => value || {}, [value]);

  useEffect(() => {
    if (!locales.some((locale) => locale.code === activeLocale)) {
      setActiveLocale(defaultLocale);
    }
  }, [activeLocale, defaultLocale, locales]);

  const activeDocument = useMemo(
    () => getLocalizedRichText(safeValue, activeLocale, defaultLocale),
    [activeLocale, defaultLocale, safeValue],
  );

  const handleEditorChange = (doc: RichTextDocument) => {
    onChange({
      ...safeValue,
      [activeLocale]: doc,
    });
  };

  return (
    <div className="space-y-2 font-sans">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-zinc-800 flex items-center">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="flex border border-zinc-200 rounded overflow-hidden">
          {locales.map((loc) => (
            <button
              key={loc.code}
              type="button"
              onClick={() => setActiveLocale(loc.code)}
              className={`px-3 py-1 text-xs font-medium uppercase transition-colors ${
                activeLocale === loc.code
                  ? "bg-zinc-950 text-white"
                  : "bg-white text-zinc-600 hover:bg-zinc-100"
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
        error={error}
      />
    </div>
  );
}
