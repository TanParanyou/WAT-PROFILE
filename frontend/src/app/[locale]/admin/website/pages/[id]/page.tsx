"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { PageLoading } from "@/components/ui/Loading";
import { WebsitePageEditorShell } from "@/components/admin/website/WebsitePageEditorShell";
import {
  useArchiveWebsiteSectionMutation,
  useCreateWebsiteSectionMutation,
  useDuplicateWebsiteSectionMutation,
  usePublishWebsitePageMutation,
  useReorderWebsiteSectionsMutation,
  useRestoreWebsiteSectionMutation,
  useUpdateWebsitePageMutation,
  useUpdateWebsiteSectionMutation,
  useWebsitePageQuery,
} from "@/hooks/website-cms";
import { useWebsiteCmsEditorStore } from "@/stores/website-cms-editor-store";
import { websitePageFormToUpdatePayload, websiteSectionFormToUpdatePayload } from "@/utils/websiteCms";

export default function WebsitePageEditor() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations("Admin");
  const pageQuery = useWebsitePageQuery(id);
  const pageMutation = useUpdateWebsitePageMutation(id);
  const sectionMutation = useUpdateWebsiteSectionMutation(id);
  const publishMutation = usePublishWebsitePageMutation(id);
  const {
    activeLocale,
    activeSectionId,
    activeTab,
    previewDevice,
    previewMode,
    hasUnsavedChanges,
    setActiveLocale,
    setActiveSectionId,
    setActiveTab,
    setPreviewDevice,
    setPreviewMode,
    setHasUnsavedChanges,
  } = useWebsiteCmsEditorStore();
  const createSectionMutation = useCreateWebsiteSectionMutation(id);
  const reorderSectionsMutation = useReorderWebsiteSectionsMutation(id);
  const archiveSectionMutation = useArchiveWebsiteSectionMutation(id);
  const restoreSectionMutation = useRestoreWebsiteSectionMutation(id);
  const duplicateSectionMutation = useDuplicateWebsiteSectionMutation(id);

  useEffect(() => {
    setActiveSectionId(null);
  }, [id, setActiveSectionId]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  if (pageQuery.isLoading) {
    return <PageLoading text={t("common.loading")} />;
  }

  if (pageQuery.isError || !pageQuery.data) {
    return <div className="border border-zinc-200 bg-white p-4 text-sm text-red-600">Page not found.</div>;
  }

  return (
    <WebsitePageEditorShell
      page={pageQuery.data}
      activeLocale={activeLocale}
      activeSectionId={activeSectionId}
      activeTab={activeTab}
      previewDevice={previewDevice}
      previewMode={previewMode}
      hasUnsavedChanges={hasUnsavedChanges}
      onActiveLocaleChange={setActiveLocale}
      onActiveSectionChange={setActiveSectionId}
      onActiveTabChange={setActiveTab}
      onPreviewDeviceChange={setPreviewDevice}
      onPreviewModeChange={setPreviewMode}
      isSavingPage={pageMutation.isPending}
      isSavingSection={sectionMutation.isPending}
      isPublishing={publishMutation.isPending}
      pageSaved={pageMutation.isSuccess}
      sectionSaved={sectionMutation.isSuccess}
      published={publishMutation.isSuccess}
      pageError={pageMutation.error}
      sectionError={sectionMutation.error}
      publishError={publishMutation.error}
      onSavePage={(values) =>
        pageMutation.mutate(
          { id: pageQuery.data.id, payload: websitePageFormToUpdatePayload(values) },
          { onSuccess: () => setHasUnsavedChanges(false) },
        )
      }
      onSaveSection={(values, sectionId) =>
        sectionMutation.mutate(
          { id: sectionId, payload: websiteSectionFormToUpdatePayload(values) },
          { onSuccess: () => setHasUnsavedChanges(false) },
        )
      }
      onPublish={() => publishMutation.mutate(pageQuery.data.id)}
      isCreatingSection={createSectionMutation.isPending}
      isReorderingSection={reorderSectionsMutation.isPending}
      isArchivingSection={archiveSectionMutation.isPending}
      isDuplicatingSection={duplicateSectionMutation.isPending}
      onCreateSection={(sectionType) =>
        createSectionMutation.mutate(
          { pageId: pageQuery.data.id, sectionType },
          {
            onSuccess: (section) => {
              setActiveSectionId(section.id);
              setHasUnsavedChanges(false);
            },
          },
        )
      }
      onReorderSections={(sectionIds) =>
        reorderSectionsMutation.mutate(
          { pageId: pageQuery.data.id, sectionIds },
          { onSuccess: () => setHasUnsavedChanges(false) },
        )
      }
      onArchiveSection={(sectionId) =>
        archiveSectionMutation.mutate(sectionId, { onSuccess: () => setHasUnsavedChanges(false) })
      }
      onRestoreSection={(sectionId) =>
        restoreSectionMutation.mutate(sectionId, { onSuccess: () => setHasUnsavedChanges(false) })
      }
      onDuplicateSection={(sectionId) =>
        duplicateSectionMutation.mutate(
          { id: sectionId },
          {
            onSuccess: (section) => {
              setActiveSectionId(section.id);
              setHasUnsavedChanges(false);
            },
          },
        )
      }
      onDirtyChange={setHasUnsavedChanges}
    />
  );
}
