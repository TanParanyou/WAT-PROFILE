"use client";

import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
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
  onPreviewDraftChange,
}: {
  page: ContentPage;
  locale: string;
  isSaving: boolean;
  error: Error | null;
  onSubmit: (values: WebsiteCmsPageFormData) => void;
  onDirtyChange?: (dirty: boolean) => void;
  onPreviewDraftChange?: (values: WebsiteCmsPageFormData) => void;
}) {
  const t = useTranslations("Admin.website");
  const publicHref = getPublicPageHref(page, locale);

  return (
    <div className="space-y-4">
      <div className="border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
        {`Last updated: ${formatCmsTimestamp(page.updated_at)} · Last published: ${formatCmsTimestamp(page.published_at)}`}
      </div>
      <WebsitePageMetadataEditor
        page={page}
        isSaving={isSaving}
        error={error}
        onSubmit={onSubmit}
        heading={t("settingsTab")}
        summary="Slug, page identity, publish state, and operational metadata."
        showLocalizedContent={false}
        showSeoJson={false}
        showBodyJson={false}
        showSettingsJson={false}
        onDirtyChange={onDirtyChange}
        onPreviewDraftChange={onPreviewDraftChange}
      />
      <Button
        type="button"
        variant="outline"
        icon={<ExternalLink size={14} />}
        onClick={() => window.open(publicHref, "_blank", "noopener,noreferrer")}
      >
        {t("viewPublic")}
      </Button>
    </div>
  );
}
