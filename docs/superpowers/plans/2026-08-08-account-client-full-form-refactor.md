# Account Client Full Form Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the public Account data-entry surfaces to React Hook Form and Zod while making session expiry, action-token failures, localization, Unicode validation, privacy metadata, and visitor-facing time behavior production-safe.

**Architecture:** Keep HTTP transport in `api.ts`, remote state in TanStack Query, and automatic token actions as explicit state machines. Add focused form-schema and error-policy modules, then migrate only genuine data-entry forms to React Hook Form; align the Go display-name contract with the same Unicode semantics and keep all existing routes and payloads unchanged.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict mode, React Hook Form 7, Zod 4, `@hookform/resolvers`, TanStack Query, next-intl, Axios, Go 1.25, Fiber, GORM, Node test runner through `tsx`.

## Global Constraints

- Supported locales are exactly `th`, `en`, and `de`; every new Account message key must exist and be non-empty in all three files.
- Preserve the existing Account routes, HTTP payloads, in-memory access-token model, HttpOnly refresh-cookie model, feature flags, and visual layout.
- Do not render backend `field_errors[].message` as public UI copy; use stable codes and allow-listed field names to choose localized frontend messages.
- Do not add dependencies, a new component-test framework, database migrations, or Admin authentication changes.
- Keep remote account data in TanStack Query and form state in React Hook Form; do not mirror server records into context or Zustand.
- Passwords are never trimmed or normalized. Emails are trimmed and lowercased. Display names are trimmed and limited to 2–80 Unicode code points.
- All visitor-facing Account dates and times use `Europe/Berlin`.
- Every Account route must inherit `robots: { index: false, follow: false }`.
- Preserve keyboard operation, visible focus, 44px targets, error focus, and reduced-motion behavior.
- Keep unrelated user changes intact; stage and commit only files named by the current task.
- Source and config are authoritative; update `backend/docs/openapi.yaml` only if an HTTP route or payload changes. This plan does not change either.

## File Responsibility Map

| File | Responsibility after this work |
|---|---|
| `frontend/src/features/public/account/formSchemas.ts` | Localized Zod factories and inferred values for Account data-entry forms |
| `frontend/src/features/public/account/formErrors.ts` | Pure mapping from `AccountApiError` to an allow-listed RHF field or `root.server` plus a localized message key |
| `frontend/src/features/public/account/actionErrors.ts` | Classification for automatic token-action failures |
| `frontend/src/features/public/account/sessionPolicy.ts` | Classification for terminal versus recoverable authenticated-session failures |
| `frontend/src/features/public/account/components/LoginForm.tsx` | Password login RHF form plus Google entry action |
| `frontend/src/features/public/account/components/RegisterForm.tsx` | Password registration RHF form plus Google entry action |
| `frontend/src/features/public/account/components/RecoveryForms.tsx` | Forgot/reset/resend RHF forms and verify-email state machine |
| `frontend/src/features/public/account/components/LifecycleForms.tsx` | Reopen-request RHF form and email/reopen confirmation state machines |
| `frontend/src/features/public/account/components/ProfileForm.tsx` | Profile/preferences RHF state, dirty navigation, locale switch, and Account tab composition |
| `frontend/src/features/public/account/components/CredentialForms.tsx` | Credential accordion composition only |
| `frontend/src/features/public/account/components/PasswordChangeForm.tsx` | Password-change RHF form |
| `frontend/src/features/public/account/components/EmailChangeForm.tsx` | Email-change RHF form |
| `frontend/src/features/public/account/components/AccountReauthModal.tsx` | Password reauthentication RHF form or Google command action |
| `frontend/src/features/public/account/AccountSessionProvider.tsx` | Account bootstrap, authenticated state, and deterministic terminal-session cleanup |
| `backend/internal/services/account_registration_service.go` | Unicode-aware registration display-name validation |
| `backend/internal/services/account_profile_service.go` | Unicode-aware profile display-name validation |

---

### Task 1: Add localized form contracts and error policies

**Files:**
- Create: `frontend/src/features/public/account/formSchemas.ts`
- Create: `frontend/src/features/public/account/formErrors.ts`
- Create: `frontend/src/features/public/account/actionErrors.ts`
- Create: `frontend/src/features/public/account/sessionPolicy.ts`
- Create: `frontend/src/features/public/account/formSchemas.test.ts`
- Create: `frontend/src/features/public/account/accountPolicies.test.ts`
- Modify: `frontend/src/features/public/account/validation.ts`

**Interfaces:**
- Consumes: `validatePassword(password: string)`, `toAccountApiError(error: unknown)`, `AccountApiError`, `AccountErrorCode`, and `AccountLocale`.
- Produces: `createAccountFormSchemas(messages)`, `AccountFormSchemas`, inferred form value types, `mapAccountFormError(error, allowedFields)`, `classifyAccountActionError(error, tokenPresent)`, and `classifyAccountSessionError(error)`.

- [ ] **Step 1: Write failing schema tests**

Create `formSchemas.test.ts` with localized sentinel messages so tests prove that schemas return the supplied copy and preserve normalization rules:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { createAccountFormSchemas } from "./formSchemas";

const schemas = createAccountFormSchemas({
  emailRequired: "EMAIL_REQUIRED",
  emailInvalid: "EMAIL_INVALID",
  displayNameRequired: "NAME_REQUIRED",
  displayNameMin: "NAME_MIN",
  displayNameMax: "NAME_MAX",
  passwordRequired: "PASSWORD_REQUIRED",
  passwordMin: "PASSWORD_MIN",
  passwordMax: "PASSWORD_MAX",
  passwordComplexity: "PASSWORD_COMPLEXITY",
});

test("login schema normalizes email without changing password", () => {
  const result = schemas.login.parse({
    email: " Visitor@Example.com ",
    password: "  Keep spaces 1!A",
  });
  assert.deepEqual(result, {
    email: "visitor@example.com",
    password: "  Keep spaces 1!A",
  });
});

test("register schema counts display names as Unicode code points", () => {
  assert.equal(
    schemas.register.safeParse({
      displayName: "ก".repeat(80),
      email: "visitor@example.com",
      password: "abcdefghij1!",
      locale: "th",
    }).success,
    true,
  );
  const rejected = schemas.register.safeParse({
    displayName: "🙂".repeat(81),
    email: "visitor@example.com",
    password: "abcdefghij1!",
    locale: "th",
  });
  assert.equal(rejected.success, false);
  assert.equal(rejected.error?.issues[0]?.message, "NAME_MAX");
});

