# Architecture

## System context

WAT-PROFILE serves a multilingual public website and a protected Admin Panel.
The frontend talks to one Go API; the API owns database and object-storage access.

```text
Browser
  -> Next.js App Router
     -> Axios service / TanStack Query
        -> Go Fiber /api/v1
           -> auth + permission middleware
              -> handler -> service -> GORM -> PostgreSQL
                                    -> R2 for media objects
```

## Runtime components

| Component | Entry point | Responsibility |
|---|---|---|
| Frontend | `frontend/src/app/` | Routes, rendering, admin workflows |
| API | `backend/cmd/app/main.go` | Middleware, health/docs, runtime lifecycle |
| Route registry | `backend/internal/routes/routes.go` | Public/auth/member/admin endpoints |
| Database | `backend/internal/config/config.go` | GORM connection and optional AutoMigrate |
| Migration CLI | `backend/cmd/migrate/main.go` | Versioned SQL migration execution |
| Seed CLI | `backend/cmd/seed/main.go` | Roles, admin, settings, CMS seed |
| Object storage | `backend/internal/storage/r2.go` | R2 upload/delete operations |

## Frontend boundaries

- `src/app/[locale]/(client)/` owns public routes.
- `src/app/[locale]/admin/` owns protected admin routes.
- `src/components/` renders UI; components do not own HTTP transport.
- `src/features/public/<domain>/api.ts` owns public request functions.
- `src/features/public/<domain>/queries.ts` owns query keys and TanStack Query hooks.
- `src/services/` owns shared/admin Axios calls and token refresh.
- `src/schemas/` owns Zod form validation.
- `src/types/` owns shared client contracts.
- `src/stores/` holds editor UI state, not server records.
- `src/data/` contains fixtures/fallbacks, not the production persistence layer.

The API base is `NEXT_PUBLIC_API_URL` or `http://localhost:8080`.
The frontend utilizes separated HTTP clients based on security context:
- **`src/services/adminApi.ts`**: Dedicated HTTP client for all **Admin Panel** requests (`/api/v1/admin/*`). Attaches Admin access token stored in memory (`adminAuthStore.ts`) and uses cookie-based single-flight refresh via `/auth/admin/refresh`.
- **`src/services/api.ts`**: Dedicated HTTP client for **Public Authenticated Member / User Account** requests (`/api/v1/member/*`, `/api/v1/community/*`, `/api/v1/account/*`), reading tokens from `localStorage` and refreshing via `/auth/refresh`.
- **`src/services/publicService.ts`**: Anonymous HTTP client for `/api/v1/public/*` requests.

## Backend boundaries

- `internal/routes/` maps endpoints and permission middleware.
- `internal/handlers/` parses HTTP input, maps errors, calls services, and audits mutations.
- `internal/services/` owns domain operations and GORM queries.
- `internal/models/` owns persisted models and JSONB value types.
- `internal/middleware/` owns JWT context and RBAC checks.
- `internal/publiccontent/`, `internal/richtext/`, `internal/seo/`, and
  `internal/eventalert/` contain focused domain policies.
- `pkg/utils/response.go` defines the common response envelope.

New database access belongs in a service. Existing direct GORM access in
`dashboard_handler.go` and `upload_handler.go` is legacy, not a pattern to copy.

## API groups

| Prefix | Access |
|---|---|
| `/api/v1/public` | Anonymous reads and public submissions |
| `/api/v1/auth` | Register, login, refresh, current user |
| `/api/v1/member` | Authenticated member operations |
| `/api/v1/admin` | Authenticated operations with per-resource permissions |

Successful responses use `{ "success": true, "data": ... }` or `message`.
Errors use `{ "success": false, "error": "...", "trace_id": "..." }`.

## Content and localization

- Supported locale keys are exactly `th`, `en`, and `de`.
- `next-intl` routing always prefixes the locale; default locale is `th`.
- Frontend request time zone is `Europe/Berlin`.
- Backend localized text is PostgreSQL JSONB via `models.MultiLangText`.
- Rich text is localized Tiptap JSON via `models.LocalizedRichText`.
- Fixed public-content endpoints serve About, Contact, Privacy, and Impressum.
- Structured CMS pages use draft fields plus published snapshots.
- Public CMS reads return published active data only.
- Some public services retain local JSON fallback controlled by frontend env.

## State ownership

| State | Owner |
|---|---|
| PostgreSQL records | Backend services/GORM |
| Remote request cache | TanStack Query |
| Form state | React Hook Form |
| Form validation | Zod plus backend validation |
| CMS editor view state | Zustand |
| Auth tokens | Browser local storage via auth service |
| Uploaded binary objects | R2; metadata remains in PostgreSQL |

## Security boundaries

- Backend middleware is authoritative; frontend permission guards are UX only.
- Every admin resource action must use `PermissionRequired(resource, action)`.
- JWT access and refresh tokens have separate lifetimes.
- Login, registration, and public contact routes are rate limited.
- Rich text must be validated before persistence and sanitized before HTML rendering.
- Never expose backend secrets through `NEXT_PUBLIC_*`.

## Source of truth

| Concern | Source |
|---|---|
| Agent commands and global rules | `AGENTS.md` |
| Runtime boundaries | This file |
| Product behavior | `PRODUCT.md` |
| UI tokens | `DESIGN.md` |
| Frontend conventions | `frontend/AGENTS.md` |
| Backend conventions | `backend/AGENTS.md` |
| Registered routes | `backend/internal/routes/routes.go` |
| API reference | `backend/docs/openapi.yaml` |
| Client contracts | `frontend/src/types/`, `frontend/src/features/public/` |
| Database operations | `docs/DATABASE.md` |
| Release operations | `docs/DEPLOYMENT.md` |

## Known architecture gaps

- OpenAPI does not yet cover every registered route.
- Frontend TypeScript tests have no configured aggregate runner.
- GORM AutoMigrate and versioned SQL migrations coexist; production must not use both
  as competing migration authorities.
- Docker builder Go version does not match `backend/go.mod`.
