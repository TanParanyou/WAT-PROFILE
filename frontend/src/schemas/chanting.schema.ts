import { z } from "zod";
import { multiLangSchema, multiLangOptionalSchema, slugSchema } from "./common";

export const chantingSchema = z.object({
  title: multiLangSchema("Title"),
  subtitle: multiLangOptionalSchema().optional(),
  category: z.string().min(1, "Category is required"),
  slug: slugSchema,
  pali_thai: z.string().min(1, "Pali Thai is required"),
  pali_roman: z.string().min(1, "Pali Roman is required"),
  translation: multiLangSchema("Translation"),
  audio_url: z.string().optional(),
  duration_seconds: z.number().int().min(0),
  display_order: z.number().int().min(0),
  is_active: z.boolean(),
});

export type ChantingFormData = z.infer<typeof chantingSchema>;
