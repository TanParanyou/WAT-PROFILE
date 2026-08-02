# Production Public Account Auth Design

## Summary

Build a production-ready authentication module for public website accounts before
building Community Q&A. The module lets a visitor create and test an account with
email/password or Google Sign-In, manage a minimal public profile, recover access,
and revoke sessions.

This module is deliberately separate from both Community Q&A and the existing
temple-membership domain. Creating a public account does not create a temple member.
The existing Admin login UI and CMS workflows remain available throughout rollout.

## Goals

- Let a visitor register with email and password, verify the email address, sign in,
  sign out, and reset a forgotten password.
- Let a visitor sign in with Google and safely link Google to an existing account.
- Give each public account a minimal profile containing a display name and optional
  avatar.
- Use short-lived access tokens and server-managed, rotating refresh sessions.
- Let a user inspect active sessions, revoke one session, or revoke every session.
- Support Thai, English, and German UI, validation messages, and transactional email.
- Allow the entire public-account surface to be enabled for testing without enabling
  Community Q&A or changing public navigation for other visitors.
- Preserve existing Admin authentication behavior while closing any path that would
  let a public account reach an Admin route.

## Non-goals

- Community topics, replies, reactions, reports, moderation, or notifications.
- Direct messages, real-time chat, WebSockets, or WhatsApp API integration.
- Temple-member enrollment or automatic linking to `members` records.
- Apple Sign-In, passkeys, multi-factor authentication, or other social providers.
- File upload for avatars. The profile accepts an optional URL managed through an
  existing approved media workflow; a generated initials avatar is the fallback.
- Replacing the existing Admin login page or redesigning Admin RBAC.

## Terminology and boundaries

| Term | Meaning |
|---|---|
| Public account | A website identity that may use Community features in a later project |
| Account profile | Public-facing display name, avatar, and preferred locale |
| Temple member | An existing formal membership record with member code and private personal data |
| Admin user | A user with an active Admin role and permissions |
| Identity | A sign-in method attached to one account, currently password or Google |
| Session | One refresh-token family associated with a browser/device |

A public account is not a temple member. Matching names or email addresses never
link those domains automatically. A future, separately approved workflow may link
them explicitly.

## Current state and constraints

The repository already has `/api/v1/auth` routes, a shared `users` table, password
hashing, JWT access and refresh tokens, and an Admin login UI. The current refresh
token is returned to JavaScript and stored un-hashed in both local storage and the
database. Refresh tokens do not rotate, logout only clears browser storage, email
verification is not implemented, and the frontend has no public-account routes.

The new public-account flow must not copy those session semantics. It uses a new
account route surface and new session records. Existing Admin clients continue to
use their current contract during this project. The backend must enforce the Admin
boundary independently of frontend navigation: an authenticated public account
with no Admin role cannot call any `/api/v1/admin` endpoint, including dashboard
routes that currently rely only on `AuthRequired`.

The legacy anonymous `/api/v1/auth/register` route is disabled when the new public
account module is enabled. The legacy `/api/v1/auth/login` remains available to the
Admin client but rejects users without an active Admin role. This prevents a second,
weaker registration path from bypassing verification and session policy.

## Architecture

### Frontend

Public account routes live under the localized public route group:

- `/[locale]/register`
- `/[locale]/login`
- `/[locale]/verify-email`
- `/[locale]/forgot-password`
- `/[locale]/reset-password`
- `/[locale]/account`
- `/[locale]/account/sessions`

Pages stay focused on routing and composition. Typed transport, DTO validation,
query keys, and mutations belong to `src/features/public/account/`. Forms use React
Hook Form and Zod. TanStack Query owns remote account state. Access tokens live only
in memory; neither access nor refresh tokens are written to local storage.

The public-account UI is controlled by `NEXT_PUBLIC_PUBLIC_ACCOUNT_AUTH_ENABLED`.
When disabled, account routes return not found and no public navigation entry is
shown. This flag does not affect Admin routes.

### Backend

