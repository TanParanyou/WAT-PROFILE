# Admin Session Hardening Design

**Date:** 2026-08-02
**Status:** Approved for implementation planning

## Summary

Harden authentication and authorization for the Admin Panel without changing the
existing Member authentication flow. Admin access will use a dedicated login and
session lifecycle: short-lived audience-bound access tokens remain in browser memory,
while an opaque rotating refresh credential is stored in a restricted HttpOnly cookie.
The backend stores only a hash of that credential and can revoke an individual Admin
session or all Admin sessions for a user.

This change intentionally invalidates all existing Admin access paths and requires every
administrator to sign in again. Existing Member sessions and the legacy Member refresh
token table remain unchanged.

## Goals

- Remove Admin access and refresh tokens from browser persistent storage.
- Ensure Member or legacy tokens cannot authorize Admin API requests.
- Add refresh credential rotation, revocation, expiry, and reuse detection.
- Make account, role, and permission changes effective immediately.
- Require an explicit permission policy for every Admin route.
- Preserve the existing Member authentication contract and sessions.
- Improve Admin authentication observability without recording secrets.

## Non-goals

- MFA or passkey authentication.
- A user-facing session-management screen.
- Replacing Member authentication or the existing `refresh_tokens` table.
- Disabling public Member registration.
- Moving the entire application to server-side sessions.
- A broad content-security-policy redesign for the public website.

## Current Risks Addressed

- Admin access and refresh tokens are stored in `localStorage`, making them available to
  JavaScript executing in the page.
- Refresh tokens are long-lived bearer JWTs and are not rotated on use.
- Admin routes use the general authentication middleware, so tokens are not bound to an
  Admin-specific audience.
- The dashboard statistics route has authentication but no resource permission.
- Frontend retry behavior does not provide a single shared refresh operation for
  simultaneous failed requests.
- Logout removes local browser state but does not revoke the server-side credential.

## Architecture

### Separate Admin authentication contract

Add the following endpoints under the existing versioned auth group:

- `POST /api/v1/auth/admin/login`
- `POST /api/v1/auth/admin/refresh`
- `POST /api/v1/auth/admin/logout`

The existing Member-compatible endpoints remain available and keep their current
contracts. Admin API routes switch from `AuthRequired` to `AdminAuthRequired`.

An account is eligible for Admin login only when all of these conditions hold:

- the user exists and is active;
- the assigned role exists and is active; and
- the role has the explicit server-owned `admin_access` capability enabled.

Admin eligibility must not be inferred from permission resource names because Member and
Admin permissions currently share resources such as `events` and `gallery`. The explicit
capability permits custom Admin roles without relying on a hard-coded role name.

Failed login responses do not reveal whether the email exists, the password is wrong,
or the account lacks Admin eligibility.

### Admin access token

The Admin access token is a signed JWT with:

- a 10–15 minute configured lifetime;
- an explicit `aud` value of `admin`;
- standard issued-at, expiry, subject, and unique token ID claims; and
- the user identifier required to load current authorization state.

The token is returned in the response body and retained only in the Admin frontend's
in-memory auth state. It is never written to `localStorage`, `sessionStorage`, a
non-HttpOnly cookie, logs, or audit metadata.

`AdminAuthRequired` verifies the accepted signing algorithm, signature, expiry, required
claims, and Admin audience. It then loads the user and role from the database and rejects
inactive or missing records. Permissions come from this current database state, not from
the JWT's role claim.

Member tokens and legacy access tokens without `aud=admin` are rejected by all Admin
routes. The existing general authentication middleware continues serving Member routes.

### Admin refresh credential

The refresh credential combines a non-secret session identifier with at least 256 bits
of cryptographically secure random secret material. Its internal format is opaque to the
browser. The identifier lets the backend locate the session even when a stolen, already
rotated secret is presented; only the secret portion is hashed for comparison. The full
credential is delivered only through a cookie with these properties:

- `HttpOnly`;
- `Secure` outside explicit local development;
- `SameSite=Strict`;
- host-only, with no `Domain` attribute;
- a path restricted to `/api/v1/auth/admin`; and
- an expiry matching the server-side Admin session.

Cookie-using Admin auth endpoints require an allowed `Origin`. Missing origins are
accepted only for explicitly trusted non-browser clients under a documented server
configuration; production browser traffic must provide a matching origin. CORS must use
an explicit allowlist and must not combine credentialed requests with a wildcard origin.

## Backend Components

### `AdminAuthHandler`

The handler parses and validates HTTP input, invokes the service, sets or clears the
cookie, and maps typed service errors to the common API envelope. It contains no database
queries or token lifecycle policy.

### `AdminAuthService`

The service owns:

- Admin eligibility checks;
- password verification;
- access token creation;
- session creation and refresh rotation;
- current-session and all-user-session revocation; and
- reuse detection.

Session mutations use database transactions. Credential generation and hashing are
encapsulated so handlers and models never expose raw credential values.

### `AdminAuthRequired`

The middleware validates the Admin access token, loads current user and role state, and
places the authenticated user in Fiber locals. Existing `PermissionRequired` remains
authoritative for resource actions.

