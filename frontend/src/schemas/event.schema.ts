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
    image_url: z.union([z.string(), z.instanceof(File)]).optional(),
    map_url: z.string().optional(),
    is_active: z.boolean(),
    registration_enabled: z.boolean(),
    schedule: z
      .array(
        z.object({
          day: z
            .object({
              th: z.string().optional(),
              en: z.string().optional(),
              de: z.string().optional(),
            })
            .optional(),
          time: z.string().min(1, "Time is required"),
          activity: multiLangSchema("Activity"),
        }),
      )
      .optional(),
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
