import type { JSONContent } from "@tiptap/core";
import type { LocalizedRichTextDto } from "./api-types";

export function toPlainText(node: unknown): string {
  if (!node || typeof node !== "object") return "";

  const n = node as JSONContent;
  const ownText = typeof n.text === "string" ? n.text : "";
  const childText = Array.isArray(n.content)
    ? n.content.map((child) => toPlainText(child)).filter(Boolean).join(" ")
    : "";

  return [ownText, childText].filter(Boolean).join(" ").trim();
}

export function getLocalizedPlainText(value: LocalizedRichTextDto, locale: string): string {
  const document = value[locale] ?? value.th ?? Object.values(value).find((entry) => entry != null) ?? null;
  return toPlainText(document);
}