test("password schemas preserve the existing account password policy", () => {
  assert.equal(schemas.resetPassword.safeParse({ password: "short" }).success, false);
  assert.equal(
    schemas.resetPassword.safeParse({ password: "abcdefghij1!" }).success,
    true,
  );
});
```

- [ ] **Step 2: Run the new schema test and confirm the missing-module failure**

Run:

```bash
cd frontend && ./node_modules/.bin/tsx --test src/features/public/account/formSchemas.test.ts
```

Expected: FAIL because `./formSchemas` does not exist.

- [ ] **Step 3: Implement the localized schema factory**

In `validation.ts`, export a code-point helper and make `validateDisplayName` use it:

```ts
export function accountTextLength(value: string): number {
  return Array.from(value).length;
}

export function validateDisplayName(
  displayName: string,
): DisplayNameValidationError | null {
  const trimmed = displayName.trim();
  if (!trimmed) return "displayNameRequired";
  const length = accountTextLength(trimmed);
  if (length < MIN_DISPLAY_NAME_LENGTH) return "displayNameMin";
  if (length > MAX_DISPLAY_NAME_LENGTH) return "displayNameMax";
  return null;
}
```

Create `formSchemas.ts` with one factory so all forms share normalization and policy:

```ts
import { z } from "zod";
import {
  accountTextLength,
  MAX_DISPLAY_NAME_LENGTH,
  MIN_DISPLAY_NAME_LENGTH,
  validatePassword,
} from "./validation";

export interface AccountFormValidationMessages {
  emailRequired: string;
  emailInvalid: string;
  displayNameRequired: string;
  displayNameMin: string;
  displayNameMax: string;
  passwordRequired: string;
  passwordMin: string;
  passwordMax: string;
  passwordComplexity: string;
}

export function createAccountFormSchemas(
  messages: AccountFormValidationMessages,
) {
  const email = z
    .string()
    .trim()
    .toLowerCase()
    .min(1, messages.emailRequired)
    .email(messages.emailInvalid);

  const displayName = z
    .string()
    .trim()
    .min(1, messages.displayNameRequired)
    .refine(
      (value) => accountTextLength(value) >= MIN_DISPLAY_NAME_LENGTH,
      messages.displayNameMin,
    )
    .refine(
      (value) => accountTextLength(value) <= MAX_DISPLAY_NAME_LENGTH,
      messages.displayNameMax,
    );

  const password = z.string().superRefine((value, context) => {
    const error = validatePassword(value);
    if (!error) return;
    context.addIssue({
      code: "custom",
      message: messages[error],
    });
  });

  return {
    login: z.object({ email, password: z.string().min(1, messages.passwordRequired) }),
    register: z.object({
      displayName,
      email,
      password,
      locale: z.enum(["th", "en", "de"]),
    }),
    emailRequest: z.object({ email }),
    resetPassword: z.object({ password }),
    profile: z.object({
      displayName,
      preferredLocale: z.enum(["th", "en", "de"]),
    }),
    emailChange: z.object({ newEmail: email }),
    passwordChange: z.object({ newPassword: password }),
    passwordReauth: z.object({
      password: z.string().min(1, messages.passwordRequired),
    }),
  };
}

export type AccountFormSchemas = ReturnType<typeof createAccountFormSchemas>;
export type LoginFormValues = z.infer<AccountFormSchemas["login"]>;
export type RegisterFormValues = z.infer<AccountFormSchemas["register"]>;
export type EmailRequestFormValues = z.infer<AccountFormSchemas["emailRequest"]>;
export type ResetPasswordFormValues = z.infer<AccountFormSchemas["resetPassword"]>;
export type ProfileFormValues = z.infer<AccountFormSchemas["profile"]>;
export type EmailChangeFormValues = z.infer<AccountFormSchemas["emailChange"]>;
export type PasswordChangeFormValues = z.infer<AccountFormSchemas["passwordChange"]>;
export type PasswordReauthFormValues = z.infer<AccountFormSchemas["passwordReauth"]>;
```

- [ ] **Step 4: Run schema tests and confirm they pass**

Run:

```bash
cd frontend && ./node_modules/.bin/tsx --test src/features/public/account/formSchemas.test.ts
```

Expected: PASS.

- [ ] **Step 5: Write failing policy tests**

Create `accountPolicies.test.ts`:

```ts
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
```

- [ ] **Step 6: Run policy tests and confirm the missing-module failure**

Run:

```bash
cd frontend && ./node_modules/.bin/tsx --test src/features/public/account/accountPolicies.test.ts
```

Expected: FAIL because the three policy modules do not exist.

- [ ] **Step 7: Implement the pure policy modules**

Create `formErrors.ts` with stable descriptors rather than raw server copy:

```ts
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
```

Create `actionErrors.ts`:

```ts
import type { AccountApiError } from "./types";

export type AccountActionFailure =
  | { kind: "invalid" }
  | { kind: "rate_limited"; retryAfterSeconds: number }
  | { kind: "transient" };

