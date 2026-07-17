import { z } from "zod";
import type { LocalizedRichText } from "@/lib/rich-text/document";

export const localizedTextSchema = z.object({
  th: z.string().min(1, "ภาษาไทยจำเป็นต้องระบุ"),
  en: z.string(),
  de: z.string(),
});

export const localizedRichTextSchema = z
  .custom<LocalizedRichText>((value) => typeof value === "object" && value !== null && !Array.isArray(value), {
    message: "Invalid rich text content",
  })
  .default({});

export const seoMetadataSchema = z.object({
  title: localizedTextSchema,
  description: localizedTextSchema,
  keywords: localizedTextSchema,
  og_image: z.string().optional(),
  canonical_url: z.string().optional(),
});



export const buildingItemSchema = z.object({
  name: localizedTextSchema,
  description: localizedTextSchema,
});

export const aboutPageContentSchema = z.object({
  hero_title: localizedTextSchema,
  hero_subtitle: localizedTextSchema,
  
  intro_title: localizedTextSchema,
  intro_description: localizedTextSchema,
  intro_founded: localizedTextSchema,
  intro_location: localizedTextSchema,
  
  objective_title: localizedTextSchema,
  objective_subtitle: localizedTextSchema,
  objective_content: localizedRichTextSchema,
  
  administration_title: localizedTextSchema,
  administration_content: localizedRichTextSchema,
  
  history_title: localizedTextSchema,
  history_content: localizedRichTextSchema,
  
  buildings_title: localizedTextSchema,
  buildings_items: z.array(buildingItemSchema).default([]),
  
  sangha_title: localizedTextSchema,
  sangha_mission: localizedTextSchema,
  sangha_current_work: localizedTextSchema,
});

export const aboutPageMasterSchema = z.object({
  id: z.string().optional(),
  slug: z.string().default("about"),
  seo: seoMetadataSchema,
  content: aboutPageContentSchema,
  status: z.enum(["draft", "published"]).default("published"),
});

export const privacySectionSchema = z.object({
  title: localizedTextSchema,
  content: localizedRichTextSchema,
});

export const privacyPageBodySchema = z.object({
  last_updated: z.string().default(""),
  sections: z.array(privacySectionSchema).default([]),
});

export const privacyPageFormSchema = z.object({
  id: z.string().optional(),
  page_key: z.string().default("PAGE-PRIVACY"),
  slug: z.string().default("privacy"),
  status: z.enum(["draft", "published", "archived"]).default("published"),
  title: localizedTextSchema,
  description: localizedTextSchema,
  seo: seoMetadataSchema,
  body: privacyPageBodySchema,
});

export const impressumPageBodySchema = z.object({
  organization_name: localizedTextSchema,
  address: localizedTextSchema,
  phone: z.string().default(""),
  email: z.string().default(""),
});

export const impressumPageFormSchema = z.object({
  id: z.string().optional(),
  page_key: z.string().default("PAGE-IMPRESSUM"),
  slug: z.string().default("impressum"),
  status: z.enum(["draft", "published", "archived"]).default("published"),
  title: localizedTextSchema,
  description: localizedTextSchema,
  seo: seoMetadataSchema,
  body: impressumPageBodySchema,
});

export type SeoMetadataFormData = z.infer<typeof seoMetadataSchema>;

export type AboutPageContentFormData = z.infer<typeof aboutPageContentSchema>;
export type AboutPageMasterFormData = z.infer<typeof aboutPageMasterSchema>;
export type PrivacySectionFormData = z.infer<typeof privacySectionSchema>;
export type PrivacyPageBodyFormData = z.infer<typeof privacyPageBodySchema>;
export type PrivacyPageFormData = z.infer<typeof privacyPageFormSchema>;
export type ImpressumPageBodyFormData = z.infer<typeof impressumPageBodySchema>;
export type ImpressumPageFormData = z.infer<typeof impressumPageFormSchema>;
