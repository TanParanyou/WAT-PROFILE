import { create } from "zustand";

export type WebsiteCmsLocale = "th" | "en" | "de";
export type WebsiteCmsPreviewDevice = "mobile" | "tablet" | "desktop";
export type WebsiteCmsEditorTab = "content" | "seo" | "settings" | "advanced";
export type WebsiteCmsPreviewMode = "draft" | "published";

interface WebsiteCmsEditorState {
  activeLocale: WebsiteCmsLocale;
  activeSectionId: string | null;
  activeTab: WebsiteCmsEditorTab;
  previewDevice: WebsiteCmsPreviewDevice;
  previewMode: WebsiteCmsPreviewMode;
  hasUnsavedChanges: boolean;
  setActiveLocale: (locale: WebsiteCmsLocale) => void;
  setActiveSectionId: (sectionId: string | null) => void;
  setActiveTab: (tab: WebsiteCmsEditorTab) => void;
  setPreviewDevice: (device: WebsiteCmsPreviewDevice) => void;
  setPreviewMode: (mode: WebsiteCmsPreviewMode) => void;
  setHasUnsavedChanges: (dirty: boolean) => void;
}

export const useWebsiteCmsEditorStore = create<WebsiteCmsEditorState>((set) => ({
  activeLocale: "th",
  activeSectionId: null,
  activeTab: "content",
  previewDevice: "desktop",
  previewMode: "draft",
  hasUnsavedChanges: false,
  setActiveLocale: (activeLocale) => set({ activeLocale }),
  setActiveSectionId: (activeSectionId) => set({ activeSectionId }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setPreviewDevice: (previewDevice) => set({ previewDevice }),
  setPreviewMode: (previewMode) => set({ previewMode }),
  setHasUnsavedChanges: (hasUnsavedChanges) => set({ hasUnsavedChanges }),
}));
