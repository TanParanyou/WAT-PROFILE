"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
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
import { useConfirm } from "@/hooks/useConfirm";
import {
  applyPageFormDraft,
  applySectionFormDrafts,
  getDefaultActiveSectionId,
  hasDraftDifference,
} from "@/utils/websiteCms";
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
  const t = useTranslations("Admin.website");
  const [pagePreviewDraft, setPagePreviewDraft] = useState<WebsiteCmsPageFormData | null>(null);
  const [sectionPreviewDrafts, setSectionPreviewDrafts] = useState<Record<string, WebsiteCmsSectionFormData>>({});
  const { confirm, ConfirmDialog } = useConfirm();

  const canLeaveCurrentForm = useCallback(async () => {
    if (!hasUnsavedChanges) return true;
    return confirm({
      title: t("unsavedEdits"),
      message: t("unsavedEditsMessage"),
      confirmText: t("continue"),
      cancelText: t("stay"),
      variant: "warning",
    });
  }, [confirm, hasUnsavedChanges, t]);

  const livePreviewPage = useMemo(
    () => applySectionFormDrafts(applyPageFormDraft(page, pagePreviewDraft), sectionPreviewDrafts),
    [page, pagePreviewDraft, sectionPreviewDrafts],
  );

  const updatePagePreviewDraft = useCallback((values: WebsiteCmsPageFormData) => {
    const nextDraft = cloneDraft(values);
    setPagePreviewDraft((current) => (draftsMatch(current, nextDraft) ? current : nextDraft));
  }, []);

  const updateSectionPreviewDraft = useCallback((sectionId: string, values: WebsiteCmsSectionFormData) => {
    const nextDraft = cloneDraft(values);
    setSectionPreviewDrafts((current) => {
      if (draftsMatch(current[sectionId] ?? null, nextDraft)) return current;
      return { ...current, [sectionId]: nextDraft };
    });
  }, []);

  useEffect(() => {
    if (!activeSectionId) {
      onActiveSectionChange(getDefaultActiveSectionId(page));
    }
  }, [activeSectionId, onActiveSectionChange, page]);

  useEffect(() => {
    setPagePreviewDraft(null);
    setSectionPreviewDrafts({});
  }, [page.id, page.updated_at]);

  return (
    <div className="space-y-4">
      <ConfirmDialog />
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
        <div className="space-y-4 border border-admin-border bg-admin-surface p-4 rounded-none">
          <WebsiteEditorTabs
            value={activeTab}
            onChange={async (tab) => {
              if (!(await canLeaveCurrentForm())) return;
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
              onSectionPreviewDraftChange={updateSectionPreviewDraft}
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
              onPreviewDraftChange={updatePagePreviewDraft}
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
              onPreviewDraftChange={updatePagePreviewDraft}
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
              onPagePreviewDraftChange={updatePagePreviewDraft}
              onSectionPreviewDraftChange={updateSectionPreviewDraft}
            />
          ) : null}
        </div>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-none border border-admin-control-border bg-admin-surface p-1">
              <button
                type="button"
                className={previewMode === "draft" ? "bg-admin-action text-admin-on-action rounded px-3 py-2 text-xs font-medium focus-visible:outline-2 focus-visible:outline-admin-focus" : "px-3 py-2 text-xs font-medium text-admin-body hover:text-admin-foreground focus-visible:outline-2 focus-visible:outline-admin-focus"}
                onClick={() => onPreviewModeChange("draft")}
              >
                {t("draft")}
              </button>
              <button
                type="button"
                className={previewMode === "published" ? "bg-admin-action text-admin-on-action rounded px-3 py-2 text-xs font-medium focus-visible:outline-2 focus-visible:outline-admin-focus" : "px-3 py-2 text-xs font-medium text-admin-body hover:text-admin-foreground focus-visible:outline-2 focus-visible:outline-admin-focus"}
                onClick={() => onPreviewModeChange("published")}
              >
                {t("published")}
              </button>
            </div>
            <WebsitePreviewDeviceSwitch value={previewDevice} onChange={onPreviewDeviceChange} />
          </div>
          <WebsitePreviewPanel page={previewMode === "draft" ? livePreviewPage : page} locale={activeLocale} device={previewDevice} mode={previewMode} />
          <WebsitePublishPanel page={page} isPublishing={isPublishing} onPublish={onPublish} />
        </div>
      </div>
    </div>
  );
}

function draftsMatch(current: unknown, next: unknown) {
  if (!current || !next) return false;
  return JSON.stringify(current) === JSON.stringify(next);
}

function cloneDraft<T>(value: T): T {
  return structuredClone(value);
}