export function classifyAccountActionError(
  error: AccountApiError | null,
  tokenPresent: boolean,
): AccountActionFailure {
  if (!tokenPresent || error?.code === "AUTH_TOKEN_INVALID_OR_EXPIRED") {
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
```

Create `sessionPolicy.ts`:

```ts
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
```

- [ ] **Step 8: Run Account tests and type-check**

Run:

```bash
cd frontend && npm run test:account
cd frontend && ./node_modules/.bin/tsc --noEmit
```

Expected: all Account tests pass and TypeScript exits 0.

- [ ] **Step 9: Commit the shared contracts**

```bash
git add frontend/src/features/public/account/formSchemas.ts frontend/src/features/public/account/formErrors.ts frontend/src/features/public/account/actionErrors.ts frontend/src/features/public/account/sessionPolicy.ts frontend/src/features/public/account/formSchemas.test.ts frontend/src/features/public/account/accountPolicies.test.ts frontend/src/features/public/account/validation.ts
git commit -m "refactor(account): add form and error policies"
```

---

### Task 2: Align backend display-name validation with Unicode

**Files:**
- Modify: `backend/internal/services/account_registration_service.go:3-12,90-99`
- Modify: `backend/internal/services/account_profile_service.go:3-12,103-112`
- Modify: `backend/internal/services/account_registration_service_test.go`
- Modify: `backend/internal/services/account_profile_service_test.go`

**Interfaces:**
- Consumes: the existing `minDisplayName = 2` and `maxDisplayName = 80` constants.
- Produces: identical 2–80 Unicode-code-point behavior in registration and profile update without changing request or response payloads.

- [ ] **Step 1: Add failing Unicode boundary tests**

Add this complete table-driven registration test:

```go
func TestRegisterPasswordDisplayNameUnicodeLength(t *testing.T) {
    tests := []struct {
        name        string
        email       string
        displayName string
        wantErr     bool
    }{
        {name: "thai accepted", email: "thai@example.com", displayName: strings.Repeat("ก", 80)},
        {name: "german accepted", email: "german@example.com", displayName: strings.Repeat("ä", 80)},
        {name: "emoji accepted", email: "emoji@example.com", displayName: strings.Repeat("🙂", 80)},
        {name: "one code point rejected", email: "short@example.com", displayName: "ก", wantErr: true},
        {name: "eighty one code points rejected", email: "long@example.com", displayName: strings.Repeat("🙂", 81), wantErr: true},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            db := newAccountTestDB(t)
            service := newRegistrationFixture(t, db, &fakeEmailSender{})
            err := service.RegisterPassword(context.Background(), RegisterPasswordInput{
                Email:       tt.email,
                Password:    "Abcdefghijk1",
                DisplayName: tt.displayName,
                Locale:      "en",
            })
            if tt.wantErr {
                if err == nil || accountauth.ErrorCode(err) != accountauth.CodeValidation {
                    t.Fatalf("expected validation error, got %v", err)
                }
                return
            }
            if err != nil {
                t.Fatalf("expected display name to be accepted, got %v", err)
            }
        })
    }
}
```

Add the equivalent complete profile-update test:

```go
func TestUpdateProfileDisplayNameUnicodeLength(t *testing.T) {
    tests := []struct {
        name        string
        displayName string
        wantErr     bool
    }{
        {name: "thai accepted", displayName: strings.Repeat("ก", 80)},
        {name: "german accepted", displayName: strings.Repeat("ä", 80)},
        {name: "emoji accepted", displayName: strings.Repeat("🙂", 80)},
        {name: "one code point rejected", displayName: "ก", wantErr: true},
        {name: "eighty one code points rejected", displayName: strings.Repeat("🙂", 81), wantErr: true},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            svc, _, db := newProfileFixture(t)
            user := seedProfileAccount(t, db, "unicode@example.com", "Valid Name", "en")
            _, err := svc.UpdateProfile(context.Background(), user.ID, UpdateProfileInput{
                DisplayName:     tt.displayName,
                PreferredLocale: "en",
            })
            if tt.wantErr {
                if err == nil || accountauth.ErrorCode(err) != accountauth.CodeValidation {
                    t.Fatalf("expected validation error, got %v", err)
                }
                return
            }
            if err != nil {
                t.Fatalf("expected display name to be accepted, got %v", err)
            }
        })
    }
}
```

- [ ] **Step 2: Run targeted backend tests and confirm multibyte failures**

Run:

```bash
cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/services -run 'Test(RegisterPassword|UpdateProfile)DisplayNameUnicodeLength' -count=1
```

Expected: Thai/German/emoji cases at 80 code points fail because the services currently count UTF-8 bytes.

- [ ] **Step 3: Replace byte counts with a shared Unicode helper**

Add `unicode/utf8` to `account_registration_service.go` and define the package-level helper beside the existing constants:

```go
import "unicode/utf8"

func validDisplayName(value string) bool {
    length := utf8.RuneCountInString(strings.TrimSpace(value))
    return length >= minDisplayName && length <= maxDisplayName
}
```

Use it in registration:

```go
displayName := strings.TrimSpace(in.DisplayName)
if !validDisplayName(displayName) {
    return accountauth.NewFieldError(
        accountauth.CodeValidation,
        "display_name",
        "Display name must be between 2 and 80 characters.",
    )
}
```

Use the same helper in profile update:

```go
displayName := strings.TrimSpace(in.DisplayName)
if !validDisplayName(displayName) {
    return AccountView{}, accountauth.NewFieldError(
        accountauth.CodeValidation,
        "display_name",
        "Display name must be between 2 and 80 characters.",
    )
}
```

Do not duplicate the helper in `account_profile_service.go`; both files are in package `services`.

- [ ] **Step 4: Format and run service tests**

Run:

```bash
cd backend && gofmt -w internal/services/account_registration_service.go internal/services/account_profile_service.go internal/services/account_registration_service_test.go internal/services/account_profile_service_test.go
cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/services -run 'Test(RegisterPassword|UpdateProfile)DisplayNameUnicodeLength' -count=1
```

Expected: targeted tests pass.

- [ ] **Step 5: Commit the Unicode contract fix**

```bash
git add backend/internal/services/account_registration_service.go backend/internal/services/account_profile_service.go backend/internal/services/account_registration_service_test.go backend/internal/services/account_profile_service_test.go
git commit -m "fix(account): validate Unicode display names"
```

---

### Task 3: Refactor login and registration forms

**Files:**
- Modify: `frontend/src/features/public/account/components/LoginForm.tsx`
- Modify: `frontend/src/features/public/account/components/RegisterForm.tsx`
- Modify: `frontend/src/features/public/account/messages.test.ts`

**Interfaces:**
- Consumes: `createAccountFormSchemas`, `LoginFormValues`, `RegisterFormValues`, `mapAccountFormError`, `login`, `registerAccount`, `startGoogle`, and existing translated copy.
- Produces: RHF-owned login and registration field state, validation, submission state, and localized backend-error mapping.

- [ ] **Step 1: Strengthen the localization regression test**

Extend `messages.test.ts` so parity also rejects empty Account messages:

```ts
function flattenValues(obj: Record<string, unknown>): string[] {
  return Object.values(obj).flatMap((value) =>
    value !== null && typeof value === "object" && !Array.isArray(value)
      ? flattenValues(value as Record<string, unknown>)
      : [String(value)],
  );
}

