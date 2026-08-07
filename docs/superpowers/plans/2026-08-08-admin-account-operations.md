# Account Auth Hardening and Admin Account Operations Revised Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the authentication review findings first, then deliver a least-privilege Admin workflow for viewing and operating on public accounts. Test-file creation is explicitly deferred from this execution phase.

**Architecture:** Phase 0 hardens the existing public-account authentication boundary: Google reauthentication, email-change conflict handling, deterministic session expiry, and the standard error envelope. Phase 1 adds the `account_operations` RBAC contract and six protected Admin API routes. Phase 2 implements the scoped backend service and Phase 3 adds the typed Admin UI. Public accounts remain distinct from Admin users throughout.

**Tech Stack:** Go 1.24, Fiber v2, GORM, PostgreSQL, Next.js 16, React 19, TypeScript, TanStack Query, next-intl, Tailwind Admin tokens.

## Global Constraints

- Only users with an `account_profiles` row are public-account targets; never operate on staff-only Admin users.
- `account_operations` exposes only `read` and `update`; it is not a synonym for the existing `users` resource.
- Never return password hashes, refresh tokens, opaque action tokens, OAuth state, avatar storage keys, IP prefixes, trace IDs, security metadata, or raw client user agents.
- Disable only an active public account; enable only a verified disabled public account; a closed account remains owner-recoverable only through the existing email flow.
- Disable and force-sign-out revoke active public sessions in the same transaction as the lifecycle mutation.
- Staff mutations use only the reason codes `security_review`, `policy_violation`, `user_request`, and `support_request` and write one redacted audit entry.
- Preserve `th`, `en`, and `de` Admin messages and existing Admin focus/44px control tokens.
- Do not alter previous migrations or enable `DB_AUTO_MIGRATE`.
- **This phase must not create or modify any `*_test.go`, `*.test.ts`, or `*.test.tsx` file.** Test work is listed in the deferred gate at the end of this plan.

## Status Before Execution

| Area | Current state | Plan decision |
| --- | --- | --- |
| Public session binding and lifecycle locks | Partially delivered in the working tree | Keep, then apply Phase 0 corrections. |
| Google reauthentication | Unlocked identity check before session transaction | Fix before Admin work. |
| Email-change uniqueness | Pre-check exists, database race is unmapped | Map PostgreSQL `23505` to `AUTH_EMAIL_ALREADY_REGISTERED`. |
| Middleware clock/error envelope | Uses `time.Now()` and omits `trace_id` on new branches | Inject clock and use the shared response helpers. |
| `account_operations` permission | Enum/seed/migration pieces exist | Keep migration reversible; do not call the feature complete yet. |
| Admin Account Operations API/UI | Not implemented | Implement Phases 1–3. |

## Product and Policy Contract

### Allowed staff actions

| Operation | Preconditions | Effect |
| --- | --- | --- |
| View/search | `account_profiles` row exists | Safe summary/detail and redacted security events. |
| Disable | `account_status=active`, `is_active=true` | Set `disabled`/`false` and revoke active sessions atomically. |
| Enable | `account_status=disabled`, `email_verified=true` | Set `active`/`true`; do not create a session. |
| Force sign-out | Account is active or disabled | Revoke active sessions only; leave lifecycle status unchanged. |

### Explicit non-features

No staff password reset, email change, provider link/unlink, impersonation, access-token issuance, reopen/purge/delete, bulk operations, or CSV export.

### API routes

| Method | Path | Permission |
| --- | --- | --- |
| GET | `/api/v1/admin/account-operations` | `account_operations:read` |
| GET | `/api/v1/admin/account-operations/:id` | `account_operations:read` |
| GET | `/api/v1/admin/account-operations/:id/security-events` | `account_operations:read` |
| POST | `/api/v1/admin/account-operations/:id/disable` | `account_operations:update` |
| POST | `/api/v1/admin/account-operations/:id/enable` | `account_operations:update` |
| POST | `/api/v1/admin/account-operations/:id/logout-all` | `account_operations:update` |

### Safe DTOs