The backend adds a focused account-auth module with handler, service, repository
queries, email delivery, Google verification, session rotation, and security-event
recording behind explicit interfaces. Handlers parse input and map typed domain
errors; services own transactions and security policy; database access remains in
services.

The public-account API is controlled by `PUBLIC_ACCOUNT_AUTH_ENABLED`. When disabled,
new account endpoints return not found. Production must enable backend and frontend
flags together.

### Deployment boundary

Production auth requests must be same-site so a `Secure`, `HttpOnly`, `SameSite=Lax`
refresh cookie works without third-party-cookie behavior. The frontend and API may
use different subdomains under the same registrable domain. If hosting cannot meet
that invariant, auth requests must be proxied through a same-origin frontend route;
the design does not fall back to a JavaScript-readable refresh token.

## Data model

Schema changes use one new reversible migration pair,
`000023_add_public_account_auth.up.sql` and
`000023_add_public_account_auth.down.sql`. The migration creates the four new tables
below and makes the explicit `users` changes described later in this section.

### `account_profiles`

| Column | Constraints |
|---|---|
| `id` | UUID primary key |
| `user_id` | UUID, unique, foreign key to `users.id`, cascade delete |
| `display_name` | VARCHAR(80), required |
| `avatar_url` | VARCHAR(500), nullable |
| `preferred_locale` | VARCHAR(2), required, one of `th`, `en`, `de` |
| `created_at`, `updated_at` | timestamps |

The table contains only community-safe profile fields. It does not duplicate birth
date, address, phone, nationality, emergency contact, member code, or membership
status from `members`.

### `auth_identities`

| Column | Constraints |
|---|---|
| `id` | UUID primary key |
| `user_id` | UUID, foreign key to `users.id`, cascade delete |
| `provider` | `password` or `google` |
| `provider_subject` | provider-stable identifier |
| `provider_email` | normalized email observed from provider |
| `credential_hash` | password hash for password identity; null for Google |
| `created_at`, `updated_at` | timestamps |

`(provider, provider_subject)` is unique. `(user_id, provider)` is unique in the
first release. Google identity uses Google's `sub` claim as `provider_subject`.
Password identity uses the normalized account email as its subject.

Existing Admin password hashes remain readable by the legacy Admin auth path. The
public-account implementation must not migrate or delete Admin credentials in this
project. New public password credentials are stored only in `auth_identities`.

### `auth_sessions`

| Column | Constraints |
|---|---|
| `id` | UUID primary key and public session identifier |
| `user_id` | UUID, indexed foreign key, cascade delete |
| `family_id` | UUID, indexed token-family identifier |
| `token_hash` | fixed-length cryptographic hash, unique |
| `expires_at` | timestamp, indexed |
| `last_used_at` | timestamp |
| `revoked_at` | nullable timestamp |
| `revoked_reason` | nullable bounded string |
| `user_agent_summary` | bounded, sanitized string |
| `ip_prefix` | nullable coarse network prefix, not a full long-term IP history |
| `created_at`, `updated_at` | timestamps |

Only a hash of the opaque refresh token is stored. Rotation consumes the current
record and creates its replacement in one transaction. Reuse of a consumed token
revokes the entire family.

### `auth_action_tokens`

| Column | Constraints |
|---|---|
| `id` | UUID primary key |
| `user_id` | UUID, indexed foreign key, cascade delete |
| `purpose` | `verify_email`, `reset_password`, or `link_identity` |
| `token_hash` | fixed-length cryptographic hash, unique |
| `payload` | minimal JSONB needed for the action; no raw credentials |
| `expires_at` | timestamp, indexed |
| `consumed_at` | nullable timestamp |
| `created_at` | timestamp |

Issuing a new token invalidates unconsumed tokens for the same user and purpose.
Tokens are single-use even when requests race.

### `auth_security_events`

| Column | Constraints |
|---|---|
| `id` | UUID primary key |
| `user_id` | nullable UUID, indexed, set null on account deletion |
| `event_type` | bounded event code |
| `outcome` | `success` or `failure` |
| `provider` | nullable `password` or `google` |
| `request_trace_id` | nullable trace identifier |
| `ip_prefix` | nullable coarse network prefix |
| `metadata` | allow-listed JSONB only |
| `created_at` | timestamp, indexed |

