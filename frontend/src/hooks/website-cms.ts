import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { websiteCmsAdminService } from "@/services/websiteCmsService";
import type { ContentPage, ContentSection } from "@/types/website-cms";
import { websitePageFormToUpdatePayload, websiteSectionFormToUpdatePayload } from "@/utils/websiteCms";

export const websiteCmsKeys = {
  all: ["website-cms"] as const,
  pages: () => [...websiteCmsKeys.all, "pages"] as const,
  page: (pageKey: string) => [...websiteCmsKeys.all, "page", pageKey] as const,
};

export function useWebsitePagesQuery() {
  return useQuery({
    queryKey: websiteCmsKeys.pages(),
    queryFn: websiteCmsAdminService.listPages,
  });
}

export function useWebsitePageQuery(pageKey: string) {
  return useQuery({
    queryKey: websiteCmsKeys.page(pageKey),
    queryFn: () => websiteCmsAdminService.getPage(pageKey),
    enabled: Boolean(pageKey),
  });
}

export function useUpdateWebsitePageMutation(pageKey: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ContentPage> }) =>
      websiteCmsAdminService.updatePage(id, payload),
    onSuccess: (page) => {
      queryClient.setQueryData(websiteCmsKeys.page(pageKey), page);
      queryClient.invalidateQueries({ queryKey: websiteCmsKeys.pages() });
    },
  });
}

export function useUpdateWebsiteSectionMutation(pageKey: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ContentSection> }) =>
      websiteCmsAdminService.updateSection(id, payload),
    onSuccess: (section) => {
      queryClient.setQueryData<ContentPage | undefined>(websiteCmsKeys.page(pageKey), (page) => {
        if (!page) return page;
        return {
          ...page,
          sections: page.sections.map((item) => (item.id === section.id ? section : item)),
        };
      });
      queryClient.invalidateQueries({ queryKey: websiteCmsKeys.pages() });
    },
  });
}

export function usePublishWebsitePageMutation(pageKey: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => websiteCmsAdminService.publishPage(id),
    onSuccess: (page) => {
      queryClient.setQueryData(websiteCmsKeys.page(pageKey), page);
      queryClient.invalidateQueries({ queryKey: websiteCmsKeys.pages() });
    },
  });
}

export function useCreateWebsiteSectionMutation(pageKey: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pageId, sectionType }: { pageId: string; sectionType: string }) =>
      websiteCmsAdminService.createSection(pageId, sectionType),
    onSuccess: (section) => {
      queryClient.setQueryData<ContentPage | undefined>(websiteCmsKeys.page(pageKey), (page) => {
        if (!page) return page;
        return {
          ...page,
          updated_at: new Date().toISOString(),
          sections: [...page.sections, section],
        };
      });
      queryClient.invalidateQueries({ queryKey: websiteCmsKeys.pages() });
    },
  });
}

export function useReorderWebsiteSectionsMutation(pageKey: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pageId, sectionIds }: { pageId: string; sectionIds: string[] }) =>
      websiteCmsAdminService.reorderSections(pageId, sectionIds),
    onSuccess: (page) => {
      queryClient.setQueryData(websiteCmsKeys.page(pageKey), page);
      queryClient.invalidateQueries({ queryKey: websiteCmsKeys.pages() });
    },
  });
}

export function useArchiveWebsiteSectionMutation(pageKey: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => websiteCmsAdminService.archiveSection(id),
    onSuccess: (section) => {
      queryClient.setQueryData<ContentPage | undefined>(websiteCmsKeys.page(pageKey), (page) => {
        if (!page) return page;
        return {
          ...page,
          updated_at: new Date().toISOString(),
          sections: page.sections.map((item) => (item.id === section.id ? section : item)),
        };
      });
      queryClient.invalidateQueries({ queryKey: websiteCmsKeys.pages() });
    },
  });
}

export function useRestoreWebsiteSectionMutation(pageKey: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => websiteCmsAdminService.restoreSection(id),
    onSuccess: (section) => {
      queryClient.setQueryData<ContentPage | undefined>(websiteCmsKeys.page(pageKey), (page) => {
        if (!page) return page;
        return {
          ...page,
          updated_at: new Date().toISOString(),
          sections: page.sections.map((item) => (item.id === section.id ? section : item)),
        };
      });
      queryClient.invalidateQueries({ queryKey: websiteCmsKeys.pages() });
    },
  });
}

export function useDuplicateWebsiteSectionMutation(pageKey: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: { section_key?: string } }) =>
      websiteCmsAdminService.duplicateSection(id, payload ?? {}),
    onSuccess: (section) => {
      queryClient.setQueryData<ContentPage | undefined>(websiteCmsKeys.page(pageKey), (page) => {
        if (!page) return page;
        return {
          ...page,
          updated_at: new Date().toISOString(),
          sections: [...page.sections, section].sort((a, b) => a.sort_order - b.sort_order),
        };
      });
      queryClient.invalidateQueries({ queryKey: websiteCmsKeys.pages() });
    },
  });
}

export function toWebsitePageUpdatePayload(values: Parameters<typeof websitePageFormToUpdatePayload>[0]) {
  return websitePageFormToUpdatePayload(values);
}

export function toWebsiteSectionUpdatePayload(
  values: Parameters<typeof websiteSectionFormToUpdatePayload>[0],
) {
  return websiteSectionFormToUpdatePayload(values);
}
