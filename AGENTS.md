# AI Agent Guide

## Repository

WAT-PROFILE is a full-stack monorepo for a multilingual (`th`, `en`, `de`) temple
website, Admin Panel, and Website CMS.

| Path | Scope |
|---|---|
| `frontend/` | Next.js public site and admin application |
| `backend/` | Go API, domain services, auth/RBAC, storage |
| `backend/migrations/` | Ordered PostgreSQL migrations |
| `backend/docs/openapi.yaml` | API reference; keep aligned with routes |
| `docs/` | Database and deployment operations |
| `PRODUCT.md` | Product goals, audience, content principles |
| `DESIGN.md` | Visual tokens and UI constraints |

## Read scope

Read only the documents required by the task:

- Any code change: read this file first.
- Frontend change: read `frontend/AGENTS.md`.
- Backend or API change: read `backend/AGENTS.md`.
- Cross-boundary or architecture change: read `ARCHITECTURE.md`.
- Schema, migration, seed, or query change: read `docs/DATABASE.md`.
- Build, runtime env, Docker, or release change: read `docs/DEPLOYMENT.md`.
- Product behavior or copy decision: read `PRODUCT.md`.
- Public UI or design-system change: read `DESIGN.md`.
- Do not load `docs/superpowers/` plans/specs unless the task names an exact file.

Nested `AGENTS.md` files add rules; they do not replace this file.

## Commands

Run commands from the repository root unless the command starts with `cd`.

| Task | Command |
|---|---|
| Install all | `make install` |
| Install frontend reproducibly | `cd frontend && npm ci` |
| Download backend modules | `cd backend && go mod download` |
| Run both dev servers | `make dev` |
| Run frontend only | `make fe-dev` |
| Run backend only | `make be-dev` |
| Build frontend | `make fe-build` |
| Build backend | `make be-build` |
| Test backend | `cd backend && go test ./...` |
| Lint frontend | `make fe-lint` |
| Vet backend | `cd backend && go vet ./...` |
| Type-check frontend | `cd frontend && ./node_modules/.bin/tsc --noEmit` |

- Frontend has TypeScript test files but no working aggregate test command.
- `make be-migrate` is incomplete because the migration CLI requires a subcommand.
- Use the explicit migration commands in `docs/DATABASE.md`.
- If the sandbox blocks the Go cache, prefix Go verification with
  `GOCACHE=/private/tmp/wat-profile-go-cache`.

## Repository-wide rules

- Preserve the `th`, `en`, and `de` variants of localized data and messages.
- Keep HTTP contracts typed on both sides of the boundary.
- Do not use TypeScript `any`, `as any`, or `@ts-ignore`; use `unknown` and narrow it.
- Update `backend/docs/openapi.yaml` when an API route or payload changes.
- Keep secrets only in ignored env files; examples contain placeholders only.
- Add dependencies only when existing libraries cannot satisfy the requirement.
- Follow the existing formatter/style of the touched file; do not reformat unrelated code.
- Keep user-facing communication in Thai unless the user requests another language.
- Treat source/config as authoritative when documentation disagrees with runtime behavior.

## Do not

- Do not edit or commit `.env`, `.env.local`, tokens, passwords, or production URLs.
- Do not commit `.next/`, `node_modules/`, `backend/bin/`, binaries, logs, or caches.
- Do not call PostgreSQL directly from frontend code.
- Do not bypass backend authentication or `PermissionRequired` for admin routes.
- Do not edit an existing numbered migration after it has been shared or deployed.
- Do not enable `NEXT_PUBLIC_SKIP_ADMIN_AUTH` outside isolated local UI review.
- Do not use `make be-migrate` until its missing subcommand handling is fixed.
- Do not treat old plans, generated critiques, or local agent artifacts as source of truth.

## Definition of Done

- The change stays within the requested scope and leaves unrelated user changes intact.
- Relevant build, lint, type-check, test, and vet commands above pass.
- New behavior has tests where a working runner exists; otherwise report the test gap.
- API changes update routes, typed clients, permissions, and OpenAPI together.
- Schema changes include a new reversible migration and matching GORM model changes.
- UI copy and localized content remain complete for `th`, `en`, and `de`.
- No secret, generated artifact, debug code, or unrelated formatting appears in the diff.
- Documentation is updated only at its designated source of truth.