Metadata never stores credentials, raw tokens, complete request bodies, or Google
tokens.

### Existing `users`

The shared user row remains the canonical principal and keeps role/RBAC relations.
Public-account creation sets no Admin role. Account status distinguishes at least
`pending_verification`, `active`, `disabled`, and `closed`; this must be represented
with an explicit field rather than inferred from `email_verified` and `is_active`.
Email comparison uses a normalized lowercase value and a database uniqueness rule.

Migration `000023` adds `account_status` with `active` as the value for existing
users, adds its check constraint, and makes `users.password_hash` nullable so a
Google-only account does not receive a fake password. The legacy Admin login treats
a null hash as the same generic authentication failure as a wrong password. Existing
password hashes remain in place for Admin compatibility; they are not copied or
deleted. Before adding normalized-email uniqueness, the migration checks for
case-insensitive duplicates and aborts with a diagnostic rather than merging users.

## HTTP contracts

All endpoints use the standard success/error envelope and stable machine-readable
error codes. `backend/docs/openapi.yaml` and frontend DTOs change together.

### Anonymous endpoints

- `POST /api/v1/accounts/register`
- `POST /api/v1/accounts/verify-email`
- `POST /api/v1/accounts/resend-verification`
- `POST /api/v1/accounts/login`
- `POST /api/v1/accounts/refresh`
- `POST /api/v1/accounts/forgot-password`
- `POST /api/v1/accounts/reset-password`
- `GET /api/v1/accounts/google/start`
- `GET /api/v1/accounts/google/callback`
- `POST /api/v1/accounts/google/link/confirm`

### Authenticated endpoints

- `POST /api/v1/accounts/logout`
- `POST /api/v1/accounts/logout-all`
- `GET /api/v1/account`
- `PATCH /api/v1/account/profile`
- `GET /api/v1/account/sessions`
- `DELETE /api/v1/account/sessions/:id`
- `POST /api/v1/account/close`

State-changing authenticated endpoints require a valid public-account access token.
Cookie-authenticated refresh and logout requests additionally enforce an allowed
Origin check. Responses never include a refresh token.

## Authentication flows

### Email/password registration

1. Normalize email, validate display name and locale, and validate a password of
   12-128 characters. Passphrases and password-manager output are allowed; arbitrary
   composition rules are not required.
2. In one transaction, create a role-less `users` row in
   `pending_verification`, its account profile, and its password identity.
3. Create a single-use verification token with a 30-minute lifetime and send the
   localized verification email after the transaction commits.
4. A repeated registration for an existing unverified email returns the same generic
   result and may resend only within the resend rate limit.
5. Verification atomically consumes the token and activates the account. It does not
   automatically create a temple member.
6. The user signs in after verification. Verification links do not silently create a
   long-lived session on a shared device.

### Password login

1. Return the same public failure for unknown email, wrong password, disabled account,
   and non-password identity where disclosure would reveal account state.
2. Require email verification before session creation.
3. On success, return a short-lived access token in the response body and set an
   opaque rotating refresh token in the secure cookie.
4. Record an allow-listed security event without storing credentials.

### Google Sign-In

1. The start endpoint creates signed, short-lived `state` and PKCE material and then
   redirects to Google. The requested locale and safe post-login destination are
   preserved server-side.
2. The callback verifies `state`, PKCE, issuer, audience, signature, expiry, nonce,
   Google `sub`, and verified-email status.
3. If the Google identity already exists, sign in its user.
4. If no account uses the email, create an active role-less user, account profile,
   and Google identity in one transaction.
5. If a verified existing account uses the email but Google is not linked, do not
   link or sign in silently. Send a short-lived approval link to the existing email.
   The user must approve linking before Google can create a session.
6. Never grant or change a role from Google claims. Do not persist Google access or
   refresh tokens because no Google API access is required.