```go
type AdminAccountSummary struct {
    ID            uuid.UUID  `json:"id"`
    Email         string     `json:"email"`
    DisplayName   string     `json:"display_name"`
    AccountStatus string     `json:"account_status"`
    EmailVerified bool       `json:"email_verified"`
    Providers     []string   `json:"providers"`
    LastLoginAt   *time.Time `json:"last_login_at,omitempty"`
    ClosedAt      *time.Time `json:"closed_at,omitempty"`
    PurgeAfter    *time.Time `json:"purge_after,omitempty"`
    CreatedAt     time.Time  `json:"created_at"`
}

type AdminAccountSecurityEvent struct {
    ID        uuid.UUID `json:"id"`
    EventType string    `json:"event_type"`
    Outcome   string    `json:"outcome"`
    Provider  string    `json:"provider,omitempty"`
    CreatedAt time.Time `json:"created_at"`
}

type AdminAccountMutationInput struct {
    Reason string `json:"reason"`
}
```

## Phase 0: Close review findings without adding test files

### Task 1: Make Google reauthentication atomic with unlink

**Files:**
- Modify: `backend/internal/services/account_google_service.go:545-575,799-835`

**Interfaces:**
- Add `sessionForGoogleReauthentication(ctx context.Context, userID uuid.UUID, providerSubject string, client accountauth.ClientInfo, now time.Time) (accountauth.SessionResult, error)`.
- Keep `sessionForUser` for non-reauth flows that do not need an identity match.

- [ ] **Step 1: Replace the unlocked pre-checks in `completeGoogleReauthentication`**

The callback must call the new helper once. Remove the separate `AuthIdentity` query and separate `User` query from the callback method so no decision is made using stale rows.

- [ ] **Step 2: Implement one user-locked transaction in the helper**

Inside one transaction, lock the `users` row with `clause.Locking{Strength: "UPDATE"}`, validate `sessionStatusCode`, then load the Google identity for the same user and `provider_subject`. Return `AUTH_REAUTH_REQUIRED` when it is absent and `AUTH_GOOGLE_EMAIL_MISMATCH` when the subject differs. Create the session, issue the access token, and update `last_login_at` before commit.

- [ ] **Step 3: Preserve failure recording and callback locale**

Keep the existing failure/success security events and return `flow.Locale` unchanged. Do not add identity fields to the response or audit payload.

- [ ] **Step 4: Perform a manual race review**

Inspect the lock order against `AccountProfileService.UnlinkGoogle`: both paths must lock the user before reading/deleting the Google identity. Do not add a test file in this phase.

### Task 2: Map email-change unique violations to the stable auth error

**Files:**
- Modify: `backend/internal/services/account_credentials_service.go:95-145`
- Reuse: `backend/internal/services/account_registration_service.go:319-327` (`mapAccountConflict`)

- [ ] **Step 1: Keep the normalized pre-check**

Retain `lower(btrim(email))` conflict detection for the fast user-facing path.

- [ ] **Step 2: Map the database race at `tx.Save(&user)`**

Wrap the save error with `mapAccountConflict(err)`. A PostgreSQL `23505` from the normalized unique index must return `AUTH_EMAIL_ALREADY_REGISTERED`; any other database error must pass through unchanged so the transaction rolls back.

- [ ] **Step 3: Confirm token/session atomicity**

Verify the mapped conflict exits the transaction before the email identity update, token cleanup, or `LogoutAllTx` commit. Do not add a test file in this phase.

### Task 3: Inject middleware time and standardize error envelopes

**Files:**
- Modify: `backend/internal/middleware/account_auth.go:1-100`
- Modify: `backend/internal/handlers/account_auth_handler.go:813-845`

- [ ] **Step 1: Add an injectable clock without breaking existing callers**

Change the constructor to accept an optional `accountauth.Clock` argument. Use `accountauth.SystemClock{}` when omitted, and use `clock.Now()` for the `auth_sessions.expires_at` check. Production routes continue to work without a new environment variable.

- [ ] **Step 2: Use shared response helpers for every rejection**

Replace direct `fiber.Map` responses in `PublicAccountRequired` with `utils.ErrorResponse` or `utils.CodedErrorResponse`, preserving the existing status/message/code while adding `trace_id` consistently.

- [ ] **Step 3: Keep public route behavior unchanged**

Update only the middleware invocations needed by the new signature. Do not alter auth codes, cookie behavior, or account status policy.