### `AdminOriginGuard`

The guard validates the normalized request origin against the configured allowlist for
Admin login, refresh, and logout. Invalid origins fail with `403` before session work.

### Audit integration

Record security-relevant Admin authentication events:

- successful login;
- failed login with a non-secret normalized reason category;
- logout;
- session revoked;
- refresh credential reuse detected; and
- all sessions revoked because of a password change or account disablement.

Audit data may include user ID when known, request trace ID, coarse client information,
and IP address under the project's retention policy. It must never include credentials,
passwords, JWTs, cookie values, credential hashes, or secret-bearing request bodies.

## Data Model

Add a new reversible numbered migration and matching GORM models for
`admin_sessions` and `admin_session_refresh_history`. Do not modify an existing
migration.

The same migration adds `roles.admin_access BOOLEAN NOT NULL DEFAULT FALSE` and enables
it for the existing `admin`, `editor`, and `accountant` roles. The `member` role remains
false. The GORM role model and frontend role contract expose this capability; only the
backend uses it as an authorization boundary.

The table contains:

- session UUID primary key;
- user UUID foreign key with cascade delete;
- unique current secret hash;
- absolute session expiry;
- nullable revoked timestamp and revocation reason;
- last-used timestamp;
- created and updated timestamps; and
- optional bounded user-agent and IP metadata for security investigation.

The refresh-history table contains a session foreign key, a previously valid secret hash,
and its short grace expiry. It may hold more than one recent hash so three or more tabs
refreshing concurrently do not cause a false reuse alert. Expired history rows are not
valid credentials and are removed by bounded cleanup.

Index actual lookup paths: the session primary key, user ID, session history, and
expiry/revocation cleanup. Hash comparisons use constant-time comparison. Raw credentials
and raw secret material are never persisted.

The migration creates only this Admin-specific structure. It does not delete or alter
Member refresh credentials. Its down migration removes only objects introduced by this
migration.

## Session Flows

### Login

1. Validate origin, request shape, and Admin login rate limit.
2. Normalize the email and load the user and role.
3. Perform password verification and the Admin eligibility check.
4. Return the same `401` message for any credential or eligibility failure.
5. In a transaction, create an Admin session containing only the credential hash.
6. Set the restricted refresh cookie.
7. Return the Admin access token and current user contract.
8. Audit the outcome without secret material.

### Application bootstrap

The Admin frontend starts in an indeterminate loading state. It calls the Admin refresh
endpoint with credentials enabled. A successful response places the new access token and
user in memory. A `401` produces an unauthenticated state and the login screen. Protected
Admin content must not flash before bootstrap finishes.

### Authorized API request

The frontend attaches the in-memory access token as a Bearer token. The backend verifies
the Admin audience and current account state, then `PermissionRequired` checks the
resource action. A permission failure returns `403` without destroying an otherwise valid
session.

### Refresh rotation

1. Validate origin, parse the opaque credential, and hash its secret portion.
2. Lock and load the Admin session by its non-secret session identifier.
3. Generate a new opaque credential.
4. Insert the current hash into refresh history with a short grace expiry, then save the
   new current hash atomically.
5. Set the replacement cookie and return a new access token and current user.

A refresh-history hash received inside the bounded grace window is treated as a
legitimate concurrent refresh and may advance the same session again. Existing unexpired
history rows remain until their own grace expiry, so several concurrent tabs can
complete. A hash that matches neither the current secret nor an in-window history secret
for that session identifier is treated as suspected reuse and revokes the session. The
grace duration is short, configurable, and covered by concurrency tests.

### API retry

Within a browser tab, the frontend maintains one shared refresh promise. Concurrent API
requests receiving `401` wait for that promise and are replayed at most once after a
successful refresh. Refresh and login requests are never recursively retried.

A `403` is surfaced as a permission error and does not trigger refresh. If refresh fails,
the frontend clears in-memory auth state and navigates to the locale-aware Admin login
page.

### Logout and revocation

Logout revokes the current Admin session server-side, clears the cookie using identical
scope attributes, clears frontend memory, and returns a successful idempotent response.
An absent, expired, or already-revoked credential still results in the cookie being
cleared.

Changing a password or disabling an account revokes every Admin session for that user.
Role or permission changes take effect on the next request because authorization state is
loaded from the database. Account disablement is rejected immediately even if session
revocation has not yet completed.

## Authorization Policy

Every route in the `/api/v1/admin` group must declare both Admin authentication and one
of these policies:

- a concrete `PermissionRequired(resource, action)` middleware; or
- an explicit, reviewed exception documented next to the route.

Add the `dashboard:read` permission and apply it to the dashboard statistics endpoint.
Update role seeds, frontend permission types and guards, and relevant API documentation
together. Add a route-policy test that fails when an Admin route is registered without a
permission or explicit exception.

## Rate Limiting and Response Safety

Admin login uses a stricter limit than general login and is keyed by client IP at the API
layer. The deployment edge should apply an additional distributed limit when multiple API
instances are used. Responses use a generic login failure message to prevent account
enumeration. Rate-limit responses use the common error envelope and include a trace ID.

