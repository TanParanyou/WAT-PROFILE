# Public Account Auth — Testing and Acceptance

This guide exercises the public account module (password and Google sign-in) end to end,
including session rotation, recovery, closure, Admin isolation, and the three locales.

The module is feature-gated on both sides. Enable it only in a dedicated test environment
until the rollout checklist in `docs/DEPLOYMENT.md` is complete.

## 1. Local environment

### Backend

Copy `backend/.env.example` to `backend/.env` and set:

| Variable | Required | Purpose |
|---|---|---|
| `PUBLIC_ACCOUNT_AUTH_ENABLED` | yes | `true` mounts the `/api/v1/accounts/*` routes and disables legacy `/auth/register` |
| `PUBLIC_ACCOUNT_FRONTEND_URL` | yes | Frontend origin used for redirects and email links, e.g. `http://localhost:3002` |
| `PUBLIC_ACCOUNT_ALLOWED_ORIGINS` | yes | Explicit account cookie origins; in local development use `http://localhost:3002` |
| `GOOGLE_CLIENT_ID` | yes | Google OAuth client id |
| `GOOGLE_CLIENT_SECRET` | yes | Google OAuth client secret |
| `GOOGLE_REDIRECT_URL` | yes | Registered callback, e.g. `http://localhost:8082/api/v1/accounts/google/callback` |
| `GOOGLE_FLOW_SECRET` | yes | HMAC key signing the OAuth flow cookie |
| `AUTH_EMAIL_DELIVERY_MODE` | yes | `capture` (dev) or `resend` (test/prod). `capture` is forbidden in production |
| `RESEND_API_KEY` | if `resend` | Resend API key |
| `ACCOUNT_EMAIL_FROM` | if `resend` | Verified sender address |
| `AUTH_ACCESS_TOKEN_EXPIRY` | no | Access token TTL (default `15m`) |
| `AUTH_REFRESH_TOKEN_EXPIRY` | no | Refresh token TTL (default `30d`) |
| `AUTH_REGISTER_LIMIT` / `AUTH_LOGIN_LIMIT` / `AUTH_VERIFY_RESEND_LIMIT` / `AUTH_FORGOT_PASSWORD_LIMIT` / `AUTH_REFRESH_LIMIT` / `AUTH_GOOGLE_LIMIT` / `AUTH_AVATAR_UPLOAD_LIMIT` | no | Existing per-surface rate limits |
| `AUTH_SENSITIVE_MUTATION_LIMIT` | no | Optional shared count override for sensitive mutation buckets; endpoint windows remain separate |
| `ADMIN_COOKIE_SECURE` | prod | `true` in production |

Placeholders only in this document — never real secrets.

Development convenience: `AUTH_EMAIL_DELIVERY_MODE=capture` writes every outgoing email
to the backend log with a `[captured-email]` marker instead of sending it. Use the
`ActionURL`/`token` from the captured message to complete verify/reset/link flows.

### Frontend

Copy `frontend/.env.example` to `frontend/.env.local` and set:

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_PUBLIC_ACCOUNT_AUTH_ENABLED` | yes | `true` renders account pages, navigation, and the Google flows |
| `NEXT_PUBLIC_API_URL` | yes | Backend origin, e.g. `http://localhost:8082` |

Both flags must be `true` for the flows below.

### Database

```bash
docker run -d --name wat-profile-migrate-test \
  -e POSTGRES_PASSWORD=testpass \
  -p 55433:5432 postgres:16-alpine

DATABASE_URL_TEST="postgres://postgres:testpass@127.0.0.1:55433/wat_profile_test?sslmode=disable"
```

Apply the complete versioned schema to a disposable database before each acceptance pass
so no state leaks between runs:

```bash
createdb wat_profile_test  # once
cd backend && DATABASE_URL="$DATABASE_URL_TEST" go run cmd/migrate/main.go up
```

For migrations that have down files, verify both directions on a copy of the prior schema
(`go run cmd/migrate/main.go up` then `down`) per `docs/DATABASE.md`.

### Backend Go toolchain

The backend pins Go 1.25 (`go.mod`) and depends on modern `x/crypto`/`x/net`/`x/sys`.
Use a Go toolchain that satisfies that directive:

```bash
export GOTOOLCHAIN=local
export GOCACHE=/private/tmp/wat-profile-go-cache   # example scratch cache
go test ./internal/accountauth ./internal/services -run 'TestSecurityEvent|TestCoarseIPPrefix'
```

## 2. Start the applications

```bash
make be-dev                              # http://localhost:8082
make fe-dev                              # http://localhost:3002
```

Verify:

- `http://localhost:8082/health` returns 200.
- `http://localhost:8082/docs` renders the API reference.
- `http://localhost:8082/api/v1/accounts/register` exists when the backend flag is on,
  and returns 404 when it is off.

## 3. Password flow (browser)

1. Open `http://localhost:3002/en/register`. Fill display name, email, password
   (12–128 characters). Submit.
2. Expect the generic "verification email sent" screen (no account-existence leak).
3. In capture mode, copy the verification `ActionURL` from the backend log and open it
   in the same browser.
4. Expect the "email verified" screen with a sign-in link.
5. Sign in at `/en/account/login`. Expect the refresh cookie `wat_public_refresh`
   (HttpOnly, SameSite=Lax) and an access token in the body only.
6. Expect redirect to the account page showing email, status `Active`, and providers.
7. Edit the display name and preferred locale; save; expect the updated values.
8. From Security, change the password and request an email change. Each protected
   action opens the shared confirmation modal: password accounts enter the current
   password there, while Google-only accounts complete Google reauthentication.
   Confirm the new email link and verify other sessions are revoked.
9. Open `/en/account/sessions`; expect the current session flagged `Current`.
10. Sign in from a second browser; expect two sessions. Revoke the second session and
   confirm it disappears.
11. Click "Sign out". Expect the refresh cookie cleared and the profile page gone.
12. Repeat the flow at `/th/register` and `/de/register` (see Locale checks).

### Session rotation and reuse detection

1. Sign in and note the refresh cookie.
2. Open the browser's Application → Cookies and delete the refresh cookie.
3. Use an old captured refresh token (or replay the last `/accounts/refresh` request):
   expect a session-family revoke, and every refresh attempt afterwards returns
   `AUTH_TOKEN_INVALID_OR_EXPIRED`.

### Password recovery

1. On the login page choose "Forgot password".
2. Expect a generic response. In capture mode, copy the reset `ActionURL`.
3. Open the link, set a new password (12–128). Expect success and a sign-in link.
4. Sign in with the new password. Old sessions are revoked.
5. Keep an old access token from before the reset and call a protected account
   endpoint. Expect `401 AUTH_TOKEN_INVALID_OR_EXPIRED`, not a successful read.
6. Request recovery for an unregistered email: expect the same generic response as
   step 2 (no existence leak).

## 4. Google flow (browser)

Prerequisites: the backend `GOOGLE_REDIRECT_URL` must be registered on the Google OAuth
console, and the browser must have a Google test account available.

1. On `/en/register` click "Continue with Google". Expect redirect to Google.
2. Approve. Back on the frontend expect:
   - A brand-new email → an active account is created (no member record) and you are
     signed in.
   - An email already used by a password account → the "approval sent" screen. Check the
     email inbox (or capture log) for the single-use link-approval token.
3. Open the link-approval URL. Expect the link-confirm screen, then a session.
4. Attempt to reuse the same link-approval URL: expect an invalid-token screen.
5. In another tab, try to sign in with Google using the same Google account: expect
   sign-in (identity already linked) — never a silent takeover of the password account.
6. For a closed account, attempt Google sign-in again. Expect the callback to return
   to the same locale's login page with a localized disabled-account message and a
   link to request account recovery.

If the live Google console cannot be reached in this environment, run the mocked Google
suite instead and leave the live OAuth acceptance item unchecked:

```bash
cd backend && GOTOOLCHAIN=local GOCACHE=/private/tmp/wat-profile-go-cache \
  go test ./internal/handlers ./internal/middleware \
  -run 'Test(AccountGoogle|PublicAccount|LoginSets|Account)' -count=1
```

## 5. Closed and disabled accounts

1. With a fresh session, open `/en/account`, scroll to "Close account", click the
   destructive action, and complete the shared recent-auth modal (password or Google).
   Expect the account closed screen, a 30-day deletion date,
   a recovery-link action, and all sessions revoked.
