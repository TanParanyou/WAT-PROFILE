"use client";

import type { ContentPage } from "@/types/website-cms";
import { getLocalizedText } from "@/utils/localizedText";

export function SeoPreviewPanel({ page, locale }: { page: ContentPage; locale: string }) {
  const title = getLocalizedText(page.published_title || page.title, locale);
  const description = getLocalizedText(page.published_description || page.description, locale);
  const canonicalUrl = page.seo?.canonical_url || `/${locale}/${page.slug}`;

  return (
    <div className="border border-admin-border bg-admin-surface p-4 rounded-xl">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-admin-muted">SEO</p>
      <div className="mt-3 space-y-2">
        <div className="text-sm font-medium text-admin-foreground">{title}</div>
        <div className="text-sm text-admin-body">{description}</div>
        <div className="font-mono text-[11px] text-admin-muted">{canonicalUrl}</div>
      </div>
    </div>
  );
}
