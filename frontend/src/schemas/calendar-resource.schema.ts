import { z } from "zod";
import { multiLangSchema, slugSchema } from "./common";

export const calendarResourceSchema = z.object({
  slug: slugSchema,
  resource_type: z.string().min(1, "Resource type is required").max(50),
  title: multiLangSchema("Title").extend({
    en: z.string().min(1, "Title (English) is required"),
    de: z.string().min(1, "Title (German) is required"),
  }),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color must be a six-digit hex value").nullable().optional(),
  capacity: z.number().int().positive().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()),
  is_active: z.boolean(),
  is_public: z.boolean(),
  display_order: z.number().int().nonnegative(),
});

export type CalendarResourceFormData = z.infer<typeof calendarResourceSchema>;
