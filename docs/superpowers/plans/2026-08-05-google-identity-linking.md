# Google Identity Linking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task with review checkpoints.

**Goal:** Let an existing email/password public account connect and later disconnect the same verified Google identity through an approval-based, localized flow.

**Architecture:** Add a dedicated authenticated Google-link OAuth start flow. Bind the OAuth state to the current public account, reuse the existing single-use email approval token, and keep anonymous Google login/register behavior unchanged. Add a focused frontend hook/component backed by typed API functions and TanStack Query so status, cooldown, reauthentication, redirect cancellation, and unlinking are explicit states.

**Tech Stack:** Go 1.24, Fiber v2, GORM, PostgreSQL migrations, JWT access tokens with HttpOnly refresh cookies, Next.js 16 App Router, React 19, TypeScript strict mode, Zod, Axios, TanStack Query, next-intl, Node `node:test` via `tsx`.

## Global Constraints

- Preserve `th`, `en`, and `de` variants of every changed public message.
- Keep HTTP contracts typed on both sides and update `backend/docs/openapi.yaml` with every route or payload change.
- Do not use TypeScript `any`, `as any`, or `@ts-ignore`.
- Bind authenticated link OAuth state to the current account; never infer the target solely from Google email.
- Do not silently link a Google identity; the existing account email must approve through the single-use email link.
- Keep access tokens in module memory and refresh tokens in the server-managed HttpOnly cookie.
- Use `apply_patch` for source edits and preserve unrelated working-tree changes.
- Do not alter the existing anonymous `/accounts/google/start` behavior for login/register.
- Use public square controls, 44px targets, visible focus, text-based error states, and no raw colors in public TSX.
- Run backend commands with `GOCACHE=/private/tmp/wat-profile-go-cache` when the default Go cache is unavailable.

---

## File Map

### Backend

- Create `backend/migrations/000027_add_google_link_target.up.sql` and its down migration for the nullable OAuth-flow target account.
- Modify `backend/internal/models/account_auth.go` to persist the target account on link OAuth flows.
- Modify `backend/internal/accountauth/contracts.go` with stable Google-link error codes.
- Modify `backend/internal/services/account_google_service.go` for authenticated link start, status, target binding, email matching, identity-conflict handling, and cooldown.
- Modify `backend/internal/services/account_profile_service.go` for guarded Google unlinking.
- Modify `backend/internal/services/account_google_service_test.go` and `backend/internal/services/account_profile_service_test.go` with service coverage.
- Modify `backend/internal/handlers/account_auth_handler.go` to expose link start/status/unlink and map retry hints.
- Modify `backend/internal/handlers/account_auth_handler_test.go` with protected-route and response-envelope coverage.
- Modify `backend/docs/openapi.yaml` for all new routes, schemas, errors, and retry fields.

### Frontend

- Modify `frontend/src/features/public/account/types.ts` with Google-link error codes and status types.
- Modify `frontend/src/features/public/account/schema.ts` with strict status and retry-envelope schemas.
- Modify `frontend/src/features/public/account/api.ts` with start/status/unlink functions.
- Modify `frontend/src/features/public/account/api.test.ts` with typed contract tests.
- Modify `frontend/src/features/public/account/queries.ts` with the Google-link status query and invalidation helper.
- Modify `frontend/src/features/public/account/AccountSessionProvider.tsx` with a method that adopts a confirmed session in the current tab.
- Create `frontend/src/features/public/account/hooks/useGoogleAccountLink.ts` for redirect, cooldown, reauthentication retry, status refresh, and unlink state.
- Create `frontend/src/features/public/account/components/AccountProviderMethods.tsx` for connect/pending/connected/unlink UI.
- Modify `frontend/src/features/public/account/components/ProfileForm.tsx` to render provider methods in the Security tab.
- Modify `frontend/src/features/public/account/components/LinkAccount.tsx` to adopt the session and replace the route after confirmation.
- Modify `frontend/src/messages/th.json`, `frontend/src/messages/en.json`, and `frontend/src/messages/de.json` with matching provider-link copy and error translations.
- Modify `frontend/src/features/public/account/messages.test.ts` for locale-tree parity.

