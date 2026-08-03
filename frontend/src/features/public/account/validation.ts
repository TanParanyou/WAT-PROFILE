import { accountSchema } from "./schema";

export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 128;
export const MIN_DISPLAY_NAME_LENGTH = 2;
export const MAX_DISPLAY_NAME_LENGTH = 80;

/** Normalizes an email address for comparison and submission. */
export function normalizeAccountEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Validates a raw password against the 12-128 length bounds. */
export function validatePassword(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH && password.length <= MAX_PASSWORD_LENGTH;
}

/** Validates a display name after trimming, within the 2-80 bounds. */
export function validateDisplayName(displayName: string): boolean {
  const trimmed = displayName.trim();
  return trimmed.length >= MIN_DISPLAY_NAME_LENGTH && trimmed.length <= MAX_DISPLAY_NAME_LENGTH;
}

/**
 * Allows only empty or relative same-site paths for Google returnTo values.
 * Rejects absolute URLs, protocol-relative URLs, and scheme-like strings.
 */
export function validateReturnTo(returnTo: string): boolean {
  const value = returnTo.trim();
  if (value === "") return true;
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//")) return false;
  if (value.includes("://")) return false;
  if (value.includes("\\")) return false;
  if (/^javascript:/i.test(value)) return false;
  return true;
}

/**
 * Shape-matches an unknown profile payload against the strict account schema
 * so component code never casts with `as`.
 */
export function isAccountShape(payload: unknown): boolean {
  return accountSchema.safeParse(payload).success;
}
