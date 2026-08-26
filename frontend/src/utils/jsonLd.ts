/**
 * Safely serialize data to JSON string for embedding inside <script type="application/ld+json">
 * Replaces '<' with unicode escape '\u003c' to prevent breaking out of script tags (Stored XSS).
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