---

## Task 1: Add the link-flow persistence and stable domain codes

**Files:**

- Create: `backend/migrations/000027_add_google_link_target.up.sql`
- Create: `backend/migrations/000027_add_google_link_target.down.sql`
- Modify: `backend/internal/models/account_auth.go`
- Modify: `backend/internal/accountauth/contracts.go`

**Interfaces:**

- Produces `models.AuthOAuthFlow.LinkUserID *uuid.UUID`, `googleFlowData.LinkUserID uuid.UUID`, and the following codes:

```go
CodeGoogleEmailMismatch  Code = "AUTH_GOOGLE_EMAIL_MISMATCH"
CodeGoogleIdentityInUse  Code = "AUTH_GOOGLE_IDENTITY_IN_USE"
CodeGoogleAlreadyLinked  Code = "AUTH_GOOGLE_ALREADY_LINKED"
CodeGoogleLinkPending    Code = "AUTH_GOOGLE_LINK_PENDING"
```

- Existing anonymous flows use the zero UUID/nil database value. Authenticated link flows use the current public account UUID.

- [ ] **Step 1: Write the migration files**

`000027_add_google_link_target.up.sql` must add a nullable indexed foreign key:

```sql
ALTER TABLE auth_oauth_flows
  ADD COLUMN link_user_id uuid REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX auth_oauth_flows_link_user_id_idx
  ON auth_oauth_flows(link_user_id);
```

`000027_add_google_link_target.down.sql` must reverse those exact objects:

```sql
DROP INDEX IF EXISTS auth_oauth_flows_link_user_id_idx;
ALTER TABLE auth_oauth_flows DROP COLUMN IF EXISTS link_user_id;
```

- [ ] **Step 2: Extend the persistence model and flow store mapping**

Add this field to `AuthOAuthFlow`:

```go
LinkUserID *uuid.UUID `gorm:"type:uuid;index" json:"-"`
```

Update the PostgreSQL flow store `Put`/`Take` mapping in `account_google_service.go` in Task 2 so nil/zero values remain compatible with anonymous flows.

- [ ] **Step 3: Add stable error codes**

Add the four codes to `accountauth/contracts.go` without changing existing code values. Keep `RetryAfter time.Duration` on `accountauth.Error`; it will carry the pending cooldown in Task 2.

- [ ] **Step 4: Verify the migration and package compile**

Run:

```bash
cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/accountauth ./internal/models
```

Expected: PASS. Do not run migration commands against a developer database in this task; the reversible SQL is reviewed in Task 7.

---

## Task 2: Implement authenticated Google-link service behavior

**Files:**

- Modify: `backend/internal/services/account_google_service.go`
- Modify: `backend/internal/services/account_google_service_test.go`

**Interfaces:**

- Produce these service methods and result type:

```go
type GoogleLinkStatus struct {
    Connected  bool
    Pending    bool
    RetryAfter time.Duration
}

func (s *AccountGoogleService) StartGoogleLink(
    ctx context.Context,
    userID uuid.UUID,
    authTime time.Time,
    locale string,
    returnTo string,
) (GoogleStartResult, error)

func (s *AccountGoogleService) GoogleLinkStatus(
    ctx context.Context,
    userID uuid.UUID,
) (GoogleLinkStatus, error)
```

- `CompleteGoogle` consumes `googleFlowData.LinkUserID` when present. Anonymous behavior remains the existing branch.
- [ ] **Step 1: Add failing service tests for link start and status**

Add tests in `account_google_service_test.go` for:

