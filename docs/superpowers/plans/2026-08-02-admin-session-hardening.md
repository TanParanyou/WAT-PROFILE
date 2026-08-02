# Admin Session Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the Admin Panel a dedicated, revocable authentication flow with in-memory access tokens, rotating HttpOnly refresh credentials, current RBAC enforcement, and no change to Member sessions.

**Architecture:** Add an Admin-only auth boundary beside the existing Member auth flow. The browser holds a short-lived `aud=admin` JWT only in memory and uses a host-only HttpOnly cookie to rotate an opaque server-side session credential; every Admin request reloads current user and role state before applying route permissions.

**Tech Stack:** Go 1.24, Fiber v2, GORM, PostgreSQL migrations, `golang-jwt/jwt/v5`, Next.js 16, React 19, strict TypeScript, Axios, next-intl.

## Global Constraints

- Preserve the existing Member login, refresh-token table, and active Member sessions.
- Admin access and refresh credentials must never be stored in `localStorage` or `sessionStorage`.
- The refresh secret must contain at least 256 bits of cryptographically secure randomness; persist only SHA-256 hashes.
- Admin JWTs must use the configured signing algorithm and require `aud=admin`, subject, token ID, issued-at, and expiry claims.
- Backend user, role, and permission state is authoritative on every Admin request.
- Admin eligibility requires `roles.admin_access=true`; never infer it from resource names or a hard-coded role name.
- Preserve Thai, English, and German Admin messages.
- Do not add TypeScript `any`, `as any`, `@ts-ignore`, or new dependencies.
- Add migration `000023`; do not edit existing numbered migrations.
- Update GORM models, route permissions, frontend types, and `backend/docs/openapi.yaml` together.
- Never log passwords, JWTs, refresh credentials, cookie values, or credential hashes.
- Production must reject `NEXT_PUBLIC_SKIP_ADMIN_AUTH=true` through build/deployment validation.

---

## File Structure

**Create**

- `backend/migrations/000023_add_admin_sessions.up.sql` — Admin session and refresh-history schema plus dashboard permission data migration.
- `backend/migrations/000023_add_admin_sessions.down.sql` — reversible removal of migration-owned schema and permission key.
- `backend/internal/models/admin_session.go` — GORM persistence models only.
- `backend/pkg/utils/admin_token.go` — Admin JWT creation/verification and opaque refresh credential primitives.
- `backend/pkg/utils/admin_token_test.go` — pure token and credential tests.
- `backend/internal/services/admin_auth_service.go` — Admin eligibility and transactional session lifecycle.
- `backend/internal/services/admin_auth_service_test.go` — isolated PostgreSQL service tests.
- `backend/internal/handlers/admin_auth_handler.go` — HTTP contract and cookie handling.
- `backend/internal/handlers/admin_auth_handler_test.go` — endpoint, cookie, origin, and response tests.
- `backend/internal/handlers/upload_handler_test.go` — request-size boundary tests.
- `backend/internal/middleware/admin_auth.go` — Admin audience and current-state middleware.
- `backend/internal/middleware/admin_security.go` — origin, no-store, and Admin response-header middleware.
- `backend/internal/routes/admin_policy_test.go` — route permission regression test.
- `frontend/src/services/adminAuthService.ts` — Admin login/refresh/logout transport.
- `frontend/src/services/adminApi.ts` — in-memory Bearer attachment and single-flight retry.
- `frontend/src/services/adminAuthStore.ts` — module-private access-token storage and auth-loss callback.
- `frontend/src/services/adminApi.test.ts` — focused single-flight behavior test, runnable when the TypeScript test runner is repaired.

**Modify**

