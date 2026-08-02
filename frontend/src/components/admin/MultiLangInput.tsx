"use client";

import React, { useState } from "react";
import { cn } from "@/utils/cn";
import type { MultiLangText } from "@/types/api";

interface MultiLangInputProps {
  label: string;
  value?: MultiLangText;
  onChange: (value: MultiLangText) => void;
  type?: "input" | "textarea";
  required?: boolean;
  placeholder?: string | MultiLangText;
  error?: string;
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
}: MultiLangInputProps) {
  const [activeLang, setActiveLang] = useState<"th" | "en" | "de">("th");

  const safeValue = value || { th: "", en: "", de: "" };

  const handleChange = (text: string) => {
    onChange({ ...safeValue, [activeLang]: text });
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
    <div className="space-y-2 font-sans">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-admin-foreground flex items-center">
          {label}
          {required && <span className="text-admin-danger ml-1">*</span>}
        </label>
        <div className="flex border border-admin-control-border rounded overflow-hidden">
          {langs.map((lang) => (
            <button
              key={lang.key}
              type="button"
              onClick={() => setActiveLang(lang.key)}
              className={cn(
                "px-3 py-1 text-xs font-medium uppercase transition-colors focus-visible:outline-2 focus-visible:outline-admin-focus",
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
