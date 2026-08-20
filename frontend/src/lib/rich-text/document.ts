import type { JSONContent } from "@tiptap/core";
import { generateJSON } from "@tiptap/html";
import { richTextExtensions } from "./extensions";

export type RichTextDocument = JSONContent;
export type LocalizedRichText = Record<string, RichTextDocument | null | undefined>;
type LocalizedRichTextSource = Record<string, unknown>;

export const emptyRichTextDocument = (): RichTextDocument => ({ type: "doc", content: [{ type: "paragraph" }] });
export const isRichTextDocument = (value: unknown): value is RichTextDocument =>
  typeof value === "object" && value !== null && (value as { type?: unknown }).type === "doc";

export const isLocalizedRichTextSource = (value: unknown): value is LocalizedRichTextSource =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function normalizeLegacyRichText(value: unknown): RichTextDocument {
  if (isRichTextDocument(value)) return value;
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return emptyRichTextDocument();
  if (/<[a-z][\s\S]*>/i.test(text)) return generateJSON(text, richTextExtensions);
  return { type: "doc", content: text.split(/\n{2,}/).map((paragraph) => ({ type: "paragraph", content: paragraph ? [{ type: "text", text: paragraph }] : [] })) };
}

export function hasLegacyLocalizedRichText(value: unknown): boolean {
  if (!isLocalizedRichTextSource(value)) return false;
  return Object.values(value).some((entry) => typeof entry === "string");
}

export function normalizeLocalizedRichText(
  value: unknown,
  locales: readonly string[] | string[] = ["th", "en", "de"],
  defaultLocale: string = "th"
): LocalizedRichText {
  const source = isLocalizedRichTextSource(value) ? value : {};
  const localeSet = new Set<string>([defaultLocale, ...locales, ...Object.keys(source)]);
  const normalized: LocalizedRichText = {};

  for (const locale of localeSet) {
    normalized[locale] = normalizeLegacyRichText(source[locale]);
  }

  return normalized;
}

export function isRichTextDocumentEmpty(doc: unknown): boolean {
  if (!isRichTextDocument(doc)) return true;
  if (!doc.content || doc.content.length === 0) return true;
  return doc.content.every((node) => {
    if (!node.content || node.content.length === 0) return true;
    return node.content.every((c) => !c.text || c.text.trim() === "");
  });
}

export function getLocalizedRichText(value: unknown, locale: string = "th", defaultLocale: string = "th"): RichTextDocument {
  if (!isLocalizedRichTextSource(value)) {
    return normalizeLegacyRichText(value);
  }

  // 1. Try requested locale
  const requestedDoc = normalizeLegacyRichText(value[locale]);
  if (!isRichTextDocumentEmpty(requestedDoc)) {
    return requestedDoc;
  }

  // 2. Fallback to default locale (usually 'th')
  const defaultDoc = normalizeLegacyRichText(value[defaultLocale]);
  if (!isRichTextDocumentEmpty(defaultDoc)) {
    return defaultDoc;
  }

  // 3. Fallback to any locale that has non-empty content
  for (const entry of Object.values(value)) {
    const candidate = normalizeLegacyRichText(entry);
    if (!isRichTextDocumentEmpty(candidate)) {
      return candidate;
    }
  }

  return requestedDoc;
}
