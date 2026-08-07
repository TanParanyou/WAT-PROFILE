import type { AccountApiError, AccountErrorCode } from "./types";

export type AccountFormTarget = string | "root.server";
export type AccountFormMessageKey =
  | "validation.emailInvalid"
  | `errors.${AccountErrorCode}`;

export interface AccountFormErrorDescriptor {
  target: AccountFormTarget;
  messageKey: AccountFormMessageKey;
  retryAfterSeconds?: number;
}

export function mapAccountFormError(
  error: AccountApiError,
  allowedFields: Readonly<Record<string, string>>,
): AccountFormErrorDescriptor {
  const fieldError = error.fieldErrors.find(
    ({ field }) => allowedFields[field] !== undefined,
  );

  if (fieldError) {
    return {
      target: allowedFields[fieldError.field],
      messageKey:
        error.code === "AUTH_VALIDATION" &&
        (fieldError.field === "email" || fieldError.field === "new_email")
          ? "validation.emailInvalid"
          : `errors.${error.code}`,
    };
  }

  return {
    target: "root.server",
    messageKey: `errors.${error.code}`,
    ...(error.retryAfterSeconds > 0
      ? { retryAfterSeconds: error.retryAfterSeconds }
      : {}),
  };
}
