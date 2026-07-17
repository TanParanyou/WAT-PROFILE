import api from "./api";
import { publicApi } from "./publicService";
import mockSiteSettings from "@/data/site-settings.json";
import { globalContactSettingsSchema, siteSettingsSchema } from "@/schemas/site-settings.schema";
import type { ApiResponse } from "@/types/api";
import type { GlobalContactSettings, SiteSettings } from "@/types/site-settings";

const useMockSiteSettings = process.env.NEXT_PUBLIC_WEBSITE_CMS_SOURCE !== "api";
const siteSettingsStore = normalizeSiteSettings(structuredClone(mockSiteSettings));

function clone<T>(value: T): T {
  return structuredClone(value);
}

function unwrapApiResponse<T>(response: ApiResponse<T>, fallbackMessage: string): T {
  if (!response.success || response.error || response.data === undefined || response.data === null) {
    throw new Error(response.error || fallbackMessage);
  }

  return response.data;
}

function normalizeSiteSettings(value: unknown): SiteSettings {
  return siteSettingsSchema.parse(value);
}

function normalizeContactSettings(value: unknown): GlobalContactSettings {
  return globalContactSettingsSchema.parse(value);
}

export function getDefaultSiteSettings() {
  return normalizeSiteSettings(clone(siteSettingsStore));
}

export function getDefaultContactSettings() {
  return normalizeContactSettings(clone(siteSettingsStore.contact));
}

