"use client";

import type { ContentPage } from "@/types/website-cms";
import type { WebsiteCmsPageFormData, WebsiteCmsSectionFormData } from "@/schemas/website-cms.schema";
import { WebsitePageMetadataEditor } from "@/components/admin/website/WebsitePageMetadataEditor";
import { GenericSectionAdvancedEditor } from "@/components/admin/website/sections/GenericSectionAdvancedEditor";
import { getDefaultActiveSectionId } from "@/utils/websiteCms";
import { useTranslations } from "next-intl";

export function WebsiteAdvancedTab({
  page,
  activeSectionId,
  activeLocale,
  isSavingPage,
  isSavingSection,
  pageError,
  sectionError,
  onSavePage,
  onSaveSection,
  onDirtyChange,
  onPagePreviewDraftChange,
  onSectionPreviewDraftChange,
}: {
  page: ContentPage;
  activeSectionId: string | null;
  activeLocale: string;
  isSavingPage: boolean;
  isSavingSection: boolean;
  pageError: Error | null;
  sectionError: Error | null;
  onSavePage: (values: WebsiteCmsPageFormData) => void;
  onSaveSection: (values: WebsiteCmsSectionFormData, sectionId: string) => void;
  onDirtyChange?: (dirty: boolean) => void;
  onPagePreviewDraftChange?: (values: WebsiteCmsPageFormData) => void;
  onSectionPreviewDraftChange?: (sectionId: string, values: WebsiteCmsSectionFormData) => void;
}) {
  const t = useTranslations("Admin.website");
  const section = page.sections.find((item) => item.id === (activeSectionId ?? getDefaultActiveSectionId(page))) ?? null;

  return (
    <div className="space-y-4">
      <div className="border border-admin-warning-border bg-admin-warning-surface p-3 text-sm text-admin-warning rounded-none">
        {t("advancedWarning")}
      </div>
      <WebsitePageMetadataEditor
        page={page}
        isSaving={isSavingPage}
        error={pageError}
        onSubmit={onSavePage}
        heading={t("saveAdvancedPage")}
        summary="Raw SEO, body, and settings payloads for admin/dev only."
        showIdentity={false}
        showLocalizedContent={false}
        onDirtyChange={onDirtyChange}
        onPreviewDraftChange={onPagePreviewDraftChange}
      />
      {section ? (
        <GenericSectionAdvancedEditor
          section={section}
          activeLocale={activeLocale}
          isSaving={isSavingSection}
          error={sectionError}
          onDirtyChange={onDirtyChange}
          onPreviewDraftChange={(values) => onSectionPreviewDraftChange?.(section.id, values)}
          onSubmit={(values) => onSaveSection(values, section.id)}
        />
      ) : null}
    </div>
  );
}
