import { z } from "zod";

export const localizedTextSchema = z
  .object({
    th: z.string().default(""),
    en: z.string().default(""),
    de: z.string().default(""),
  })
  .refine(
    (value) => Boolean(value.th.trim() || value.en.trim() || value.de.trim()),
    "At least one language is required",
  );

const heroBodySchema = z.object({
  eyebrow: z.string().optional().default(""),
  image: z.string().optional().default(""),
});

const heroSettingsSchema = z
  .object({
    tone: z.enum(["calm", "neutral", "highlight"]).optional().default("calm"),
    cta_label: z.string().optional().default(""),
    cta_href: z.string().optional().default(""),
  })
  .superRefine((value, ctx) => {
    if (value.cta_label?.trim() && !value.cta_href?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cta_href"],
        message: "CTA link is required when CTA label is set",
      });
    }
  });

const contactInfoBodySchema = z.object({
  phone: z.string().optional().default(""),
  email: z.string().optional().default(""),
  address: z.string().optional().default(""),
});

const contactInfoSettingsSchema = z.object({
  map_url: z.string().optional().default(""),
  show_map: z.boolean().optional().default(true),
  show_social: z.boolean().optional().default(true),
  show_bank: z.boolean().optional().default(false),
});

const contactFormSettingsSchema = z.object({
  enabled: z.boolean().optional().default(true),
  submit_label: z.string().optional().default(""),
  success_message: z.string().optional().default(""),
  destination_label: z.string().optional().default(""),
});

const richTextBodySchema = z.object({
  markdown: z.string().optional().default(""),
});

const richTextSettingsSchema = z.object({
  width: z.enum(["narrow", "regular", "wide"]).optional().default("regular"),
});

const mapBodySchema = z
  .object({
    embed_url: z.string().optional().default(""),
    directions_url: z.string().optional().default(""),
    address: z.string().optional().default(""),
  })
  .superRefine((value, ctx) => {
    if (!value.embed_url?.trim() && !value.directions_url?.trim() && !value.address?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["address"],
        message: "Add at least one map field",
      });
    }
  });

const mapSettingsSchema = z.object({
  show_directions: z.boolean().optional().default(true),
});

export const websiteCmsSectionFormSchema = z.object({
  id: z.string().min(1),
  page_id: z.string().min(1),
  section_key: z.string().min(1, "Section key is required"),
  section_type: z.string().min(1, "Section type is required"),
  title: localizedTextSchema,
  description: localizedTextSchema,
  body: z.record(z.string(), z.unknown()).default({}),
  settings: z.record(z.string(), z.unknown()).default({}),
  sort_order: z.number().int().nonnegative(),
  status: z.enum(["draft", "published", "archived"]),
});

export function getWebsiteCmsSectionFormSchema(sectionType: string) {
  return websiteCmsSectionFormSchema.superRefine((value, ctx) => {
    const addIssues = (result: any, root: "body" | "settings") => {
      if (result.success) return;
      for (const issue of result.error.issues) {
        ctx.addIssue({
          ...issue,
          path: [root, ...issue.path],
        });
      }
    };

    switch (sectionType) {
      case "hero":
        addIssues(heroBodySchema.safeParse(value.body), "body");
        addIssues(heroSettingsSchema.safeParse(value.settings), "settings");
        break;
      case "contact_info":
        addIssues(contactInfoBodySchema.safeParse(value.body), "body");
        addIssues(contactInfoSettingsSchema.safeParse(value.settings), "settings");
        break;
      case "contact_form":
        addIssues(contactFormSettingsSchema.safeParse(value.settings), "settings");
        break;
      case "rich_text":
        addIssues(richTextBodySchema.safeParse(value.body), "body");
        addIssues(richTextSettingsSchema.safeParse(value.settings), "settings");
        break;
      case "map":
        addIssues(mapBodySchema.safeParse(value.body), "body");
        addIssues(mapSettingsSchema.safeParse(value.settings), "settings");
        break;
      default:
        break;
    }
  });
}

export const websiteCmsPageFormSchema = z.object({
  id: z.string().min(1),
  page_key: z.string().min(1, "Page key is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be URL-safe"),
  title: localizedTextSchema,
  description: localizedTextSchema,
  seo: z.record(z.string(), z.unknown()).default({}),
  body: z.record(z.string(), z.unknown()).default({}),
  settings: z.record(z.string(), z.unknown()).default({}),
  status: z.enum(["draft", "published", "archived"]),
});

export type WebsiteCmsSectionFormData = z.infer<typeof websiteCmsSectionFormSchema>;
export type WebsiteCmsPageFormData = z.infer<typeof websiteCmsPageFormSchema>;
