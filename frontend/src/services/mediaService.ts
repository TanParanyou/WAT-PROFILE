import api from "./api";
import type { ApiResponse } from "@/types/api";
import type { Media, MediaMetadata } from "@/types/entities";

type UploadResponse = {
  url: string;
  media: Media;
};

export const mediaService = {
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
    if (!media) {
      throw new Error("Upload succeeded but media record was not returned");
    }

    return media;
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
};