- [ ] **Step 4: Run existing verification only**

Run:

```bash
cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/middleware ./internal/services -count=1
cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go vet ./...
```

Do not create or modify test files. If a pre-existing test exposes a compile issue from the signature change, update production call sites only; defer new coverage to the final test gate.

## Phase 1: RBAC and API contract

### Task 4: Finish the permission/API boundary

**Files:**
- Keep/verify: `backend/migrations/000036_add_account_operations_permission.up.sql`
- Keep/verify: `backend/migrations/000036_add_account_operations_permission.down.sql`
- Modify: `backend/cmd/seed/main.go:55-75`
- Modify: `frontend/src/types/auth.ts:38-54`
- Modify: `frontend/src/components/admin/PermissionEditor.tsx:5-20`
- Modify: `backend/docs/openapi.yaml`

- [ ] **Step 1: Keep migration scope reversible**

The up migration grants `account_operations: all` only to the active built-in `admin` role. The down migration removes only the `account_operations` key from that role. Do not edit earlier migrations or grant this permission to every role.

- [ ] **Step 2: Align seed and TypeScript permission unions**

Keep the seed entry, `PermissionResource` member, and PermissionEditor row aligned on the exact key `account_operations`.

- [ ] **Step 3: Document all six paths and safe schemas in OpenAPI**

Document query allowlists, reason values, pagination envelopes, lifecycle conflicts, and the deliberate omission of IP, trace, metadata, credential, and token fields.

- [ ] **Step 4: Verify migration SQL manually**

On an upgrade-path database, run migration version, up, and down checks and confirm only the built-in Admin role changes. Do not run `DB_AUTO_MIGRATE`.

## Phase 2: Backend Admin service and routes

### Task 5: Implement scoped account operations service

**Files:**
- Create: `backend/internal/services/admin_account_operations_service.go`
- Reuse: `backend/internal/services/account_session_service.go:414-420`
- Reuse: `backend/internal/services/account_profile_service.go` lifecycle status rules

- [ ] **Step 1: Add safe read projections**

Implement `List`, `Get`, and `ListSecurityEvents` using an `INNER JOIN account_profiles`. Allow only `status`, `provider`, normalized email/display-name search, and sorts `created_at`, `last_login_at`, `email`, `display_name`, and `purge_after`. Select only the safe DTO fields.

- [ ] **Step 2: Add serialized mutations**

Implement `Disable`, `Enable`, and `LogoutAll`. Every transaction locks the public account's `users` row first, revalidates the profile and status, then updates lifecycle/session rows. Use `admin_disabled` and `admin_logout_all` session revoke reasons.

- [ ] **Step 3: Enforce policy conflicts**

Reject staff-only users, closed accounts, pending-verification accounts, unverified enable requests, unsupported reasons, and unsupported filters with stable domain errors. Enabling never creates a session.

- [ ] **Step 4: Preserve redaction**

Never preload or serialize password hashes, token hashes/payloads, OAuth state, avatar keys, security-event metadata, IP prefixes, trace IDs, or raw user agents.

### Task 6: Add protected handlers, routes, and audit writes

**Files:**
- Create: `backend/internal/handlers/admin_account_operations_handler.go`
- Modify: `backend/internal/routes/routes.go:178-300`
- Modify: `backend/internal/services/audit_service.go` only if a typed helper is required
- Modify: `backend/docs/openapi.yaml` if response details change

- [ ] **Step 1: Validate list/event queries and mutation bodies**

Use existing list-query parsing and allowlists. Require `{ "reason": "security_review" }` (or another allowed reason) for every mutation and validate UUIDs before service calls.

- [ ] **Step 2: Wire `PermissionRequired` on all six routes**

Use `account_operations:read` for reads and `account_operations:update` for mutations. Register one handler instance in the Admin handler map and bind every documented path.

- [ ] **Step 3: Write one redacted audit action per mutation**

Use `account_operations.disable`, `account_operations.enable`, and `account_operations.logout_all`. Persist only the allowlisted reason and status transition; never persist email, session data, IP data, or security metadata.

- [ ] **Step 4: Verify production code without creating tests**

