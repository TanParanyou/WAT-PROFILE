# Account Client Full Form Refactor Design

**Date:** 2026-08-08

**Status:** Approved design, pending written-spec review

## Objective

Refactor the public Account data-entry forms to React Hook Form and Zod, then
harden the surrounding session, action-token, localization, privacy, and time
handling so the complete account lifecycle behaves consistently in Thai,
English, and German.

The work covers the frontend account client and the minimum backend contract
changes needed to make client validation truthful. It preserves the existing
routes, HTTP payloads, visual layout, authentication boundaries, and feature
flags.

## Scope

### Forms moved to React Hook Form and Zod

- Login
- Registration
- Forgot password
- Verification-email resend
- Reset password
- Account reopen request
- Profile and preferred-language preferences
- Password change
- Email change
- Password reauthentication in the shared reauthentication modal

These surfaces accept user-entered values and own validation, field errors,
submission state, or dirty-state behavior. React Hook Form becomes the owner of
their form state, with Zod as the client validation boundary.

### Surfaces kept as state machines or command UI

- Verify-email token consumption
- Confirm-email-change token consumption
- Account-reopen token consumption
- Google-link token consumption
- Google start, connect, disconnect, and redirect actions
- Avatar selection, crop, processing, and upload
- Session revocation, logout-all, logout, and account-closure confirmations

These surfaces do not benefit from form state because they either execute an
automatic token action or confirm a command. They retain focused state-machine
or mutation state instead of being forced into React Hook Form.

### Explicitly out of scope

- Redesigning Account page layout or visual tokens
- Changing Account endpoint paths or payload shapes
- Replacing TanStack Query or the in-memory access-token model
- Adding a component-testing framework or new runtime dependency
- Refactoring Admin authentication or Admin Account Operations
- Changing database schema or migrations

## Architecture

### Form schemas

Create `frontend/src/features/public/account/formSchemas.ts` as the owner of
form-input schemas and inferred form value types. Schema factories accept the
localized validation messages required by Zod, keeping schema output localized
without coupling the module to React hooks.

The schemas normalize values only where the HTTP contract already does so:

- Emails are trimmed and lowercased.
- Display names are trimmed and measured as Unicode code points.
- Passwords are never trimmed or normalized.
- Locales are restricted to `th`, `en`, and `de`.

Runtime response schemas remain in `schema.ts`; request-form schemas do not get
mixed into the response-contract file.

### Form error adapter

Create `frontend/src/features/public/account/formErrors.ts` to translate an
`AccountApiError` into React Hook Form errors. The adapter maps stable backend
error codes and allow-listed field names to client message keys. It never
renders `fieldError.message` directly because backend validation messages are
English operational text, not localized UI copy.

Unknown fields and non-field errors map to `root.server`. Rate-limited errors
preserve `retryAfterSeconds` for localized retry guidance. Components retain
their submitted values after server, network, or rate-limit errors.

### Action-error policy

Create `frontend/src/features/public/account/actionErrors.ts` for automatic
token flows. The policy classifies failures as:

- `invalid`: only `AUTH_TOKEN_INVALID_OR_EXPIRED` or a missing token
- `rate_limited`: `AUTH_RATE_LIMITED`, including retry delay when available
- `transient`: network failures, timeouts, `AUTH_INTERNAL`, unknown failures,
  and HTTP 5xx responses

Invalid actions offer the correct replacement-token flow. Transient and
rate-limited actions keep a retry action and must not tell users that the token
is invalid.

### Session policy

Create `frontend/src/features/public/account/sessionPolicy.ts` to classify
terminal account-session failures. When an authenticated account read cannot
refresh because the session is invalid, expired, reused, revoked, or disabled,
`AccountSessionProvider` must:

1. clear the in-memory access token;
2. remove account, session, and Google-link queries;
3. transition to `anonymous`;
4. expose a localized session-end reason for the Account access state.

Network and server failures remain recoverable account-query errors and do not
destroy an otherwise valid local session.

### Component responsibilities

Each refactored form component owns only:

- localized schema construction;
- `useForm` setup with `zodResolver`;
- submission orchestration through the existing API or query boundary;
- success-state rendering;
- focus and navigation appropriate to that flow.

RHF `formState.isSubmitting` replaces duplicated busy flags.
`formState.errors` replaces ad-hoc field-error objects. Profile dirty state uses
`formState.isDirty`, while the existing unsaved-change guard remains the
navigation boundary.

Large components may be split only along existing responsibilities. In
particular, `CredentialForms.tsx` may keep its accordion composition while its
password and email forms move into focused components. This work must not cause
unrelated layout refactoring.

## Behavior

### Submission flow

Every data-entry form follows the same sequence:

1. Zod normalizes and validates input.
2. React Hook Form focuses the first invalid field.
3. The component submits a typed payload through `api.ts` or an existing query
   mutation.
4. The error adapter maps backend errors to fields or `root.server`.
5. Success resets only fields that should no longer remain dirty.
6. TanStack Query is updated or invalidated by the owning mutation boundary.

