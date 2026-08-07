import type { AccountApiError } from "./types";

export type AccountActionFailure =
  | { kind: "invalid" }
  | { kind: "rate_limited"; retryAfterSeconds: number }
  | { kind: "transient" };

export function classifyAccountActionError(
  error: AccountApiError | null,
  tokenPresent: boolean,
): AccountActionFailure {
  if (!tokenPresent || !error || error.code === "AUTH_TOKEN_INVALID_OR_EXPIRED") {
    return { kind: "invalid" };
  }

  if (error.code === "AUTH_RATE_LIMITED" || error.status === 429) {
    return {
      kind: "rate_limited",
      retryAfterSeconds: error.retryAfterSeconds,
    };
  }

  return { kind: "transient" };
}