Run `go test` on existing backend packages, `go vet ./...`, and inspect the route registry to confirm no endpoint is registered without the required resource/action.

## Phase 3: Typed Admin UI

### Task 7: Add typed client and query invalidation

**Files:**
- Create: `frontend/src/features/admin-accounts/types.ts`
- Create: `frontend/src/services/accountOperationsAdminService.ts`
- Create: `frontend/src/features/admin-accounts/queries.ts`

- [ ] **Step 1: Define strict DTO and union types**

Use `AdminAccountStatus`, `AdminAccountProvider`, and `AccountOperationReason` unions matching the OpenAPI contract. Do not use `any` or expose server-private fields.

- [ ] **Step 2: Implement the typed service boundary**

Provide `getPaginated`, `getById`, `getSecurityEvents`, `disable`, `enable`, and `logoutAll` using the existing Admin API client and exact paths/bodies.

- [ ] **Step 3: Add stable query keys and invalidation**

Mutations must invalidate list, detail, and security-event keys for the affected account. Keep query serialization deterministic.

### Task 8: Add list/detail/action UX and localization

**Files:**
- Create: `frontend/src/app/[locale]/admin/accounts/page.tsx`
- Create: `frontend/src/features/admin-accounts/components/AccountOperationsDetailPanel.tsx`
- Modify: `frontend/src/components/admin/AdminSidebar.tsx`
- Modify: `frontend/src/messages/admin/th.json`
- Modify: `frontend/src/messages/admin/en.json`
- Modify: `frontend/src/messages/admin/de.json`

- [ ] **Step 1: Build the scoped account list**

Show display name, email, providers, lifecycle status, verification, last login, and created date. Do not add bulk actions or export.

- [ ] **Step 2: Build the safe detail panel**

Show the safe account summary and redacted security timeline. Hide lifecycle actions for closed/pending-verification accounts; show Disable only for active and Enable only for verified disabled accounts.

- [ ] **Step 3: Require reason confirmation**

Use the existing confirmation dialog and a localized reason select. Disable confirmation until a valid reason is selected. Refresh through query invalidation after success.

- [ ] **Step 4: Add permission-guarded navigation and all locales**

Add `/admin/accounts` under the Admin System group guarded by `account_operations:read`. Add equivalent Thai, English, and German copy for statuses, actions, warnings, reasons, errors, and redaction policy.

- [ ] **Step 5: Run frontend production checks**

Run:

```bash
cd frontend && ./node_modules/.bin/tsc --noEmit
cd frontend && ./node_modules/.bin/eslint src/features/admin-accounts src/services/accountOperationsAdminService.ts src/app/'[locale]'/admin/accounts/page.tsx
```

Do not create component/query test files in this phase.

## Deferred Test and Release Gate

These files are intentionally **not** created or modified by the current execution. They become the next gate before merge:

- `backend/internal/services/admin_account_operations_service_test.go`
- `backend/internal/handlers/admin_account_operations_handler_test.go`
- `backend/internal/services/account_google_service_test.go` additions for unlink/reauth concurrency
- `backend/internal/services/account_credentials_service_test.go` additions for concurrent normalized-email changes
- `backend/internal/middleware/account_auth_test.go` additions for injected clock and `trace_id`
- `frontend/src/features/admin-accounts/queries.test.ts`
- `frontend/src/features/admin-accounts/components/AccountOperationsDetailPanel.test.tsx`

The deferred gate must cover public-account scoping, all lifecycle transitions, session revocation, Google unlink/reauth race, email unique-violation mapping, RBAC/403 behavior, audit redaction, localization parity, and the migration up/down path. Until that gate is completed, the feature status remains “implementation in progress” even if `go test`, `go vet`, and TypeScript checks pass.

## Completion Checklist

- [ ] Phase 0 review findings fixed without test-file changes.
- [ ] Permission migration, seed, TypeScript resource, and OpenAPI are aligned.
- [ ] All six routes enforce `account_operations` permissions.
- [ ] Service scopes only `account_profiles` users and locks user rows before mutation.
- [ ] Responses and audit entries are redacted by construction.
- [ ] Thai, English, and German Admin UI copy is complete.
- [ ] Deferred test gate completed in a later change.
- [ ] Final code review confirms the plan status matches the implementation.