### Preferred language

Saving `preferred_locale` first persists the profile. If the selected locale
differs from the current URL locale, the client then replaces the current
Account route with the selected locale while preserving the active Account tab.
The locale change must not occur when the profile mutation fails.

This makes the existing copy truthful: the account menus and settings switch to
the selected language immediately, while the public site's content choice
remains controlled by its locale-prefixed URL.

### Unicode display names

The client and backend both define the display-name limit as 2–80 Unicode code
points after trimming. The backend replaces byte-length validation with
`utf8.RuneCountInString`. Thai names, German diacritics, and emoji therefore
receive the same result at both boundaries.

No database change is required because the persisted field already supports
the relevant text.

### Token actions

Verify email, confirm email change, confirm reopen, and confirm Google link keep
automatic execution guarded against React development double effects. Each flow
shows distinct loading, success, invalid, rate-limited, and transient states.
Retry is available only when repeating the same request is safe.

### Verification-email resend

The resend surface becomes a semantic `<form>` with localized email validation,
Enter-key submission, `aria-invalid`, an associated error message, and focus on
the email field after failure.

### Privacy and dates

The Account route layout defines `robots: { index: false, follow: false }`, which
covers authenticated pages, authentication pages, and token-bearing action
pages regardless of child metadata.

All visitor-facing Account dates and times explicitly use `Europe/Berlin`.
This applies to session activity and account-purge dates.

## Localization

All new UI copy and validation messages are added to the `Account` namespace in
`th.json`, `en.json`, and `de.json`. Message parity tests verify equal key trees
and reject empty strings.

Backend messages remain useful for logs and non-UI clients but are not rendered
as public Account field copy. The frontend trusts stable error codes and field
names, falling back to a localized generic error for unknown values.

## Testing Strategy

### Frontend automated tests

- Schema tests cover valid inputs, required values, email normalization,
  password policy, and Unicode display-name boundaries.
- Form-error tests cover allow-listed field mapping, localized fallbacks,
  unknown fields, rate limits, and the absence of raw backend messages.
- Action-error tests cover invalid, rate-limited, transient, and retryable
  outcomes.
- Session-policy tests cover expired/revoked sessions versus recoverable
  network and server errors.
- API tests continue to verify single-flight refresh, token clearing, and the
  rule that mutations are never automatically replayed.
- Message tests verify matching, non-empty Account trees in all three locales.
- Metadata inspection verifies that Account routes inherit `noindex` and
  `nofollow`.

The existing `npm run test:account` command remains the Account aggregate test
entry point. No new test framework is introduced.

### Backend automated tests

Registration and profile-service tests cover:

- 2- and 80-code-point boundaries;
- Thai display names;
- German diacritics;
- emoji;
- rejection above 80 code points.

Existing password, session, handler, middleware, and Google tests remain part of
the full backend verification pass.

### Browser acceptance

- Complete the password lifecycle in Thai, English, and German.
- Expire or revoke a session while the Account page is open and verify the
  anonymous transition and localized notice.
- Exercise offline, HTTP 500, and HTTP 429 outcomes for token flows.
- Change preferred locale and verify that the URL locale changes without losing
  the active Account tab.
- Submit forms using only the keyboard, including Enter on resend verification;
  verify error focus and visible focus indicators.
- Verify the unsaved-change guard for tabs, logout, and page navigation.
- Check Account pages at 375px and desktop widths.
- Run the mocked Google reauthentication flow; run live Google OAuth acceptance
  when the configured environment is available.

## Delivery Sequence

1. Add form schemas, form-error mapping, action-error policy, and session policy
   with failing tests.
2. Align backend display-name validation with Unicode code-point semantics.
3. Refactor login, registration, and recovery data-entry forms.
4. Refactor profile, preferences, password change, and email change.
5. Refactor password reauthentication in the shared modal.
6. Harden automatic action-token flows and terminal session handling.
7. Add Account-wide privacy metadata, Berlin time semantics, resend-form
   accessibility, and localized copy.
8. Run full frontend/backend verification and update `docs/AUTH_TESTING.md` with
   the new acceptance cases.

Each delivery unit must be independently testable and reviewable. The
implementation plan will define test-first steps and a focused commit for every
unit.

## Definition of Done

- All in-scope data-entry forms use React Hook Form with Zod validation.
- No Account component renders a raw backend field-error message.
- Expired, revoked, and disabled sessions leave authenticated UI state
  deterministically.
- Token flows distinguish invalid, rate-limited, and transient failures.
- Preferred locale changes the Account route locale after a successful save.
- Display-name validation agrees across client and backend for Unicode input.
- Every Account route is `noindex, nofollow`.
- Account dates and times use `Europe/Berlin`.
- Thai, English, and German Account messages are complete and non-empty.
- Account tests, frontend lint/type-check/build, backend test/vet/build, and the
  documented browser acceptance pass succeed.
- No unrelated source changes, secrets, generated artifacts, or dependencies
  are included.
