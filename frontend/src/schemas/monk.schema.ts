import { z } from "zod";
import { multiLangSchema, slugSchema } from "./common";

export const monkSchema = z.object({
  name: multiLangSchema("Name"),
  title: multiLangSchema("Title").optional(),
  dharma_name: multiLangSchema("Dharma Name").optional(),
  education: multiLangSchema("Education").optional(),
  bio: z.record(z.string(), z.unknown()).optional(),
  position: z.string().optional(),
  display_order: z.number().int().min(0),
  slug: slugSchema,
  image_url: z.union([z.string(), z.instanceof(File)]).optional(),
  ordination_date: z.string().nullable().optional(),
  is_active: z.boolean(),
});

export type MonkFormData = z.infer<typeof monkSchema>;