- `backend/internal/config/config.go` — register Admin session models for local AutoMigrate.
- `backend/internal/models/role.go` — persist and return the explicit Admin-access capability.
- `backend/pkg/utils/response.go` — add a stable error-code response helper.
- `backend/internal/routes/routes.go` — register Admin auth endpoints and harden Admin group.
- `backend/internal/middleware/admin.go` — require active roles and retain resource-action enforcement.
- `backend/internal/services/user_service.go` — revoke Admin sessions on password change and account disablement.
- `backend/internal/handlers/user_handler.go` — pass security-relevant user changes through the service transaction.
- `backend/internal/handlers/auth_handler.go` — revoke Admin sessions on self-service password change.
- `backend/internal/services/audit_service.go` — record bounded authentication security events without secrets.
- `backend/cmd/seed/main.go` — seed `dashboard: read` for Admin-capable roles.
- `backend/cmd/app/main.go` — Admin rate limit, timeouts, body limit, and trusted CORS/header configuration.
- `backend/internal/handlers/upload_handler.go` — enforce the media limit below the global request-body ceiling.
- `backend/.env.example` — placeholder-only Admin auth configuration.
- `backend/docs/openapi.yaml` — Admin auth contracts and security requirements.
- `frontend/src/types/auth.ts` — Admin auth response and dashboard resource types.
- `frontend/src/types/api.ts` — stable backend error code.
- `frontend/src/context/AuthContext.tsx` — Admin bootstrap and in-memory session lifecycle.
- `frontend/src/app/[locale]/admin/login/page.tsx` — typed error handling.
- `frontend/src/components/admin/AdminAuthGuard.tsx` — localized bootstrap state.
- `frontend/src/components/admin/AdminHeader.tsx` — await server logout.
- `frontend/src/messages/admin/th.json` — Thai auth/security messages.
- `frontend/src/messages/admin/en.json` — English auth/security messages.
- `frontend/src/messages/admin/de.json` — German auth/security messages.
- `frontend/next.config.ts` — Admin response headers and production bypass validation.
- `frontend/src/services/adminService.ts`, `auditLogService.ts`, `mediaService.ts`, `publicContentService.ts`, `richTextMigrationService.ts`, `siteSettingsService.ts`, and `websiteCmsService.ts` — switch protected requests to `adminApi`.
- `frontend/src/app/[locale]/admin/events/_components/EventEditor.tsx`, `gallery/upload/page.tsx`, and `monks/_components/MonkEditor.tsx` — switch their existing protected transport import to `adminApi` without broad component refactoring.

---

### Task 1: Token and Error Primitives

**Files:**
- Create: `backend/pkg/utils/admin_token.go`
- Create: `backend/pkg/utils/admin_token_test.go`
- Modify: `backend/pkg/utils/response.go`

**Interfaces:**
- Produces: `GenerateAdminAccessToken(userID uuid.UUID) (string, error)`
- Produces: `VerifyAdminAccessToken(raw string) (*AdminClaims, error)`
- Produces: `NewAdminRefreshCredential(sessionID uuid.UUID) (raw string, hash string, error error)`
- Produces: `ParseAdminRefreshCredential(raw string) (sessionID uuid.UUID, hash string, error error)`
- Produces: `CodedErrorResponse(c *fiber.Ctx, status int, code, message string) error`

- [ ] **Step 1: Write failing pure utility tests**

```go
func TestAdminAccessTokenRequiresAdminAudience(t *testing.T) {
	t.Setenv("JWT_SECRET", "01234567890123456789012345678901")
	userID := uuid.New()
	raw, err := GenerateAdminAccessToken(userID)
	if err != nil { t.Fatal(err) }
	claims, err := VerifyAdminAccessToken(raw)
	if err != nil { t.Fatal(err) }
	if claims.Subject != userID.String() { t.Fatalf("subject = %q", claims.Subject) }
	if !slices.Contains(claims.Audience, "admin") { t.Fatal("missing admin audience") }
}

func TestAdminRefreshCredentialRoundTrip(t *testing.T) {
	sessionID := uuid.New()
	raw, createdHash, err := NewAdminRefreshCredential(sessionID)
	if err != nil { t.Fatal(err) }
	parsedID, parsedHash, err := ParseAdminRefreshCredential(raw)
	if err != nil { t.Fatal(err) }
	if parsedID != sessionID || parsedHash != createdHash { t.Fatal("credential mismatch") }
	if strings.Contains(raw, createdHash) { t.Fatal("raw credential exposed hash") }
}
```

- [ ] **Step 2: Run tests and confirm the missing-symbol failure**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./pkg/utils -run 'TestAdmin'`

Expected: FAIL because the four Admin token functions do not exist.

- [ ] **Step 3: Implement the token primitives**

Use `crypto/rand` to generate 32 bytes, base64url without padding, and SHA-256 hex for storage. The raw credential format is `<session UUID>.<secret>`; validate exactly two parts and a 32-byte decoded secret. Define `AdminClaims` using `jwt.RegisteredClaims`, set issuer `wat-profile`, audience `admin`, and a UUID token ID. In `VerifyAdminAccessToken`, restrict parsing to `jwt.SigningMethodHS256`, require expiry, subject, issued-at, issuer, and audience.

```go
type AdminClaims struct { jwt.RegisteredClaims }

