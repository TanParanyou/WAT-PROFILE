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
- `NEXT_PUBLIC_PUBLIC_ACCOUNT_AUTH_ENABLED` — `true` renders the public account UI
  and the account entry in the navigation (build-time flag)
- `RESEND_API_KEY` is server-only despite living in the frontend application.
- `EMAIL_FROM`
- `CONTACT_EMAIL`

Backend:

- `PORT`, `ENV`
- `DATABASE_URL`, `DB_AUTO_MIGRATE`, `PREFER_SIMPLE_PROTOCOL`
- `JWT_SECRET`, `JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY`
- `ALLOWED_ORIGINS`
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`, `R2_PUBLIC_URL`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`
- `SMTP_FROM_EMAIL`, `SMTP_FROM_NAME`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`

Public account auth (backend):

- `PUBLIC_ACCOUNT_AUTH_ENABLED` — `true` mounts `/api/v1/accounts/*`, disables the
  legacy anonymous `/auth/register`, and enforces the extra config below
- `PUBLIC_ACCOUNT_FRONTEND_URL` — frontend origin for redirects and email links
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URL` — Google OAuth;
  the redirect URL must be registered on the Google console
- `GOOGLE_FLOW_SECRET` — HMAC key signing the OAuth flow cookie
- `AUTH_ACCESS_TOKEN_EXPIRY` (default `15m`), `AUTH_REFRESH_TOKEN_EXPIRY` (default `30d`)
- `AUTH_EMAIL_DELIVERY_MODE` — `capture` (development only; forbidden in production)
  or `resend`; `resend` requires `RESEND_API_KEY` and `ACCOUNT_EMAIL_FROM`
- `AUTH_REGISTER_LIMIT`, `AUTH_LOGIN_LIMIT`, `AUTH_VERIFY_RESEND_LIMIT`,
  `AUTH_FORGOT_PASSWORD_LIMIT`, `AUTH_REFRESH_LIMIT`, `AUTH_GOOGLE_LIMIT`,
  `AUTH_AVATAR_UPLOAD_LIMIT`
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
- Run one migration executor per release.

## Public account auth invariants

- Both feature flags are disabled by default. Enable the backend flag first, then the
  frontend flag, then run the browser acceptance in `docs/AUTH_TESTING.md`.
- Migration `000025_add_public_account_auth` is a prerequisite and is applied by the
  normal release migration step. It **aborts** if case-insensitive duplicate emails
  exist, so resolve duplicates before releasing.
- Refresh tokens live only in the HttpOnly `wat_public_refresh` cookie (Path
  `/api/v1/accounts`, SameSite=Lax); only their SHA-256 hashes are stored. Access
  tokens are short-lived (15m default) and carry audience `public-account`.
- Public access tokens are rejected by the Admin API; Admin tokens are rejected by the
  public-account API. Public accounts never create or modify `members` rows.
- In production `AUTH_EMAIL_DELIVERY_MODE` must be `resend` (`capture` is forbidden)
  and the frontend/redirect URLs must be HTTPS.
- Rate-limit surfaces are configured independently and share the `AUTH_RATE_LIMITED`
  error envelope.

## Release order

1. Build frontend and backend from the same revision.
2. Back up the target PostgreSQL database.
3. Apply reviewed migrations with `go run cmd/migrate/main.go up`.
4. Deploy the backend and verify `/health`.
5. Deploy the frontend with the matching API URL.
6. Smoke-test public reads, admin login, one permission-restricted route, and media access.
7. Verify error logs contain trace IDs and no secrets.

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
