import type { MultiLangText } from "@/types/api";

export type SlugSource =
  | string
  | MultiLangText
  | Partial<Record<"th" | "en" | "de", string | undefined>>
  | null
  | undefined;

/**
 * Generates a random alphanumeric slug with optional prefix.
 * e.g. generateDefaultSlug("evt") -> "evt-k9x1m3"
 */
export function generateDefaultSlug(prefix?: string, length = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return prefix ? `${prefix}-${result}` : result;
}

/**
 * Converts a text string or MultiLangText into a clean, URL-friendly slug.
 * Supports English, Thai, and German characters.
 */
export function generateSlug(source: SlugSource): string {
  if (!source) return "";

  let text = "";
  if (typeof source === "string") {
    text = source;
  } else {
    // Priority: English -> Thai -> German
    text = (source.en || source.th || source.de || "").trim();
  }

  return text
    .toLowerCase()
    .trim()
    .replace(/[\s_\/]+/g, "-") // Replace spaces, underscores, and slashes with hyphens
    .replace(/[^a-z0-9\u0e00-\u0e7f-]/g, "") // Keep English, Thai, numbers, and hyphens
    .replace(/-+/g, "-") // Collapse multiple hyphens
    .replace(/^-+|-+$/g, ""); // Trim leading/trailing hyphens
}