```go
func TestStartGoogleLinkRejectsStaleAuthentication(t *testing.T)
func TestStartGoogleLinkRejectsAlreadyLinkedAccount(t *testing.T)
func TestStartGoogleLinkRejectsPendingCooldown(t *testing.T)
func TestGoogleLinkStatusReportsConnectedAndPending(t *testing.T)
```

Use the existing fixture/database helpers and fake clock. Assert `CodeReauthRequired`, `CodeGoogleAlreadyLinked`, and `CodeGoogleLinkPending` respectively; for pending, assert `RetryAfter` is positive and no second OAuth flow is stored.

- [ ] **Step 2: Add target-account flow state mapping**

Extend `googleFlowData` with `LinkUserID uuid.UUID`. In PostgreSQL `Put`, write a pointer only when the UUID is not `uuid.Nil`; in `Take`, map nullable `row.LinkUserID` back to zero when absent. Keep `memoryGoogleFlowStore` as a plain struct map so tests cover both flow types.

- [ ] **Step 3: Implement `GoogleLinkStatus`**

Query the current user’s `auth_identities` for `provider = 'google'`. Query the unconsumed, unexpired `link_identity` action token for the same user. Return:

```go
GoogleLinkStatus{
    Connected:  googleIdentityFound,
    Pending:    pendingTokenFound,
    RetryAfter: maxDuration(0, token.CreatedAt.Add(60*time.Second).Sub(now)),
}
```

If there is no pending token, return zero `RetryAfter`. Do not expose token payloads or timestamps to the client.

- [ ] **Step 4: Implement `StartGoogleLink`**

Validate, in order:

1. `authTime` is not older than ten minutes; otherwise return `CodeReauthRequired`.
2. The account has no Google identity; otherwise return `CodeGoogleAlreadyLinked`.
3. There is no pending action token within the 60-second resend window; otherwise return `CodeGoogleLinkPending` with `RetryAfter`.
4. `returnTo` passes the existing `validateReturnTo` helper.

Create the same opaque state, nonce, verifier, PKCE challenge, signed flow cookie, and authorization URL as `StartGoogle`, but persist `LinkUserID: userID`.

- [ ] **Step 5: Add link-specific callback completion**

At the start of `CompleteGoogle`, after Google identity verification and before the anonymous identity lookup branch, handle a non-zero `flow.LinkUserID`:

```go
if flow.LinkUserID != uuid.Nil {
    return s.completeAuthenticatedGoogleLink(ctx, flow, identity, client, now)
}
```

`completeAuthenticatedGoogleLink` must:

- Load the target user and reject disabled/closed accounts with the existing account-status code.
- Compare `accountauth.NormalizeEmail(identity.Email)` to the target user’s normalized email; mismatch returns `CodeGoogleEmailMismatch`.
- Query `(provider = 'google', provider_subject = identity.Subject)`; a different `UserID` returns `CodeGoogleIdentityInUse`; the same user returns `CodeGoogleAlreadyLinked`.
- Invalidate the target user’s existing unconsumed `link_identity` tokens, create one new token with the Google subject/email/display/avatar payload, and send the existing localized link-approval email.
- Return `GoogleCompletionApprovalSent` without a session or refresh cookie.

- [ ] **Step 6: Run the service tests**

Run:

```bash
cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/services -run 'Google(Link|Existing)' -count=1
```

Expected: all targeted Google-link tests pass, including existing anonymous Google tests.

---

## Task 3: Add guarded unlink behavior to the profile service

**Files:**

- Modify: `backend/internal/services/account_profile_service.go`
- Modify: `backend/internal/services/account_profile_service_test.go`

**Interfaces:**

```go
func (s *AccountProfileService) UnlinkGoogle(
    ctx context.Context,
    userID uuid.UUID,
    authTime time.Time,
    password string,
) error
```

- [ ] **Step 1: Write failing unlink tests**

Add tests:

```go
func TestUnlinkGoogleRequiresRecentAuthentication(t *testing.T)
func TestUnlinkGoogleRequiresPasswordIdentity(t *testing.T)
func TestUnlinkGoogleRejectsIncorrectPassword(t *testing.T)
func TestUnlinkGoogleRemovesOnlyGoogleIdentity(t *testing.T)
```

Assert that stale auth returns `CodeReauthRequired`, a Google-only user is not modified, an incorrect password returns `CodeInvalidCredentials`, and a password+Google user retains the password identity while deleting only the Google row.

- [ ] **Step 2: Implement the guarded transaction**

Inside one transaction:

1. Reject `now.Sub(authTime) > maxReauthAge`.
2. Load the password identity and verify it exists with a non-nil `CredentialHash`.
3. Verify the supplied password with `checkPasswordAgainst`.
4. Delete the user’s Google identity; if it is already absent, treat the operation as idempotent success.
5. Record a `google_unlink` security event after the transaction succeeds.

Never delete the password identity and never revoke unrelated sessions in this method.

- [ ] **Step 3: Run profile-service tests**

Run:

```bash
cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/services -run UnlinkGoogle -count=1
```

Expected: all four tests pass.

---

## Task 4: Expose protected link/status/unlink HTTP contracts

**Files:**

- Modify: `backend/internal/handlers/account_auth_handler.go`
- Modify: `backend/internal/handlers/account_auth_handler_test.go`
- Modify: `backend/docs/openapi.yaml`

**Interfaces:**

- `GET /api/v1/accounts/google/link/start` with `Origin` guard and `PublicAccountRequired`.
- `GET /api/v1/accounts/google/link/status` with `PublicAccountRequired`.
- `DELETE /api/v1/account/providers/google` with `PublicAccountRequired`; JSON body `{ "password": string }`.

Success envelopes:

```json
{"success":true,"data":{"authorization_url":"https://accounts.google.com/..."}}
{"success":true,"data":{"connected":false,"pending":true,"retry_after_seconds":42}}
{"success":true,"message":"Google identity disconnected"}
```

- [ ] **Step 1: Write failing handler tests**

Extend the existing handler app fixture with tests for:

```go
func TestAccountGoogleLinkStartRequiresPublicAccount(t *testing.T)
func TestAccountGoogleLinkStatusReturnsTypedData(t *testing.T)
func TestAccountGoogleLinkStartSetsFlowCookie(t *testing.T)
func TestAccountGoogleUnlinkRejectsStaleAuth(t *testing.T)
```

Assert missing/invalid bearer access is `401`, stale auth is `403` with `AUTH_REAUTH_REQUIRED`, the start response contains an authorization URL and `wat_google_flow` cookie, and status includes integer `retry_after_seconds`.

- [ ] **Step 2: Add handler methods and routes**

`GoogleLinkStart` reads `locale` and `return_to`, reads `auth_time` from `c.Locals`, calls `StartGoogleLink`, sets the existing Google flow cookie, and returns `authorization_url`.

`GoogleLinkStatus` calls `h.google.GoogleLinkStatus` and returns booleans plus `int64(status.RetryAfter.Seconds())`.

`GoogleUnlink` parses `{Password string}`, reads `auth_time`, calls `h.profile.UnlinkGoogle`, and returns a success message. It must not log the password.

Extend `respondAccountError` to map Google-link codes to `409` for identity conflicts/already-linked, `429` for cooldown, and `400` for email mismatch. When the typed error has `RetryAfter > 0`, add `retry_after_seconds` to the error envelope.

Register:

```go
accounts.Get("/google/link/start", middleware.AccountOriginGuard(allowedOrigins), middleware.PublicAccountRequired(h.db, h.secret), h.GoogleLinkStart)
accounts.Get("/google/link/status", middleware.PublicAccountRequired(h.db, h.secret), h.GoogleLinkStatus)
account.Delete("/providers/google", h.GoogleUnlink)
```

Keep `/accounts/google/start` public and unchanged.

- [ ] **Step 3: Update OpenAPI**

