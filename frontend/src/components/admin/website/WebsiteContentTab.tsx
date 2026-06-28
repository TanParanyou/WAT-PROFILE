"use client";

import { Archive, ArchiveRestore, ArrowDown, ArrowUp, Copy, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ContentPage } from "@/types/website-cms";
import { WebsiteLocaleTabs } from "@/components/admin/website/WebsiteLocaleTabs";
import { WebsiteSectionList } from "@/components/admin/website/WebsiteSectionList";
import { HeroSectionEditor } from "@/components/admin/website/sections/HeroSectionEditor";
import { ContactInfoSectionEditor } from "@/components/admin/website/sections/ContactInfoSectionEditor";
import { ContactFormSectionEditor } from "@/components/admin/website/sections/ContactFormSectionEditor";
import { RichTextSectionEditor } from "@/components/admin/website/sections/RichTextSectionEditor";
import { MapSectionEditor } from "@/components/admin/website/sections/MapSectionEditor";
import { GenericSectionAdvancedEditor } from "@/components/admin/website/sections/GenericSectionAdvancedEditor";
import type { WebsiteCmsLocale } from "@/stores/website-cms-editor-store";
import { Button } from "@/components/ui/Button";
import type { WebsiteCmsSectionFormData } from "@/schemas/website-cms.schema";
import { getAvailableSectionTemplates, getDefaultActiveSectionId, sortContentSections } from "@/utils/websiteCms";