test("account messages are non-empty in th en de", () => {
  for (const messages of [th.Account, en.Account, de.Account]) {
    assert.equal(flattenValues(messages).every((value) => value.trim().length > 0), true);
  }
});
```

- [ ] **Step 2: Replace LoginForm field state with React Hook Form**

Use this form setup inside `LoginForm`:

```ts
const schemas = useMemo(
  () =>
    createAccountFormSchemas({
      emailRequired: t("validation.emailRequired"),
      emailInvalid: t("validation.emailInvalid"),
      displayNameRequired: t("validation.displayNameRequired"),
      displayNameMin: t("validation.displayNameMin"),
      displayNameMax: t("validation.displayNameMax"),
      passwordRequired: t("validation.passwordRequired"),
      passwordMin: t("validation.passwordMin"),
      passwordMax: t("validation.passwordMax"),
      passwordComplexity: t("validation.passwordComplexity"),
    }),
  [t],
);
const {
  register,
  handleSubmit,
  setError,
  formState: { errors, isSubmitting },
} = useForm<LoginFormValues>({
  resolver: zodResolver(schemas.login),
  defaultValues: { email: "", password: "" },
  shouldFocusError: true,
});
```

Submit typed values and apply localized descriptors:

```ts
const onSubmit = handleSubmit(async ({ email, password }) => {
  try {
    await login(email, password);
    router.replace("/account");
  } catch (error: unknown) {
    const apiError = toAccountApiError(error);
    const mapped = mapAccountFormError(apiError, {
      email: "email",
      password: "password",
    });
    setError(mapped.target as "email" | "password" | "root.server", {
      type: "server",
      message:
        mapped.target === "root.server"
          ? getErrorMessage(apiError)
          : t(mapped.messageKey),
    });
  }
});
```

Bind fields with `register("email")` and `register("password")`; render
`errors.email?.message`, `errors.password?.message`, and
`errors.root?.server?.message`. Replace `submitting` checks with `isSubmitting`.
Keep callback-query errors and Google redirect state outside RHF.

- [ ] **Step 3: Replace RegisterForm field state with React Hook Form**

Use `useForm<RegisterFormValues>` with `schemas.register`, default locale from
`useLocale()`, and `watch("password")` for `PasswordRequirements`:

```ts
const form = useForm<RegisterFormValues>({
  resolver: zodResolver(schemas.register),
  defaultValues: {
    displayName: "",
    email: "",
    password: "",
    locale: locale as "th" | "en" | "de",
  },
  shouldFocusError: true,
});
const passwordRequirements = inspectPassword(form.watch("password"));

const onSubmit = form.handleSubmit(async (values) => {
  try {
    await registerAccount({
      email: values.email,
      password: values.password,
      display_name: values.displayName,
      locale: values.locale,
    });
    setSubmitted(true);
  } catch (error: unknown) {
    const apiError = toAccountApiError(error);
    const mapped = mapAccountFormError(apiError, {
      email: "email",
      password: "password",
      display_name: "displayName",
    });
    form.setError(
      mapped.target as "email" | "password" | "displayName" | "root.server",
      {
        type: "server",
        message:
          mapped.target === "root.server"
            ? getErrorMessage(apiError)
            : t(mapped.messageKey),
      },
    );
  }
});
```

Keep the generic success response and Google action unchanged. Do not expose
account existence through success or error copy.

- [ ] **Step 4: Run focused lint, tests, and type-check**

Run:

```bash
cd frontend && npm run test:account
cd frontend && ./node_modules/.bin/eslint src/features/public/account/components/LoginForm.tsx src/features/public/account/components/RegisterForm.tsx src/features/public/account/formSchemas.ts src/features/public/account/formErrors.ts
cd frontend && ./node_modules/.bin/tsc --noEmit
```

Expected: all commands exit 0 and no component reads `fieldError.message`.

- [ ] **Step 5: Commit the auth form migration**

```bash
git add frontend/src/features/public/account/components/LoginForm.tsx frontend/src/features/public/account/components/RegisterForm.tsx frontend/src/features/public/account/messages.test.ts
git commit -m "refactor(account): migrate auth forms to RHF"
```

---

### Task 4: Refactor recovery and reopen request forms

**Files:**
- Modify: `frontend/src/features/public/account/components/RecoveryForms.tsx`
- Modify: `frontend/src/features/public/account/components/LifecycleForms.tsx`

**Interfaces:**
- Consumes: `EmailRequestFormValues`, `ResetPasswordFormValues`, form schemas, form-error mapping, existing recovery APIs, and action-error policy from Task 1.
- Produces: RHF forgot/reset/resend/reopen-request forms; automatic token flows remain state machines for Task 7 to harden.

- [ ] **Step 1: Migrate forgot password and reopen request to the shared email schema**

For each component use:

```ts
const form = useForm<EmailRequestFormValues>({
  resolver: zodResolver(schemas.emailRequest),
  defaultValues: { email: "" },
  shouldFocusError: true,
});
```

Forgot-password submission remains generic:

```ts
const onSubmit = form.handleSubmit(async ({ email }) => {
  try {
    await forgotPassword(email, locale);
    setSubmitted(true);
  } catch (error: unknown) {
    const apiError = toAccountApiError(error);
    const mapped = mapAccountFormError(apiError, { email: "email" });
    form.setError(
      mapped.target as "email" | "root.server",
      {
        type: "server",
        message:
          mapped.target === "root.server"
            ? getErrorMessage(apiError)
            : t(mapped.messageKey),
      },
    );
  }
});
```

Apply the same structure to reopen request with `requestAccountReopen` and its
existing generic success screen.

- [ ] **Step 2: Migrate reset password to the password schema**

Use `useForm<ResetPasswordFormValues>` with `schemas.resetPassword`. Preserve the
token-presence gate and password-requirements display:

```ts
const form = useForm<ResetPasswordFormValues>({
  resolver: zodResolver(schemas.resetPassword),
  defaultValues: { password: "" },
  shouldFocusError: true,
});
const requirements = inspectPassword(form.watch("password"));