Document the three routes, `GoogleLinkStatus`, `GoogleStartResponse`, `AccountErrorResponse.retry_after_seconds`, and the four Google-link error codes. Document that the start callback never sets a refresh cookie for `approval_sent` and that unlink requires a password identity.

- [ ] **Step 4: Run handler tests**

Run:

```bash
cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/handlers -run 'AccountGoogle(Link|Start)|AccountGoogleUnlink' -count=1
```

Expected: all targeted tests pass.

---

## Task 5: Add typed frontend API, schemas, query, and session adoption

**Files:**

- Modify: `frontend/src/features/public/account/types.ts`
- Modify: `frontend/src/features/public/account/schema.ts`
- Modify: `frontend/src/features/public/account/api.ts`
- Modify: `frontend/src/features/public/account/api.test.ts`
- Modify: `frontend/src/features/public/account/queries.ts`
- Modify: `frontend/src/features/public/account/AccountSessionProvider.tsx`

**Interfaces:**

```ts
export type GoogleLinkStatus = {
  connected: boolean;
  pending: boolean;
  retry_after_seconds: number;
};

export async function startGoogleLink(locale: string, returnTo: string): Promise<string>;
export async function fetchGoogleLinkStatus(): Promise<GoogleLinkStatus>;
export async function unlinkGoogleAccount(): Promise<void>;
```

Add these `AccountErrorCode` values:

```ts
| "AUTH_GOOGLE_EMAIL_MISMATCH"
| "AUTH_GOOGLE_IDENTITY_IN_USE"
| "AUTH_GOOGLE_ALREADY_LINKED"
| "AUTH_GOOGLE_LINK_PENDING"
```

- [ ] **Step 1: Write failing API tests**

Add tests to `api.test.ts` that install the existing Axios adapter and assert:

```ts
test("startGoogleLink parses authorization URL", async () => { /* status 200 envelope */ });
test("fetchGoogleLinkStatus parses cooldown seconds", async () => { /* strict status envelope */ });
test("toAccountApiError preserves Google link retry hint", () => { /* 429 + retry_after_seconds */ });
```

The retry-hint test must assert `apiError.retryAfterSeconds === 42` after extending `AccountApiError` and the error schema.

- [ ] **Step 2: Extend strict schemas and error mapping**

Add `retry_after_seconds: z.number().int().nonnegative().optional()` to the error envelope, add a strict `googleLinkStatusSchema`, and parse the `data` object rather than returning unknown payloads. Extend `AccountApiError` with `retryAfterSeconds: number` defaulting to `0`; keep `toAccountApiError` idempotent for already-normalized errors.

- [ ] **Step 3: Add API functions**

Use `accountApi` only. `startGoogleLink` calls `GET /accounts/google/link/start` with `{ locale, return_to }` query parameters and parses the existing Google-start envelope. `fetchGoogleLinkStatus` calls `GET /accounts/google/link/status`. `unlinkGoogleAccount` calls `DELETE /account/providers/google` without a password body because the UI reauthenticates first.

- [ ] **Step 4: Add query and session-adoption contracts**

Add:

```ts
googleLink: () => ["account", "google-link"] as const
```

and `useGoogleLinkStatus(enabled?: boolean)` with the existing public retry policy and 30-second stale time. Add `adoptCurrentSession: () => Promise<void>` to `AccountSessionValue`; its provider implementation sets status to `authenticated` and invalidates `accountKeys.current()` after `confirmGoogleLink` has placed the access token in memory.

- [ ] **Step 5: Run frontend API tests and type-check**

Run:

```bash
cd frontend && npm run test:account
./node_modules/.bin/tsc --noEmit
```

Expected: all account tests pass and TypeScript reports no errors.

---

## Task 6: Build the hook and Account provider-methods UI

**Files:**