Admin API responses set `Cache-Control: no-store`. Baseline response headers include
`X-Content-Type-Options: nosniff`, a restrictive `Referrer-Policy`, a minimal
`Permissions-Policy`, and framing protection for the Admin surface. Request body limits
and HTTP read, write, and idle timeouts are configured conservatively and verified
against legitimate media-upload requirements rather than applied blindly.

Production startup or deployment validation must reject
`NEXT_PUBLIC_SKIP_ADMIN_AUTH=true`. The bypass remains limited to explicit local UI
review and never changes backend enforcement.

## Error Contract

- Invalid credentials or unavailable Admin access: `401` with one generic message and a
  stable machine-readable code.
- Missing, expired, revoked, or reused Admin session: `401` with a stable code that does
  not reveal token internals.
- Authenticated but insufficient permission: `403`.
- Disallowed origin: `403`.
- Malformed input: `400`.
- Rate limit exceeded: `429`.
- Internal failure: generic `500` with `trace_id`; internal details are logged only on the
  server.

Frontend behavior is based on status and stable error code, never parsing human-readable
messages. Authentication messages added to the UI remain complete in Thai, English, and
German.

## API and Contract Changes

Update `backend/docs/openapi.yaml` for all three Admin auth endpoints, cookie behavior,
request and response schemas, error codes, and Admin bearer requirements. Add or update
strict frontend types in `frontend/src/types/` and keep HTTP access inside the service
boundary.

No Admin component constructs API URLs or imports Axios directly. Components consume the
Admin auth context and permission helpers.

## Testing Strategy

### Backend unit and service tests

- Admin eligibility for active and inactive users and roles.
- Roles with and without the explicit Admin-access capability, including a Member role
  that shares resource permission names.
- Access token audience, expiry, signing algorithm, and required claims.
- Credential generation and one-way hashing.
- Session creation, expiry, rotation, revocation, and reuse detection.
- Grace-window behavior under concurrent refresh attempts.
- Revocation after password change and account disablement.
- Current database permissions overriding token-time role state.
- Generic authentication errors that do not enumerate accounts.

### Middleware and route tests

- Member and legacy tokens cannot enter Admin routes.
- Inactive users and roles are denied.
- `401` and `403` behavior remains distinct.
- Allowed and rejected origins.
- Required cookie attributes on set and clear responses.
- Every Admin route declares a permission or explicit exception.
- Dashboard statistics requires `dashboard:read`.
- Admin responses carry the required no-store and security headers.

### Frontend tests and executable verification

- No Admin credential is written to browser persistent storage.
- Bootstrap loading, authenticated, and unauthenticated states.
- Single-flight refresh and one-time request replay.
- Refresh failure clears state and redirects to the locale-aware login route.
- `403` preserves the session and displays a permission error.
- Logout calls the backend before clearing local state.
- Thai, English, and German authentication messages are present.

The repository does not currently have a working aggregate TypeScript test runner. Add
focused tests where the existing environment can execute them; otherwise verify the
frontend behavior through lint, type-check, build, and documented browser checks, and
report the runner gap.

### Required verification

- `GOCACHE=/private/tmp/wat-profile-go-cache go test ./...`
- `GOCACHE=/private/tmp/wat-profile-go-cache go vet ./...`
- backend build
- frontend lint
- frontend TypeScript type-check
- frontend production build
- migration upgrade on an empty database and a copy of the previous schema
- migration down verification on an isolated non-production database

## Rollout

1. Apply the new Admin session migration before starting the new backend.
2. Deploy the backend with the new endpoints while retaining the Member endpoints.
3. Deploy the frontend that performs Admin bootstrap refresh and keeps access tokens in
   memory.
4. Enforce `AdminAuthRequired` with `aud=admin` on every Admin route.
5. Require all Admin users to sign in again.
6. Monitor authentication failures, refresh reuse, `401`/`403` rates, and server errors
   through non-secret logs and audit events.

The backend and frontend should be released in a coordinated maintenance window because
the enforcement step intentionally rejects the previous Admin token contract. Rollback
uses the previous backend and frontend versions. The new table may remain unused during
rollback; its down migration is applied only after rollback is no longer needed or in a
confirmed non-production environment.

## Acceptance Criteria

- Admin access and refresh credentials never appear in browser persistent storage.
- Only access tokens with a valid Admin audience reach Admin handlers.
- Only users whose active role explicitly enables `admin_access` can obtain or use an
  Admin session.
- The server can revoke the current Admin session and all Admin sessions for a user.
- Refresh credentials rotate, only hashes are persisted, and out-of-window reuse revokes
  the affected session.
- Member authentication and existing Member sessions continue unchanged.
- Account, role, and permission changes affect Admin authorization immediately.
- Dashboard access requires `dashboard:read`.
- Every Admin route has an enforceable, tested permission policy.
- Cookie, origin, CORS, cache, and security-header behavior matches this design.
- OpenAPI and typed frontend contracts match the implemented endpoints.
- Relevant backend and frontend verification commands pass, with any known test-runner
  limitation reported explicitly.
