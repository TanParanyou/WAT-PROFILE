# Build and Deployment

## Verified repository capabilities

| Component | Build | Run |
|---|---|---|
| Frontend | `cd frontend && npm ci && npm run build` | `cd frontend && npm run start` |
| Backend | `cd backend && go build -o bin/server ./cmd/app` | `cd backend && ./bin/server` |
| Backend image | `cd backend && docker build -t wat-profile-api .` | `docker run -p 8080:8080 --env-file backend/.env wat-profile-api` |

The repository does not contain CI workflows, Docker Compose, infrastructure as code,
or a production frontend image. Do not infer a hosting platform from old documents.

## Current blocker

`backend/go.mod` declares Go 1.24, while `backend/Dockerfile` builds with
`golang:1.22-alpine`. The Docker build is not a reliable release path until those
versions are aligned and the image build passes. This document does not change config.

## Runtime ports and endpoints

- Frontend default port: `3000`
- Backend default port: `8080`
- Health check: `/health`
- API base: `/api/v1`
- API reference UI: `/docs`
- OpenAPI asset: `/docs/openapi.yaml`

## Environment names

Frontend:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SKIP_ADMIN_AUTH`
- `NEXT_PUBLIC_WEBSITE_CMS_SOURCE`
- `NEXT_PUBLIC_MEDIA_ALLOWED_ORIGINS` — comma-separated explicit origins for managed
  media (for example `https://media.example.com`). Production builds require at
  least one HTTPS origin; do not use wildcards, paths, or credentials.
- `NEXT_PUBLIC_PUBLIC_ACCOUNT_AUTH_ENABLED` — `true` renders the public account UI
  and the account entry in the navigation (build-time flag)

Backend:

- `PORT`, `ENV`
- `DATABASE_URL`, `DB_AUTO_MIGRATE`, `PREFER_SIMPLE_PROTOCOL`
- `JWT_SECRET`, `JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY`
- `ALLOWED_ORIGINS`
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`, `R2_PUBLIC_URL`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`
- `SMTP_FROM_EMAIL`, `SMTP_FROM_NAME`
- `CONTACT_EMAIL_FROM`, `CONTACT_NOTIFICATION_TO` — Resend sender and operator
  recipient consumed only by `operations-worker` for durable Contact notifications.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`

Public account auth (backend):

- `PUBLIC_ACCOUNT_AUTH_ENABLED` — `true` mounts `/api/v1/accounts/*`, disables the
  legacy anonymous `/auth/register`, and enforces the extra config below
- `PUBLIC_ACCOUNT_FRONTEND_URL` — frontend origin for redirects and email links
- `PUBLIC_ACCOUNT_ALLOWED_ORIGINS` — explicit account cookie/OAuth origins; must be a subset of `ALLOWED_ORIGINS`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URL` — Google OAuth;
  the redirect URL must be registered on the Google console
- `GOOGLE_FLOW_SECRET` — HMAC key signing the OAuth flow cookie
- `AUTH_ACCESS_TOKEN_EXPIRY` (default `15m`), `AUTH_REFRESH_TOKEN_EXPIRY` (default `30d`)
- `AUTH_EMAIL_DELIVERY_MODE` — `capture` (development only; forbidden in production)
  or `resend`; `resend` requires `RESEND_API_KEY` and `ACCOUNT_EMAIL_FROM`
- Group event registration email is dispatched by `operations-worker` even when
  `PUBLIC_ACCOUNT_AUTH_ENABLED=false`. It requires `JWT_SECRET` (at least 32
  bytes), `PUBLIC_ACCOUNT_FRONTEND_URL`, and the configured account email sender.
  The worker stores only an encrypted management-token payload in the outbox and
  never persists the raw token.
- `AUTH_REGISTER_LIMIT`, `AUTH_LOGIN_LIMIT`, `AUTH_VERIFY_RESEND_LIMIT`,
  `AUTH_FORGOT_PASSWORD_LIMIT`, `AUTH_REFRESH_LIMIT`, `AUTH_GOOGLE_LIMIT`,
  `AUTH_AVATAR_UPLOAD_LIMIT`
- `AUTH_SENSITIVE_MUTATION_LIMIT` — optional shared count override for sensitive
  mutation buckets; endpoint windows remain independently defined in code
- `ADMIN_COOKIE_SECURE` — `true` in production (public refresh cookie is `Secure`
  when the environment is production)

Never place real values in this file or committed env examples.

## Production invariants

- Set `NEXT_PUBLIC_SKIP_ADMIN_AUTH=false`.
- Set `NEXT_PUBLIC_WEBSITE_CMS_SOURCE=api`.
- Point `NEXT_PUBLIC_API_URL` to the deployed backend origin.
- Set `DB_AUTO_MIGRATE=false`; apply SQL migrations before application startup.
- Use a non-default `JWT_SECRET` and explicit admin seed credentials.
- Restrict `ALLOWED_ORIGINS` to deployed frontend origins.
- Provide R2 credentials only to the backend runtime.
1. Configure the exact managed-media origin and R2/CDN CORS for image `GET` and
   `HEAD` requests from every deployed frontend origin. Verify the response
   includes `Content-Type`; avoid `*` when credentials or an allowlist is required.
2. Set `NEXT_PUBLIC_MEDIA_ALLOWED_ORIGINS` to that same `R2_PUBLIC_URL` origin
   (or its CDN).
3. Only then build and deploy the frontend. Rebuild whenever the media allowlist
   changes.
- Run one migration executor per release.

## Public account auth invariants

- Both feature flags are disabled by default. Enable the backend flag first, then the
  frontend flag, then run the browser acceptance in `docs/AUTH_TESTING.md`.
- Migration `000025_add_public_account_auth` is a prerequisite and is applied by the
  normal release migration step. It **aborts** if case-insensitive duplicate emails
  exist, so resolve duplicates before releasing.
- Migration `000033_add_account_avatar_cleanup` adds the retry queue for old avatar
  objects. Apply it before deploying code that replaces account avatars; otherwise
  a replacement request will fail closed rather than losing the old object key.
- Refresh tokens live only in the HttpOnly `wat_public_refresh` cookie (Path
  `/api/v1/accounts`, SameSite=Lax); only their SHA-256 hashes are stored. Access
  tokens are short-lived (15m default) and carry audience `public-account`.
- Public access tokens are rejected by the Admin API; Admin tokens are rejected by the
  public-account API. Public accounts never create or modify `members` rows.
- In production `AUTH_EMAIL_DELIVERY_MODE` must be `resend` (`capture` is forbidden)
  and the frontend/redirect URLs must be HTTPS.
- When public account auth is enabled, `ENV` must be `development`, `staging`, or
  `production`; staging and production require HTTPS origins, Resend delivery,
  Secure cookies, and a non-placeholder 32-byte JWT secret.
- Rate-limit surfaces are configured independently and share the `AUTH_RATE_LIMITED`
  error envelope.
- Sensitive authenticated mutations (reauthentication, password/email changes,
  account closure, and provider unlink) have independent limits. Keep the
  defaults unless an abuse review justifies a change; increasing one limit does
  not increase any other surface.

## Release order

1. Build frontend and backend from the same revision.
2. Back up the target PostgreSQL database.
3. Apply reviewed migrations with `go run cmd/migrate/main.go up`.
4. Deploy the backend and verify `/health`.
5. Deploy `operations-worker` with `JWT_SECRET`, `PUBLIC_ACCOUNT_FRONTEND_URL`,
   `RESEND_API_KEY`, `ACCOUNT_EMAIL_FROM`, `CONTACT_EMAIL_FROM`, and
   `CONTACT_NOTIFICATION_TO`; verify it can claim and retry outbox jobs.
6. Deploy the frontend with the matching API URL.
7. Smoke-test public reads, admin login, one permission-restricted route, Contact
   submission/outbox creation, and media access.
8. Verify error logs contain trace IDs and no secrets.

## Contact notifications

- Set `RESEND_API_KEY`, `CONTACT_EMAIL_FROM`, and `CONTACT_NOTIFICATION_TO` only in
  the backend/worker environment; the frontend must not contain email provider keys.
- Apply migration `000042_add_contact_communication_locale` before serving the new
  Contact form, then deploy the backend and operations worker before the frontend.
- A successful Contact API response means one `contact_inquiries` row and one
  `contact.notification` outbox row committed together.
- Resend failure leaves the inquiry intact and the outbox job failed/retryable.
- The removed `/api/send-email` route must remain absent (404); no browser-side
  provider call is part of the production Contact flow.

Public account rollout (after the baseline steps above):

1. Keep both flags `false`, deploy schema + backend.
2. Configure `PUBLIC_ACCOUNT_FRONTEND_URL`, Google credentials, email delivery, and
   cookie/origin settings in the test environment.
3. Enable `PUBLIC_ACCOUNT_AUTH_ENABLED=true` and verify `/api/v1/accounts/*` responses,
   Admin login regression, and Admin isolation (public token rejected on `/admin/*`).
4. Enable `NEXT_PUBLIC_PUBLIC_ACCOUNT_AUTH_ENABLED=true` on the frontend and run the
   full browser acceptance in `docs/AUTH_TESTING.md` (password + Google flows, session
   rotation/reuse, recovery, closure, TH/EN/DE, keyboard, mobile).
5. Product owner approval before enabling the account entry in production navigation.

Account retention: run `go run ./cmd/account-retention` from `backend/` daily
with the production environment and R2 credentials. The command is idempotent,
deletes due closed accounts after 30 days, retries queued avatar-object cleanup,
and anonymizes retained security events. Use a single scheduler lock so two
retention runs cannot overlap. Keep secrets in the service environment rather
than in crontab; for example:

```cron
15 2 * * * cd /srv/wat-profile/backend && flock -n /run/wat-profile-account-retention.lock go run ./cmd/account-retention >> /var/log/wat-profile/account-retention.log 2>&1
```

Operations outbox: run `go run ./cmd/operations-worker` from `backend/` every
minute. It claims email and media-retention jobs with row locks, retries failed
jobs using exponential backoff, and records the final error in PostgreSQL. The
daily media purge job is deduplicated by date, so the worker may safely be run
more than once:

Production must set `AUTH_EMAIL_DELIVERY_MODE=resend`, `RESEND_API_KEY`, and
`ACCOUNT_EMAIL_FROM`; the worker refuses to use the development capture sender
in production.

```cron
* * * * * cd /srv/wat-profile/backend && flock -n /run/wat-profile-operations.lock go run ./cmd/operations-worker >> /var/log/wat-profile/operations.log 2>&1
```

## Rollback

- To disable the module, disable the frontend flag first, then the backend flag. The
  module refuses to mount when the backend flag is off (404), and legacy anonymous
  `/auth/register` is restored.
- Production rollback never runs destructive down migrations; it only disables flags.
  Accounts, sessions, and security events are retained and sign-in simply stops.


## Required checks

```bash
cd frontend && npm run lint
cd frontend && ./node_modules/.bin/tsc --noEmit
cd frontend && npm run build
cd backend && go test ./...
cd backend && go vet ./...
cd backend && go build -o bin/server ./cmd/app
```

Frontend automated tests are not release-gating because no working runner is configured.
Report this gap; do not claim the tests passed.

## TODO: team confirmation

- Confirm frontend/backend hosting platforms, domains, TLS, and rollback owner.
- Confirm secret manager, log sink, uptime monitoring, and alerting.
- Confirm PostgreSQL backup/restore drill and retention.
- Align Docker Go version with `backend/go.mod`.
- Add CI for the required checks and migration validation.
- Add `NEXT_PUBLIC_API_URL` to the committed frontend env example.
