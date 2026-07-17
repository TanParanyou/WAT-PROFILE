import { z } from "zod";
import { localizedTextSchema, localizedRichTextSchema, seoMetadataSchema } from "./website-page.schema";

// 1. About
export const buildingItemSchema = z.object({
  name: localizedTextSchema,
  description: localizedTextSchema,
});

export const aboutBodySchema = z.object({
  intro: z.object({
    heading: localizedTextSchema,
    description: localizedTextSchema,
    founded: localizedTextSchema,
    location: localizedTextSchema,
  }),
  objective: z.object({
    heading: localizedTextSchema,
    subtitle: localizedTextSchema,
    content: localizedRichTextSchema,
  }),
  administration: z.object({
    heading: localizedTextSchema,
    content: localizedRichTextSchema,
  }),
  history: z.object({
    heading: localizedTextSchema,
    content: localizedRichTextSchema,
  }),
  buildings: z.object({
    heading: localizedTextSchema,
    items: z.array(buildingItemSchema).default([]),
  }),
  sangha: z.object({
    heading: localizedTextSchema,
    mission: localizedTextSchema,
    content: localizedRichTextSchema,
  }),
});

export const aboutContentFormSchema = z.object({
  title: localizedTextSchema,
  description: localizedTextSchema,
  seo: seoMetadataSchema,
  body: aboutBodySchema,
});

// 2. Contact
export const contactOpeningHoursSchema = z.object({
  days: localizedTextSchema,
  time: localizedTextSchema,
  notice: localizedTextSchema,
});

export const contactMapSchema = z.object({
  name: localizedTextSchema,
  embed_url: z.string().url("Must be a valid Google Maps embed URL").or(z.string().length(0)),
  directions_url: z.string().url("Must be a valid directions URL").or(z.string().length(0)),
});

export const contactTransportSchema = z.object({
  parking: localizedTextSchema,
  public_transport: z.array(localizedTextSchema).default([]),
  driving: localizedTextSchema,
});

export const contactSocialsSchema = z.object({
  facebook: z.string().url("Must be a valid URL").or(z.string().length(0)),
  instagram: z.string().url("Must be a valid URL").or(z.string().length(0)),
  messenger: z.string().url("Must be a valid URL").or(z.string().length(0)),
  line: z.string().default(""),
  youtube: z.string().url("Must be a valid URL").or(z.string().length(0)),
});

export const contactBankSchema = z.object({
  bank_name: localizedTextSchema,
  account_name: localizedTextSchema,
  account_number: z.string().default(""),
  iban: z.string().default(""),
  bic: z.string().default(""),
});

export const contactFormSettingsSchema = z.object({
  enabled: z.boolean().default(true),
  success_message: localizedTextSchema,
  privacy_page_link: z.string().default("/privacy"),
});

export const contactBodySchema = z.object({
  address: localizedTextSchema,
  phone: z.string().default(""),
  email: z.string().email("Must be a valid email").or(z.string().length(0)),
  opening_hours: contactOpeningHoursSchema,
  map: contactMapSchema,
  transport: contactTransportSchema,
  socials: contactSocialsSchema,
  bank: contactBankSchema,
  contact_form: contactFormSettingsSchema,
});

export const contactContentFormSchema = z.object({
  title: localizedTextSchema,
  description: localizedTextSchema,
  seo: seoMetadataSchema,
  body: contactBodySchema,
});

// 3. Privacy
export const privacyBodySchema = z.object({
  content: localizedRichTextSchema,
  last_updated: z.string().default(""),
});

export const privacyContentFormSchema = z.object({
  title: localizedTextSchema,
  seo: seoMetadataSchema,
  body: privacyBodySchema,
});

// 4. Impressum
export const impressumBodySchema = z.object({
  organization_name: localizedTextSchema,
  legal_form: localizedTextSchema,
  address: localizedTextSchema,
  phone: z.string().default(""),
  email: z.string().email("Must be a valid email").or(z.string().length(0)),
  representative: localizedTextSchema,
  registry_court: localizedTextSchema,
  registry_number: z.string().default(""),
  vat_id: z.string().default(""),
  content_responsibility: localizedTextSchema,
});

export const impressumContentFormSchema = z.object({
  title: localizedTextSchema,
  description: localizedTextSchema,
  seo: seoMetadataSchema,
  body: impressumBodySchema,
});