const onSubmit = form.handleSubmit(async ({ password }) => {
  if (!token) return;
  try {
    await resetPassword(token, password);
    form.reset();
    setSubmitted(true);
  } catch (error: unknown) {
    const apiError = toAccountApiError(error);
    if (apiError.code === "AUTH_TOKEN_INVALID_OR_EXPIRED") {
      setTokenError(true);
      return;
    }
    const mapped = mapAccountFormError(apiError, {
      password: "password",
      new_password: "password",
    });
    form.setError(mapped.target as "password" | "root.server", {
      type: "server",
      message:
        mapped.target === "root.server"
          ? getErrorMessage(apiError)
          : t(mapped.messageKey),
    });
  }
});
```

- [ ] **Step 3: Turn verification resend into a semantic RHF form**

Inside `VerifyEmailContent`, add a separate `useForm<EmailRequestFormValues>` and
replace the loose input/button pair with:

```tsx
<form onSubmit={resendForm.handleSubmit(handleResend)} noValidate>
  <AccountField
    id="verify-email"
    label={t("forgotPassword.emailLabel")}
    error={resendForm.formState.errors.email?.message}
  >
    <input
      id="verify-email"
      type="email"
      autoComplete="email"
      {...resendForm.register("email")}
      aria-invalid={resendForm.formState.errors.email ? true : undefined}
      aria-describedby={
        resendForm.formState.errors.email ? "verify-email-error" : undefined
      }
      className={inputBase}
    />
  </AccountField>
  <button
    type="submit"
    disabled={resendForm.formState.isSubmitting}
    className={actionClass}
  >
    {t("verifyEmail.resendSubmit")}
  </button>
</form>
```

`handleResend` receives `{ email }`, calls `resendVerification(email, locale)`,
and maps errors through `mapAccountFormError`.

- [ ] **Step 4: Run Account tests, lint, and type-check**

Run:

```bash
cd frontend && npm run test:account
cd frontend && ./node_modules/.bin/eslint src/features/public/account/components/RecoveryForms.tsx src/features/public/account/components/LifecycleForms.tsx
cd frontend && ./node_modules/.bin/tsc --noEmit
```

Expected: all commands exit 0; Enter submits verification resend; no raw field
message is rendered.

- [ ] **Step 5: Commit the recovery form migration**

```bash
git add frontend/src/features/public/account/components/RecoveryForms.tsx frontend/src/features/public/account/components/LifecycleForms.tsx
git commit -m "refactor(account): migrate recovery forms to RHF"
```

---

### Task 5: Refactor profile and preferred-locale state

**Files:**
- Modify: `frontend/src/features/public/account/components/ProfileForm.tsx`
- Modify: `frontend/src/features/public/account/hooks/useUnsavedChanges.ts`
- Modify: `frontend/src/features/public/account/accountNavigation.ts`
- Modify: `frontend/src/features/public/account/messages.test.ts`

**Interfaces:**
- Consumes: `ProfileFormValues`, `schemas.profile`, `useUpdateAccountProfile`, locale-aware `useRouter`, `buildAccountHref`, and existing Account tabs.
- Produces: RHF-owned profile/preferences state, `formState.isDirty` navigation protection, and post-save locale replacement that preserves the active tab.

- [ ] **Step 1: Add a navigation helper test for locale-preserving Account tabs**

Add to `messages.test.ts`:

```ts
import { buildAccountHref, parseAccountTab } from "./accountNavigation";

test("preferred locale navigation preserves the active account tab", () => {
  assert.equal(buildAccountHref(parseAccountTab("security")), "/account?tab=security");
  assert.equal(buildAccountHref(parseAccountTab("preferences")), "/account?tab=preferences");
});
```

- [ ] **Step 2: Replace profile field and baseline state with React Hook Form**

Initialize the form once and reset it when a different account arrives:

```ts
const form = useForm<ProfileFormValues>({
  resolver: zodResolver(schemas.profile),
  defaultValues: {
    displayName: "",
    preferredLocale: locale as AccountLocale,
  },
  shouldFocusError: true,
});

useEffect(() => {
  if (!account || account.id === initializedAccountId) return;
  form.reset({
    displayName: account.display_name,
    preferredLocale: account.preferred_locale,
  });
  setInitializedAccountId(account.id);
  setActiveTab(requestedTab);
}, [account, form, initializedAccountId, requestedTab]);

const isDirty = form.formState.isDirty;
```

Remove `displayName`, `preferredLocale`, and `baseline` state. Implement discard
with `form.reset()` and keep the current saved values as RHF defaults after a
successful mutation.

- [ ] **Step 3: Submit typed profile values and switch locale only after success**

Use one submit function for both profile and preference panels:

```ts
const saveProfile = form.handleSubmit(async (values) => {
  try {
    const updated = await updateProfile.mutateAsync({
      display_name: values.displayName,
      avatar_url: account.avatar_url,
      preferred_locale: values.preferredLocale,
    });
    form.reset({
      displayName: updated.display_name,
      preferredLocale: updated.preferred_locale,
    });
    setSaved(true);
    if (values.preferredLocale !== locale) {
      router.replace(buildAccountHref(activeTab), {
        locale: values.preferredLocale,
        scroll: false,
      });
    }
  } catch (error: unknown) {
    const apiError = toAccountApiError(error);
    const mapped = mapAccountFormError(apiError, {
      display_name: "displayName",
      locale: "preferredLocale",
      preferred_locale: "preferredLocale",
    });
    form.setError(
      mapped.target as
        | "displayName"
        | "preferredLocale"
        | "root.server",
      {
        type: "server",
        message:
          mapped.target === "root.server"
            ? getErrorMessage(apiError)
            : t(mapped.messageKey),
      },
    );
  }
});
```

Bind `displayName` and `preferredLocale` with `form.register`. Render field-level
messages near their controls and `errors.root?.server` in the existing alert.
Use `form.formState.isSubmitting` instead of the manual saving flag.

- [ ] **Step 4: Preserve dirty guards across tabs, logout, sessions, and unload**

Continue to pass `form.formState.isDirty` to `useUnsavedChanges`. Implement the
sticky actions with RHF state:

```ts
const handleDiscard = () => {
  form.reset();
  form.clearErrors();
  setSaved(false);
};

