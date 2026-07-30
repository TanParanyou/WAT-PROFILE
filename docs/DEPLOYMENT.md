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

## Release order

1. Build frontend and backend from the same revision.
2. Back up the target PostgreSQL database.
3. Apply reviewed migrations with `go run cmd/migrate/main.go up`.
4. Deploy the backend and verify `/health`.
5. Deploy the frontend with the matching API URL.
6. Smoke-test public reads, admin login, one permission-restricted route, and media access.
7. Verify error logs contain trace IDs and no secrets.

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
