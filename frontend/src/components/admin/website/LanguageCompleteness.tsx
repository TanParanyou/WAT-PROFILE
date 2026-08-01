"use client";

import type { LocalizedText } from "@/types/common";

export function LanguageCompleteness({ value }: { value: Partial<LocalizedText> | undefined }) {
  const items = [
    ["th", value?.th],
    ["en", value?.en],
    ["de", value?.de],
  ] as const;
  const filled = items.filter(([, text]) => Boolean(text && text.trim())).length;
  return (
    <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-admin-muted">
      {filled}/3
    </div>
  );
}
