import type { LocalizedText } from "@/types/common";

export function getLocalizedText(
  value: Partial<LocalizedText> | Record<string, string> | undefined | null,
  locale: string,
) {
  if (!value) return "";
  return (
    value[locale as keyof typeof value] ||
    value.en ||
    value.th ||
    Object.values(value).find((item) => typeof item === "string" && item) ||
    ""
  );
}