func hashAdminRefreshSecret(secret string) string {
	sum := sha256.Sum256([]byte(secret))
	return hex.EncodeToString(sum[:])
}
```

- [ ] **Step 4: Add the coded error envelope**

```go
func CodedErrorResponse(c *fiber.Ctx, statusCode int, code, message string) error {
	traceID, _ := c.Locals("trace_id").(string)
	if traceID == "" { traceID = c.GetRespHeader("X-Trace-Id") }
	return c.Status(statusCode).JSON(fiber.Map{
		"success": false, "error": message, "code": code, "trace_id": traceID,
	})
}
```

- [ ] **Step 5: Run focused and existing utility tests**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./pkg/utils`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/pkg/utils/admin_token.go backend/pkg/utils/admin_token_test.go backend/pkg/utils/response.go
git commit -m "feat(auth): add admin token primitives"
```

---

### Task 2: Admin Session Schema and Models

**Files:**
- Create: `backend/migrations/000023_add_admin_sessions.up.sql`
- Create: `backend/migrations/000023_add_admin_sessions.down.sql`
- Create: `backend/internal/models/admin_session.go`
- Modify: `backend/internal/models/role.go`
- Modify: `backend/internal/config/config.go`
- Modify: `backend/cmd/seed/main.go`

**Interfaces:**
- Produces: `models.AdminSession`
- Produces: `models.AdminSessionRefreshHistory`

- [ ] **Step 1: Add the reversible migration**

```sql
CREATE TABLE admin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_secret_hash CHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    revocation_reason VARCHAR(100),
    last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address VARCHAR(45),
    user_agent VARCHAR(512),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE admin_session_refresh_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES admin_sessions(id) ON DELETE CASCADE,
    secret_hash CHAR(64) NOT NULL,
    grace_expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (session_id, secret_hash)
);

CREATE INDEX idx_admin_sessions_user_id ON admin_sessions(user_id);
CREATE INDEX idx_admin_sessions_cleanup ON admin_sessions(expires_at, revoked_at);
CREATE INDEX idx_admin_session_history_lookup ON admin_session_refresh_history(session_id, grace_expires_at);

ALTER TABLE roles ADD COLUMN admin_access BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE roles SET admin_access = TRUE WHERE name IN ('admin', 'editor', 'accountant');

