import { accountSchema } from "./schema";

export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 128;
export const MIN_DISPLAY_NAME_LENGTH = 2;
export const MAX_DISPLAY_NAME_LENGTH = 80;

/** Normalizes an email address for comparison and submission. */
export function normalizeAccountEmail(email: string): string {
  return email.trim().toLowerCase();
}

export type PasswordValidationError = "passwordRequired" | "passwordMin" | "passwordMax";
export type DisplayNameValidationError = "displayNameRequired" | "displayNameMin" | "displayNameMax";

/** Validates a raw password against required and length bounds. Returns error key or null if valid. */
export function validatePassword(password: string): PasswordValidationError | null {
  if (!password) return "passwordRequired";
  if (password.length < MIN_PASSWORD_LENGTH) return "passwordMin";
  if (password.length > MAX_PASSWORD_LENGTH) return "passwordMax";
  return null;
}

/** Validates a display name after trimming, within required and length bounds. Returns error key or null if valid. */
export function validateDisplayName(displayName: string): DisplayNameValidationError | null {
  const trimmed = displayName.trim();
  if (!trimmed) return "displayNameRequired";
  if (trimmed.length < MIN_DISPLAY_NAME_LENGTH) return "displayNameMin";
  if (trimmed.length > MAX_DISPLAY_NAME_LENGTH) return "displayNameMax";
  return null;
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
