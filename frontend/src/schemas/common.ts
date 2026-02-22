import { z } from "zod";

export const multiLangSchema = (name: string) =>
  z.object({
    th: z.string().min(1, `${name} (ภาษาไทย) is required`),
    en: z.string().optional(),
    de: z.string().optional(),
  });

export const slugSchema = z
  .string()
  .min(1, "Slug is required")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must be URL-safe (lowercase alphanumeric and hyphens only)",
  );

export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};
