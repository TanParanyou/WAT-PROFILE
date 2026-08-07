# Account Reauthentication Modal Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. This implementation is being executed inline because the user requested no subagents. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace repeated account-password fields with a reusable, theme-aware public `SiteModal` and a centralized recent-auth flow that works for password and Google-only accounts.

**Architecture:** Add public modal tokens and a portal root inside the `.public-theme` scope, then build a small `SiteModal` primitive with focus and scroll management. Add an account-scoped `AccountReauthProvider`, `useAccountReauth`, and `AccountReauthModal`; sensitive account actions request recent authentication first and never receive a password value. Update backend mutations to trust the fresh recent-auth token rather than accepting repeated password fields.

**Tech Stack:** Next.js 16 App Router, React 19, strict TypeScript, Tailwind CSS 4 semantic public tokens, TanStack Query, Go Fiber, GORM, JWT auth-time claims, next-intl (`th`, `en`, `de`).

## Global Constraints

- Public UI uses `site-*` semantic tokens and never raw colors or Admin `admin-*` tokens.
- Light/Dark/System themes must resolve through `.public-theme` CSS variables; Modal portals must remain inside the public theme scope.
- Public controls remain square-cornered, keyboard accessible, and at least 44px high.
- Password values are submitted only to `/accounts/reauthenticate`, never returned by the hook or sent with action mutations.
- Every changed user-facing message must exist in `th`, `en`, and `de`.
- Existing Admin Modal behavior and files remain unchanged.
- Preserve unrelated dirty-worktree changes and do not commit this pass.

---

### Task 1: Add public modal tokens and a theme-scoped portal root

**Files:**
- Modify: `frontend/src/app/globals.css`
- Modify: `frontend/src/app/[locale]/(client)/layout.tsx`
- Create: `frontend/src/components/public/modal/SiteModalPortal.tsx`

**Interfaces:**
- Produces `SiteModalPortal` that renders into `#public-modal-root` under `.public-theme`.
- Produces `site-overlay` and `site-modal-shadow` semantic utilities for all future public dialogs.

- [x] Add `--public-overlay` and `--public-modal-shadow` to both public light and dark variable blocks and expose them via `@theme inline` as `site-overlay` and `site-modal-shadow`.
- [x] Add `<div id="public-modal-root" />` as the final child of the client layout's `.public-theme` wrapper so portals inherit the active public theme.
- [x] Implement `SiteModalPortal` as a client component that waits for mount, resolves `document.getElementById("public-modal-root")`, and returns `createPortal(children, root)` without falling back to `document.body`.
- [x] Run targeted ESLint and the frontend type-check.

### Task 2: Build the reusable public `SiteModal` primitive

**Files:**
- Create: `frontend/src/components/public/modal/SiteModal.tsx`
- Create: `frontend/src/components/public/modal/index.ts`

**Interfaces:**
- `SiteModalProps`: `open`, `title`, optional `description`, `onClose`, optional `size` (`sm | md`), optional `tone` (`neutral | danger`), `children`, and optional `closeOnOverlayClick`.
- `SiteModal` owns `role="dialog"`, `aria-modal`, generated title/description IDs, focus restoration, Tab trapping, Escape handling, and body overflow restoration.

- [x] Implement a square-cornered shell using `bg-site-canvas`, `border-site-border`, `text-site-foreground`, `shadow-site-modal`, and a `bg-site-overlay` backdrop.
- [x] Keep the shell centered on desktop and bottom-aligned on mobile with `max-w-md`, responsive padding, and a 70vh scrollable body.
- [x] Use one semantic `tone` mapping; `danger` changes the heading marker through theme tokens rather than hard-coded red classes.
- [x] Restore the triggering element's focus on close and trap Tab/Shift+Tab within the dialog while open.
- [x] Disable Escape and overlay close while `busy` state is controlled by the caller; expose no password-specific behavior from this primitive.
- [x] Export the primitive and prop types from `index.ts`.
- [x] Run targeted ESLint and TypeScript checks.

### Task 3: Add account reauthentication state machine and hook

**Files:**
- Create: `frontend/src/features/public/account/reauth/reauth-types.ts`
- Create: `frontend/src/features/public/account/reauth/reauth-intent.ts`
- Create: `frontend/src/features/public/account/hooks/useAccountReauth.ts`
- Create: `frontend/src/features/public/account/components/AccountReauthModal.tsx`
- Create: `frontend/src/features/public/account/components/AccountReauthProvider.tsx`
- Modify: `frontend/src/app/[locale]/(client)/account/page.tsx`

**Interfaces:**
- `ReauthReason`: `change_password | change_email | close_account | unlink_google | link_google`.
- `requireRecentAuth({ reason }): Promise<ReauthResult>` where `ReauthResult` contains only `method` and `authenticatedAt`; it never contains a password.
- Provider owns one active request at a time and rejects cancellation with a typed `AUTH_REAUTH_CANCELLED` client error.

