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
    "font-sans text-base text-current leading-relaxed",
    // Headings
    "[&_h1]:text-2xl sm:[&_h1]:text-3xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:mt-8 [&_h1]:mb-4",
    "[&_h2]:text-xl sm:[&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:mt-6 [&_h2]:mb-3",
    "[&_h3]:text-lg sm:[&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-5 [&_h3]:mb-2",
    "[&_h4]:text-base sm:[&_h4]:text-lg [&_h4]:font-semibold [&_h4]:mt-4 [&_h4]:mb-2",
    // Paragraphs & Inline formatting
    "[&_p]:my-3 [&_p]:leading-relaxed",
    "[&_strong]:font-bold",
    "[&_b]:font-bold",
    "[&_em]:italic",
    "[&_i]:italic",
    "[&_u]:underline [&_u]:underline-offset-2",
    "[&_s]:line-through",
    "[&_sub]:text-xs [&_sub]:align-sub",
    "[&_sup]:text-xs [&_sup]:align-super",
    "[&_mark]:bg-amber-200/80 dark:[&_mark]:bg-amber-500/30 [&_mark]:px-1 [&_mark]:py-0.5 [&_mark]:rounded",
    // Code & Codeblock
    "[&_code]:rounded [&_code]:bg-neutral-100 dark:[&_code]:bg-neutral-800 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm [&_code]:text-amber-700 dark:[&_code]:text-amber-300",
    "[&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-neutral-900 [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-sm [&_pre]:text-neutral-100",
    "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit",
    // Lists
    "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul_ul]:my-1.5 [&_ul_ul]:list-circle [&_ul_ul_ul]:list-square",
    "[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol_ol]:my-1.5",
    "[&_li]:my-1.5 [&_li>p]:my-0.5",
    // Blockquote
    "[&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-site-accent [&_blockquote]:bg-site-surface [&_blockquote]:px-4 [&_blockquote]:py-2.5 [&_blockquote]:italic [&_blockquote]:text-site-body",
    // Horizontal Rule
    "[&_hr]:my-6 [&_hr]:border-site-divider",
    // Links
    "[&_a]:font-medium [&_a]:text-site-accent [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:opacity-80",
    // Images & Floating
    "[&_img]:max-w-full [&_img]:h-auto [&_img]:my-4 [&_img]:rounded-none",
    "[&_img[data-align=left]]:float-left [&_img[data-align=left]]:mr-6 [&_img[data-align=left]]:mb-4 [&_img[data-align=left]]:max-w-[50%]",
    "[&_img[data-align=right]]:float-right [&_img[data-align=right]]:ml-6 [&_img[data-align=right]]:mb-4 [&_img[data-align=right]]:max-w-[50%]",
    "[&_img[data-align=center]]:mx-auto [&_img[data-align=center]]:block",
    "[&_img[data-align=full]]:w-full [&_img[data-align=full]]:block",
    "[&_img]:clear-both",
  ].join(" ");

  return (
    <div
      className={`${editorStyles} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
