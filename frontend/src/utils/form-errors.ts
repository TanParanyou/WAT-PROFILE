export type DeepFieldErrors = {
  [key: string]: unknown;
};

/**
 * Recursively inspects a FieldErrors-like object to find the first language code
 * ('th', 'en', or 'de') that has validation errors.
 */
export function findErrorLanguage(errors: DeepFieldErrors): "th" | "en" | "de" | null {
  if (!errors || typeof errors !== "object") return null;

  // Check if current level has language keys that represent an error
  if ("th" in errors && errors.th) return "th";
  if ("en" in errors && errors.en) return "en";
  if ("de" in errors && errors.de) return "de";

  // Recursively search child properties
  for (const key of Object.keys(errors)) {
    const value = errors[key];
    if (value && typeof value === "object") {
      const found = findErrorLanguage(value as DeepFieldErrors);
      if (found) return found;
    }
  }

  return null;
}

/**
 * Recursively checks if a specific language code ('th', 'en', or 'de') has errors.
 */
export function hasLanguageError(lang: "th" | "en" | "de", errors: DeepFieldErrors): boolean {
  if (!errors || typeof errors !== "object") return false;

  if (lang in errors && errors[lang] && typeof errors[lang] === "object") {
    const target = errors[lang] as Record<string, unknown>;
    // Check if it's a FieldError (has type or message)
    if ("type" in target || "message" in target) {
      return true;
    }
  }

  for (const key of Object.keys(errors)) {
    const value = errors[key];
    if (value && typeof value === "object") {
      if (hasLanguageError(lang, value as DeepFieldErrors)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Safely extracts an error message string from a FieldError or nested multi-lang error object
 * without requiring unsafe 'any' assertions.
 */
export function getFieldError(fieldError: unknown): string | undefined {
  if (!fieldError) return undefined;
  if (typeof fieldError === "object") {
    const err = fieldError as Record<string, unknown>;
    if (typeof err.message === "string") return err.message;

    // Check nested multi-lang fields (th, en, de)
    const th = err.th as Record<string, unknown> | undefined;
    const en = err.en as Record<string, unknown> | undefined;
    const de = err.de as Record<string, unknown> | undefined;

    if (th && typeof th.message === "string") return th.message;
    if (en && typeof en.message === "string") return en.message;
    if (de && typeof de.message === "string") return de.message;
  }
  return undefined;
}