### Refresh and logout

- Access-token lifetime is 15 minutes.
- Refresh-session lifetime is 30 days with rotation on every refresh.
- Refresh creates a replacement token and consumes the current token atomically.
- Reuse of an already consumed token revokes the token family.
- Logout revokes the current family and clears the cookie.
- Logout-all and password reset revoke all sessions for the user.
- Disabled or closed accounts cannot refresh or create sessions.

### Password reset

Forgot-password always returns the same accepted response. For a password-enabled,
active account it sends a localized, single-use link valid for 30 minutes. Resetting
the password consumes the token, replaces the password hash, revokes every existing
session, and sends a security notification. Google-only users receive a neutral
message explaining they can continue with Google without revealing that fact in the
HTTP response.

### Account closure

Closing an account requires an `auth_time` no more than 10 minutes old. A password
user may re-enter the password; a Google-only user repeats Google authentication.
Closure revokes every session, marks the account `closed`, removes profile visibility,
and prevents login. Hard deletion and retention schedules are an operational privacy
process outside this first UI; the API and schema must not make later deletion
impossible.

## Admin isolation

- The Admin login UI and existing Admin token storage contract are unchanged in this
  project.
- Every `/api/v1/admin` route must require an active user with an active Admin role
  before per-resource permissions are evaluated.
- Public-account access tokens carry an explicit public-account audience and cannot
  satisfy Admin middleware.
- Admin tokens cannot call public-account profile/session endpoints unless that user
  separately owns an account profile and uses the public-account sign-in flow.
- Regression tests cover Admin login plus rejection of a role-less public account on
  dashboard and permission-protected Admin routes.

## Validation and error handling

The backend returns stable codes such as `AUTH_INVALID_CREDENTIALS`,
`AUTH_EMAIL_VERIFICATION_REQUIRED`, `AUTH_TOKEN_INVALID_OR_EXPIRED`,
`AUTH_RATE_LIMITED`, `AUTH_ACCOUNT_DISABLED`, and `AUTH_REAUTH_REQUIRED`. The
frontend maps codes to complete `th`, `en`, and `de` messages. Backend English text
is a safe fallback, not the UI localization source.

Validation failures include typed field errors. Provider outages, email-delivery
failures, and database failures return a trace ID and do not expose upstream tokens,
SQL details, or account existence. Email delivery is retryable: a committed account
remains pending when initial delivery fails, and the user can use the rate-limited
resend flow.

## Rate limits and abuse controls

Separate limits apply to registration, password login, verification resend,
forgot-password, refresh, and Google start/callback. Limits combine coarse IP signal
with normalized account identifier where applicable. Repeated password failures use
a bounded cooldown; they do not create a permanent denial-of-service lockout.

Limits are configurable through server-only environment variables with conservative
production defaults. Responses use a stable error code and retry metadata without
confirming whether an account exists.

## Email delivery and localization

Resend remains the transactional email provider. Templates cover email verification,
identity-link approval, password reset, password-changed notification, and suspicious
session revocation. Subject, body, expiry wording, and call-to-action are complete in
Thai, English, and German. Links always preserve a validated locale and point to an
allow-listed frontend origin.

Local development uses an explicit non-production capture adapter that records only
the rendered message and action URL in a local test sink. It must refuse to start in
capture mode when `ENV=production`. Raw action tokens never appear in normal runtime
logs.

## Configuration

Committed env examples document placeholders for:

- `PUBLIC_ACCOUNT_AUTH_ENABLED`
- `PUBLIC_ACCOUNT_FRONTEND_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URL`
- `AUTH_ACCESS_TOKEN_EXPIRY`
- `AUTH_REFRESH_TOKEN_EXPIRY`
- `AUTH_EMAIL_DELIVERY_MODE`
- scoped rate-limit values
- `NEXT_PUBLIC_PUBLIC_ACCOUNT_AUTH_ENABLED`

Secrets remain server-only. Google configuration must allow only explicit local,
test, and production callback URLs.

## Testing strategy

