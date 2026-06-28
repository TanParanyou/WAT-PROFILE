import type { ContentPage, ContentSection, PublicContentPage } from "@/types/website-cms";
import type { WebsiteCmsPageFormData, WebsiteCmsSectionFormData } from "@/schemas/website-cms.schema";

export const WEBSITE_CMS_LOCALES = ["th", "en", "de"] as const;

type Locale = (typeof WEBSITE_CMS_LOCALES)[number];

export function contentPageToPublicPreview(page: ContentPage): PublicContentPage {
  return {
    id: page.id,
    page_key: page.page_key,
    slug: page.slug,
    title: page.title,
    description: page.description,
    seo: page.seo,
    body: page.body,
    settings: page.settings,
    status: page.status,
    sections: [...page.sections].sort((a, b) => a.sort_order - b.sort_order),
    published_at: page.published_at,
  };
}

export function contentPageToPublishedPreview(page: ContentPage): PublicContentPage {
  return {
    id: page.id,
    page_key: page.page_key,
    slug: page.slug,
    title: page.published_title || page.title,
    description: page.published_description || page.description,
    seo: page.published_seo || page.seo,
    body: page.published_body || page.body,
    settings: page.published_settings || page.settings,
    status: page.status,
    sections: sortContentSections(page.sections)
      .filter((section) => section.status === "published" || Boolean(section.published_at))
      .map((section) => ({
        ...section,
        title: section.published_title || section.title,
        description: section.published_description || section.description,
        body: section.published_body || section.body,
        settings: section.published_settings || section.settings,
      })),
    published_at: page.published_at,
  };
}

export function contentSectionToFormValues(section: ContentSection): WebsiteCmsSectionFormData {
  return {
    id: section.id,
    page_id: section.page_id,
    section_key: section.section_key,
    section_type: section.section_type,
    title: withAllLocales(section.title),
    description: withAllLocales(section.description),
    body: section.body || {},
    settings: section.settings || {},
    sort_order: section.sort_order,
    status: section.status,
  };
}

export function contentPageToFormValues(page: ContentPage): WebsiteCmsPageFormData {
  return {
    id: page.id,
    page_key: page.page_key,
    slug: page.slug,
    title: withAllLocales(page.title),
    description: withAllLocales(page.description),
    seo: page.seo || {},
    body: page.body || {},
    settings: page.settings || {},
    status: page.status,
  };
}

export function websitePageFormToUpdatePayload(values: WebsiteCmsPageFormData): Partial<ContentPage> {
  return {
    page_key: values.page_key,
    slug: values.slug,
    title: values.title,
    description: values.description,
    seo: values.seo,
    body: values.body,
    settings: values.settings,
    status: values.status,
  };
}

export function websiteSectionFormToUpdatePayload(
  values: WebsiteCmsSectionFormData,
): Partial<ContentSection> {
  return {
    section_key: values.section_key,
    section_type: values.section_type,
    title: values.title,
    description: values.description,
    body: values.body,
    settings: values.settings,
    sort_order: values.sort_order,
    status: values.status,
  };
}

export function getDefaultActiveSectionId(page: ContentPage) {
  return sortContentSections(page.sections)[0]?.id ?? null;
}

export function hasDraftDifference(page: ContentPage) {
  if (page.status !== "published") return true;
  if (!page.published_at) return true;
  if (page.updated_at > page.published_at) return true;
  return page.sections.some((section) => !section.published_at || section.updated_at > section.published_at);
}

export function getPublicPageHref(page: Pick<ContentPage, "slug">, locale: string) {
  if (page.slug === "home") {
    return `/${locale}`;
  }

  return `/${locale}/${page.slug}`;
}

export function formatCmsTimestamp(value?: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleString();
}

export function getLocalizedCompleteness(value: Partial<Record<Locale, string>> | undefined) {
  return WEBSITE_CMS_LOCALES.filter((locale) => Boolean(value?.[locale]?.trim())).length;
}

export function getSectionHealth(section: ContentSection) {
  const titleCount = getLocalizedCompleteness(section.title);
  const descriptionCount = getLocalizedCompleteness(section.description);

  if (section.status === "archived") return { tone: "muted" as const, label: "Archived" };
  if (titleCount < WEBSITE_CMS_LOCALES.length || descriptionCount < WEBSITE_CMS_LOCALES.length) {
    return { tone: "warn" as const, label: "Missing translation" };
  }
  if (section.status === "draft") return { tone: "draft" as const, label: "Draft" };
  return { tone: "ready" as const, label: "Ready" };
}

