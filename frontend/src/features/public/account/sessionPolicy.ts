import type { AccountApiError } from "./types";

export type AccountSessionEndReason = "expired" | "disabled";

export function classifyAccountSessionError(
  error: AccountApiError,
): AccountSessionEndReason | null {
  if (error.code === "AUTH_ACCOUNT_DISABLED") return "disabled";
  if (
    error.code === "AUTH_TOKEN_INVALID_OR_EXPIRED" ||
    error.status === 401
  ) {
    return "expired";
  }
  return null;
}
