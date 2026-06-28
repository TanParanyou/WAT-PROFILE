"use client";

import type { ContentPage } from "@/types/website-cms";
import type { WebsiteCmsPageFormData, WebsiteCmsSectionFormData } from "@/schemas/website-cms.schema";
import { WebsitePageMetadataEditor } from "@/components/admin/website/WebsitePageMetadataEditor";
import { GenericSectionAdvancedEditor } from "@/components/admin/website/sections/GenericSectionAdvancedEditor";
import { getDefaultActiveSectionId } from "@/utils/websiteCms";

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
}) {
  const section = page.sections.find((item) => item.id === (activeSectionId ?? getDefaultActiveSectionId(page))) ?? null;

  return (
    <div className="space-y-4">
      <div className="border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        Advanced JSON can affect public rendering. Use this tab for admin/dev fixes only.
      </div>
      <WebsitePageMetadataEditor
        page={page}
        isSaving={isSavingPage}
        error={pageError}
        onSubmit={onSavePage}
        heading="Advanced page JSON"
        summary="Raw SEO, body, and settings payloads for admin/dev only."
        showIdentity={false}
        showLocalizedContent={false}
        onDirtyChange={onDirtyChange}
      />
      {section ? (
        <GenericSectionAdvancedEditor
          section={section}
          activeLocale={activeLocale}
          isSaving={isSavingSection}
          error={sectionError}
          onDirtyChange={onDirtyChange}
          onSubmit={(values) => onSaveSection(values, section.id)}
        />
      ) : null}
    </div>
  );
}