2. Try to sign in again with that email: expect a generic invalid-credentials response.
3. Open `/en/account/reopen-request`, submit the original email, and open the
   single-use link. Expect the account active again without restoring old sessions.
   Reuse the access token captured before closure and confirm it still receives
   `401 AUTH_TOKEN_INVALID_OR_EXPIRED` after reopening.
4. From the database (test only), set a second account `account_status='disabled'` and
   try to sign in: expect the disabled screen without security details.
5. Confirm no `members` row was created for any public account:

   ```sql
   SELECT count(*) FROM members m
   JOIN users u ON u.id = m.user_id
   WHERE u.email IN ('<public-account-emails>');
   ```

## 6. Admin isolation and legacy regression

1. Sign in to the Admin panel at `/admin` with an Admin user. Expect the dashboard.
2. Take the public-account access token and call a protected Admin route, e.g.
   `GET /api/v1/admin/dashboard/stats` with `Authorization: Bearer <public-token>`.
   Expect 401 — the audience `public-account` is rejected.
3. Take an Admin token and call `GET /api/v1/account`: expect 401 — Admin tokens do
   not satisfy the public-account middleware.
4. With `PUBLIC_ACCOUNT_AUTH_ENABLED=true`, `POST /api/v1/auth/register` returns 404
   (legacy anonymous register disabled); Admin login at `/auth/admin/login` still works.
5. Open the CMS editor and confirm normal Admin content operations are unchanged.

## 7. Locale, mobile, and keyboard checks

- TH/EN/DE: complete the password flow at `/th/*`, `/en/*`, `/de/*`; confirm all form
  labels, validation messages, error codes, and success screens are translated and that
  the message trees match (`npm run test:account` covers tree parity).
- Mobile: at 375px width verify account pages, the session list, and the navigation
  render without horizontal scroll; the account login/profile entry appears in the
  hamburger menu.
- Keyboard: verify each form is completable with Tab only; the error summary receives
  focus after a failed submit; buttons show visible focus rings.

## 8. Admin Account Operations

Use a disposable public account and an Admin role with the new
`account_operations` permission. Keep `DB_AUTO_MIGRATE=false` in staging and apply
the migration explicitly before testing.

1. A role without `account_operations` cannot see the public-account sidebar item and
   receives 403 from every `/api/v1/admin/account-operations*` endpoint.
2. A role with `account_operations:read` can list, view, and inspect events, but
   receives 403 for disable, enable, and logout-all.
3. Disable an active verified account with `security_review`. Confirm all public
   sessions are revoked and public login/refresh returns `AUTH_ACCOUNT_DISABLED`.
4. Enable the same verified disabled account. Confirm no old session is restored and
   a fresh normal sign-in works.
5. Force sign-out an active account. Confirm its status remains active, the old access
   token is rejected, and a fresh sign-in works.
6. Open a closed account in the panel. Confirm `purge_after` is visible but there is
   no Admin reopen, delete, or purge action; owner recovery remains email-only.
7. Confirm the security-event API and drawer never expose IP prefix, trace ID,
   metadata, credentials, tokens, or raw user-agent data.
8. Confirm Audit Logs records exactly one `account_operations.*` action with only the
   allow-listed reason and status transition.

## 9. Automated suite

```bash
cd backend && GOTOOLCHAIN=local GOCACHE=/private/tmp/wat-profile-go-cache go test ./... -p 1
cd backend && GOTOOLCHAIN=local GOCACHE=/private/tmp/wat-profile-go-cache go vet ./...
cd backend && GOTOOLCHAIN=local GOCACHE=/private/tmp/wat-profile-go-cache go build -o bin/server ./cmd/app
cd frontend && npm run test:account
cd frontend && npm run lint
cd frontend && ./node_modules/.bin/tsc --noEmit
cd frontend && npm run build
```

`go test ./...` runs packages serially with `-p 1` because the shared persistent test
database is truncated by the services package between runs (pre-existing limitation).

## 10. Cleanup

- Stop the backend and frontend processes.
- Drop the disposable database: `dropdb wat_profile_test` (or remove the container).
- Remove the captured-email log, any test `.env` overrides, and the Google test account
  authorizations in the Google console.
- Restore `PUBLIC_ACCOUNT_AUTH_ENABLED=false` and
  `NEXT_PUBLIC_PUBLIC_ACCOUNT_AUTH_ENABLED=false` in any non-test environment.
