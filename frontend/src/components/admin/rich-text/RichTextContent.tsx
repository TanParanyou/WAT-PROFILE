import React from "react";
import { generateHTML } from "@tiptap/html";
import { richTextExtensions } from "@/lib/rich-text/extensions";
import { getLocalizedRichText } from "@/lib/rich-text/document";
import type { LocalizedRichText } from "@/lib/rich-text/document";
import { sanitizeHtml } from "@/utils/sanitize";

type RichTextContentProps = {
  value: LocalizedRichText;
  locale: string;
  defaultLocale: string;
  className?: string;
};

export function RichTextContent({
  value,
  locale,
  defaultLocale,
  className = "",
}: RichTextContentProps) {
  // Safe normalization of value inside getLocalizedRichText
  const document = getLocalizedRichText(value || {}, locale, defaultLocale);
  const html = sanitizeHtml(generateHTML(document, richTextExtensions));

  return (
    <div
      className={`prose max-w-none dark:prose-invert ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
