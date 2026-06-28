"use client";

import { useEffect } from "react";
import type { ContentPage } from "@/types/website-cms";
import { WebsiteContentTab } from "@/components/admin/website/WebsiteContentTab";
import { WebsiteEditorTabs } from "@/components/admin/website/WebsiteEditorTabs";
import { WebsiteEditorToolbar } from "@/components/admin/website/WebsiteEditorToolbar";
import { WebsiteEditorStatePanel } from "@/components/admin/website/WebsiteEditorStatePanel";
import { WebsiteAdvancedTab } from "@/components/admin/website/WebsiteAdvancedTab";
import { WebsitePreviewDeviceSwitch } from "@/components/admin/website/WebsitePreviewDeviceSwitch";
import { WebsitePreviewPanel } from "@/components/admin/website/WebsitePreviewPanel";
import { WebsitePublishPanel } from "@/components/admin/website/WebsitePublishPanel";
import { WebsiteSeoTab } from "@/components/admin/website/WebsiteSeoTab";
import { WebsiteSettingsTab } from "@/components/admin/website/WebsiteSettingsTab";
import { getDefaultActiveSectionId, hasDraftDifference } from "@/utils/websiteCms";
import type {
  WebsiteCmsEditorTab,
  WebsiteCmsLocale,
  WebsiteCmsPreviewDevice,
  WebsiteCmsPreviewMode,
} from "@/stores/website-cms-editor-store";
import type { WebsiteCmsPageFormData, WebsiteCmsSectionFormData } from "@/schemas/website-cms.schema";