- Create: `frontend/src/features/public/account/hooks/useGoogleAccountLink.ts`
- Create: `frontend/src/features/public/account/components/AccountProviderMethods.tsx`
- Modify: `frontend/src/features/public/account/components/ProfileForm.tsx`
- Modify: `frontend/src/features/public/account/hooks/useGoogleRedirect.ts`

**Interfaces:**

```ts
export function useGoogleAccountLink(): {
  status: GoogleLinkStatus | undefined;
  loading: boolean;
  redirecting: boolean;
  unlinking: boolean;
  error: AccountApiError | null;
  startLink: () => Promise<void>;
  unlink: (password: string) => Promise<void>;
  clearError: () => void;
};
```

- [ ] **Step 1: Write hook behavior tests**

Create `frontend/src/features/public/account/googleAccountLink.test.ts` with pure seam tests for:

```ts
test("pageshow clears redirecting after Google cancellation", () => { /* reuse subscribeToPageShow */ });
test("cooldown prevents a second start before retry_after_seconds expires", () => { /* status retry seconds */ });
test("AUTH_REAUTH_REQUIRED reauthenticates then retries link start", async () => { /* fake API calls */ });
```

Keep the network orchestration injectable through the existing module API or test adapter; do not add a second HTTP client.

- [ ] **Step 2: Implement the hook**

Use `useGoogleLinkStatus` for server state, `useGoogleRedirect` for OAuth navigation state, and `useAccountSession().reauthenticate` for stale-session recovery. On `AUTH_REAUTH_REQUIRED`, expose a `requiresReauth` state to the component; after the password is submitted, call `reauthenticate(password)` and retry `startGoogleLink(locale, "/account")`. On success, call `markRedirecting()` immediately before `window.location.assign(url)`.

Start must clear old errors, respect `pending && retry_after_seconds > 0`, and call `queryClient.invalidateQueries({ queryKey: accountKeys.googleLink() })` after returning from non-redirect errors. Unlink must reauthenticate with the submitted password, call `unlinkGoogleAccount`, invalidate both Google-link and current-account queries, and reset the unlink state.

- [ ] **Step 3: Implement the provider component**

Render under the existing `providersLabel` section with these accessible states:

- Connect: explanatory text and primary “Connect Google” button.
- Reauthentication: password field, confirm button, cancel button, and an alert tied to the field.
- Pending: approval-sent status, retry countdown, and disabled/resend action.
- Connected: Google connected label and “Disconnect Google” secondary/danger action.
- Error: localized `useAccountErrorMessage` text in `role="alert"`.

When connected, do not render unlink if the account providers do not include `password`. Use `PasswordInput`, square public controls, 44px minimum heights, and `useGoogleRedirect` so Browser Back restores the button.

- [ ] **Step 4: Mount it in the Security tab**

In `ProfileForm.tsx`, render `<AccountProviderMethods account={account} />` before the sessions section or at the top of Security. Keep account/profile save dirty-state behavior unchanged. The component must receive the account provider list and update through query invalidation rather than duplicating account data in local state.

- [ ] **Step 5: Run targeted frontend checks**

Run:

```bash
cd frontend && ./node_modules/.bin/eslint src/features/public/account/hooks/useGoogleAccountLink.ts src/features/public/account/components/AccountProviderMethods.tsx src/features/public/account/components/ProfileForm.tsx
npm run test:account
./node_modules/.bin/tsc --noEmit
```

Expected: lint, account tests, and TypeScript all pass.

---

## Task 7: Complete approval-page adoption and localization

**Files:**

- Modify: `frontend/src/features/public/account/components/LinkAccount.tsx`
- Modify: `frontend/src/messages/th.json`
- Modify: `frontend/src/messages/en.json`
- Modify: `frontend/src/messages/de.json`
- Modify: `frontend/src/features/public/account/messages.test.ts`

**Interfaces:**

- `LinkAccountContent` consumes `adoptCurrentSession` from `useAccountSession` and `useRouter` from `@/navigation`.
- `confirmGoogleLink(token)` remains the only API call for the approval token.