### Backend automated tests

- Registration transaction, normalization, duplicate handling, and rollback.
- Verification/resend success, expiry, single use, races, and delivery failure.
- Password login success plus generic failure behavior.
- Refresh rotation, concurrent refresh, reuse detection, expiry, logout, and
  logout-all.
- Password-reset single use, expiry, session revocation, and notification.
- Google token validation and account creation with the provider verifier mocked.
- Existing-account Google linking, expired approval, duplicate callback, and role
  preservation.
- Admin isolation for dashboard and a permission-protected route.
- Account profile validation and session ownership checks.
- Rate limits and security-event redaction.

GORM integration tests use an isolated database, never a developer or production
database. A focused HTTP test harness is added for the account routes because their
cookie and response contracts are security-critical.

### Frontend automated tests

Pure validation, error-code mapping, locale-preserving redirects, and account DTO
parsing use the repository's `node:test` style. The project adds `tsx` as a development
dependency and a focused `npm run test:account` script so these TypeScript tests are
actually executable. It does not claim to repair or aggregate unrelated historical
test files.

### Browser acceptance

Exercise password registration, email capture/verification, login, silent refresh,
profile update, current-session logout, logout-all, reset password, Google new-account
login, Google existing-account linking, expired links, and disabled accounts. Repeat
the user-visible flows in `th`, `en`, and `de`, at mobile and desktop widths, with
keyboard-only operation. Verify that Admin login and CMS navigation still work.

### Required repository checks

```bash
cd frontend && npm run lint
cd frontend && npm run test:account
cd frontend && ./node_modules/.bin/tsc --noEmit
cd frontend && npm run build
cd backend && go test ./...
cd backend && go vet ./...
cd backend && go build -o bin/server ./cmd/app
```

Migration verification applies the new migrations to an empty database and to a copy
of the prior schema, then runs the matching down migrations only against a confirmed
non-production test target.

## Rollout and testing gate

1. Deploy schema and backend with public-account auth disabled.
2. Configure Resend, Google callbacks, same-site cookie topology, allowed origins,
   and local/test/production frontend origins.
3. Enable the backend only in the test environment and complete automated checks.
4. Enable the frontend flag in the test environment and expose direct account URLs
   without adding Community navigation.
5. Complete browser acceptance and verify Admin regression coverage.
6. Let the product owner use both password and Google flows and approve the Auth
   experience.
7. Enable account navigation in production only after that approval.
8. Keep Community Q&A out of scope until Auth has passed this gate and received its
   own approved design and implementation plan.

Rollback disables both feature flags first. The application can then roll back while
leaving additive auth tables in place. Destructive down migrations are reserved for
a confirmed non-production database; production rollback does not delete newly
created accounts or sessions.

## Acceptance criteria

- A visitor can create a public account by password or Google without becoming a
  temple member.
- Password accounts cannot sign in until email verification succeeds.
- A Google identity with a matching existing email cannot take over or silently link
  the existing account.
- Access tokens are short-lived and refresh tokens are rotating, hashed at rest, and
  unavailable to browser JavaScript.
- A user can view and revoke sessions, reset a password, and close the account.
- Account routes and email are complete in Thai, English, and German.
- A public account cannot access any Admin endpoint; existing Admin login still works.
- Account surfaces can be enabled for isolated testing without Community features.
- OpenAPI, backend routes, migrations, GORM models, frontend contracts, and env
  examples agree.
- Relevant build, lint, type-check, test, vet, migration, and browser checks pass or
  an explicitly documented repository test-runner limitation remains.

## Future Community contract

After Auth approval, Community Q&A may depend only on the authenticated user ID,
active account status, account profile display name/avatar, preferred locale, and a
stable authorization middleware contract. It must not read password identities,
sessions, action tokens, security events, or temple-member private fields.

The Community project will receive a separate design covering public-read/member-
write topics, `th`/`en`/`de` topic language, member replies, trust-based first-post
approval, official staff answers, reports, and moderation. None of those tables or
routes are created by this Auth project.
