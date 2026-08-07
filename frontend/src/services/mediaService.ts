import api from "./adminApi";
import type { ApiResponse } from "@/types/api";
import type { Media, MediaMetadata, MediaReference } from "@/types/entities";
import { createAdminService } from "./adminService";

const baseMediaAdminService = createAdminService<Media>("media");

type UploadResponse = {
  url: string;
  media: Media;
};

export const mediaService = {
  ...baseMediaAdminService,

  async list(): Promise<Media[]> {
    const res = await api.get<ApiResponse<Media[]>>("/admin/media");
    return res.data.data || [];
  },

  async upload(file: File): Promise<Media> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await api.post<ApiResponse<UploadResponse>>("/admin/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    const media = res.data.data?.media;
    if (media) {
      return media;
    }

    const url = res.data.data?.url;
    if (url) {
      return {
        id: "",
        url,
        filename: file.name,
        original_filename: file.name,
        mime_type: file.type,
        size: file.size,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Media;
    }

    throw new Error("Upload succeeded but media record was not returned");
  },

  async uploadImage(file: File): Promise<string> {
    const media = await this.upload(file);
    return media.url;
  },

  async updateMetadata(id: string, metadata: MediaMetadata): Promise<Media> {
    const res = await api.put<ApiResponse<Media>>(`/admin/media/${id}`, {
      metadata,
    });
    const media = res.data.data;
    if (!media) {
      throw new Error("Media update failed");
    }
    return media;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/admin/media/${id}`);
  },

  async getReferences(id: string): Promise<MediaReference[]> {
    const res = await api.get<ApiResponse<MediaReference[]>>(`/admin/media/${id}/references`);
    return res.data.data || [];
  },

  async getTrash(): Promise<Media[]> {
    const res = await api.get<ApiResponse<Media[]>>("/admin/media/trash");
    return res.data.data || [];
  },

  async restore(id: string): Promise<void> {
    await api.post(`/admin/media/${id}/restore`);
  },

  async purge(id: string): Promise<void> {
    await api.post(`/admin/media/${id}/purge`, { confirm: true });
  },

  async getFilterOptions(): Promise<{
    categories: string[];
    mime_types: string[];
    alt_missing_locales: string[];
  }> {
    const res = await api.get("/admin/media/filter-options");
    return res.data.data || { categories: [], mime_types: [], alt_missing_locales: ["th", "en", "de"] };
  },
};
