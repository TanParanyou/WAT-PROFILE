import { z } from "zod";
import { multiLangSchema, slugSchema } from "./common";

export const eventSchema = z
  .object({
    title: multiLangSchema("Title"),
    description: multiLangSchema("Description").optional(),
    slug: slugSchema,
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().min(1, "End date is required"),
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
          start_time: z.string().min(1, "Start time is required"),
          end_time: z.string().min(1, "End time is required"),
          activity: multiLangSchema("Activity"),
        }).refine(data => data.end_time >= data.start_time, {
          message: "End time must be after start time",
          path: ["end_time"]
        }),
      )
      .optional(),
  })
  .refine(
    (data) => {
      if (data.start_date && data.end_date) {
        return new Date(data.end_date) >= new Date(data.start_date);
      }
      return true;
    },
    {
      message: "End date must be on or after start date",
      path: ["end_date"],
    }
  )
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