export function getSeoHealth(page: ContentPage) {
  const title = page.seo?.title;
  const description = page.seo?.description;
  const hasTitle = Boolean(title?.th || title?.en || title?.de);
  const hasDescription = Boolean(description?.th || description?.en || description?.de);
  const hasCanonical = Boolean(page.seo?.canonical_url || page.slug);
  const warnings = [
    !hasTitle && "Missing meta title",
    !hasDescription && "Missing meta description",
    !hasCanonical && "Missing canonical URL",
    page.seo?.noindex && "Noindex enabled",
  ].filter(Boolean) as string[];

  return {
    score: Math.max(0, 100 - warnings.length * 25),
    warnings,
  };
}

export function sortContentSections(sections: ContentSection[]) {
  return [...sections].sort((a, b) => a.sort_order - b.sort_order);
}

export function getAvailableSectionTemplates(pageKey: string) {
  if (pageKey === "PAGE-CONTACT") {
    return [
      { type: "hero", key: "hero", label: "Hero" },
      { type: "contact_info", key: "contact-info", label: "Contact info" },
      { type: "contact_form", key: "contact-form", label: "Contact form" },
      { type: "rich_text", key: "details", label: "Rich text" },
      { type: "map", key: "map", label: "Map" },
    ] as const;
  }

  return [] as const;
}

export function createSectionTemplate(page: ContentPage, sectionType: string) {
  const order = page.sections.length;
  const timestamp = new Date().toISOString();
  const templateKey =
    getAvailableSectionTemplates(page.page_key).find((item) => item.type === sectionType)?.key || `${sectionType}-${order + 1}`;

  return {
    id: crypto.randomUUID(),
    page_id: page.id,
    section_key: getUniqueSectionKey(page.sections, templateKey),
    section_type: sectionType,
    title: { th: "", en: "", de: "" },
    description: { th: "", en: "", de: "" },
    body: getSectionTemplateBody(sectionType),
    settings: getSectionTemplateSettings(sectionType),
    sort_order: order,
    status: "draft" as const,
    published_at: null,
    created_at: timestamp,
    updated_at: timestamp,
  } satisfies ContentSection;
}

export function moveSection(sections: ContentSection[], sectionId: string, direction: "up" | "down") {
  const sorted = sortContentSections(sections);
  const index = sorted.findIndex((section) => section.id === sectionId);
  if (index < 0) return sections;
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= sorted.length) return sections;

  const next = [...sorted];
  [next[index], next[target]] = [next[target], next[index]];
  return next.map((section, nextIndex) => ({ ...section, sort_order: nextIndex }));
}

export function reorderSectionsByIds(sections: ContentSection[], sectionIds: string[]) {
  const indexMap = new Map(sectionIds.map((id, index) => [id, index]));
  return [...sections]
    .map((section) => ({
      ...section,
      sort_order: indexMap.get(section.id) ?? section.sort_order,
    }))
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((section, sort_order) => ({ ...section, sort_order }));
}

export function duplicateSectionTemplate(page: ContentPage, source: ContentSection) {
  const timestamp = new Date().toISOString();
  return {
    ...structuredClone(source),
    id: crypto.randomUUID(),
    section_key: getUniqueSectionKey(page.sections, `${source.section_key}-copy`),
    sort_order: page.sections.length,
    status: "draft" as const,
    published_title: undefined,
    published_description: undefined,
    published_body: undefined,
    published_settings: undefined,
    published_at: null,
    created_at: timestamp,
    updated_at: timestamp,
  } satisfies ContentSection;
}

function withAllLocales(value: Partial<Record<Locale, string>> | undefined) {
  return {
    th: value?.th || "",
    en: value?.en || "",
    de: value?.de || "",
  };
}

function getUniqueSectionKey(sections: ContentSection[], baseKey: string) {
  const existing = new Set(sections.map((section) => section.section_key));
  if (!existing.has(baseKey)) return baseKey;

  let index = 2;
  while (existing.has(`${baseKey}-${index}`)) {
    index += 1;
  }
  return `${baseKey}-${index}`;
}

function getSectionTemplateBody(sectionType: string) {
  switch (sectionType) {
    case "hero":
      return { eyebrow: "", image: "" };
    case "contact_info":
      return { phone: "", email: "", address: "" };
    case "rich_text":
      return { markdown: "" };
    case "map":
      return { embed_url: "", directions_url: "", address: "" };
    default:
      return {};
  }
}

function getSectionTemplateSettings(sectionType: string) {
  switch (sectionType) {
    case "hero":
      return { tone: "calm", cta_label: "", cta_href: "" };
    case "contact_info":
      return { map_url: "", show_map: true, show_social: true, show_bank: false };
    case "contact_form":
      return { enabled: true, submit_label: "", success_message: "", destination_label: "" };
    case "rich_text":
      return { width: "regular" };
    case "map":
      return { show_directions: true };
    default:
      return {};
  }
}
