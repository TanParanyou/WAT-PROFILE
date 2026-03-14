"use client";

import React, { useState } from "react";
import { cn } from "@/utils/cn";
import type { MultiLangText } from "@/types/api";
import { RichTextEditor } from "./RichTextEditor";

interface MultiLangRichTextProps {
  label: string;
  value: MultiLangText;
  onChange: (value: MultiLangText) => void;
  required?: boolean;
  error?: string;
  placeholder?: string;
}

const langs = [
  { key: "th" as const, label: "TH" },
  { key: "en" as const, label: "EN" },
  { key: "de" as const, label: "DE" },
];

export function MultiLangRichText({
  label,
  value,
  onChange,
  required = false,
  error,
  placeholder,
}: MultiLangRichTextProps) {
  const [activeLang, setActiveLang] = useState<"th" | "en" | "de">("th");

  const handleChange = (htmlStr: string) => {
    // Tiptap might return '<p></p>' for empty content. Treat it as empty.
    const finalValue = htmlStr === "<p></p>" ? "" : htmlStr;
    onChange({ ...value, [activeLang]: finalValue });
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="flex gap-1">
          {langs.map((lang) => (
            <button
              key={lang.key}
              type="button"
              onClick={() => setActiveLang(lang.key)}
              className={cn(
                "px-2 py-0.5 text-xs rounded font-medium transition-colors",
                activeLang === lang.key
                  ? "bg-amber-600 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200",
              )}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-[250px]">
        {/* We unmount and remount or rely on a key to ensure tiptap reinstantiates when language changes.
            Using a key based on activeLang is the safest way to reset Tiptap state seamlessly. */}
        <RichTextEditor
          key={activeLang}
          value={value[activeLang] || ""}
          onChange={handleChange}
          error={error}
          placeholder={placeholder || `${label} (${activeLang.toUpperCase()})`}
        />
      </div>

      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}
