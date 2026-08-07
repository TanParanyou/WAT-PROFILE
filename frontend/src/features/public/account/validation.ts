import { accountSchema } from "./schema";

export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 128;
export const MIN_DISPLAY_NAME_LENGTH = 2;
export const MAX_DISPLAY_NAME_LENGTH = 80;

/** Normalizes an email address for comparison and submission. */
export function normalizeAccountEmail(email: string): string {
  return email.trim().toLowerCase();
}

export interface PasswordPolicyResult {
  length: number;
  hasMinLength: boolean;
  hasMaxLength: boolean;
  hasLowercase: boolean;
  hasUppercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  characterGroups: number;
  valid: boolean;
}

export type PasswordValidationError =
  | "passwordRequired"
  | "passwordMin"
  | "passwordMax"
  | "passwordComplexity";
export type DisplayNameValidationError = "displayNameRequired" | "displayNameMin" | "displayNameMax";

/** Counts Unicode code points rather than UTF-16 code units. */
export function accountTextLength(value: string): number {
  return Array.from(value).length;
}

const lowercasePattern = new RegExp("\\p{Ll}", "u");
const uppercasePattern = new RegExp("\\p{Lu}", "u");
const numberPattern = new RegExp("\\p{N}", "u");
const specialPattern = new RegExp("[^\\p{L}\\p{N}\\s]", "u");

/** Inspects a raw password without trimming or normalizing it. */
export function inspectPassword(password: string): PasswordPolicyResult {
  const length = Array.from(password).length;
  const hasMinLength = length >= MIN_PASSWORD_LENGTH;
  const hasMaxLength = length <= MAX_PASSWORD_LENGTH;
  const hasLowercase = lowercasePattern.test(password);
  const hasUppercase = uppercasePattern.test(password);
  const hasNumber = numberPattern.test(password);
  const hasSpecial = specialPattern.test(password);
  const characterGroups = [hasLowercase, hasUppercase, hasNumber, hasSpecial].filter(Boolean).length;

  return {
    length,
    hasMinLength,
    hasMaxLength,
    hasLowercase,
    hasUppercase,
    hasNumber,
    hasSpecial,
    characterGroups,
    valid: hasMinLength && hasMaxLength && characterGroups >= 3,
  };
}

/** Validates a raw password against the creation/reset policy. */
export function validatePassword(password: string): PasswordValidationError | null {
  if (!password) return "passwordRequired";
  const requirements = inspectPassword(password);
  if (!requirements.hasMinLength) return "passwordMin";
  if (!requirements.hasMaxLength) return "passwordMax";
  if (!requirements.valid) return "passwordComplexity";
  return null;
}

/** Validates a display name after trimming, within required and length bounds. Returns error key or null if valid. */
export function validateDisplayName(displayName: string): DisplayNameValidationError | null {
  const trimmed = displayName.trim();
  if (!trimmed) return "displayNameRequired";
  const length = accountTextLength(trimmed);
  if (length < MIN_DISPLAY_NAME_LENGTH) return "displayNameMin";
  if (length > MAX_DISPLAY_NAME_LENGTH) return "displayNameMax";
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
