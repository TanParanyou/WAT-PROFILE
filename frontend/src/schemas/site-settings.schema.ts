import { z } from "zod";

const localizedTextSchema = z.object({
  th: z.string().default(""),
  en: z.string().default(""),
  de: z.string().default(""),
});

export const globalContactSettingsSchema = z.object({
  address: localizedTextSchema,
  phone: z.string().default(""),
  email: z.string().email().or(z.literal("")).default(""),
  social: z
    .object({
      facebook: z.string().optional().default(""),
      messenger: z.string().optional().default(""),
      instagram: z.string().optional().default(""),
      line: z.string().optional().default(""),
      youtube: z.string().optional().default(""),
    })
    .default({
      facebook: "",
      messenger: "",
      instagram: "",
      line: "",
      youtube: "",
    }),
  openingHours: z.object({
    days: localizedTextSchema,
    time: z.string().default(""),
    remark: localizedTextSchema.optional(),
  }),
  transport: z
    .object({
      parking: localizedTextSchema.optional(),
      directionsUrl: z.string().optional().default(""),
      public: z
        .array(
          z.object({
            icon: z.enum(["train", "bus", "walk", "car"]),
            text: localizedTextSchema,
          }),
        )
        .optional()
        .default([]),
      car: z
        .object({
          text: localizedTextSchema,
        })
        .optional(),
    })
    .default({
      directionsUrl: "",
      public: [],
    }),
  map: z
    .object({
      embedUrl: z.string().optional().default(""),
      locationName: z.string().optional().default(""),
    })
    .default({
      embedUrl: "",
      locationName: "",
    }),
  bank: z.object({
    name: z.string().default(""),
    account: z.string().optional().default(""),
    iban: z.string().optional().default(""),
    bic: z.string().optional().default(""),
  }),
});

export const siteSettingsSchema = z.object({
  contact: globalContactSettingsSchema,
});

export type GlobalContactSettingsFormData = z.infer<typeof globalContactSettingsSchema>;