const handleTabChange = (tab: AccountTab): boolean => {
  if (tab === activeTab) return true;
  if (!confirmNavigation()) return false;
  setActiveTab(tab);
  router.replace(buildAccountHref(tab), { scroll: false });
  requestAnimationFrame(() => panelHeadingRefs[tab]?.focus());
  return true;
};
```

Do not trigger the locale change until the update mutation has returned a valid
Account response.

- [ ] **Step 5: Run Account tests, lint, and type-check**

Run:

```bash
cd frontend && npm run test:account
cd frontend && ./node_modules/.bin/eslint src/features/public/account/components/ProfileForm.tsx src/features/public/account/hooks/useUnsavedChanges.ts src/features/public/account/accountNavigation.ts
cd frontend && ./node_modules/.bin/tsc --noEmit
```

Expected: all commands exit 0 and TypeScript accepts locale-aware
`router.replace` with the active-tab href.

- [ ] **Step 6: Commit profile and locale behavior**

```bash
git add frontend/src/features/public/account/components/ProfileForm.tsx frontend/src/features/public/account/hooks/useUnsavedChanges.ts frontend/src/features/public/account/accountNavigation.ts frontend/src/features/public/account/messages.test.ts
git commit -m "refactor(account): migrate profile form to RHF"
```

---

### Task 6: Split and refactor credential and reauthentication forms

**Files:**
- Create: `frontend/src/features/public/account/components/PasswordChangeForm.tsx`
- Create: `frontend/src/features/public/account/components/EmailChangeForm.tsx`
- Modify: `frontend/src/features/public/account/components/CredentialForms.tsx`
- Modify: `frontend/src/features/public/account/components/AccountReauthModal.tsx`

**Interfaces:**
- Consumes: `PasswordChangeFormValues`, `EmailChangeFormValues`, `PasswordReauthFormValues`, form policies, `requireRecentAuth`, `changePasswordAccount`, `requestEmailChange`, and `accountKeys.current()`.
- Produces: two focused credential form components, a composition-only accordion, and an RHF password reauthentication form. Google reauthentication remains a command action.

- [ ] **Step 1: Extract PasswordChangeForm with RHF submission**

Move the existing password-change markup into the new file and use:

```ts
export interface PasswordChangeFormProps {
  requireRecentAuth: (options: {
    reason: "change_password";
  }) => Promise<ReauthResult>;
}

const form = useForm<PasswordChangeFormValues>({
  resolver: zodResolver(schemas.passwordChange),
  defaultValues: { newPassword: "" },
  shouldFocusError: true,
});

const onSubmit = form.handleSubmit(async ({ newPassword }) => {
  try {
    await requireRecentAuth({ reason: "change_password" });
    await changePasswordAccount(newPassword);
    await queryClient.invalidateQueries({ queryKey: accountKeys.current() });
    form.reset();
    setMessage(t("account.passwordChanged"));
  } catch (error: unknown) {
    if (
      error instanceof AccountReauthError &&
      error.code === "AUTH_REAUTH_CANCELLED"
    ) return;
    const apiError = toAccountApiError(error);
    const mapped = mapAccountFormError(apiError, {
      password: "newPassword",
      new_password: "newPassword",
    });
    form.setError(mapped.target as "newPassword" | "root.server", {
      type: "server",
      message:
        mapped.target === "root.server"
          ? getError(apiError)
          : t(mapped.messageKey),
    });
  }
});
```

- [ ] **Step 2: Extract EmailChangeForm with RHF submission**

Move the email form into its own file and expose:

```ts
export interface EmailChangeFormProps {
  locale: string;
  requireRecentAuth: (options: {
    reason: "change_email";
  }) => Promise<ReauthResult>;
}
```

Use `schemas.emailChange`, map backend `email` and `new_email` to `newEmail`,
and preserve the existing confirmation-sent success panel. A successful request
calls `form.reset()` but does not mutate the current Account query because the
email remains unchanged until the confirmation token is consumed.

- [ ] **Step 3: Reduce CredentialForms to accordion composition**

Keep `CredentialAccordionItem`, setup-password prompting, search-param expansion,
and accordion state in `CredentialForms.tsx`. Replace the embedded forms with:

```tsx
<PasswordChangeForm requireRecentAuth={requireRecentAuth} />
<EmailChangeForm
  locale={locale}
  requireRecentAuth={requireRecentAuth}
/>
```

The resulting file must not import `changePasswordAccount`,
`requestEmailChange`, `useQueryClient`, `PasswordInput`, or `useForm`.

- [ ] **Step 4: Refactor password reauthentication inside AccountReauthModal**

Use `useForm<PasswordReauthFormValues>` only for the password branch:

```ts
const form = useForm<PasswordReauthFormValues>({
  resolver: zodResolver(schemas.passwordReauth),
  defaultValues: { password: "" },
  shouldFocusError: true,
});

const submitPassword = form.handleSubmit(async ({ password }) => {
  await onPasswordSubmit(password);
  form.reset();
});
```

Bind the `PasswordInput` with `Controller` because it forwards an input ref:

```tsx
<Controller
  name="password"
  control={form.control}
  render={({ field, fieldState }) => (
    <PasswordInput
      {...field}
      ref={(element) => {
        field.ref(element);
        passwordInputRef.current = element;
      }}
      id={`account-reauth-password-${locale}`}
      autoComplete="current-password"
      aria-invalid={fieldState.invalid || undefined}
      aria-describedby={fieldState.error ? "account-reauth-password-error" : undefined}
      disabled={busy}
    />
  )}
/>
```

Render the localized field message with `role="alert"`. Keep Google-only modal
behavior, popup focus, cancellation, and provider orchestration unchanged.

- [ ] **Step 5: Run Account tests, lint, and type-check**

Run:

```bash
cd frontend && npm run test:account
cd frontend && ./node_modules/.bin/eslint src/features/public/account/components/CredentialForms.tsx src/features/public/account/components/PasswordChangeForm.tsx src/features/public/account/components/EmailChangeForm.tsx src/features/public/account/components/AccountReauthModal.tsx
cd frontend && ./node_modules/.bin/tsc --noEmit
```

Expected: all commands exit 0; `CredentialForms.tsx` is composition-focused;
Google-only reauthentication still compiles without form fields.

- [ ] **Step 6: Commit credential form extraction**

```bash
git add frontend/src/features/public/account/components/CredentialForms.tsx frontend/src/features/public/account/components/PasswordChangeForm.tsx frontend/src/features/public/account/components/EmailChangeForm.tsx frontend/src/features/public/account/components/AccountReauthModal.tsx
git commit -m "refactor(account): migrate credential forms to RHF"
```

---

### Task 7: Harden terminal sessions and automatic token actions

**Files:**
- Create: `frontend/src/features/public/account/hooks/useRetryCountdown.ts`
- Modify: `frontend/src/features/public/account/AccountSessionProvider.tsx`
- Modify: `frontend/src/features/public/account/components/ProfileForm.tsx`
- Modify: `frontend/src/features/public/account/components/SessionList.tsx`
- Modify: `frontend/src/features/public/account/components/RecoveryForms.tsx`
- Modify: `frontend/src/features/public/account/components/LifecycleForms.tsx`
- Modify: `frontend/src/features/public/account/components/LinkAccount.tsx`
- Modify: `frontend/src/messages/th.json`
- Modify: `frontend/src/messages/en.json`
- Modify: `frontend/src/messages/de.json`
- Modify: `frontend/src/features/public/account/messages.test.ts`

**Interfaces:**
- Consumes: `classifyAccountSessionError`, `classifyAccountActionError`, `toAccountApiError`, query keys, and localized Account messages.
- Produces: deterministic anonymous transition with `sessionEndReason`, recoverable token-action states, and complete localized UI copy.

- [ ] **Step 1: Extend the session context contract**

Add to `AccountSessionValue`:

```ts
sessionEndReason: AccountSessionEndReason | null;
```

Inside the provider:

```ts
const [sessionEndReason, setSessionEndReason] =
  useState<AccountSessionEndReason | null>(null);

