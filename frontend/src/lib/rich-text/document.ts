import type { JSONContent } from "@tiptap/core";
import { generateJSON } from "@tiptap/html";
import { richTextExtensions } from "./extensions";

export type RichTextDocument = JSONContent;
export type LocalizedRichText = Record<string, RichTextDocument>;

export const emptyRichTextDocument = (): RichTextDocument => ({ type: "doc", content: [{ type: "paragraph" }] });
export const isRichTextDocument = (value: unknown): value is RichTextDocument =>
  typeof value === "object" && value !== null && (value as { type?: unknown }).type === "doc";

export function normalizeLegacyRichText(value: unknown): RichTextDocument {
  if (isRichTextDocument(value)) return value;
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return emptyRichTextDocument();
  if (/<[a-z][\s\S]*>/i.test(text)) return generateJSON(text, richTextExtensions);
  return { type: "doc", content: text.split(/\n{2,}/).map((paragraph) => ({ type: "paragraph", content: paragraph ? [{ type: "text", text: paragraph }] : [] })) };
}

export function getLocalizedRichText(value: LocalizedRichText, locale: string, defaultLocale: string): RichTextDocument {
  return value[locale] ?? value[defaultLocale] ?? Object.values(value).find(isRichTextDocument) ?? emptyRichTextDocument();
}
