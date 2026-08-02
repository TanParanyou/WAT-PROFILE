import api from "./adminApi";
import { publicApi } from "./publicService";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type { AdminListParams } from "@/features/admin-list/types";
import { serializeAdminListParams } from "@/features/admin-list/url";
import type {
  ArchiveContentSectionRequest,
  ContentPage,
  ContentSection,
  CreateContentSectionRequest,
  DuplicateContentSectionRequest,
  PublicContentPage,
  ReorderContentSectionsRequest,
} from "@/types/website-cms";
import mockPages from "@/data/website-cms.json";
import { contentPageToPublishedPreview } from "@/utils/websiteCms";

const useMockWebsiteCms = process.env.NEXT_PUBLIC_WEBSITE_CMS_SOURCE !== "api";
const pages = mockPages as ContentPage[];

function unwrapApiResponse<T>(response: ApiResponse<T>, fallbackMessage: string): T {
  if (!response.success || response.error) {
    const error = new Error(response.error || fallbackMessage);
    Object.assign(error, { fields: response.fields });
    throw error;
  }
  if (response.data === undefined || response.data === null) {
    throw new Error(fallbackMessage);
  }
  return response.data;
}

function clonePage(page: ContentPage) {
  return structuredClone(page);
}

function normalizeSection(section: ContentSection): ContentSection {
  return {
    ...section,
    title: section.title || { th: "", en: "", de: "" },
    description: section.description || { th: "", en: "", de: "" },
    body: section.body || {},
    settings: section.settings || {},
    status: section.status || "draft",
  };
}

function normalizePage(page: ContentPage): ContentPage {
  return {
    ...page,
    title: page.title || { th: "", en: "", de: "" },
    description: page.description || { th: "", en: "", de: "" },
    seo: page.seo || {},
    body: page.body || {},
    settings: page.settings || {},
    status: page.status || "draft",
    sections: [...(page.sections || [])].map(normalizeSection).sort((a, b) => a.sort_order - b.sort_order),
  };
}

function normalizePublicPage(page: PublicContentPage): PublicContentPage {
  return {
    ...page,
    title: page.title || { th: "", en: "", de: "" },
    description: page.description || { th: "", en: "", de: "" },
    seo: page.seo || {},
    body: page.body || {},
    settings: page.settings || {},
    status: page.status || "draft",
    sections: [...(page.sections || [])].map(normalizeSection).sort((a, b) => a.sort_order - b.sort_order),
  };
}

const toPublicPage = (page: ContentPage): PublicContentPage => contentPageToPublishedPreview(page);

export const websiteCmsAdminService = {
  async getPaginatedPages(params: AdminListParams): Promise<PaginatedResponse<ContentPage>> {
    const queryString = serializeAdminListParams(params);
    const url = queryString ? `/admin/website/pages?${queryString}` : `/admin/website/pages`;
    const res = await api.get<PaginatedResponse<ContentPage>>(url);
    const data = (res.data.data || []).map(normalizePage);
    return {
      ...res.data,
      data,
    };
  },

  async listPages() {
    const res = await api.get<ApiResponse<ContentPage[]>>("/admin/website/pages");
    const payload = unwrapApiResponse(res.data, "Failed to fetch content pages");
    return payload.map(normalizePage);
  },

  async getPage(pageKey: string) {
    const res = await api.get<ApiResponse<ContentPage>>(`/admin/website/pages/${pageKey}`);
    return normalizePage(unwrapApiResponse(res.data, "Page not found"));
  },

  async updatePage(id: string, payload: Partial<ContentPage>) {
    const res = await api.put<ApiResponse<ContentPage>>(`/admin/website/pages/${id}`, payload);
    return normalizePage(unwrapApiResponse(res.data, "Failed to update content page"));
  },

  async updateSection(id: string, payload: Partial<ContentSection>) {
    const res = await api.put<ApiResponse<ContentSection>>(`/admin/website/sections/${id}`, payload);
    return normalizeSection(unwrapApiResponse(res.data, "Failed to update content section"));
  },

  async createSection(pageId: string, sectionType: string) {
    const request: CreateContentSectionRequest = {
      section_type: sectionType,
    };
    const res = await api.post<ApiResponse<ContentSection>>(`/admin/website/pages/${pageId}/sections`, request);
    return normalizeSection(unwrapApiResponse(res.data, "Failed to create section"));
  },

  async reorderSections(pageId: string, sectionIds: string[]) {
    const request: ReorderContentSectionsRequest = {
      section_ids: sectionIds,
    };
    const res = await api.put<ApiResponse<ContentPage>>(`/admin/website/pages/${pageId}/sections/reorder`, request);
    return normalizePage(unwrapApiResponse(res.data, "Failed to reorder sections"));
  },

  async archiveSection(id: string) {
    const request: ArchiveContentSectionRequest = { archived: true };
    const res = await api.post<ApiResponse<ContentSection>>(`/admin/website/sections/${id}/archive`, request);
    return normalizeSection(unwrapApiResponse(res.data, "Failed to archive section"));
  },

  async restoreSection(id: string) {
    const request: ArchiveContentSectionRequest = { archived: false };
    const res = await api.post<ApiResponse<ContentSection>>(`/admin/website/sections/${id}/restore`, request);
    return normalizeSection(unwrapApiResponse(res.data, "Failed to restore section"));
  },

  async duplicateSection(id: string, payload: DuplicateContentSectionRequest = {}) {
    const res = await api.post<ApiResponse<ContentSection>>(`/admin/website/sections/${id}/duplicate`, payload);
    return normalizeSection(unwrapApiResponse(res.data, "Failed to duplicate section"));
  },

  async publishPage(id: string) {
    const res = await api.post<ApiResponse<ContentPage>>(`/admin/website/pages/${id}/publish`);
    return normalizePage(unwrapApiResponse(res.data, "Failed to publish content page"));
  },
};

export const websiteCmsPublicService = {
  async getPage(slug: string) {
    if (useMockWebsiteCms) {
      const page = pages.find((item) => item.slug === slug || item.page_key === slug);
      return page ? normalizePublicPage(toPublicPage(clonePage(page))) : null;
    }

    const res = await publicApi.get<ApiResponse<PublicContentPage>>(`/pages/${slug}`);
    return res.data.data ? normalizePublicPage(res.data.data) : null;
  },
};
