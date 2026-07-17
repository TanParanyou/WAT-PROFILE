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
  const body = { ...(section.body || {}) };
  
  if (section.section_type === "rich_text") {
    // If it's a rich_text section and lacks body.richText but has legacy body.markdown
    if (!body.richText && typeof body.markdown === "string") {
      const { normalizeLegacyRichText } = require("@/lib/rich-text/document");
      // Map legacy single string markdown to richText locale objects.
      // Website CMS richText stores a record of LocalizedRichText. Since legacy markdown string
      // might not have been localized itself (it was just body.markdown = string), we seed it 
      // under "th" and others as normalized empty or same. Wait, actually, let's see:
      // Typically, since website sections are localized by the template, if markdown is a string,
      // it means it's a single language or same string. We normalize it and put it in 'th', 'en', 'de'
      const doc = normalizeLegacyRichText(body.markdown);
      body.richText = {
        th: doc,
        en: doc,
        de: doc,
      };
    }
  }

  return {
    id: section.id,
    page_id: section.page_id,
    section_key: section.section_key,
    section_type: section.section_type,
    title: withAllLocales(section.title),
    description: withAllLocales(section.description),
    body: body,
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

export function applyPageFormDraft(page: ContentPage, draft: WebsiteCmsPageFormData | null) {
  if (!draft) return page;

  return {
    ...page,
    page_key: draft.page_key || page.page_key,
    slug: draft.slug || page.slug,
    title: draft.title || page.title,
    description: draft.description || page.description,
    seo: draft.seo || page.seo,
    body: draft.body || page.body,
    settings: draft.settings || page.settings,
    status: draft.status || page.status,
  } satisfies ContentPage;
}

export function applySectionFormDrafts(
  page: ContentPage,
  drafts: Record<string, WebsiteCmsSectionFormData>,
) {
  if (!Object.keys(drafts).length) return page;

  return {
    ...page,
    sections: page.sections.map((section) => {
      const draft = drafts[section.id];
      if (!draft) return section;

      return {
        ...section,
        section_key: draft.section_key || section.section_key,
        section_type: draft.section_type || section.section_type,
        title: draft.title || section.title,
        description: draft.description || section.description,
        body: draft.body || section.body,
        settings: draft.settings || section.settings,
        sort_order: draft.sort_order ?? section.sort_order,
        status: draft.status || section.status,
      } satisfies ContentSection;
    }),
  } satisfies ContentPage;
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

  if (pageKey === "PAGE-HOME") {
    return [
      { type: "hero", key: "hero", label: "Hero" },
      { type: "event_teaser", key: "featured-events", label: "Featured events" },
      { type: "monk_teaser", key: "featured-monks", label: "Featured monks" },
    ] as const;
  }

  if (pageKey === "PAGE-ABOUT") {
    return [
      { type: "rich_text", key: "history", label: "History" },
      { type: "quote", key: "quote", label: "Quote" },
      { type: "item_list", key: "items", label: "Item list" },
      { type: "monks_grid", key: "monks", label: "Monks grid" },
    ] as const;
  }

  if (pageKey === "PAGE-GALLERY") {
    return [
      { type: "hero", key: "hero", label: "Hero" },
      { type: "gallery_intro", key: "intro", label: "Gallery intro" },
    ] as const;
  }

  if (pageKey === "PAGE-MONKS") {
    return [
      { type: "hero", key: "hero", label: "Hero" },
      { type: "monks_intro", key: "intro", label: "Monks intro" },
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
    case "event_teaser":
      return { limit: 3 };
    case "monk_teaser":
      return { limit: 4 };
    case "quote":
      return { quote: "", author: "" };
    case "item_list":
      return { items: [] };
    case "monks_grid":
      return { limit: 6 };
    case "gallery_intro":
      return { markdown: "" };
    case "monks_intro":
      return { markdown: "" };
    case "rich_text":
      return { richText: {} };
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
    case "event_teaser":
      return { limit: 3 };
    case "monk_teaser":
      return { limit: 4 };
    case "quote":
      return { style: "mono" };
    case "item_list":
      return { columns: 1 };
    case "monks_grid":
      return { columns: 3 };
    case "gallery_intro":
      return { width: "regular" };
    case "monks_intro":
      return { width: "regular" };
    case "rich_text":
      return { width: "regular" };
    case "map":
      return { show_directions: true };
    default:
      return {};
  }
}

import type { AboutPageMasterFormData } from "@/schemas/website-page.schema";
import { hasLegacyLocalizedRichText, normalizeLocalizedRichText } from "@/lib/rich-text/document";

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function normalizeSeoMetadata(seo: unknown): {
  title: Record<string, string>;
  description: Record<string, string>;
  canonical_url: string;
  noindex: boolean;
} {
  const s = asRecord(seo);
  return {
    title: withAllLocales(s.title as Record<string, string> | undefined),
    description: withAllLocales(s.description as Record<string, string> | undefined),
    canonical_url: typeof s.canonical_url === "string" ? s.canonical_url : "",
    noindex: typeof s.noindex === "boolean" ? s.noindex : false,
  };
}

export function contentPageToAboutFormData(page: ContentPage): AboutPageMasterFormData {
  const body = asRecord(page.body);
  return {
    id: page.id,
    slug: page.slug,
    status: page.status === "archived" ? "draft" : page.status, // Form status only allows "draft" | "published"
    seo: normalizeSeoMetadata(page.seo),
    content: {
      hero_title: withAllLocales(page.title),
      hero_subtitle: withAllLocales(page.description),
      
      intro_title: withAllLocales(body.intro_title as Record<string, string> | undefined),
      intro_description: withAllLocales(body.intro_description as Record<string, string> | undefined),
      intro_founded: withAllLocales(body.intro_founded as Record<string, string> | undefined),
      intro_location: withAllLocales(body.intro_location as Record<string, string> | undefined),
      
      objective_title: withAllLocales(body.objective_title as Record<string, string> | undefined),
      objective_subtitle: withAllLocales(body.objective_subtitle as Record<string, string> | undefined),
      objective_content: normalizeLocalizedRichText(body.objective_content, [...WEBSITE_CMS_LOCALES], "th"),
      
      administration_title: withAllLocales(body.administration_title as Record<string, string> | undefined),
      administration_content: normalizeLocalizedRichText(body.administration_content, [...WEBSITE_CMS_LOCALES], "th"),
      
      history_title: withAllLocales(body.history_title as Record<string, string> | undefined),
      history_content: normalizeLocalizedRichText(body.history_content, [...WEBSITE_CMS_LOCALES], "th"),
      
      buildings_title: withAllLocales(body.buildings_title as Record<string, string> | undefined),
      buildings_items: Array.isArray(body.buildings_items)
        ? body.buildings_items.map((item) => {
            const i = asRecord(item);
            return {
              name: withAllLocales(i.name as Record<string, string> | undefined),
              description: withAllLocales(i.description as Record<string, string> | undefined),
            };
          })
        : [],
      
      sangha_title: withAllLocales(body.sangha_title as Record<string, string> | undefined),
      sangha_mission: withAllLocales(body.sangha_mission as Record<string, string> | undefined),
      sangha_current_work: withAllLocales(body.sangha_current_work as Record<string, string> | undefined),
    },
  };
}

export function aboutFormDataToContentPagePayload(values: AboutPageMasterFormData): Partial<ContentPage> {
  const { hero_title, hero_subtitle, ...body } = values.content;
  return {
    slug: values.slug,
    title: hero_title,
    description: hero_subtitle,
    seo: values.seo,
    body: body,
    status: values.status,
  };
}

export function hasLegacyAboutRichTextBody(body: unknown): boolean {
  const b = asRecord(body);
  return (
    hasLegacyLocalizedRichText(b.objective_content) ||
    hasLegacyLocalizedRichText(b.administration_content) ||
    hasLegacyLocalizedRichText(b.history_content)
  );
}

