import api from "./api";
import { publicApi } from "./publicService";
import type { ApiResponse } from "@/types/api";
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
import {
  contentPageToPublishedPreview,
  createSectionTemplate,
  duplicateSectionTemplate,
  reorderSectionsByIds,
} from "@/utils/websiteCms";

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

function cloneSection(section: ContentSection) {
  return structuredClone(section);
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
  async listPages() {
    if (useMockWebsiteCms) {
      return pages.map((page) => normalizePage(clonePage(page)));
    }

    const res = await api.get<ApiResponse<ContentPage[]>>("/admin/website/pages");
    const payload = unwrapApiResponse(res.data, "Failed to fetch content pages");
    return payload.map(normalizePage);
  },

  async getPage(pageKey: string) {
    if (useMockWebsiteCms) {
      const page = pages.find((item) => item.page_key === pageKey || item.slug === pageKey);
      if (!page) throw new Error("Page not found");
      return normalizePage(clonePage(page));
    }

    const res = await api.get<ApiResponse<ContentPage>>(`/admin/website/pages/${pageKey}`);
    return normalizePage(unwrapApiResponse(res.data, "Page not found"));
  },

  async updatePage(id: string, payload: Partial<ContentPage>) {
    if (useMockWebsiteCms) {
      const page = pages.find((item) => item.id === id);
      if (!page) throw new Error("Page not found");
      Object.assign(page, payload, { updated_at: new Date().toISOString() });
      return normalizePage(clonePage(page));
    }

    const res = await api.put<ApiResponse<ContentPage>>(`/admin/website/pages/${id}`, payload);
    return normalizePage(unwrapApiResponse(res.data, "Failed to update content page"));
  },

  async updateSection(id: string, payload: Partial<ContentSection>) {
    if (useMockWebsiteCms) {
      for (const page of pages) {
        const index = page.sections.findIndex((section) => section.id === id);
        if (index >= 0) {
          page.sections[index] = {
            ...page.sections[index],
            ...payload,
            updated_at: new Date().toISOString(),
          };
          page.updated_at = new Date().toISOString();
          return normalizeSection(cloneSection(page.sections[index]));
        }
      }
      throw new Error("Section not found");
    }

    const res = await api.put<ApiResponse<ContentSection>>(`/admin/website/sections/${id}`, payload);
    return normalizeSection(unwrapApiResponse(res.data, "Failed to update content section"));
  },

  async createSection(pageId: string, sectionType: string) {
    if (useMockWebsiteCms) {
      const page = pages.find((item) => item.id === pageId);
      if (!page) throw new Error("Page not found");
      const nextSection = createSectionTemplate(page, sectionType);
      page.sections = [...page.sections, nextSection];
      page.updated_at = new Date().toISOString();
      return normalizeSection(cloneSection(nextSection));
    }

    const request: CreateContentSectionRequest = {
      section_type: sectionType,
    };
    const res = await api.post<ApiResponse<ContentSection>>(`/admin/website/pages/${pageId}/sections`, request);
    return normalizeSection(unwrapApiResponse(res.data, "Failed to create section"));
  },

  async reorderSections(pageId: string, sectionIds: string[]) {
    if (useMockWebsiteCms) {
      const page = pages.find((item) => item.id === pageId);
      if (!page) throw new Error("Page not found");
      page.sections = reorderSectionsByIds(page.sections, sectionIds).map((item) => ({
        ...item,
        updated_at: new Date().toISOString(),
      }));
      page.updated_at = new Date().toISOString();
      return normalizePage(clonePage(page));
    }

    const request: ReorderContentSectionsRequest = {
      section_ids: sectionIds,
    };
    const res = await api.put<ApiResponse<ContentPage>>(`/admin/website/pages/${pageId}/sections/reorder`, request);
    return normalizePage(unwrapApiResponse(res.data, "Failed to reorder sections"));
  },

  async archiveSection(id: string) {
    if (useMockWebsiteCms) {
      for (const page of pages) {
        const index = page.sections.findIndex((section) => section.id === id);
        if (index < 0) continue;
        page.sections[index] = {
          ...page.sections[index],
          status: "archived",
          updated_at: new Date().toISOString(),
        };
        page.updated_at = new Date().toISOString();
        return normalizeSection(cloneSection(page.sections[index]));
      }
      throw new Error("Section not found");
    }

    const request: ArchiveContentSectionRequest = { archived: true };
    const res = await api.post<ApiResponse<ContentSection>>(`/admin/website/sections/${id}/archive`, request);
    return normalizeSection(unwrapApiResponse(res.data, "Failed to archive section"));
  },

  async restoreSection(id: string) {
    if (useMockWebsiteCms) {
      for (const page of pages) {
        const index = page.sections.findIndex((section) => section.id === id);
        if (index < 0) continue;
        page.sections[index] = {
          ...page.sections[index],
          status: "draft",
          updated_at: new Date().toISOString(),
        };
        page.updated_at = new Date().toISOString();
        return normalizeSection(cloneSection(page.sections[index]));
      }
      throw new Error("Section not found");
    }

    const request: ArchiveContentSectionRequest = { archived: false };
    const res = await api.post<ApiResponse<ContentSection>>(`/admin/website/sections/${id}/restore`, request);
    return normalizeSection(unwrapApiResponse(res.data, "Failed to restore section"));
  },

  async duplicateSection(id: string, payload: DuplicateContentSectionRequest = {}) {
    if (useMockWebsiteCms) {
      for (const page of pages) {
        const source = page.sections.find((section) => section.id === id);
        if (!source) continue;
        const duplicate = duplicateSectionTemplate(page, source);
        if (payload.section_key) {
          duplicate.section_key = payload.section_key;
        }
        page.sections = [...page.sections, duplicate];
        page.updated_at = new Date().toISOString();
        return normalizeSection(cloneSection(duplicate));
      }
      throw new Error("Section not found");
    }

    const res = await api.post<ApiResponse<ContentSection>>(`/admin/website/sections/${id}/duplicate`, payload);
    return normalizeSection(unwrapApiResponse(res.data, "Failed to duplicate section"));
  },

  async publishPage(id: string) {
    if (useMockWebsiteCms) {
      const page = pages.find((item) => item.id === id);
      if (!page) throw new Error("Page not found");
      const now = new Date().toISOString();
      page.status = "published";
      page.published_title = page.title;
      page.published_description = page.description;
      page.published_seo = page.seo;
      page.published_body = page.body;
      page.published_settings = page.settings;
      page.published_at = now;
      page.sections = page.sections.map((section) => ({
        ...section,
        status: "published",
        published_title: section.title,
        published_description: section.description,
        published_body: section.body,
        published_settings: section.settings,
        published_at: now,
      }));
      return normalizePage(clonePage(page));
    }

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
