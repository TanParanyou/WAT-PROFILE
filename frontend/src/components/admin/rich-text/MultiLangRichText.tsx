"use client";

import React, { useState } from "react";
import type { LocalizedRichText } from "@/lib/rich-text/document";
import { normalizeLegacyRichText, emptyRichTextDocument } from "@/lib/rich-text/document";
import { RichTextEditor } from "./RichTextEditor";

type RichTextLocale = { code: string; label: string };

type MultiLangRichTextProps = {
  label: string;
  locales: RichTextLocale[];
  defaultLocale: string;
  value: LocalizedRichText;
  onChange: (value: LocalizedRichText) => void;
  disabled?: boolean;
  error?: string;
};

export function MultiLangRichText({
  label,
  locales,
  defaultLocale,
  value,
  onChange,
  disabled = false,
  error,
}: MultiLangRichTextProps) {
  const [activeLocale, setActiveLocale] = useState(defaultLocale);

  const handleEditorChange = (doc: any) => {
    onChange({
      ...value,
      [activeLocale]: doc,
    });
  };

  const getLocaleDocument = (locale: string) => {
    const rawVal = value?.[locale];
    return normalizeLegacyRichText(rawVal);
  };

  return (
    <div className="space-y-2 font-sans">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-zinc-800">{label}</label>
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
        key={activeLocale} // Using key to force editor remount when switching languages is safe and ensures proper initial content seeding
        value={getLocaleDocument(activeLocale)}
        onChange={handleEditorChange}
        disabled={disabled}
        error={error}
      />
    </div>
  );
}
