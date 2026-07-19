import { z } from "zod";

const localizedTextSchema = z.object({
  th: z.string(),
  en: z.string(),
  de: z.string(),
});

const optionalUrlSchema = z.string().refine(
  (value) => value === "" || value.startsWith("/") || URL.canParse(value),
  "Invalid URL",
);

export const seoMetadataSchema = z.object({
  title: localizedTextSchema.default({ th: "", en: "", de: "" }),
  description: localizedTextSchema.default({ th: "", en: "", de: "" }),
  keywords: localizedTextSchema.default({ th: "", en: "", de: "" }),
  og_image: optionalUrlSchema.default(""),
  canonical_url: optionalUrlSchema.default(""),
  noindex: z.boolean().default(false),
});

export type SeoMetadata = z.infer<typeof seoMetadataSchema>;

export const emptySeoMetadata: SeoMetadata = seoMetadataSchema.parse({});
