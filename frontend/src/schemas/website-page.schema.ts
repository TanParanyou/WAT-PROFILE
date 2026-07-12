import { z } from "zod";

export const localizedTextSchema = z.object({
  th: z.string().min(1, "ภาษาไทยจำเป็นต้องระบุ"),
  en: z.string().optional().default(""),
  de: z.string().optional().default(""),
});

export const seoMetadataSchema = z.object({
  title: localizedTextSchema,
  description: localizedTextSchema,
  keywords: localizedTextSchema,
  og_image: z.string().optional().default(""),
  canonical_url: z.string().optional().default(""),
});

export const homeFeatureItemSchema = z.object({
  icon: z.string().default("🙏"),
  title: localizedTextSchema,
  description: localizedTextSchema,
});

export const homePageContentSchema = z.object({
  hero_title: localizedTextSchema,
  hero_subtitle: localizedTextSchema,
  hero_image: z.string().optional().default(""),
  welcome_title: localizedTextSchema,
  welcome_description: localizedTextSchema,
  features: z.array(homeFeatureItemSchema).default([]),
});

export const homePageMasterSchema = z.object({
  id: z.string().optional(),
  slug: z.string().default("home"),
  seo: seoMetadataSchema,
  content: homePageContentSchema,
  status: z.enum(["draft", "published"]).default("published"),
});

export const publicTransportItemSchema = z.object({
  icon: z.enum(["train", "bus", "car"]).default("train"),
  text: localizedTextSchema,
});

export const contactPageContentSchema = z.object({
  hero_title: localizedTextSchema,
  hero_subtitle: localizedTextSchema,
  hero_tone: z.enum(["light", "dark", "calm"]).default("calm"),
  info_title: localizedTextSchema,
  info_description: localizedTextSchema,
  address: localizedTextSchema,
  phone: z.string().default(""),
  email: z.string().default(""),
  show_social: z.boolean().default(true),
  show_bank: z.boolean().default(true),
  facebook: z.string().default(""),
  instagram: z.string().default(""),
  messenger: z.string().default(""),
  opening_days: localizedTextSchema,
  opening_time: z.string().default(""),
  opening_remark: localizedTextSchema,
  parking: localizedTextSchema,
  directions_url: z.string().default(""),
  public_transport: z.array(publicTransportItemSchema).default([]),
  car_directions: localizedTextSchema,
  map_embed_url: z.string().default(""),
  map_location_name: z.string().default(""),
  bank_name: z.string().default(""),
  bank_account: z.string().default(""),
  bank_iban: z.string().default(""),
  bank_bic: z.string().default(""),
  form_title: localizedTextSchema,
  form_description: localizedTextSchema,
  form_enabled: z.boolean().default(true),
});

export const contactPageMasterSchema = z.object({
  id: z.string().optional(),
  slug: z.string().default("contact"),
  seo: seoMetadataSchema,
  content: contactPageContentSchema,
  status: z.enum(["draft", "published"]).default("published"),
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
  objective_content: localizedTextSchema,
  
  administration_title: localizedTextSchema,
  administration_content: localizedTextSchema,
  
  history_title: localizedTextSchema,
  history_content: localizedTextSchema,
  
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

export type SeoMetadataFormData = z.infer<typeof seoMetadataSchema>;
export type HomePageContentFormData = z.infer<typeof homePageContentSchema>;
export type HomePageMasterFormData = z.infer<typeof homePageMasterSchema>;
export type ContactPageContentFormData = z.infer<typeof contactPageContentSchema>;
export type ContactPageMasterFormData = z.infer<typeof contactPageMasterSchema>;
export type AboutPageContentFormData = z.infer<typeof aboutPageContentSchema>;
export type AboutPageMasterFormData = z.infer<typeof aboutPageMasterSchema>;
