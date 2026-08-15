import { z } from "zod";
import { multiLangSchema, multiLangOptionalSchema, slugSchema } from "./common";

export const baseEventSchema = z.object({
  title: multiLangSchema("Title"),
  description: z.record(z.string(), z.unknown()).optional(),
  slug: slugSchema,
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  start_time: z.string().nullable().optional(),
  end_time: z.string().nullable().optional(),
  event_type: z.string().min(1, "Event type is required"),
  location: multiLangOptionalSchema(),
  image_url: z.union([z.string(), z.instanceof(File)]).optional(),
  map_url: z.string().optional(),
  is_active: z.boolean(),
  registration_enabled: z.boolean(),
  registration_deadline: z.string().nullable().optional(),
  max_participants: z.coerce.number().nullable().optional(),
  gallery_urls: z.array(z.string()).optional(),
  online_join_url: z.string().optional(),
  dress_code: multiLangOptionalSchema(),
  what_to_bring: multiLangOptionalSchema(),
  donation_enabled: z.boolean().optional(),
  contact_phone: z.string().optional(),
  contact_line: z.string().optional(),
  contact_email: z.string().optional(),
  transport_info: multiLangOptionalSchema(),
  schedule: z
    .array(
      z.object({
        start_time: z.string().min(1, "Start time is required"),
        end_time: z.string().min(1, "End time is required"),
        activity: multiLangSchema("Activity"),
      }),
    )
    .optional(),
  resource_ids: z.array(z.number().int().positive()).default([]),
});

export const eventSchema = baseEventSchema.superRefine((data, ctx) => {
  if (data.start_date && data.end_date) {
    if (new Date(data.end_date) < new Date(data.start_date)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date must be on or after start date",
        path: ["end_date"],
      });
    }
  }

  if (data.start_time && data.end_time) {
    if (data.end_time <= data.start_time) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End time must be after start time",
        path: ["end_time"],
      });
    }
  }

  if (data.schedule) {
    data.schedule.forEach((item, index) => {
      if (item.start_time && item.end_time && item.end_time < item.start_time) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "End time must be after start time",
          path: ["schedule", index, "end_time"],
        });
      }
    });
  }
});

export type EventFormData = z.infer<typeof eventSchema>;
