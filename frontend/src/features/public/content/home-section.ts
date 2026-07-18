import type { LocalizedText } from "@/types/common";
import type { ContentSection, PublicContentPage } from "@/types/website-cms";

type CmsValue = string | LocalizedText | { [key: string]: CmsValue };

export interface HomeHeroModel {
  title: LocalizedText | undefined;
  description: LocalizedText | undefined;
  ctaLabel: LocalizedText | undefined;
  ctaHref: string | undefined;
}

function isLocalizedText(value: CmsValue): value is LocalizedText {
  return typeof value === "object" && !Array.isArray(value) &&
    typeof value.th === "string" && typeof value.en === "string" && typeof value.de === "string";
}

function isCmsValue(value: unknown): value is CmsValue {
  if (typeof value === "string") return true;
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value).every(isCmsValue);
}

function findSection(page: PublicContentPage | null, key: string, type: string): ContentSection | undefined {
  return page?.sections.find((section) => section.section_key === key) ?? page?.sections.find((section) => section.section_type === type);
}

function readValue(section: ContentSection | undefined, source: "body" | "settings", key: string): CmsValue | undefined {
  const value = section?.[source][key];
  return isCmsValue(value) ? value : undefined;
}

function readLocalized(value: CmsValue | undefined): LocalizedText | undefined {
  return value && isLocalizedText(value) ? value : undefined;
}

export function toHomeHeroModel(page: PublicContentPage | null): HomeHeroModel {
  const section = findSection(page, "hero", "hero");
  const ctaHref = readValue(section, "settings", "cta_href");
  return {
    title: page?.title,
    description: readLocalized(readValue(section, "body", "description")) ?? page?.description,
    ctaLabel: readLocalized(readValue(section, "settings", "cta_label")),
    ctaHref: typeof ctaHref === "string" ? ctaHref : undefined,
  };
}
