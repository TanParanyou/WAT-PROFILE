import mockSiteSettings from "@/data/site-settings.json";
import { globalContactSettingsSchema, siteSettingsSchema } from "@/schemas/site-settings.schema";
import type { GlobalContactSettings, SiteSettings } from "@/types/site-settings";

const siteSettingsStore = normalizeSiteSettings(structuredClone(mockSiteSettings));

function clone<T>(value: T): T {
  return structuredClone(value);
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

