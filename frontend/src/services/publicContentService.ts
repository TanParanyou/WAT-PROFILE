import api from "./adminApi";
import { publicApi } from "./publicService";
import type { ApiResponse } from "@/types/api";
import type {
  AboutContentFormData,
  ContactContentFormData,
  PrivacyContentFormData,
  ImpressumContentFormData,
} from "@/types/public-content";

function unwrapApiResponse<T>(response: ApiResponse<T>, fallbackMessage: string): T {
  if (!response.success || response.error || response.data === undefined || response.data === null) {
    throw new Error(response.error || fallbackMessage);
  }
  return response.data;
}

export const publicContentService = {
  // Admin Methods (requires authentication)
  getAbout: async (): Promise<AboutContentFormData> => {
    const res = await api.get<ApiResponse<AboutContentFormData>>("/admin/about");
    return unwrapApiResponse(res.data, "Failed to fetch About page");
  },
  updateAbout: async (data: AboutContentFormData): Promise<AboutContentFormData> => {
    const res = await api.put<ApiResponse<AboutContentFormData>>("/admin/about", data);
    return unwrapApiResponse(res.data, "Failed to update About page");
  },

  getContact: async (): Promise<ContactContentFormData> => {
    const res = await api.get<ApiResponse<ContactContentFormData>>("/admin/contact");
    return unwrapApiResponse(res.data, "Failed to fetch Contact page");
  },
  updateContact: async (data: ContactContentFormData): Promise<ContactContentFormData> => {
    const res = await api.put<ApiResponse<ContactContentFormData>>("/admin/contact", data);
    return unwrapApiResponse(res.data, "Failed to update Contact page");
  },

  getPrivacy: async (): Promise<PrivacyContentFormData> => {
    const res = await api.get<ApiResponse<PrivacyContentFormData>>("/admin/privacy");
    return unwrapApiResponse(res.data, "Failed to fetch Privacy page");
  },
  updatePrivacy: async (data: PrivacyContentFormData): Promise<PrivacyContentFormData> => {
    const res = await api.put<ApiResponse<PrivacyContentFormData>>("/admin/privacy", data);
    return unwrapApiResponse(res.data, "Failed to update Privacy page");
  },

  getImpressum: async (): Promise<ImpressumContentFormData> => {
    const res = await api.get<ApiResponse<ImpressumContentFormData>>("/admin/impressum");
    return unwrapApiResponse(res.data, "Failed to fetch Impressum page");
  },
  updateImpressum: async (data: ImpressumContentFormData): Promise<ImpressumContentFormData> => {
    const res = await api.put<ApiResponse<ImpressumContentFormData>>("/admin/impressum", data);
    return unwrapApiResponse(res.data, "Failed to update Impressum page");
  },

  // Public Methods (accessible without authentication)
  getPublicAbout: async (): Promise<AboutContentFormData> => {
    const res = await publicApi.get<ApiResponse<AboutContentFormData>>("/about");
    return unwrapApiResponse(res.data, "Failed to fetch public About page");
  },
  getPublicContact: async (): Promise<ContactContentFormData> => {
    const res = await publicApi.get<ApiResponse<ContactContentFormData>>("/contact");
    return unwrapApiResponse(res.data, "Failed to fetch public Contact page");
  },
  getPublicPrivacy: async (): Promise<PrivacyContentFormData> => {
    const res = await publicApi.get<ApiResponse<PrivacyContentFormData>>("/privacy");
    return unwrapApiResponse(res.data, "Failed to fetch public Privacy page");
  },
  getPublicImpressum: async (): Promise<ImpressumContentFormData> => {
    const res = await publicApi.get<ApiResponse<ImpressumContentFormData>>("/impressum");
    return unwrapApiResponse(res.data, "Failed to fetch public Impressum page");
  },
};
export default publicContentService;