- [x] Implement password mode: show one `PasswordInput`, submit once to `reauthenticateAccount`, and keep invalid-credential errors inside the Modal.
- [x] Implement Google-only mode with a same-origin popup and a short-lived `postMessage` completion intent; the callback never exposes credentials and the popup cannot rotate the shared refresh cookie.
- [x] Localize reason-specific title/body/action/cancel/error copy in `th`, `en`, and `de`.
- [x] Mount `AccountReauthProvider` around `ProfileForm` at the account page boundary so Admin and unrelated public pages do not inherit account state.
- [x] Ensure the provider queues no second request while a Modal is open and never retries the same failed mutation indefinitely.
- [x] Run frontend type-check and targeted account tests after the provider compiles.

### Task 4: Make frontend account mutations recent-auth based

**Files:**
- Modify: `frontend/src/features/public/account/api.ts`
- Modify: `frontend/src/features/public/account/queries.ts`
- Modify: `frontend/src/features/public/account/components/CredentialForms.tsx`
- Modify: `frontend/src/features/public/account/components/ProfileForm.tsx`
- Modify: `frontend/src/features/public/account/hooks/useGoogleAccountLink.ts`
- Modify: `frontend/src/features/public/account/components/AccountProviderMethods.tsx`

**Interfaces:**
- `changePasswordAccount(newPassword)` sends only `new_password`.
- `requestEmailChange(newEmail, locale)` sends only `new_email` and `locale`.
- `closeAccount()` and `unlinkGoogleAccount()` send no password body.
- Credential, close-account, provider-link, and provider-unlink flows call `requireRecentAuth` before their mutation.

- [x] Remove current-password state and inputs from Password Change, Email Change, Close Account, and Provider Methods UI; keep new-password and new-email inputs in their original action sections.
- [x] Trigger the shared Modal only after local field validation and before the protected mutation.
- [x] For close account, retain a destructive confirmation step, then invoke the shared reauth Modal; do not show two password fields.
- [x] Invalidate/update account and provider queries after the protected action succeeds, and clear local drafts on success.
- [x] Preserve Google-only password setup and Google reauth redirect behavior without duplicating inline prompts.
- [x] Update frontend account API tests to assert payloads contain no password fields for protected mutations.

### Task 5: Align backend protected mutation contracts with recent auth

**Files:**
- Modify: `backend/internal/handlers/account_auth_handler.go`
- Modify: `backend/internal/services/account_session_service.go`
- Modify: `backend/internal/services/account_credentials_service.go`
- Modify: `backend/internal/services/account_profile_service.go`
- Modify: `backend/docs/openapi.yaml`
- Modify: `docs/AUTH_TESTING.md`

**Interfaces:**
- `POST /api/v1/account/password` accepts `{ "new_password": string }` and requires an auth token with recent `auth_time`.
- `POST /api/v1/account/email-change` accepts `{ "new_email": string, "locale": string }` and requires recent auth.
- `POST /api/v1/account/close` accepts `{}` and requires recent auth.
- `DELETE /api/v1/account/providers/google` accepts `{}` and requires recent auth plus a password identity.

- [x] Remove password fields from handler request structs and service signatures; keep password verification exclusively in `Reauthenticate`.
- [x] Apply the same recent-auth guard (`auth_time` within 10 minutes) across all four mutations.
- [x] Preserve Google-only rules: adding a password requires fresh Google auth; unlinking Google still requires a password identity.
- [x] Keep security events and error codes stable, including `AUTH_REAUTH_REQUIRED` for stale auth and `AUTH_INVALID_CREDENTIALS` only for the explicit reauth endpoint.
- [x] Update OpenAPI request schemas, descriptions, and examples to match the new bodies.
- [x] Update `AUTH_TESTING.md` with the modal/recent-auth manual flow for ports 3002 and 8082.

### Task 6: Verify the integrated flow

**Files:**
- Verify: all files above; no additional production files.

- [x] Run targeted ESLint and `./node_modules/.bin/tsc --noEmit`.
- [x] Run `npm run test:account` with escalation because `tsx` IPC was blocked by the sandbox.
- [x] Run `GOCACHE=/private/tmp/wat-profile-go-cache go test ./...`, `go vet ./...`, and `go build -o /private/tmp/wat-profile-account-server ./cmd/app` from `backend`.
- [x] Run `git -c core.fsmonitor=false diff --check` for all changed files.
- [ ] Manually verify Light/Dark theme, TH/EN/DE, keyboard focus, cancel/retry, password reauth, Google reauth, and close-account flow at `http://localhost:3002` with API `http://localhost:8082`.
