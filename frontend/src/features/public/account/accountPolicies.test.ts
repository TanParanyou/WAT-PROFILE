import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyAccountActionError } from "./actionErrors";
import { mapAccountFormError } from "./formErrors";
import { classifyAccountSessionError } from "./sessionPolicy";
import type { AccountApiError } from "./types";

function apiError(
  code: AccountApiError["code"],
  overrides: Partial<AccountApiError> = {},
): AccountApiError {
  return {
    code,
    message: "RAW_BACKEND_MESSAGE",
    status: 400,
    fieldErrors: [],
    retryAfterSeconds: 0,
    ...overrides,
  };
}

test("form errors allow only declared backend fields", () => {
  const mapped = mapAccountFormError(
    apiError("AUTH_VALIDATION", {
      fieldErrors: [{ field: "display_name", message: "RAW_BACKEND_MESSAGE" }],
    }),
    { display_name: "displayName" },
  );
  assert.deepEqual(mapped, {
    target: "displayName",
    messageKey: "errors.AUTH_VALIDATION",
  });
  assert.equal(JSON.stringify(mapped).includes("RAW_BACKEND_MESSAGE"), false);
});

test("unknown backend fields map to the server root", () => {
  const mapped = mapAccountFormError(
    apiError("AUTH_VALIDATION", {
      fieldErrors: [{ field: "internal_id", message: "RAW_BACKEND_MESSAGE" }],
    }),
    { email: "email" },
  );
  assert.equal(mapped.target, "root.server");
});

test("same-email validation uses the dedicated localized message", () => {
  const mapped = mapAccountFormError(
    apiError("AUTH_VALIDATION", {
      fieldErrors: [{ field: "new_email", message: "RAW_BACKEND_MESSAGE" }],
    }),
    { new_email: "newEmail" },
  );
  assert.deepEqual(mapped, {
    target: "newEmail",
    messageKey: "validation.emailDifferent",
  });
});

test("action errors separate invalid, rate limited, and transient failures", () => {
  assert.deepEqual(classifyAccountActionError(null, false), { kind: "invalid" });
  assert.deepEqual(
    classifyAccountActionError(apiError("AUTH_TOKEN_INVALID_OR_EXPIRED"), true),
    { kind: "invalid" },
  );
  assert.deepEqual(
    classifyAccountActionError(
      apiError("AUTH_RATE_LIMITED", { status: 429, retryAfterSeconds: 30 }),
      true,
    ),
    { kind: "rate_limited", retryAfterSeconds: 30 },
  );
  assert.deepEqual(
    classifyAccountActionError(apiError("AUTH_INTERNAL", { status: 500 }), true),
    { kind: "transient" },
  );
});

test("session policy clears only terminal authenticated failures", () => {
  assert.equal(
    classifyAccountSessionError(apiError("AUTH_TOKEN_INVALID_OR_EXPIRED", { status: 401 })),
    "expired",
  );
  assert.equal(
    classifyAccountSessionError(apiError("AUTH_ACCOUNT_DISABLED", { status: 403 })),
    "disabled",
  );
  assert.equal(
    classifyAccountSessionError(apiError("AUTH_INTERNAL", { status: 500 })),
    null,
  );
});
