# Public Account Production Lifecycle Implementation Plan

> **For agentic workers:** Execute inline, without subagents, task-by-task.

**Goal:** Harden production account authentication and complete password, email,
closure, reopen, retention, and avatar lifecycles.

**Architecture:** Keep HTTP handlers thin. Configuration validation stays in
`internal/config`; credential and lifecycle transactions live in focused account
services; Fiber routes compose handlers and middleware; frontend account API,
query, component, and locale layers consume typed contracts.

**Tech Stack:** Go/Fiber/GORM/PostgreSQL/R2, Next.js/React/TypeScript/Zod.

## Global Constraints

- Preserve Thai, English, and German copy.
- Add a new reversible numbered migration; never modify migrations 000025-000027.
- Do not log raw credentials, tokens, or account email-change secrets.
- Do not add CI, browser E2E, Docker release changes, or an in-process scheduler.

---

### Task 1: Validate production account configuration

**Files:** config, route setup, startup, account middleware, frontend config,
env examples, deployment documentation.

- [x] Validate `ENV`, public account origin allowlist, HTTPS and Resend in
  staging/production, secret strength, and the public-origin subset relation.
- [x] Pass the validated account origin list directly to account routes and use
  only validated CORS origins at startup.
- [x] Reject production frontend builds that enable account auth without an
  HTTPS API URL.

### Task 2: Persist lifecycle and avatar ownership

**Files:** migration 000028, account models, account profile service, avatar
handler/storage boundary.

- [x] Add `closed_at` and `purge_after` to public-account users and an internal
  avatar object key to account profiles, including suitable due-purge indexes.
- [x] Track uploaded object keys, delete only keys in the authenticated account
  namespace after a replacement, and clear the persisted avatar on closure.

### Task 3: Add credential and email-change services

**Files:** account credential service, action-token/email templates, account
handler and routes, OpenAPI.

- [x] Add password change/add-password with recent authentication, password
  policy, new current access token, and revocation of other sessions.
- [x] Add request/confirm email change with single-use tokens, new-address
  confirmation, old-address notification, and session revocation.

### Task 4: Add closure, reopen, and purge operations

**Files:** account lifecycle service, handler/routes, `cmd/account-retention`,
models, OpenAPI.

- [x] Set a 30-day purge deadline during closure and issue an email-based
  reopen action token without restoring old sessions.
- [x] Make the retention command safely repeatable: delete account-owned data
  and objects, then anonymize the retained security event columns.

### Task 5: Surface lifecycle controls in the public account UI

**Files:** account API/types/schema/queries, security components, locale pages,
all Account message files.

- [x] Add password and email forms plus confirmation/reopen pages.
- [x] Show closure deadline and recovery action; update account status after
  mutations without persisting access tokens outside memory.
- [x] Add matching TH/EN/DE messages and update API reference/contracts.

### Task 6: Verify and document

**Files:** account config/service/handler tests, OpenAPI, env example,
deployment and auth testing docs.

- [x] Run backend tests/vet/build and frontend account tests/lint/type-check.
- [ ] Add targeted unit and handler coverage for security configuration,
  credential tokens, lifecycle transitions, purge anonymization, and avatar
  ownership (deferred per request).
- [ ] Document scheduler invocation, environment variables, migration order,
and manual browser acceptance. CI/E2E remain deferred.
