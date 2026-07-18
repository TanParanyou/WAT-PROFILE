import type { JSONContent } from "@tiptap/core";
import type { LocalizedRichTextDto } from "./api-types";

function toPlainText(node: JSONContent | null | undefined): string {
  if (!node) return "";

  const ownText = typeof node.text === "string" ? node.text : "";
  const childText = node.content?.map((child) => toPlainText(child)).filter(Boolean).join(" ") ?? "";

  return [ownText, childText].filter(Boolean).join(" ").trim();
}

export function getLocalizedPlainText(value: LocalizedRichTextDto, locale: string): string {
  const document = value[locale] ?? value.th ?? Object.values(value).find((entry) => entry != null) ?? null;
  return toPlainText(document);
}
