import { z } from "zod";
import { multiLangSchema, slugSchema } from "./common";

export const galleryCategorySchema = z.object({
  name: multiLangSchema("Name"),
  slug: slugSchema,
  display_order: z.number(),
  is_active: z.boolean(),
});

export type GalleryCategoryFormData = z.infer<typeof galleryCategorySchema>;

export const gallerySchema = z.object({
  image_url: z.string().min(1, "Please select an image"),
  caption: multiLangSchema("Caption").optional(),
  category_id: z.number().nullable().optional(),
  display_order: z.number(),
  is_active: z.boolean(),
});

export type GalleryFormData = z.infer<typeof gallerySchema>;