export function WebsitePageEditorShell({
  page,
  activeLocale,
  activeSectionId,
  activeTab,
  previewDevice,
  previewMode,
  hasUnsavedChanges,
  onActiveLocaleChange,
  onActiveSectionChange,
  onActiveTabChange,
  onPreviewDeviceChange,
  onPreviewModeChange,
  isSavingPage,
  isSavingSection,
  isPublishing,
  pageSaved,
  sectionSaved,
  published,
  pageError,
  sectionError,
  publishError,
  onSavePage,
  onSaveSection,
  onPublish,
  isCreatingSection,
  isReorderingSection,
  isArchivingSection,
  isDuplicatingSection,
  onCreateSection,
  onReorderSections,
  onArchiveSection,
  onRestoreSection,
  onDuplicateSection,
  onDirtyChange,
}: {
  page: ContentPage;
  activeLocale: WebsiteCmsLocale;
  activeSectionId: string | null;
  activeTab: WebsiteCmsEditorTab;
  previewDevice: WebsiteCmsPreviewDevice;
  previewMode: WebsiteCmsPreviewMode;
  hasUnsavedChanges: boolean;
  onActiveLocaleChange: (locale: WebsiteCmsLocale) => void;
  onActiveSectionChange: (sectionId: string | null) => void;
  onActiveTabChange: (tab: WebsiteCmsEditorTab) => void;
  onPreviewDeviceChange: (device: WebsiteCmsPreviewDevice) => void;
  onPreviewModeChange: (mode: WebsiteCmsPreviewMode) => void;
  isSavingPage: boolean;
  isSavingSection: boolean;
  isPublishing: boolean;
  pageSaved: boolean;
  sectionSaved: boolean;
  published: boolean;
  pageError: Error | null;
  sectionError: Error | null;
  publishError: Error | null;
  onSavePage: (values: WebsiteCmsPageFormData) => void;
  onSaveSection: (values: WebsiteCmsSectionFormData, sectionId: string) => void;
  onPublish: () => void;
  isCreatingSection: boolean;
  isReorderingSection: boolean;
  isArchivingSection: boolean;
  isDuplicatingSection: boolean;
  onCreateSection: (sectionType: string) => void;
  onReorderSections: (sectionIds: string[]) => void;
  onArchiveSection: (sectionId: string) => void;
  onRestoreSection: (sectionId: string) => void;
  onDuplicateSection: (sectionId: string) => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const canLeaveCurrentForm = () => {
    return !hasUnsavedChanges || window.confirm("You have unsaved edits. Continue without saving?");
  };

  useEffect(() => {
    if (!activeSectionId) {
      onActiveSectionChange(getDefaultActiveSectionId(page));
    }
  }, [activeSectionId, onActiveSectionChange, page]);

  return (
    <div className="space-y-4">
      <WebsiteEditorToolbar
        page={page}
        locale={activeLocale}
        isPublishing={isPublishing}
        hasUnpublishedChanges={hasDraftDifference(page)}
        hasUnsavedChanges={hasUnsavedChanges}
        onBeforeLeave={canLeaveCurrentForm}
        onPublish={onPublish}
      />
      <WebsiteEditorStatePanel
        savingPage={isSavingPage}
        savingSection={isSavingSection}
        publishing={isPublishing}
        pageSaved={pageSaved}
        sectionSaved={sectionSaved}
        published={published}
        pageError={pageError}
        sectionError={sectionError}
        publishError={publishError}
      />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="space-y-4 border border-zinc-200 bg-white p-4">
          <WebsiteEditorTabs
            value={activeTab}
            onChange={(tab) => {
              if (!canLeaveCurrentForm()) return;
              onActiveTabChange(tab);
            }}
          />
          {activeTab === "content" ? (
            <WebsiteContentTab
              page={page}
              activeLocale={activeLocale}
              activeSectionId={activeSectionId}
              isSavingSection={isSavingSection}
              sectionError={sectionError}
              isCreatingSection={isCreatingSection}
              isReorderingSection={isReorderingSection}
              isArchivingSection={isArchivingSection}
              isDuplicatingSection={isDuplicatingSection}
              hasUnsavedChanges={hasUnsavedChanges}
              onActiveLocaleChange={onActiveLocaleChange}
              onActiveSectionChange={onActiveSectionChange}
              onSaveSection={onSaveSection}
              onCreateSection={onCreateSection}
              onReorderSections={onReorderSections}
              onArchiveSection={onArchiveSection}
              onRestoreSection={onRestoreSection}
              onDuplicateSection={onDuplicateSection}
              onDirtyChange={onDirtyChange}
              onBeforeLeave={canLeaveCurrentForm}
            />
          ) : null}
          {activeTab === "seo" ? (
            <WebsiteSeoTab
              page={page}
              locale={activeLocale}
              isSaving={isSavingPage}
              error={pageError}
              onSubmit={onSavePage}
              onDirtyChange={onDirtyChange}
            />
          ) : null}
          {activeTab === "settings" ? (
            <WebsiteSettingsTab
              page={page}
              locale={activeLocale}
              isSaving={isSavingPage}
              error={pageError}
              onSubmit={onSavePage}
              onDirtyChange={onDirtyChange}
            />
          ) : null}
          {activeTab === "advanced" ? (
            <WebsiteAdvancedTab
              page={page}
              activeSectionId={activeSectionId}
              activeLocale={activeLocale}
              isSavingPage={isSavingPage}
              isSavingSection={isSavingSection}
              pageError={pageError}
              sectionError={sectionError}
              onSavePage={onSavePage}
              onSaveSection={onSaveSection}
              onDirtyChange={onDirtyChange}
            />
          ) : null}
        </div>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex border border-zinc-200 p-1">
              <button
                type="button"
                className={previewMode === "draft" ? "bg-zinc-950 px-3 py-2 text-xs font-medium text-white" : "px-3 py-2 text-xs font-medium text-zinc-600"}
                onClick={() => onPreviewModeChange("draft")}
              >
                Draft
              </button>
              <button
                type="button"
                className={previewMode === "published" ? "bg-zinc-950 px-3 py-2 text-xs font-medium text-white" : "px-3 py-2 text-xs font-medium text-zinc-600"}
                onClick={() => onPreviewModeChange("published")}
              >
                Published
              </button>
            </div>
            <WebsitePreviewDeviceSwitch value={previewDevice} onChange={onPreviewDeviceChange} />
          </div>
          <WebsitePreviewPanel page={page} locale={activeLocale} device={previewDevice} mode={previewMode} />
          <WebsitePublishPanel page={page} isPublishing={isPublishing} onPublish={onPublish} />
        </div>
      </div>
    </div>
  );
}