const clearLocalSession = useCallback(
  (reason: AccountSessionEndReason | null = null) => {
    setMemoryAccessToken(null);
    setStatus("anonymous");
    setSessionEndReason(reason);
    queryClient.removeQueries({ queryKey: accountKeys.current() });
    queryClient.removeQueries({ queryKey: accountKeys.sessions() });
    queryClient.removeQueries({ queryKey: accountKeys.googleLink() });
  },
  [queryClient],
);
```

Keep logout and close-account cleanup silent by calling `clearLocalSession(null)`.
Clear notices when login or session adoption succeeds.

- [ ] **Step 2: Observe authenticated account-query terminal errors**

Normalize the query error and clear only terminal sessions:

```ts
useEffect(() => {
  if (status !== "authenticated" || !accountQuery.error) return;
  const reason = classifyAccountSessionError(
    toAccountApiError(accountQuery.error),
  );
  if (reason) clearLocalSession(reason);
}, [accountQuery.error, clearLocalSession, status]);
```

Do not clear session state for network, 429, or HTTP 5xx errors. Those remain in
the existing retry/load-error surface.

- [ ] **Step 3: Render localized session-end notices**

In anonymous states of `ProfileForm` and `SessionList`, show a status message
before sign-in actions when `sessionEndReason` is present:

```tsx
{sessionEndReason ? (
  <AccountFeedback
    state={{
      kind: "error",
      message: t(
        sessionEndReason === "disabled"
          ? "account.sessionDisabled"
          : "account.sessionExpired",
      ),
    }}
  />
) : null}
```

Add non-empty `account.sessionExpired` and `account.sessionDisabled` keys to all
three public message files.

- [ ] **Step 4: Give each token action explicit failure state**

Use this state shape in verify-email, email-change confirmation, reopen
confirmation, and Google-link confirmation:

```ts
type ActionState =
  | { kind: "loading" }
  | { kind: "success" }
  | { kind: "invalid" }
  | { kind: "rate_limited"; retryAfterSeconds: number }
  | { kind: "transient" };
```

Normalize failures before classification:

```ts
try {
  await executeTokenAction(token);
  setState({ kind: "success" });
} catch (error: unknown) {
  setState(
    classifyAccountActionError(toAccountApiError(error), Boolean(token)),
  );
}
```

Create `hooks/useRetryCountdown.ts` so every action flow enables retry at the
same time:

```ts
"use client";

import { useEffect, useState } from "react";

export function useRetryCountdown(initialSeconds: number): number {
  const [remaining, setRemaining] = useState(initialSeconds);

  useEffect(() => {
    setRemaining(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = window.setTimeout(() => {
      setRemaining((current) => Math.max(0, current - 1));
    }, 1_000);
    return () => window.clearTimeout(timer);
  }, [remaining]);

  return remaining;
}
```

Extract each request into a stable `executeAction` callback. The guarded initial
effect calls it once, and the retry button calls it directly:

```ts
const executeAction = useCallback(async () => {
  setState({ kind: "loading" });
  try {
    await executeTokenAction(token);
    setState({ kind: "success" });
  } catch (error: unknown) {
    setState(
      classifyAccountActionError(toAccountApiError(error), Boolean(token)),
    );
  }
}, [token]);

useEffect(() => {
  if (ranRef.current) return;
  ranRef.current = true;
  void executeAction();
}, [executeAction]);
```

For rate limits, derive `remaining` with `useRetryCountdown`, render it in the
localized `{seconds}` copy, and disable the retry button until it reaches zero:

```tsx
const remaining = useRetryCountdown(
  state.kind === "rate_limited" ? state.retryAfterSeconds : 0,
);

<button
  type="button"
  onClick={() => void executeAction()}
  disabled={remaining > 0}
>
  {t("account.actionRetry")}
</button>
```

For `transient`, the same retry button is enabled immediately. For `invalid`,
keep the existing replacement-token or sign-in route.

- [ ] **Step 5: Add and verify localized action messages**

Add these keys with equivalent intent to `th`, `en`, and `de`:

```json
{
  "actionTransient": "We could not complete this action. Try again.",
  "actionRateLimited": "Please wait {seconds} seconds before trying again.",
  "actionRetry": "Try again",
  "sessionExpired": "Your session ended. Sign in again to continue.",
  "sessionDisabled": "This account is no longer allowed to continue this session."
}
```

Place them under `Account.account` and translate them rather than copying the
English values into Thai or German.

- [ ] **Step 6: Run policies, messages, Account tests, lint, and type-check**

Run:

```bash
cd frontend && npm run test:account
cd frontend && ./node_modules/.bin/eslint src/features/public/account/AccountSessionProvider.tsx src/features/public/account/components/ProfileForm.tsx src/features/public/account/components/SessionList.tsx src/features/public/account/components/RecoveryForms.tsx src/features/public/account/components/LifecycleForms.tsx src/features/public/account/components/LinkAccount.tsx
cd frontend && ./node_modules/.bin/tsc --noEmit
```

Expected: all commands exit 0; message parity and non-empty checks pass.

- [ ] **Step 7: Commit session and action hardening**

```bash
git add frontend/src/features/public/account/hooks/useRetryCountdown.ts frontend/src/features/public/account/AccountSessionProvider.tsx frontend/src/features/public/account/components/ProfileForm.tsx frontend/src/features/public/account/components/SessionList.tsx frontend/src/features/public/account/components/RecoveryForms.tsx frontend/src/features/public/account/components/LifecycleForms.tsx frontend/src/features/public/account/components/LinkAccount.tsx frontend/src/messages/th.json frontend/src/messages/en.json frontend/src/messages/de.json frontend/src/features/public/account/messages.test.ts
git commit -m "fix(account): harden session and token failures"
```

---

### Task 8: Add privacy metadata, Berlin time semantics, acceptance documentation, and full verification

**Files:**
- Modify: `frontend/src/app/[locale]/(client)/account/layout.tsx`
- Modify: `frontend/src/features/public/account/components/SessionCard.tsx`
- Modify: `frontend/src/features/public/account/components/ProfileForm.tsx`
- Create: `frontend/src/features/public/account/accountMetadata.test.ts`
- Modify: `docs/AUTH_TESTING.md`

**Interfaces:**
- Consumes: the completed Account forms and policies from Tasks 1–7.
- Produces: Account-wide noindex metadata, Berlin date formatting, documented acceptance cases, and complete verification evidence.

- [ ] **Step 1: Write a failing metadata regression test**

Create `accountMetadata.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

test("account layout declares noindex and nofollow", () => {
  const path = fileURLToPath(
    new URL("../../../app/[locale]/(client)/account/layout.tsx", import.meta.url),
  );
  const source = readFileSync(path, "utf8");
  assert.match(source, /robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/s);
});
```

- [ ] **Step 2: Run the metadata test and confirm failure**

Run:

```bash
cd frontend && ./node_modules/.bin/tsx --test src/features/public/account/accountMetadata.test.ts
```

Expected: FAIL because the Account layout has no robots metadata.

- [ ] **Step 3: Add Account-wide privacy metadata**

Modify the layout:

```ts
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (process.env.NEXT_PUBLIC_PUBLIC_ACCOUNT_AUTH_ENABLED !== "true") notFound();
  return children;
}
```

Run the metadata test again; expected PASS.

- [ ] **Step 4: Set Europe/Berlin explicitly for Account dates**

In `SessionCard.tsx`:

```ts
return new Intl.DateTimeFormat(locale, {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Berlin",
}).format(date);
```

In both account-purge date formatters in `ProfileForm.tsx`:

```ts
new Intl.DateTimeFormat(locale, {
  dateStyle: "long",
  timeZone: "Europe/Berlin",
}).format(new Date(purgeAfter));
```

- [ ] **Step 5: Update the Account acceptance guide**

Add concrete checks to `docs/AUTH_TESTING.md`:

```markdown
### Account client hardening

