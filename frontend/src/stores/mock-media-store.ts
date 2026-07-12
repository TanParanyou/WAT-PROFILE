import { create } from "zustand";

export interface MockMedia {
  id: string;
  url: string;
  filename: string;
  file_size: string;
  dimensions: string;
  created_at: string;
  alt: { th: string; en: string; de: string };
  caption: string;
  credit: string;
}

const INITIAL_MEDIA: MockMedia[] = [
  {
    id: "1",
    url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500&auto=format&fit=crop&q=60",
    filename: "temple-main.jpg",
    file_size: "1.2 MB",
    dimensions: "1920x1080",
    created_at: "2026-07-01",
    alt: { th: "วัดหลัก", en: "Main Temple", de: "Haupttempel" },
    caption: "Main temple building during daylight",
    credit: "Unsplash Contributor",
  },
  {
    id: "2",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=60",
    filename: "nature-beach.jpg",
    file_size: "750 KB",
    dimensions: "1280x720",
    created_at: "2026-07-05",
    alt: { th: "ชายหาดสงบ", en: "Serene Beach", de: "Ruhiger Strand" },
    caption: "Serene beach at sunset",
    credit: "Unsplash Contributor",
  },
];

interface MockMediaStore {
  mediaList: MockMedia[];
  isLoading: boolean;
  isUploading: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  fetchMedia: () => Promise<void>;
  addMedia: (url: string, filename: string) => Promise<void>;
  updateMedia: (id: string, updates: Partial<MockMedia>) => Promise<void>;
  deleteMedia: (id: string) => Promise<void>;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const useMockMediaStore = create<MockMediaStore>((set, get) => ({
  mediaList: [],
  isLoading: true,
  isUploading: false,
  isSaving: false,
  isDeleting: false,
  
  fetchMedia: async () => {
    set({ isLoading: true });
    await delay(800); // Simulate network delay
    set({ mediaList: INITIAL_MEDIA, isLoading: false });
  },

  addMedia: async (url, filename) => {
    set({ isUploading: true });
    await delay(1000);
    set((state) => ({
      mediaList: [
        {
          id: Date.now().toString(),
          url,
          filename,
          file_size: "450 KB",
          dimensions: "800x600",
          created_at: new Date().toISOString().split("T")[0],
          alt: { th: "", en: "", de: "" },
          caption: "",
          credit: "",
        },
        ...state.mediaList,
      ],
      isUploading: false,
    }));
  },

  updateMedia: async (id, updates) => {
    set({ isSaving: true });
    await delay(600);
    set((state) => ({
      mediaList: state.mediaList.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
      isSaving: false,
    }));
  },

  deleteMedia: async (id) => {
    set({ isDeleting: true });
    await delay(800);
    set((state) => ({
      mediaList: state.mediaList.filter((item) => item.id !== id),
      isDeleting: false,
    }));
  },
}));
