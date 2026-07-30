# Backend Agent Guide

Applies to `backend/`. Also follow the root `AGENTS.md`.

## Stack and paths

- Go 1.24 module, Fiber v2, GORM, PostgreSQL, zerolog, JWT, Cloudflare R2.
- `cmd/app/main.go`: runtime entry point and global middleware.
- `internal/routes/routes.go`: route registry and permissions.
- `internal/handlers/`: HTTP parsing, response mapping, mutation audit.
- `internal/services/`: domain logic and database access.
- `internal/models/`: GORM models and JSONB value types.
- `internal/middleware/`: authentication and RBAC.
- `migrations/`: versioned SQL; read `../docs/DATABASE.md`.
- `docs/openapi.yaml`: API reference.

## Commands

```bash
go mod download
go run cmd/app/main.go
go build -o bin/server ./cmd/app
go test ./...
go vet ./...
```

If Go cannot write its default cache in the sandbox:

```bash
GOCACHE=/private/tmp/wat-profile-go-cache go test ./...
GOCACHE=/private/tmp/wat-profile-go-cache go vet ./...
```

## Dependency rules

- Register routes only in `internal/routes/routes.go`.
- Apply `AuthRequired` to member/admin groups.
- Apply `PermissionRequired(resource, action)` to every protected admin resource action.
- Handler constructors receive dependencies; do not open database connections in handlers.
- Handlers parse Fiber input, call services, map status codes, and audit mutations.
- New business logic and GORM queries belong in `internal/services/`.
- Existing direct GORM access in dashboard/upload handlers is legacy; do not copy it.
- Models own persistence shape; request-only structures belong in request/contracts files.
- Storage access goes through `internal/storage`, not directly from handlers or services.

## HTTP contracts

- Return success through `utils.SuccessResponse`, `PaginatedResponse`, or
  `MessageResponse`.
- Return failures through `utils.ErrorResponse` so `trace_id` is preserved.
- Treat `gorm.ErrRecordNotFound` separately from internal database errors.
- Validate path/query parameters before calling a service.
- Validate localized rich text before create/update.
- Public list/detail queries must enforce active/published visibility.
- Never return password hashes, refresh tokens, storage secrets, or internal errors.
- Update `docs/openapi.yaml` and frontend contracts with every route/payload change.

## Data and localization

- Use `models.MultiLangText` for localized JSONB text.
- Use `models.LocalizedRichText` for localized Tiptap JSON.
- Preserve `th`, `en`, and `de` keys when normalizing project-owned content.
- Use transactions for multi-record mutations and association replacement.
- Keep ordering explicit for ordered public data.
- Do not rely on GORM AutoMigrate as the production migration workflow.

## Authentication and audit

- JWT secret must come from `JWT_SECRET`; startup must fail when it is missing.
- Frontend permission checks never replace middleware checks.
- Audit admin create/update/delete/bulk operations with the existing audit service.
- Do not log credentials, JWTs, reset tokens, or request bodies containing secrets.
- Keep auth/login/register rate limits intact when moving routes.

## Tests

- Add service tests for query/business behavior.
- Add utility tests for pure validation, token, or formatting logic.
- Use an isolated test database for GORM tests; do not use a developer or production DB.
- API contract changes require handler/integration coverage when a suitable harness exists.
- `TODO: verify` — the repository has no shared HTTP integration-test harness yet.

## Definition of Done additions

- `go test ./...`, `go vet ./...`, and `go build -o bin/server ./cmd/app` pass.
- Route, permission, handler, service, model, migration, OpenAPI, and frontend contract
  changes stay synchronized where applicable.
- New schema behavior follows `../docs/DATABASE.md`.
- No handler introduces direct database access.
