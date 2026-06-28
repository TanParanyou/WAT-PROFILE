"use client";

import type { ContentPage } from "@/types/website-cms";
import { SeoPreviewPanel } from "@/components/admin/website/SeoPreviewPanel";

export function WebsiteSeoPanel({ page, locale }: { page: ContentPage; locale: string }) {
  return <SeoPreviewPanel page={page} locale={locale} />;
}
