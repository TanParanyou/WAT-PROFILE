"use client";

import React from "react";
import { cn } from "@/utils/cn";

interface LocalizedFieldGroupProps {
  activeLocale: "th" | "en" | "de";
  onLocaleChange: (locale: "th" | "en" | "de") => void;
  completeness?: {
    th: boolean;
    en: boolean;
    de: boolean;
  };
}

export function LocalizedFieldGroup({
  activeLocale,
  onLocaleChange,
  completeness,
}: LocalizedFieldGroupProps) {
  const locales = [
    { code: "th" as const, label: "ภาษาไทย (TH)" },
    { code: "en" as const, label: "English (EN)" },
    { code: "de" as const, label: "Deutsch (DE)" },
  ];

  return (
    <div className="flex border-b border-zinc-200 mb-6 bg-zinc-50 p-1 rounded-t-lg gap-1">
      {locales.map((loc) => {
        const isComplete = completeness ? completeness[loc.code] : true;
        const isThai = loc.code === "th";
        return (
          <button
            key={loc.code}
            type="button"
            onClick={() => onLocaleChange(loc.code)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2",
              activeLocale === loc.code
                ? "bg-white text-amber-700 shadow-sm border border-zinc-200"
                : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
            )}
          >
            <span>{loc.label}</span>
            {isThai && <span className="text-red-500 font-bold">*</span>}
            {!isThai && !isComplete && (
              <span 
                className="w-2 h-2 rounded-full bg-amber-400" 
                title="แปลไม่ครบถ้วน (Incomplete translation)" 
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
export default LocalizedFieldGroup;
