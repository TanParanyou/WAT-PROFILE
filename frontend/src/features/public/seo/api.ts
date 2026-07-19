import { publicApi } from "@/services/publicService";
import { z } from "zod";
import type { ApiSuccess } from "../shared/api-types";
import { seoMetadataSchema } from "./schema";

const localizedTextSchema = z.object({ th: z.string(), en: z.string(), de: z.string() });

const publicSeoPageSchema = z.object({
  title: localizedTextSchema,
  description: localizedTextSchema,
  seo: seoMetadataSchema,
});

export type PublicSeoPage = z.infer<typeof publicSeoPageSchema>;
export type PublicSeoSlug = "gallery" | "events" | "monks";

export async function fetchPublishedPageMetadata(slug: PublicSeoSlug): Promise<PublicSeoPage> {
  const response = await publicApi.get<ApiSuccess<unknown>>(`/pages/${slug}`);
  return publicSeoPageSchema.parse(response.data.data);
}
