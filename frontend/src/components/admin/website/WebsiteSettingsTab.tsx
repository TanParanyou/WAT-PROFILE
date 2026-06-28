"use client";

import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WebsitePageMetadataEditor } from "@/components/admin/website/WebsitePageMetadataEditor";
import type { ContentPage } from "@/types/website-cms";
import type { WebsiteCmsPageFormData } from "@/schemas/website-cms.schema";
import { formatCmsTimestamp, getPublicPageHref } from "@/utils/websiteCms";

export function WebsiteSettingsTab({
  page,
  locale,
  isSaving,
  error,
  onSubmit,
  onDirtyChange,
}: {
  page: ContentPage;
  locale: string;
  isSaving: boolean;
  error: Error | null;
  onSubmit: (values: WebsiteCmsPageFormData) => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const publicHref = getPublicPageHref(page, locale);

  return (
    <div className="space-y-4">
      <div className="border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
        Last updated: {formatCmsTimestamp(page.updated_at)} · Last published: {formatCmsTimestamp(page.published_at)}
      </div>
      <WebsitePageMetadataEditor
        page={page}
        isSaving={isSaving}
        error={error}
        onSubmit={onSubmit}
        heading="Page settings"
        summary="Slug, page identity, publish state, and operational metadata."
        showLocalizedContent={false}
        showSeoJson={false}
        showBodyJson={false}
        showSettingsJson={false}
        onDirtyChange={onDirtyChange}
      />
      <Button
        type="button"
        variant="outline"
        icon={<ExternalLink size={14} />}
        onClick={() => window.open(publicHref, "_blank", "noopener,noreferrer")}
      >
        View public
      </Button>
    </div>
  );
}