1. Sign in, delete or invalidate the refresh cookie, wait for the access token
   to expire, and reload Account data. Expect anonymous state with a localized
   session-ended notice, not a permanent account-load error.
2. Exercise verify-email, reopen, email-change, and Google-link confirmation
   with HTTP 500 and offline responses. Expect retryable transient copy; do not
   expect invalid-token copy.
3. Exercise HTTP 429 with `retry_after_seconds`. Expect localized cooldown copy
   and a retry action after the delay.
4. Save `preferred_locale=de` from `/en/account?tab=preferences`. Expect
   `/de/account?tab=preferences` only after the profile request succeeds.
5. Enter an 80-code-point Thai or emoji display name. Expect client and backend
   acceptance; expect 81 code points to fail in the localized field message.
6. Submit verification resend with Enter and verify focus moves to the email
   field after invalid input.
7. Inspect Account page metadata and expect `noindex, nofollow` on every Account
   route, including token-bearing routes.
8. View session activity and account purge dates from a non-Berlin system time
   zone and confirm Europe/Berlin output.
```

Also correct the existing password-flow entry route from `/en/register` to
`/en/account/register` so the guide matches the registered frontend route.

- [ ] **Step 6: Run complete frontend verification with Account enabled**

Run:

```bash
cd frontend && npm run test:account
cd frontend && npm run lint
cd frontend && ./node_modules/.bin/tsc --noEmit
cd frontend && NEXT_PUBLIC_API_URL=https://api.example.test NEXT_PUBLIC_PUBLIC_ACCOUNT_AUTH_ENABLED=true npm run build -- --webpack
```

Expected: Account tests, lint, type-check, and production build all exit 0. The
build route list includes every `/[locale]/account/*` route.

- [ ] **Step 7: Run complete backend verification**

Run:

```bash
cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./... -p 1
cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go vet ./...
cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go build -o /private/tmp/wat-profile-server ./cmd/app
```

Expected: tests, vet, and build all exit 0. The verification binary is written
outside the repository and cannot be committed accidentally.

- [ ] **Step 8: Perform browser acceptance**

Start both applications with the documented test environment and complete the
new `Account client hardening` checklist plus these existing checks:

```text
- th/en/de password lifecycle
- mocked Google reauthentication; live OAuth when configured
- keyboard-only completion and visible focus
- unsaved-change protection for tabs, logout, and navigation
- 375px mobile and desktop layouts without horizontal overflow
- refresh cookie remains HttpOnly/SameSite=Lax and access token remains memory-only
```

Expected: every available item passes. If live Google OAuth is unavailable,
record only that item as environment-blocked and retain the mocked-flow result.

- [ ] **Step 9: Inspect the final diff**

Run:

```bash
git diff --check
git status --short
git diff --stat
```

Expected: no whitespace errors; no `.env`, `.next`, `node_modules`, binary,
cache, log, generated graph, or unrelated user file is staged.

- [ ] **Step 10: Commit privacy, time, and acceptance updates**

```bash
git add frontend/src/app/[locale]/\(client\)/account/layout.tsx frontend/src/features/public/account/components/SessionCard.tsx frontend/src/features/public/account/components/ProfileForm.tsx frontend/src/features/public/account/accountMetadata.test.ts docs/AUTH_TESTING.md
git commit -m "fix(account): complete client acceptance hardening"
```

## Final Review Checklist

- [ ] Every in-scope data-entry form imports `useForm` or `Controller` and uses a schema from `formSchemas.ts`.
- [ ] Automatic token actions, Google commands, avatar crop/upload, and destructive confirmations remain outside RHF.
- [ ] `rg -n 'fieldError\.message|fe\.message|candidate\.message' frontend/src/features/public/account/components` returns no public rendering path.
- [ ] Terminal session failures clear token and Account queries; transient failures preserve the session and expose retry.
- [ ] Preferred locale changes the route only after successful profile persistence and retains the active tab.
- [ ] Frontend and backend both accept 80 and reject 81 Unicode code points.
- [ ] Account metadata is noindex/nofollow and dates use Europe/Berlin.
- [ ] Thai, English, and German message trees match and contain no empty strings.
- [ ] All verification commands and available browser acceptance checks pass.