export function WebsiteContentTab({
  page,
  activeLocale,
  activeSectionId,
  isSavingSection,
  sectionError,
  isCreatingSection,
  isReorderingSection,
  isArchivingSection,
  isDuplicatingSection,
  onActiveLocaleChange,
  onActiveSectionChange,
  onSaveSection,
  onCreateSection,
  onReorderSections,
  onArchiveSection,
  onRestoreSection,
  onDuplicateSection,
  hasUnsavedChanges,
  onDirtyChange,
  onSectionPreviewDraftChange,
  onBeforeLeave,
}: {
  page: ContentPage;
  activeLocale: WebsiteCmsLocale;
  activeSectionId: string | null;
  isSavingSection: boolean;
  sectionError: Error | null;
  isCreatingSection: boolean;
  isReorderingSection: boolean;
  isArchivingSection: boolean;
  isDuplicatingSection: boolean;
  onActiveLocaleChange: (locale: WebsiteCmsLocale) => void;
  onActiveSectionChange: (sectionId: string | null) => void;
  onSaveSection: (values: WebsiteCmsSectionFormData, sectionId: string) => void;
  onCreateSection: (sectionType: string) => void;
  onReorderSections: (sectionIds: string[]) => void;
  onArchiveSection: (sectionId: string) => void;
  onRestoreSection: (sectionId: string) => void;
  onDuplicateSection: (sectionId: string) => void;
  hasUnsavedChanges: boolean;
  onDirtyChange?: (dirty: boolean) => void;
  onSectionPreviewDraftChange?: (sectionId: string, values: WebsiteCmsSectionFormData) => void;
  onBeforeLeave: () => Promise<boolean>;
}) {
  const t = useTranslations("Admin.website");
  const sortedSections = sortContentSections(page.sections);
  const activeSection = sortedSections.find((section) => section.id === (activeSectionId ?? getDefaultActiveSectionId(page))) ?? null;
  const activeIndex = activeSection ? sortedSections.findIndex((section) => section.id === activeSection.id) : -1;
  const templates = getAvailableSectionTemplates(page.page_key);
  const selectSection = async (sectionId: string) => {
    if (hasUnsavedChanges && !(await onBeforeLeave())) return;
    onActiveSectionChange(sectionId);
  };
  const confirmSectionAction = async () => {
    if (hasUnsavedChanges && !(await onBeforeLeave())) return false;
    return true;
  };
  const reorderActiveSection = async (direction: "up" | "down") => {
    if (!(await confirmSectionAction())) return;
    if (!activeSection) return;
    const next = [...sortedSections];
    const target = direction === "up" ? activeIndex - 1 : activeIndex + 1;
    if (target < 0 || target >= next.length) return;
    [next[activeIndex], next[target]] = [next[target], next[activeIndex]];
    onReorderSections(next.map((section) => section.id));
  };

  return (
    <div className="space-y-4">
      <WebsiteLocaleTabs activeLocale={activeLocale} onChange={onActiveLocaleChange} />
      {templates.length ? (
        <div className="border border-zinc-200 bg-zinc-50 p-3">
          <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">{t("addSection")}</div>
          <div className="flex flex-wrap gap-2">
            {templates.map((template) => (
              <Button
                key={template.type}
                type="button"
                variant="outline"
                size="sm"
                icon={<Plus size={14} />}
                isLoading={isCreatingSection}
                onClick={async () => {
                  if (!(await confirmSectionAction())) return;
                  onCreateSection(template.type);
                }}
              >
                {template.label}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
      {page.sections.length ? (
        <>
          <WebsiteSectionList sections={page.sections} activeSectionId={activeSection?.id ?? null} onSelect={selectSection} />
          {activeSection ? (
            <div className="space-y-3">
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={<ArrowUp size={14} />}
                  disabled={activeIndex <= 0}
                  isLoading={isReorderingSection}
                  onClick={() => void reorderActiveSection("up")}
                >
                  {t("moveUp")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={<ArrowDown size={14} />}
                  disabled={activeIndex < 0 || activeIndex === sortedSections.length - 1}
                  isLoading={isReorderingSection}
                  onClick={() => void reorderActiveSection("down")}
                >
                  {t("moveDown")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={activeSection.status === "archived" ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                  isLoading={isArchivingSection}
                  onClick={async () => {
                    if (!(await confirmSectionAction())) return;
                    if (activeSection.status === "archived") {
                      onRestoreSection(activeSection.id);
                    } else {
                      onArchiveSection(activeSection.id);
                    }
                  }}
                >
                  {activeSection.status === "archived" ? t("restore") : t("archive")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={<Copy size={14} />}
                  isLoading={isDuplicatingSection}
                  onClick={async () => {
                    if (!(await confirmSectionAction())) return;
                    onDuplicateSection(activeSection.id);
                  }}
                >
                  {t("duplicate")}
                </Button>
              </div>
              <SectionEditor
                section={activeSection}
                activeLocale={activeLocale}
                isSaving={isSavingSection}
                error={sectionError}
                onDirtyChange={onDirtyChange}
                onPreviewDraftChange={(values) => onSectionPreviewDraftChange?.(activeSection.id, values)}
                onSubmit={(values) => onSaveSection(values, activeSection.id)}
              />
            </div>
          ) : (
            <div className="border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm text-zinc-600">
              Select a section to start editing this page.
            </div>
          )}
        </>
      ) : (
        <div className="border border-dashed border-zinc-300 bg-zinc-50 p-6">
          <p className="font-medium text-zinc-950">This page does not have any sections yet.</p>
          <p className="mt-2 text-sm text-zinc-600">
            The preview can still render page-level metadata, but content editing will stay empty until sections are added.
          </p>
        </div>
      )}
    </div>
  );
}

function SectionEditor(props: React.ComponentProps<typeof GenericSectionAdvancedEditor>) {
  switch (props.section.section_type) {
    case "hero":
      return <HeroSectionEditor {...props} />;
    case "contact_info":
      return <ContactInfoSectionEditor {...props} />;
    case "contact_form":
      return <ContactFormSectionEditor {...props} />;
    case "rich_text":
      return <RichTextSectionEditor {...props} />;
    case "map":
      return <MapSectionEditor {...props} />;
    default:
      return <GenericSectionAdvancedEditor {...props} />;
  }
}
