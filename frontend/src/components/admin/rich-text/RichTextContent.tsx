import React from "react";
import { generateHTML } from "@tiptap/html";
import { richTextExtensions } from "@/lib/rich-text/extensions";
import { getLocalizedRichText } from "@/lib/rich-text/document";
import { sanitizeHtml } from "@/utils/sanitize";

type RichTextContentProps = {
  value: unknown;
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
  const document = getLocalizedRichText(value, locale, defaultLocale);
  const html = sanitizeHtml(generateHTML(document, richTextExtensions));

  const editorStyles = [
    "font-sans text-base text-site-foreground",
    "[&_p]:my-2",
    "[&_strong]:font-bold",
    "[&_em]:italic",
    "[&_s]:line-through",
    "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6",
    "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6",
    "[&_li]:my-1",
    "[&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-site-accent [&_blockquote]:bg-site-surface [&_blockquote]:px-4 [&_blockquote]:py-2 [&_blockquote]:text-site-body",
    "[&_hr]:my-4 [&_hr]:border-site-divider",
    "[&_a]:font-medium [&_a]:text-site-accent [&_a]:underline [&_a]:underline-offset-2",
    "[&_img]:rounded-none [&_img]:max-w-full [&_img]:h-auto [&_img]:my-4"
  ].join(" ");

  return (
    <div
      className={`${editorStyles} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
