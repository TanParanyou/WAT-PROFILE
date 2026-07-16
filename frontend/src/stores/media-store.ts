import { create } from "zustand";
import { mediaService } from "@/services/mediaService";
import type { Media, MediaMetadata } from "@/types/entities";

interface MediaStore {
  mediaList: Media[];
  hasLoaded: boolean;
  isLoading: boolean;
  isUploading: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  fetchMedia: () => Promise<void>;
  uploadMedia: (file: File) => Promise<Media>;
  updateMedia: (id: string, metadata: MediaMetadata) => Promise<Media>;
  deleteMedia: (id: string) => Promise<void>;
}

export const useMediaStore = create<MediaStore>((set) => ({
  mediaList: [],
  hasLoaded: false,
  isLoading: false,
  isUploading: false,
  isSaving: false,
  isDeleting: false,

  fetchMedia: async () => {
    set({ isLoading: true });
    try {
      const mediaList = await mediaService.list();
      set({ mediaList, hasLoaded: true });
    } finally {
      set({ isLoading: false });
    }
  },

  uploadMedia: async (file: File) => {
    set({ isUploading: true });
    try {
      const media = await mediaService.upload(file);
      set((state) => ({
        mediaList: [media, ...state.mediaList],
      }));
      return media;
    } finally {
      set({ isUploading: false });
    }
  },

  updateMedia: async (id: string, metadata: MediaMetadata) => {
    set({ isSaving: true });
    try {
      const media = await mediaService.updateMetadata(id, metadata);
      set((state) => ({
        mediaList: state.mediaList.map((item) =>
          item.id === id ? media : item,
        ),
      }));
      return media;
    } finally {
      set({ isSaving: false });
    }
  },

  deleteMedia: async (id: string) => {
    set({ isDeleting: true });
    try {
      await mediaService.delete(id);
      set((state) => ({
        mediaList: state.mediaList.filter((item) => item.id !== id),
      }));
    } finally {
      set({ isDeleting: false });
    }
  },
}));
