import { z } from "zod";
import { multiLangSchema, slugSchema } from "./common";

export const eventSchema = z
  .object({
    title: multiLangSchema("Title"),
    description: multiLangSchema("Description").optional(),
    slug: slugSchema,
    event_date: z.string().min(1, "Event date is required"),
    start_time: z.string().nullable().optional(),
    end_time: z.string().nullable().optional(),
    event_type: z.string().min(1, "Event type is required"),
    location: multiLangSchema("Location").optional(),
    image_url: z.string().optional(),
    is_active: z.boolean().default(true),
    registration_enabled: z.boolean().default(false),
  })
  .refine(
    (data) => {
      if (data.start_time && data.end_time) {
        return data.end_time > data.start_time;
      }
      return true;
    },
    {
      message: "End time must be after start time",
      path: ["end_time"],
    },
  );

export type EventFormData = z.infer<typeof eventSchema>;