UPDATE roles
SET permissions = COALESCE(permissions, '{}'::jsonb) || '{"dashboard":"read"}'::jsonb
WHERE name IN ('admin', 'editor', 'accountant');
```

The down migration deletes only `dashboard` from those roles, drops refresh history before Admin sessions, then removes `roles.admin_access`.

- [ ] **Step 2: Add GORM persistence models**

Define UUID hooks and associations matching the SQL exactly. Keep credential fields tagged `json:"-"` and bound user-agent length to 512. Add `AdminAccess bool` to `models.Role` with `gorm:"default:false;not null"` and `json:"admin_access"` tags.

```go
type AdminSession struct {
	ID uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	User User `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"-"`
	CurrentSecretHash string `gorm:"size:64;uniqueIndex;not null" json:"-"`
	ExpiresAt time.Time `gorm:"not null;index" json:"expires_at"`
	RevokedAt *time.Time `json:"revoked_at,omitempty"`
	RevocationReason string `gorm:"size:100" json:"revocation_reason,omitempty"`
	LastUsedAt time.Time `gorm:"not null" json:"last_used_at"`
	IPAddress string `gorm:"size:45" json:"ip_address,omitempty"`
	UserAgent string `gorm:"size:512" json:"user_agent,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
```

- [ ] **Step 3: Register models and seed dashboard permission**

Add both models after `RefreshToken` in `config.MigrateModels`. Set `AdminAccess: true` and add `"dashboard": "read"` for Admin, editor, and accountant role seeds. Keep `AdminAccess: false` for Member.

- [ ] **Step 4: Verify SQL and model compilation**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/models ./internal/config`

Expected: PASS or `[no test files]` with successful compilation.

- [ ] **Step 5: Commit**

```bash
git add backend/migrations/000023_add_admin_sessions.up.sql backend/migrations/000023_add_admin_sessions.down.sql backend/internal/models/admin_session.go backend/internal/models/role.go backend/internal/config/config.go backend/cmd/seed/main.go
git commit -m "feat(auth): add admin session persistence"
```

---

### Task 3: Transactional Admin Session Service

**Files:**
- Create: `backend/internal/services/admin_auth_service.go`
- Create: `backend/internal/services/admin_auth_service_test.go`

**Interfaces:**
- Consumes: Task 1 token primitives and Task 2 models.
- Produces: `LoginAdmin(email, password, ip, userAgent string) (*AdminAuthResult, error)`
- Produces: `RefreshAdmin(rawCredential string) (*AdminAuthResult, error)`
- Produces: `RevokeAdminSession(rawCredential, reason string) error`
- Produces: `RevokeAllAdminSessions(userID uuid.UUID, reason string) error`

- [ ] **Step 1: Write isolated database tests**

Use the established `DATABASE_URL_TEST` skip pattern, migrate `Role`, `User`, `AdminSession`, and `AdminSessionRefreshHistory`, and create unique UUID/email fixtures. Cover active Admin eligibility, roleless rejection, inactive role rejection, `admin_access=false` rejection even when the role contains `events:read`, rotation, three concurrent uses within grace, out-of-window reuse revocation, expiry, idempotent logout, and revoke-all.

```go
func TestAdminAuthServiceRejectsRolelessUser(t *testing.T) {
	db := testAdminAuthDB(t)
	user := createAdminAuthUser(t, db, nil, true)
	svc := NewAdminAuthService(db, time.Now)
	_, err := svc.LoginAdmin(user.Email, "Password123!", "127.0.0.1", "test")
	if !errors.Is(err, ErrAdminCredentials) { t.Fatalf("error = %v", err) }
}
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/services -run AdminAuth`

Expected: FAIL because `AdminAuthService` is undefined.

- [ ] **Step 3: Implement eligibility and login**

Define sentinel errors `ErrAdminCredentials`, `ErrAdminSessionInvalid`, and `ErrAdminSessionReused`. Normalize email with `strings.ToLower(strings.TrimSpace(email))`. Eligibility requires an active user and an active role with `AdminAccess == true`. Create the session and token in one transaction; use `ADMIN_SESSION_EXPIRY` for the absolute expiry.

- [ ] **Step 4: Implement rotation and reuse detection**

Lock the session row with `clause.Locking{Strength: "UPDATE"}`. Compare hashes with `subtle.ConstantTimeCompare`. A current hash rotates normally. A history hash is accepted only when `grace_expires_at > now`. Every accepted rotation inserts the prior current hash into history, updates the current hash and last-used time, deletes only expired history for that session, and commits before returning the new credential. Any other hash for a valid session ID sets `revoked_at` and returns `ErrAdminSessionReused`.

- [ ] **Step 5: Implement revocation**

Current-session logout parses the session identifier, marks that session revoked if present, and remains idempotent. Revoke-all updates every active Admin session for the user with a bounded reason string.

- [ ] **Step 6: Run service tests**

Run: `cd backend && DATABASE_URL_TEST="$DATABASE_URL_TEST" GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/services -run AdminAuth`

Expected: PASS when the isolated database is configured; otherwise SKIP with the documented reason.

- [ ] **Step 7: Commit**

```bash
git add backend/internal/services/admin_auth_service.go backend/internal/services/admin_auth_service_test.go
git commit -m "feat(auth): implement rotating admin sessions"
```

---

### Task 4: Admin Auth HTTP Boundary

**Files:**
- Create: `backend/internal/handlers/admin_auth_handler.go`
- Create: `backend/internal/handlers/admin_auth_handler_test.go`
- Create: `backend/internal/handlers/upload_handler_test.go`
- Create: `backend/internal/middleware/admin_security.go`
- Modify: `backend/internal/routes/routes.go`
- Modify: `backend/cmd/app/main.go`
- Modify: `backend/internal/handlers/upload_handler.go`
- Modify: `backend/.env.example`

**Interfaces:**
- Consumes: Task 3 service.
- Produces: the three `/api/v1/auth/admin/*` endpoints.

- [ ] **Step 1: Write Fiber handler tests**

Test the exact generic login error, response `code`, cookie flags, cookie path, refresh replacement, idempotent logout clearing, allowed/rejected origins, and omission of refresh credentials from JSON.

```go
func TestAdminLoginRejectsDisallowedOrigin(t *testing.T) {
	app := fiber.New()
	app.Post("/api/v1/auth/admin/login", AdminOriginGuard([]string{"https://admin.example"}), func(c *fiber.Ctx) error { return c.SendStatus(200) })
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/admin/login", strings.NewReader(`{"email":"a@b.c","password":"secret"}`))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Origin", "https://evil.example")
	res, err := app.Test(req)
	if err != nil { t.Fatal(err) }
	if res.StatusCode != fiber.StatusForbidden { t.Fatalf("status = %d", res.StatusCode) }
}
```

- [ ] **Step 2: Run handler tests and confirm failure**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/handlers -run Admin`

Expected: FAIL because the handler and origin guard do not exist.

- [ ] **Step 3: Implement cookie and handler contract**

Use a private cookie helper so set and clear operations share name, path, SameSite, Secure, and HttpOnly configuration. Login returns `{access_token,user}` only. Refresh reads only the cookie and returns `{access_token,user}`. Logout always clears the cookie, even when service revocation reports an invalid or expired credential.

```go
const adminRefreshCookie = "wat_admin_refresh"

type AdminAuthResponse struct {
	AccessToken string      `json:"access_token"`
	User        models.User `json:"user"`
}
```

- [ ] **Step 4: Register routes and rate limit**

Register the origin guard before each Admin auth handler. Apply an Admin-login limiter of five attempts per minute per IP and keep the existing Member login limiter unchanged. Add placeholder-only environment keys `ADMIN_ALLOWED_ORIGINS`, `ADMIN_COOKIE_SECURE`, `ADMIN_SESSION_GRACE`, and `ADMIN_SESSION_EXPIRY`.

- [ ] **Step 5: Configure bounded server behavior**

Set Fiber `BodyLimit` to 25 MiB, `ReadTimeout` and `WriteTimeout` to 60 seconds, and `IdleTimeout` to 120 seconds. Add a 20 MiB file-size check in the upload handler so multipart overhead remains below the application limit, and add boundary tests for an accepted 20 MiB file and a rejected larger file. Add a helper that parses explicit origins and rejects wildcard-plus-credentials configuration.

- [ ] **Step 6: Run handler and application compilation tests**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/handlers ./internal/middleware ./cmd/app`

Expected: PASS or `[no test files]` for packages without tests.

- [ ] **Step 7: Commit**

```bash
git add backend/internal/handlers/admin_auth_handler.go backend/internal/handlers/admin_auth_handler_test.go backend/internal/handlers/upload_handler.go backend/internal/handlers/upload_handler_test.go backend/internal/middleware/admin_security.go backend/internal/routes/routes.go backend/cmd/app/main.go backend/.env.example
git commit -m "feat(auth): expose secure admin session endpoints"
```

---

### Task 5: Admin Middleware and Route Permission Policy

**Files:**
- Create: `backend/internal/middleware/admin_auth.go`
- Create: `backend/internal/routes/admin_policy_test.go`
- Modify: `backend/internal/middleware/admin.go`
- Modify: `backend/internal/routes/routes.go`

**Interfaces:**
- Consumes: `VerifyAdminAccessToken` from Task 1.
- Produces: `AdminAuthRequired(db *gorm.DB) fiber.Handler`
- Produces: `adminRouteDefinitions() []AdminRouteDefinition` as the sole Admin route registry.

- [ ] **Step 1: Write middleware tests**

Cover missing Bearer token, Member/legacy JWT, valid Admin JWT, inactive user, inactive role, and database permission changes after token issue. Assert `401` for authentication failure and `403` only from permission middleware.

- [ ] **Step 2: Write the route-policy regression test**

Represent every Admin endpoint as data, then register only from that slice. The test fails on a blank method, path, resource, action, or handler key and on duplicate method/path pairs.

```go
type AdminRouteDefinition struct {
	Method string
	Path string
	Resource string
	Action string
	HandlerKey string
}

func registerAdminRoutes(group fiber.Router, definitions []AdminRouteDefinition, handlers map[string]fiber.Handler) {
	for _, definition := range definitions {
		handler, ok := handlers[definition.HandlerKey]
		if !ok { panic("missing admin handler: " + definition.HandlerKey) }
		group.Add(definition.Method, definition.Path,
			middleware.PermissionRequired(definition.Resource, definition.Action), handler)
	}
}
```

Do not infer protection by counting handler stack entries. `adminRouteDefinitions` is the source of truth and `registerAdminRoutes` always inserts the permission middleware.

- [ ] **Step 3: Run tests and confirm failure**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/middleware ./internal/routes -run 'AdminAuth|AdminRoutes'`

Expected: FAIL until Admin middleware and policy metadata are implemented.

- [ ] **Step 4: Implement Admin authentication middleware**

Inject `*gorm.DB`; do not read `config.DB`. Load `User` with `Role`, reject inactive user/role and `AdminAccess == false`, and store `user` and `userID` in locals using the same types consumed by existing audit and permission code.

- [ ] **Step 5: Convert every Admin route to explicit policy**

Apply `AdminAuthRequired(db)` to the Admin group. Convert every current Admin route into an `AdminRouteDefinition`, including `dashboard:read`, and provide the existing handler functions through a keyed map. Keep no exception in this implementation because every current Admin route maps to an existing resource/action.

- [ ] **Step 6: Run middleware and route tests**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/middleware ./internal/routes`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/internal/middleware/admin_auth.go backend/internal/middleware/admin.go backend/internal/routes/routes.go backend/internal/routes/admin_policy_test.go
git commit -m "fix(auth): enforce admin audience and route permissions"
```

---

### Task 6: Revocation and Security Audit Integration

**Files:**
- Modify: `backend/internal/services/user_service.go`
- Modify: `backend/internal/services/user_service_test.go`
- Modify: `backend/internal/handlers/user_handler.go`
- Modify: `backend/internal/handlers/auth_handler.go`
- Modify: `backend/internal/services/audit_service.go`
- Modify: `backend/internal/handlers/admin_auth_handler.go`

**Interfaces:**
- Consumes: `RevokeAllAdminSessions` from Task 3.
- Produces: atomic password/account updates with Admin-session revocation.

- [ ] **Step 1: Add failing user-service tests**

Create active Admin sessions, then verify self-service password change, Admin-set password change, and account disablement revoke all sessions. Verify name/avatar/email-only updates do not revoke sessions.

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `cd backend && DATABASE_URL_TEST="$DATABASE_URL_TEST" GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/services -run 'UpdateProfile|AdminSessionRevocation'`

Expected: FAIL on the new revocation assertions when the isolated database is configured.

- [ ] **Step 3: Make security changes transactional**

Move update plus revocation into one GORM transaction. Use reason `password_changed` for password changes and `account_disabled` when `is_active` transitions from true to false. Do not revoke on non-security profile edits.

- [ ] **Step 4: Add bounded audit events**

Add a dedicated method accepting an allowlisted reason category rather than arbitrary request data. For failed login, store only categories such as `credentials_or_eligibility`, never the supplied email or password. Truncate user-agent and do not store full request bodies.

- [ ] **Step 5: Run service and handler tests**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/services ./internal/handlers`

Expected: PASS, with database-dependent tests skipped only when `DATABASE_URL_TEST` is absent.

- [ ] **Step 6: Commit**

```bash
git add backend/internal/services/user_service.go backend/internal/services/user_service_test.go backend/internal/handlers/user_handler.go backend/internal/handlers/auth_handler.go backend/internal/services/audit_service.go backend/internal/handlers/admin_auth_handler.go
git commit -m "feat(auth): revoke admin sessions on security changes"
```

---

### Task 7: In-memory Admin API Client

**Files:**
- Create: `frontend/src/services/adminAuthStore.ts`
- Create: `frontend/src/services/adminApi.ts`
- Create: `frontend/src/services/adminAuthService.ts`
- Create: `frontend/src/services/adminApi.test.ts`
- Modify: `frontend/src/types/auth.ts`
- Modify: `frontend/src/types/api.ts`

**Interfaces:**
- Produces: `setAdminAccessToken(token: string | null): void`
- Produces: `getAdminAccessToken(): string | null`
- Produces: `setAdminAuthLostHandler(handler: (() => void) | null): void`
- Produces: Axios instance exported as default from `adminApi.ts`.
- Produces: `adminAuthService.login`, `.refresh`, and `.logout`.

- [ ] **Step 1: Add strict Admin auth types**

```ts
export interface AdminAuthResponse {
  access_token: string;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
  fields?: Record<string, string>;
}
```

Add `"dashboard"` to `PermissionResource` and `admin_access: boolean` to `Role`. Keep the existing Member `LoginResponse` and `RefreshResponse` unchanged.

- [ ] **Step 2: Write the single-flight test**

Mock the transport adapter, issue three protected requests that receive `401`, and assert exactly one `/auth/admin/refresh` call and one replay per original request. Add cases proving `403` and failed login never refresh.

- [ ] **Step 3: Implement the module-private token store**

```ts
let accessToken: string | null = null;
let authLostHandler: (() => void) | null = null;

export const getAdminAccessToken = () => accessToken;
export const setAdminAccessToken = (token: string | null) => { accessToken = token; };
export const setAdminAuthLostHandler = (handler: (() => void) | null) => { authLostHandler = handler; };
export const notifyAdminAuthLost = () => { authLostHandler?.(); };
```

- [ ] **Step 4: Implement Admin transport**

Create an Axios instance with `withCredentials: true`. Attach only the in-memory token. Maintain one module-level `Promise<string> | null` refresh operation, exclude Admin login/refresh/logout URLs from retry, replay each request once using a typed internal config extension, and notify auth loss when refresh fails. Do not import or inspect browser storage.

- [ ] **Step 5: Implement Admin auth service**

Login and refresh unwrap `ApiResponse<AdminAuthResponse>`, set the in-memory access token, and return the user. Logout calls the backend in `try` and always clears memory in `finally`.

- [ ] **Step 6: Type-check the new client**

Run: `cd frontend && ./node_modules/.bin/tsc --noEmit`

Expected: PASS. If the focused TypeScript test cannot execute because of the known runner limitation, record that fact and retain the test file for the later runner repair.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/services/adminAuthStore.ts frontend/src/services/adminApi.ts frontend/src/services/adminAuthService.ts frontend/src/services/adminApi.test.ts frontend/src/types/auth.ts frontend/src/types/api.ts
git commit -m "feat(auth): add in-memory admin API client"
```

---

### Task 8: Admin Context, UI, and Service Migration

**Files:**
- Modify: `frontend/src/context/AuthContext.tsx`
- Modify: `frontend/src/app/[locale]/admin/login/page.tsx`
- Modify: `frontend/src/components/admin/AdminAuthGuard.tsx`
- Modify: `frontend/src/components/admin/AdminHeader.tsx`
- Modify: `frontend/src/messages/admin/th.json`
- Modify: `frontend/src/messages/admin/en.json`
- Modify: `frontend/src/messages/admin/de.json`
- Modify: `frontend/src/services/adminService.ts`
- Modify: `frontend/src/services/auditLogService.ts`
- Modify: `frontend/src/services/mediaService.ts`
- Modify: `frontend/src/services/publicContentService.ts`
- Modify: `frontend/src/services/richTextMigrationService.ts`
- Modify: `frontend/src/services/siteSettingsService.ts`
- Modify: `frontend/src/services/websiteCmsService.ts`
- Modify: `frontend/src/app/[locale]/admin/events/_components/EventEditor.tsx`
- Modify: `frontend/src/app/[locale]/admin/gallery/upload/page.tsx`
- Modify: `frontend/src/app/[locale]/admin/monks/_components/MonkEditor.tsx`

**Interfaces:**
- Consumes: Task 7 Admin auth store, client, and service.
- Produces: Admin bootstrap, login, and async logout through `AuthContext`.

- [ ] **Step 1: Change the context contract**

Make `logout` return `Promise<void>`. On provider mount, register the auth-loss callback, call `adminAuthService.refresh()` once, and remain loading until it resolves or rejects. Remove all Admin calls to `authService.isAuthenticated()` and persistent token cleanup. Preserve the explicit local review mock only when the bypass flag is enabled.

- [ ] **Step 2: Replace untyped login error handling**

Use `axios.isAxiosError<ApiResponse<never>>(error)` and map stable codes to localized messages. Do not render arbitrary backend error strings.

```ts
const code = axios.isAxiosError<ApiResponse<never>>(error)
  ? error.response?.data.code
  : undefined;
setError(code === "ADMIN_INVALID_CREDENTIALS"
  ? t("login.invalidCredentials")
  : t("login.genericError"));
```

- [ ] **Step 3: Await logout and preserve locale routing**

Change the header handler to await context logout, then navigate through the locale-aware router. Disable repeated logout submission while it is running.

- [ ] **Step 4: Localize bootstrap and security errors**

Add identical key structure for `login.invalidCredentials`, `login.genericError`, `login.sessionExpired`, and `auth.checkingAccess` in Thai, English, and German. Replace the hard-coded Thai loading label in `AdminAuthGuard` with `useTranslations("Admin")`.

- [ ] **Step 5: Migrate protected Admin services**

Switch the seven listed protected service modules and three listed Admin components to `adminApi`. Keep `authService.ts` on the Member-compatible client and keep `publicService.ts` on the anonymous client. Run `rg -n '@/services/api|\./api' frontend/src/services frontend/src/app/'[locale]'/admin` and confirm only the deliberately unchanged Member/public imports remain.

- [ ] **Step 6: Verify browser storage absence and type safety**

Run: `rg -n 'localStorage|sessionStorage' frontend/src/context/AuthContext.tsx frontend/src/services/adminAuth*.ts frontend/src/services/adminApi.ts`

Expected: no matches.

Run: `cd frontend && npm run lint && ./node_modules/.bin/tsc --noEmit`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/context/AuthContext.tsx frontend/src/app/[locale]/admin/login/page.tsx frontend/src/components/admin/AdminAuthGuard.tsx frontend/src/components/admin/AdminHeader.tsx frontend/src/messages/admin/th.json frontend/src/messages/admin/en.json frontend/src/messages/admin/de.json frontend/src/services/adminService.ts frontend/src/services/auditLogService.ts frontend/src/services/mediaService.ts frontend/src/services/publicContentService.ts frontend/src/services/richTextMigrationService.ts frontend/src/services/siteSettingsService.ts frontend/src/services/websiteCmsService.ts frontend/src/app/[locale]/admin/events/_components/EventEditor.tsx frontend/src/app/[locale]/admin/gallery/upload/page.tsx frontend/src/app/[locale]/admin/monks/_components/MonkEditor.tsx
git commit -m "feat(auth): migrate admin UI to secure sessions"
```

---

### Task 9: Headers, Production Guard, and OpenAPI

**Files:**
- Modify: `frontend/next.config.ts`
- Modify: `backend/internal/middleware/admin_security.go`
- Modify: `backend/docs/openapi.yaml`
- Modify: `backend/README.md`

**Interfaces:**
- Consumes: the final endpoint and error contracts.
- Produces: documented API and deploy-time safety checks.

- [ ] **Step 1: Add Admin response headers**

Add Next headers for `/:locale/admin/:path*`: `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, and `Content-Security-Policy: frame-ancestors 'none'`. Mirror no-store and applicable API headers in the Admin backend middleware.

- [ ] **Step 2: Reject production auth bypass**

At config evaluation, throw when `NODE_ENV === "production"` and `NEXT_PUBLIC_SKIP_ADMIN_AUTH === "true"`. Keep `.env.example` set to false.

```ts
if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_SKIP_ADMIN_AUTH === "true") {
  throw new Error("NEXT_PUBLIC_SKIP_ADMIN_AUTH must be false in production");
}
```

- [ ] **Step 3: Update OpenAPI and backend documentation**

Document the three Admin auth endpoints, request/response schemas, `ADMIN_INVALID_CREDENTIALS`, `ADMIN_SESSION_INVALID`, `ADMIN_SESSION_REUSED`, cookie semantics, `AdminBearerAuth`, and `dashboard:read`. Keep the existing Member auth schemas unchanged. Update README examples so Admin examples never display a refresh credential in JSON.

- [ ] **Step 4: Validate OpenAPI syntax and builds**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./...`

Run: `cd frontend && npm run build`

Expected: both PASS; production build fails intentionally when the bypass environment variable is true.

- [ ] **Step 5: Commit**

```bash
git add frontend/next.config.ts backend/internal/middleware/admin_security.go backend/docs/openapi.yaml backend/README.md
git commit -m "docs(auth): document hardened admin sessions"
```

---

### Task 10: Full Verification and Rollout Evidence

**Files:**
- Modify only files required to fix failures introduced by Tasks 1–9.

**Interfaces:**
- Consumes: all previous tasks.
- Produces: a release-ready, evidence-backed implementation.

- [ ] **Step 1: Run backend verification**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./...`

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go vet ./...`

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go build -o bin/server ./cmd/app`

Expected: PASS for all three commands.

- [ ] **Step 2: Run frontend verification**

Run: `cd frontend && npm run lint`

Run: `cd frontend && ./node_modules/.bin/tsc --noEmit`

Run: `cd frontend && npm run build`

Expected: PASS for all three commands.

- [ ] **Step 3: Verify migration paths on isolated databases**

Apply all migrations to an empty PostgreSQL database, verify version `23`, inspect both Admin session tables and indexes, and exercise one Admin login/refresh/logout cycle. Separately apply migration 23 to a copy of version 22. Run the down migration only against an isolated disposable database and verify Member tables and refresh tokens remain intact.

- [ ] **Step 4: Perform browser checks**

Verify Thai, English, and German login states; reload bootstrap; two-tab and three-tab refresh; `403` without logout; logout revocation; password-change revocation; inactive-role denial; dashboard permission denial; cookie flags; no Admin token in Local Storage or Session Storage; and no Admin response cached by the browser.

- [ ] **Step 5: Inspect the final diff**

Run: `git status --short`

Run: `git diff --check HEAD~9..HEAD`

Run: `git diff --stat HEAD~9..HEAD`

Expected: only scoped auth, permission, migration, localization, security configuration, tests, and documentation changes; no secrets, generated binaries, caches, or unrelated formatting.

- [ ] **Step 6: Commit verification fixes if needed**

If verification required scoped code corrections, stage only those exact files and commit:

```bash
git commit -m "fix(auth): resolve admin session verification findings"
```

If no correction was required, do not create an empty commit.