- [ ] **Step 1: Add complete locale message trees**

Add matching keys under `Account.account`, `Account.google`, and `Account.errors` for:

```json
{
  "providersConnected": "Google connected",
  "providerConnect": "Connect Google",
  "providerDisconnect": "Disconnect Google",
  "providerPending": "Check your email to approve Google linking.",
  "providerCooldown": "You can request another approval email in {seconds}s.",
  "providerReauthTitle": "Confirm your password",
  "providerReauthBody": "Your session is older than 10 minutes.",
  "providerMismatch": "Use the same Google email as this account.",
  "providerInUse": "This Google account is already linked elsewhere.",
  "providerAlreadyLinked": "Google is already connected.",
  "providerLinkPending": "A Google approval request is already pending.",
  "providerDisconnectConfirm": "Enter your password to disconnect Google."
}
```

Translate the values naturally for Thai and German; preserve the same key shape and interpolation variable in all three files.

- [ ] **Step 2: Redirect after approval**

When confirmation succeeds, call `await adoptCurrentSession()`, set a success state long enough for assistive technology to receive the status, then call `router.replace("/account")`. On invalid/expired token, keep the existing localized error page and never expose the token.

- [ ] **Step 3: Add locale parity assertions**

Extend `messages.test.ts` so the recursive key-tree comparison covers the provider-link keys and verifies that `th`, `en`, and `de` all have the same structure.

- [ ] **Step 4: Run message and account tests**

Run:

```bash
cd frontend && npm run test:account
```

Expected: the account suite passes with no missing locale keys.

---

## Task 8: End-to-end contract verification and review

**Files:**

- Modify only files identified by the preceding tasks if verification exposes a contract defect.

- [ ] **Step 1: Format backend and inspect the diff**

Run:

```bash
cd backend && gofmt -w internal/accountauth/contracts.go internal/models/account_auth.go internal/services/account_google_service.go internal/services/account_profile_service.go internal/handlers/account_auth_handler.go
cd .. && git -c core.fsmonitor=false diff --check
```

Expected: no whitespace errors and no changes outside the feature files plus the migration, OpenAPI, spec, and plan.

- [ ] **Step 2: Run backend verification**

Run:

```bash
cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./...
GOCACHE=/private/tmp/wat-profile-go-cache go vet ./...
go build -o bin/server ./cmd/app
```

Expected: all backend tests, vet, and build pass. Do not commit `backend/bin/server`.

- [ ] **Step 3: Run frontend verification**

Run:

```bash
cd frontend && npm run test:account
npm run lint
./node_modules/.bin/tsc --noEmit
npm run build
```

Expected: all account tests, lint, type-check, and production build pass for `th`, `en`, and `de` routes.

- [ ] **Step 4: Perform the browser acceptance pass**

With the local frontend and backend enabled, verify this exact sequence:

1. Sign in to an email/password account and open `/th/account`.
2. Open Security > sign-in methods and click Connect Google.
3. Confirm a fresh session redirects to Google without a password prompt.
4. Return with Browser Back; verify the button is enabled and no error is shown.
5. Repeat with an old session; verify password reauthentication appears, then OAuth starts.
6. Use the same verified Google email; verify the approval-sent state and 60-second cooldown.
7. Click the email approval link; verify auto-login, provider state refresh, and redirect to `/th/account`.
8. Try a different Google email; verify localized mismatch error and unchanged account state.
9. Try a Google identity already linked elsewhere; verify conflict error and unchanged session.
10. Disconnect Google with the correct password; verify only Google is removed.
11. Verify disconnect is unavailable for an account without a password identity.

- [ ] **Step 5: Final review**

Review the diff for secrets, generated files, raw colors in public TSX, missing locale keys, untyped API payloads, and any change to the anonymous Google login/register flow. Report the test gap if the browser OAuth provider cannot be exercised locally.
