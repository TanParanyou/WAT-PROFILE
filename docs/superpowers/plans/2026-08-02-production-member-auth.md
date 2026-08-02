# Production Public Account Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver an independently testable public-account authentication system with password and Google Sign-In, verified email, rotating sessions, recovery, and a minimal public profile without creating temple-member records or enabling Community Q&A.

**Architecture:** Add an isolated public-account surface beside the legacy Admin auth contract. The Go API owns identities, action tokens, rotating refresh sessions, email delivery, Google verification, and Admin isolation; Next.js owns localized account pages, in-memory access-token state, and typed API/query boundaries. PostgreSQL migrations remain authoritative, while feature flags keep the entire public-account surface hidden until acceptance is complete.

**Tech Stack:** Go 1.24, Fiber v2, GORM, PostgreSQL, JWT, `golang.org/x/oauth2` v0.36.0, `google.golang.org/api/idtoken` v0.285.0, Resend HTTP API, Next.js 16 App Router, React 19, TypeScript, Axios, TanStack Query, React Hook Form, Zod, next-intl, `node:test`, `tsx`.

## Global Constraints

- Supported locales are exactly `th`, `en`, and `de`; all account UI and transactional email copy must be complete in all three.
- A public account must never create, update, infer, or expose a `members` record.
- Existing Admin login UI remains in place; every `/api/v1/admin` route must reject role-less public accounts before resource permissions run.
- Public-account access tokens live only in memory; refresh tokens are opaque, rotating, hashed at rest, and stored only in a `Secure`, `HttpOnly`, `SameSite=Lax` cookie.
- Access-token lifetime is 15 minutes; refresh-session lifetime is 30 days; verification, reset, and identity-link tokens expire after 30 minutes.
- Password length is 12-128 characters; do not add arbitrary composition rules.
- Google identity is keyed by the verified `sub` claim; matching email alone never silently links or signs in an existing account.
- Do not store Google access/refresh tokens, raw auth tokens, complete auth request bodies, or credentials in logs.
- `DB_AUTO_MIGRATE=false` remains mandatory in production; migration `000023` is the schema authority.
- Preserve existing source formatting and do not use TypeScript `any`, `as any`, `@ts-ignore`, or direct HTTP calls from components.
- Community topics, replies, moderation, real-time chat, WhatsApp API, Apple Sign-In, passkeys, MFA, and avatar upload are outside this plan.

## File map

Backend domain units:

- `backend/internal/models/account_auth.go`: persistence-only account profile, identity, session, action-token, and security-event models.
- `backend/internal/accountauth/contracts.go`: request/result types, provider interfaces, error codes, and clock/token abstractions shared by services.
- `backend/internal/accountauth/token.go`: opaque-token generation/hashing and action-token consumption helpers.
- `backend/internal/services/account_registration_service.go`: password registration, email verification, resend, and localized delivery orchestration.
- `backend/internal/services/account_session_service.go`: password login, access JWT issuance, refresh rotation/reuse detection, session listing, and revocation.
- `backend/internal/services/account_recovery_service.go`: forgot/reset password, profile update, recent-auth checks, and account closure.
- `backend/internal/services/account_google_service.go`: OAuth start/callback validation, new-account creation, and approval-based account linking.
- `backend/internal/services/account_security_service.go`: allow-listed security-event recording and coarse client metadata.
- `backend/internal/handlers/account_auth_handler.go`: HTTP/cookie contract only.
- `backend/internal/middleware/account_auth.go`: public-account audience validation and context population.
- `backend/internal/middleware/admin.go`: mandatory active Admin-role boundary.
- `backend/internal/config/account_auth.go`: validated account-auth configuration.

Frontend units:

- `frontend/src/features/public/account/types.ts`: account/session/DTO contracts.
- `frontend/src/features/public/account/schema.ts`: runtime response and form validation.
- `frontend/src/features/public/account/api.ts`: credentialed account HTTP client with single-flight refresh.
- `frontend/src/features/public/account/queries.ts`: stable query keys and mutations.
- `frontend/src/features/public/account/AccountSessionProvider.tsx`: in-memory access token and bootstrap state.
- `frontend/src/features/public/account/components/`: focused reusable account forms and states.
- `frontend/src/app/[locale]/(client)/(account)/`: localized route composition.

---

### Task 1: Add the reversible public-account schema and GORM models

**Files:**
- Create: `backend/migrations/000023_add_public_account_auth.up.sql`
- Create: `backend/migrations/000023_add_public_account_auth.down.sql`
- Create: `backend/internal/models/account_auth.go`
- Modify: `backend/internal/models/user.go`
- Modify: `backend/internal/config/config.go`
- Modify: `backend/internal/services/auth_service.go`
- Modify: `backend/internal/services/user_service.go`
- Modify: `backend/internal/services/user_service_test.go`
- Modify: `backend/cmd/seed/main.go`
- Create: `backend/internal/models/account_auth_test.go`

**Interfaces:**
- Produces: `models.AccountProfile`, `models.AuthIdentity`, `models.AuthSession`, `models.AuthActionToken`, `models.AuthSecurityEvent`, and `models.User.AccountStatus`.
- Produces database uniqueness for normalized email, `(provider, provider_subject)`, `(user_id, provider)`, and session/action token hashes.

- [ ] **Step 1: Write model-shape tests before defining the models**

```go
func TestAccountProfileUsesPublicFieldsOnly(t *testing.T) {
	profileType := reflect.TypeOf(AccountProfile{})
	for _, forbidden := range []string{"Phone", "BirthDate", "Address", "MemberCode"} {
		if _, ok := profileType.FieldByName(forbidden); ok {
			t.Fatalf("account profile must not contain %s", forbidden)
		}
	}
}

func TestAccountStatusValues(t *testing.T) {
	for _, status := range []AccountStatus{
		AccountStatusPendingVerification,
		AccountStatusActive,
		AccountStatusDisabled,
		AccountStatusClosed,
	} {
		if !status.Valid() {
			t.Fatalf("expected %q to be valid", status)
		}
	}
}
```

- [ ] **Step 2: Run the focused test and verify the missing types fail compilation**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/models -run 'TestAccount(Profile|Status)'`

Expected: FAIL with undefined `AccountProfile` and `AccountStatus`.

- [ ] **Step 3: Add the migration with explicit constraints and safe preflight**

```sql
DO $$
BEGIN
  IF EXISTS (
    SELECT lower(btrim(email)) FROM users
    GROUP BY lower(btrim(email)) HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'case-insensitive duplicate users.email values must be resolved before migration 000023';
  END IF;
END $$;

ALTER TABLE users
  ALTER COLUMN password_hash DROP NOT NULL,
  ADD COLUMN account_status varchar(32) NOT NULL DEFAULT 'active',
  ADD CONSTRAINT users_account_status_check
    CHECK (account_status IN ('pending_verification','active','disabled','closed'));

CREATE UNIQUE INDEX users_email_normalized_uidx ON users (lower(btrim(email)));

CREATE TABLE account_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  display_name varchar(80) NOT NULL CHECK (length(btrim(display_name)) BETWEEN 2 AND 80),
  avatar_url varchar(500),
  preferred_locale varchar(2) NOT NULL CHECK (preferred_locale IN ('th','en','de')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE auth_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider varchar(16) NOT NULL CHECK (provider IN ('password','google')),
  provider_subject varchar(255) NOT NULL,
  provider_email varchar(255) NOT NULL,
  credential_hash varchar(255),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_subject), UNIQUE (user_id, provider),
  CHECK ((provider = 'password' AND credential_hash IS NOT NULL) OR (provider = 'google' AND credential_hash IS NULL))
);

CREATE TABLE auth_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_id uuid NOT NULL, token_hash char(64) NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL, last_used_at timestamptz NOT NULL,
  revoked_at timestamptz, revoked_reason varchar(64), user_agent_summary varchar(255), ip_prefix varchar(64),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX auth_sessions_user_id_idx ON auth_sessions(user_id);
CREATE INDEX auth_sessions_family_id_idx ON auth_sessions(family_id);
CREATE INDEX auth_sessions_expires_at_idx ON auth_sessions(expires_at);

CREATE TABLE auth_action_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose varchar(32) NOT NULL CHECK (purpose IN ('verify_email','reset_password','link_identity')),
  token_hash char(64) NOT NULL UNIQUE, payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  expires_at timestamptz NOT NULL, consumed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX auth_action_tokens_user_id_idx ON auth_action_tokens(user_id);
CREATE INDEX auth_action_tokens_expires_at_idx ON auth_action_tokens(expires_at);

CREATE TABLE auth_security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  event_type varchar(64) NOT NULL, outcome varchar(16) NOT NULL CHECK (outcome IN ('success','failure')),
  provider varchar(16), request_trace_id varchar(64), ip_prefix varchar(64),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX auth_security_events_user_id_idx ON auth_security_events(user_id);
CREATE INDEX auth_security_events_created_at_idx ON auth_security_events(created_at);
```

The down migration first aborts when `users.password_hash IS NULL`, then drops the five tables in reverse dependency order, drops `users_email_normalized_uidx` and `users_account_status_check`, removes `account_status`, and restores `password_hash NOT NULL`. It does not touch any pre-000023 table data besides the two explicitly altered `users` columns.

- [ ] **Step 4: Implement the matching model types**

```go
type AccountStatus string

const (
	AccountStatusPendingVerification AccountStatus = "pending_verification"
	AccountStatusActive              AccountStatus = "active"
	AccountStatusDisabled            AccountStatus = "disabled"
	AccountStatusClosed              AccountStatus = "closed"
)

type AccountProfile struct {
	ID              uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID          uuid.UUID `gorm:"type:uuid;not null;uniqueIndex" json:"user_id"`
	DisplayName     string    `gorm:"size:80;not null" json:"display_name"`
	AvatarURL       string    `gorm:"size:500" json:"avatar_url,omitempty"`
	PreferredLocale string    `gorm:"size:2;not null" json:"preferred_locale"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}
```

```go
type AuthIdentity struct { ID uuid.UUID; UserID uuid.UUID; Provider, ProviderSubject, ProviderEmail string; CredentialHash *string `json:"-"`; CreatedAt, UpdatedAt time.Time }
type AuthSession struct { ID, UserID, FamilyID uuid.UUID; TokenHash string `json:"-"`; ExpiresAt, LastUsedAt time.Time; RevokedAt *time.Time; RevokedReason, UserAgentSummary, IPPrefix string; CreatedAt, UpdatedAt time.Time }
type AuthActionToken struct { ID, UserID uuid.UUID; Purpose string; TokenHash string `json:"-"`; Payload JSONMap `json:"-"`; ExpiresAt time.Time; ConsumedAt *time.Time; CreatedAt time.Time }
type AuthSecurityEvent struct { ID uuid.UUID; UserID *uuid.UUID; EventType, Outcome, Provider, RequestTraceID, IPPrefix string; Metadata JSONMap `json:"-"`; CreatedAt time.Time }
```

Expand these compact declarations into normally formatted structs with the GORM sizes, indexes, foreign keys, defaults, and JSON tags matching the SQL. Change `User.PasswordHash` to `*string` and add `AccountStatus AccountStatus` with `gorm:"size:32;not null;default:active;index"`.

Update every legacy password assignment/comparison and fixture for the nullable field:

```go
hashedPassword, err := utils.HashPassword(password)
if err != nil { return err }
user.PasswordHash = &hashedPassword

if user.PasswordHash == nil || !utils.CheckPasswordHash(password, *user.PasswordHash) {
	return errors.New("invalid credentials")
}
```

- [ ] **Step 5: Register the models for local AutoMigrate and rerun tests**

Add all five new models to `config.MigrateModels()` after `models.User`. Run:

`cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/models`

Expected: PASS.

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./...`

Expected: PASS, proving the nullable password field did not break legacy Admin/user code.

- [ ] **Step 6: Verify migration up/down on an isolated database**

Run: `cd backend && DATABASE_URL="$TEST_DATABASE_URL" go run cmd/migrate/main.go up`

Expected: version reports `23` and the five auth tables exist.

Run only against the same disposable database: `cd backend && DATABASE_URL="$TEST_DATABASE_URL" go run cmd/migrate/main.go down`

Expected: version returns to `22`; existing pre-000023 tables remain.

- [ ] **Step 7: Commit the schema unit**

```bash
git add backend/migrations/000023_add_public_account_auth.* backend/internal/models/account_auth.go backend/internal/models/account_auth_test.go backend/internal/models/user.go backend/internal/config/config.go backend/internal/services/auth_service.go backend/internal/services/user_service.go backend/internal/services/user_service_test.go backend/cmd/seed/main.go
git commit -m "feat(auth): add public account schema"
```

### Task 2: Add account-auth configuration, domain contracts, and token primitives

**Files:**
- Create: `backend/internal/config/account_auth.go`
- Create: `backend/internal/config/account_auth_test.go`
- Create: `backend/internal/accountauth/contracts.go`
- Create: `backend/internal/accountauth/token.go`
- Create: `backend/internal/accountauth/token_test.go`
- Modify: `backend/.env.example`
- Modify: `frontend/.env.example`

**Interfaces:**
- Produces: `config.AccountAuthConfig`, `accountauth.Code`, `accountauth.Error`, `accountauth.Clock`, `accountauth.TokenGenerator`, `accountauth.EmailSender`, and `accountauth.GoogleVerifier`.
- Produces: `NewOpaqueToken() (plain string, hash string, err error)` and `HashOpaqueToken(string) string`.

- [ ] **Step 1: Write failing configuration and token tests**

```go
func TestLoadAccountAuthConfigRejectsCaptureInProduction(t *testing.T) {
	t.Setenv("ENV", "production")
	t.Setenv("PUBLIC_ACCOUNT_AUTH_ENABLED", "true")
	t.Setenv("AUTH_EMAIL_DELIVERY_MODE", "capture")
	_, err := LoadAccountAuthConfig()
	if err == nil || !strings.Contains(err.Error(), "capture") {
		t.Fatalf("expected production capture mode rejection, got %v", err)
	}
}

func TestOpaqueTokenStoresOnlyHash(t *testing.T) {
	plain, hash, err := NewOpaqueToken()
	if err != nil || plain == hash || HashOpaqueToken(plain) != hash {
		t.Fatalf("invalid opaque token pair")
	}
}
```

- [ ] **Step 2: Run tests and verify they fail on missing APIs**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/config ./internal/accountauth`

Expected: FAIL with missing `LoadAccountAuthConfig` and `NewOpaqueToken`.

- [ ] **Step 3: Implement exact configuration validation**

```go
type AccountAuthConfig struct {
	Enabled          bool
	FrontendURL      string
	GoogleClientID   string
	GoogleSecret     string
	GoogleRedirectURL string
	AccessTTL        time.Duration
	RefreshTTL       time.Duration
	EmailMode        string
	CookieSecure     bool
}
```

When enabled, require HTTPS production frontend/callback URLs, Google credentials, 15-minute access TTL, 30-day refresh TTL, and `resend` email mode in production. Reject unknown locales and unsafe redirect origins through helpers in this package.

- [ ] **Step 4: Implement typed errors and provider interfaces**

```go
type Code string

const (
	CodeInvalidCredentials Code = "AUTH_INVALID_CREDENTIALS"
	CodeVerificationRequired Code = "AUTH_EMAIL_VERIFICATION_REQUIRED"
	CodeTokenInvalid Code = "AUTH_TOKEN_INVALID_OR_EXPIRED"
	CodeRateLimited Code = "AUTH_RATE_LIMITED"
	CodeAccountDisabled Code = "AUTH_ACCOUNT_DISABLED"
	CodeReauthRequired Code = "AUTH_REAUTH_REQUIRED"
)

type EmailSender interface {
	Send(ctx context.Context, message EmailMessage) error
}

type GoogleVerifier interface {
	AuthorizationURL(state, nonce, challenge string) string
	VerifyCallback(ctx context.Context, code, verifier string) (GoogleIdentity, error)
}

type SecurityRecorder interface {
	Record(ctx context.Context, event SecurityEvent)
}
```

Include `Clock.Now()`, token generation, normalized-email, safe-locale, and safe-redirect helpers so services can be deterministic in tests.

Set these default limiter windows in `AccountAuthConfig`: register 5 per 15 minutes,
login 10 per 15 minutes, verification resend 3 per hour, forgot-password 5 per hour,
refresh 60 per minute, and Google start/callback 20 per 15 minutes. Require
`RESEND_API_KEY` and `ACCOUNT_EMAIL_FROM` when enabled with `EmailMode=resend`.

- [ ] **Step 5: Implement cryptographically random opaque tokens**

Generate 32 random bytes with `crypto/rand`, encode with raw URL-safe base64, and hash with SHA-256 hex. Never accept an injectable pseudo-random fallback in production code.

- [ ] **Step 6: Document complete env keys and rerun tests**

Add `PUBLIC_ACCOUNT_AUTH_ENABLED`, `PUBLIC_ACCOUNT_FRONTEND_URL`,
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URL`,
`AUTH_ACCESS_TOKEN_EXPIRY`, `AUTH_REFRESH_TOKEN_EXPIRY`,
`AUTH_EMAIL_DELIVERY_MODE`, `RESEND_API_KEY`, `ACCOUNT_EMAIL_FROM`,
`AUTH_REGISTER_LIMIT`, `AUTH_LOGIN_LIMIT`, `AUTH_VERIFY_RESEND_LIMIT`,
`AUTH_FORGOT_PASSWORD_LIMIT`, `AUTH_REFRESH_LIMIT`, `AUTH_GOOGLE_LIMIT`,
`NEXT_PUBLIC_PUBLIC_ACCOUNT_AUTH_ENABLED`, and `NEXT_PUBLIC_API_URL` to the
committed env examples with non-secret sample values. Run:

`cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/config ./internal/accountauth`

Expected: PASS.

- [ ] **Step 7: Commit the primitives**

```bash
git add backend/internal/config/account_auth.go backend/internal/config/account_auth_test.go backend/internal/accountauth backend/.env.example frontend/.env.example
git commit -m "feat(auth): add account auth primitives"
```

### Task 3: Implement password registration, verification, and localized delivery

**Files:**
- Create: `backend/internal/services/account_registration_service.go`
- Create: `backend/internal/services/account_registration_service_test.go`
- Create: `backend/internal/services/account_email_service.go`
- Create: `backend/internal/services/account_email_service_test.go`
- Create: `backend/internal/accountauth/templates.go`

**Interfaces:**
- Consumes: models and accountauth interfaces from Tasks 1-2.
- Produces: `RegisterPassword(ctx, RegisterPasswordInput) error`, `VerifyEmail(ctx, token string) error`, and `ResendVerification(ctx, email, locale string) error`.
- Produces: `NewAccountEmailSender(config.AccountAuthConfig) (accountauth.EmailSender, error)`.

- [ ] **Step 1: Write service tests using a fixed clock and fake sender**

```go
func TestRegisterPasswordCreatesNoTempleMember(t *testing.T) {
	db := newAccountTestDB(t)
	sender := &fakeEmailSender{}
	service := NewAccountRegistrationService(db, sender, fixedClock(), accountauth.NewOpaqueToken)

	err := service.RegisterPassword(context.Background(), RegisterPasswordInput{
		Email: " Visitor@Example.DE ", Password: "correct horse battery staple",
		DisplayName: "Visitor", Locale: "de",
	})
	require.NoError(t, err)
	assertRowCount(t, db, "users", 1)
	assertRowCount(t, db, "account_profiles", 1)
	assertRowCount(t, db, "auth_identities", 1)
	assertRowCount(t, db, "members", 0)
	assert.Equal(t, "visitor@example.de", sender.messages[0].To)
}
```

Add tests for duplicate unverified email, active duplicate email, expired token, racing token consumption, resend invalidation, unsupported locale, transaction rollback, and delivery failure leaving the account pending.

- [ ] **Step 2: Run focused tests and confirm missing service failure**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/services -run 'Test(RegisterPassword|VerifyEmail|ResendVerification)'`

Expected: FAIL with undefined `NewAccountRegistrationService`.

- [ ] **Step 3: Implement registration as one database transaction**

```go
func (s *AccountRegistrationService) RegisterPassword(ctx context.Context, in RegisterPasswordInput) error {
	email := accountauth.NormalizeEmail(in.Email)
	if err := ValidateRegistration(in, email); err != nil { return err }
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		user := models.User{Email: email, Name: strings.TrimSpace(in.DisplayName), AccountStatus: models.AccountStatusPendingVerification}
		if err := tx.Create(&user).Error; err != nil { return mapAccountConflict(err) }
		hash, err := utils.HashPassword(in.Password)
		if err != nil { return err }
		if err := tx.Create(&models.AuthIdentity{UserID: user.ID, Provider: "password", ProviderSubject: email, ProviderEmail: email, CredentialHash: &hash}).Error; err != nil { return err }
		if err := tx.Create(&models.AccountProfile{UserID: user.ID, DisplayName: strings.TrimSpace(in.DisplayName), PreferredLocale: in.Locale}).Error; err != nil { return err }
		return s.issueActionToken(tx, user.ID, "verify_email", in.Locale)
	})
}
```

Queue/send email only after commit. Persist no temple-member row and never invoke `MemberService`.

- [ ] **Step 4: Implement atomic verification and resend invalidation**

Consume with one conditional update: `WHERE token_hash = ? AND purpose = ? AND consumed_at IS NULL AND expires_at > ?`. Update `users.email_verified=true` and `account_status='active'` in the same transaction. Resend invalidates prior unconsumed verification rows before creating the replacement.

- [ ] **Step 5: Implement Resend and capture adapters with complete templates**

```go
var accountEmailCopy = map[string]map[string]EmailCopy{
	"verify_email": {
		"th": {Subject: "ยืนยันอีเมลของคุณ", Action: "ยืนยันอีเมล"},
		"en": {Subject: "Verify your email", Action: "Verify email"},
		"de": {Subject: "E-Mail-Adresse bestätigen", Action: "E-Mail bestätigen"},
	},
}
```

Define full body text for verification, link approval, password reset, password changed, and session revocation in all locales. The capture adapter writes only to an injected in-memory/file test sink and constructor validation rejects it in production.

- [ ] **Step 6: Run registration and email tests**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/services -run 'Test(AccountEmail|RegisterPassword|VerifyEmail|ResendVerification)'`

Expected: PASS.

- [ ] **Step 7: Commit the registration slice**

```bash
git add backend/internal/services/account_registration_service* backend/internal/services/account_email_service* backend/internal/accountauth/templates.go
git commit -m "feat(auth): add verified password registration"
```

### Task 4: Implement password login and rotating session families

**Files:**
- Create: `backend/internal/services/account_session_service.go`
- Create: `backend/internal/services/account_session_service_test.go`
- Create: `backend/internal/accountauth/access_token.go`
- Create: `backend/internal/accountauth/access_token_test.go`

**Interfaces:**
- Produces: `LoginPassword(ctx, LoginPasswordInput, ClientInfo) (SessionResult, error)`.
- Produces: `Refresh(ctx, rawRefresh string, ClientInfo) (SessionResult, error)`.
- Produces: `Logout`, `LogoutAll`, `ListSessions`, and `RevokeSession`.
- Produces access claims with `aud=public-account`, `sub=user UUID`, `sid=session UUID`, and `auth_time`.

- [ ] **Step 1: Write failing login and rotation tests**

```go
func TestRefreshRotatesAndRejectsReuse(t *testing.T) {
	service := newSessionServiceFixture(t)
	first := loginVerifiedAccount(t, service)
	second, err := service.Refresh(context.Background(), first.RefreshToken, testClient())
	require.NoError(t, err)
	require.NotEqual(t, first.RefreshToken, second.RefreshToken)

	_, err = service.Refresh(context.Background(), first.RefreshToken, testClient())
	require.ErrorIs(t, err, accountauth.ErrInvalidCredentials)
	assertFamilyRevoked(t, service.db, first.FamilyID)
}
```

Add tests for unknown email/wrong password sharing one code, unverified/disabled/closed rejection, null legacy hash, concurrent refresh, expiry, current logout, logout-all, foreign-session revoke, and token hash redaction.

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/services -run 'Test(LoginPassword|Refresh|Logout|Session)'`

Expected: FAIL with missing session service.

- [ ] **Step 3: Implement public-account JWT claims and verification**

```go
type PublicAccountClaims struct {
	SessionID string `json:"sid"`
	AuthTime int64  `json:"auth_time"`
	jwt.RegisteredClaims
}

func (i *AccessTokenIssuer) Issue(userID, sessionID uuid.UUID, authTime time.Time) (string, error) {
	claims := PublicAccountClaims{SessionID: sessionID.String(), AuthTime: authTime.Unix(), RegisteredClaims: jwt.RegisteredClaims{
		Subject: userID.String(), Audience: jwt.ClaimStrings{"public-account"}, ExpiresAt: jwt.NewNumericDate(i.clock.Now().Add(15*time.Minute)),
	}}
	return i.sign(claims)
}
```

Verification must require the exact audience and must not accept legacy Admin tokens.

- [ ] **Step 4: Implement generic password login and session creation**

Query normalized email, active account, profile, and password identity. Always perform a bounded password-hash comparison path before returning generic invalid credentials. On success, create one `auth_sessions` row, return the access token and raw refresh token, and expose neither hash nor security metadata in the result.

- [ ] **Step 5: Implement transactional rotation and family reuse detection**

Lock the token row `FOR UPDATE`. If active and unexpired, mark it `revoked_reason='rotated'`, create its replacement in the same family, and return the new pair. If a rotated token is presented again, revoke every active row in the family with `revoked_reason='reuse_detected'` and return the generic invalid-token code.

- [ ] **Step 6: Implement session list/revoke operations**

Return only ID, current flag, sanitized user-agent summary, coarse location-neutral client description, created/last-used/expiry timestamps. Require user ownership in `RevokeSession`; return not found for another user's ID.

- [ ] **Step 7: Run the complete session suite**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/accountauth ./internal/services -run 'Test(LoginPassword|Refresh|Logout|Session|AccessToken)'`

Expected: PASS, including `-race` for the refresh concurrency tests.

- [ ] **Step 8: Commit the session unit**

```bash
git add backend/internal/accountauth/access_token* backend/internal/services/account_session_service*
git commit -m "feat(auth): add rotating public sessions"
```

### Task 5: Implement recovery, profile management, recent authentication, and closure

**Files:**
- Create: `backend/internal/services/account_recovery_service.go`
- Create: `backend/internal/services/account_recovery_service_test.go`
- Create: `backend/internal/services/account_profile_service.go`
- Create: `backend/internal/services/account_profile_service_test.go`

**Interfaces:**
- Produces: `RequestPasswordReset`, `ResetPassword`, `GetAccount`, `UpdateProfile`, `CloseAccount`.
- Consumes: `accountauth.EmailSender`, action-token primitives, and `AccountSessionService.LogoutAll`.

- [ ] **Step 1: Write failing recovery and profile tests**

```go
func TestResetPasswordRevokesAllSessions(t *testing.T) {
	fixture := newRecoveryFixture(t)
	token := fixture.issueResetToken(t)
	err := fixture.service.ResetPassword(context.Background(), token, "a much better passphrase")
	require.NoError(t, err)
	assertNoActiveSessions(t, fixture.db, fixture.userID)
	assertActionTokenConsumed(t, fixture.db, token)
}
```

Add cases for generic forgot-password responses, Google-only informational email, expired/raced reset, 12/128 password bounds, display-name trimming/2-80 bounds, locale allow-list, foreign profile access, closure with stale `auth_time`, Google reauthentication, and no `members` mutation.

- [ ] **Step 2: Run tests and verify missing services**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/services -run 'Test(PasswordReset|AccountProfile|CloseAccount)'`

Expected: FAIL on missing service constructors.

- [ ] **Step 3: Implement password recovery with one-time token consumption**

Forgot-password always returns nil/public accepted after applying the same timing-safe lookup path. Reset uses a transaction to consume the token, replace `AuthIdentity.CredentialHash`, and revoke sessions. Send the password-changed email after commit.

- [ ] **Step 4: Implement account/profile DTOs that cannot expose private records**

```go
type AccountView struct {
	ID              uuid.UUID `json:"id"`
	Email           string    `json:"email"`
	EmailVerified   bool      `json:"email_verified"`
	AccountStatus   string    `json:"account_status"`
	DisplayName     string    `json:"display_name"`
	AvatarURL       string    `json:"avatar_url,omitempty"`
	PreferredLocale string    `json:"preferred_locale"`
	Providers       []string  `json:"providers"`
}
```

Query only users, account profiles, and identity provider names. Do not preload `Member`.

- [ ] **Step 5: Implement recent-auth closure**

Require `now-auth_time <= 10m`. Password users reauthenticate through password comparison; Google-only users must present a newly verified Google reauth assertion. Set `account_status='closed'`, revoke sessions, and blank public profile visibility in one transaction while retaining the row for later operational deletion.

- [ ] **Step 6: Run focused tests and commit**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/services -run 'Test(PasswordReset|AccountProfile|CloseAccount)'`

Expected: PASS.

```bash
git add backend/internal/services/account_recovery_service* backend/internal/services/account_profile_service*
git commit -m "feat(auth): add account recovery and profile"
```

### Task 6: Implement Google Authorization Code + PKCE and approval-based linking

**Files:**
- Create: `backend/internal/accountauth/google.go`
- Create: `backend/internal/accountauth/google_test.go`
- Create: `backend/internal/services/account_google_service.go`
- Create: `backend/internal/services/account_google_service_test.go`
- Modify: `backend/go.mod`
- Modify: `backend/go.sum`

**Interfaces:**
- Produces: `StartGoogle(ctx, locale, returnTo string) (authorizationURL string, flowCookie string, error)`.
- Produces: `CompleteGoogle(ctx, code, flowCookie string, ClientInfo) (GoogleCompletion, error)`.
- Produces: `ConfirmGoogleLink(ctx, actionToken string, ClientInfo) (SessionResult, error)`.

- [ ] **Step 1: Write provider-verification and linking tests**

```go
func TestGoogleMatchingEmailRequiresApproval(t *testing.T) {
	fixture := newGoogleFixture(t, accountauth.GoogleIdentity{Subject: "google-sub", Email: "known@example.com", EmailVerified: true})
	fixture.createVerifiedPasswordAccount(t, "known@example.com")

	result, err := fixture.service.CompleteGoogle(context.Background(), "code", fixture.flowCookie(), testClient())
	require.NoError(t, err)
	assert.Equal(t, GoogleCompletionApprovalSent, result.Status)
	assertNoGoogleIdentity(t, fixture.db, fixture.userID)
	assert.Empty(t, result.Session.AccessToken)
}
```

Cover bad state, nonce, PKCE, issuer, audience, signature, expiry, unverified Google email, duplicate callback, unsafe return URL, existing linked identity, new account, role preservation, expired link approval, and concurrent link approval.

- [ ] **Step 2: Run the Google suite and verify failure**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/accountauth ./internal/services -run TestGoogle`

Expected: FAIL with missing Google implementation.

- [ ] **Step 3: Add pinned OAuth dependencies and implement verifier adapter**

Run: `cd backend && go get golang.org/x/oauth2@v0.36.0 google.golang.org/api@v0.285.0`

Use `oauth2.Config` for authorization-code exchange with PKCE and `idtoken.Validate` for signature, issuer, audience, and expiry validation. Verify nonce from the validated claims against server-side flow state. Return only `Subject`, normalized `Email`, `EmailVerified`, and safe display/avatar claims.

- [ ] **Step 4: Implement signed flow cookie and safe redirect state**

The short-lived HttpOnly flow cookie contains a signed identifier; server-side flow state stores nonce, PKCE verifier, locale, and allow-listed `returnTo`. Consume it once at callback. Do not place verifier or arbitrary return URLs in query parameters.

- [ ] **Step 5: Implement create/sign-in/link branches transactionally**

Existing `(google, sub)` signs in. A new email creates active role-less user/profile/identity. Matching email creates a `link_identity` action token and sends approval email without creating a Google identity or session. Confirmation locks the user/identity key, inserts the identity once, consumes the action token, preserves `role_id`, and starts a session.

- [ ] **Step 6: Run tests and commit**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/accountauth ./internal/services -run TestGoogle`

Expected: PASS.

```bash
git add backend/go.mod backend/go.sum backend/internal/accountauth/google* backend/internal/services/account_google_service*
git commit -m "feat(auth): add Google sign in"
```

### Task 7: Expose typed HTTP contracts, cookies, rate limits, and Admin isolation

**Files:**
- Create: `backend/internal/handlers/account_auth_handler.go`
- Create: `backend/internal/handlers/account_auth_handler_test.go`
- Create: `backend/internal/middleware/account_auth.go`
- Create: `backend/internal/middleware/account_auth_test.go`
- Modify: `backend/internal/middleware/admin.go`
- Modify: `backend/internal/routes/routes.go`
- Modify: `backend/cmd/app/main.go`
- Modify: `backend/docs/openapi.yaml`

**Interfaces:**
- Produces anonymous endpoints `POST /api/v1/accounts/register`, `POST /api/v1/accounts/verify-email`, `POST /api/v1/accounts/resend-verification`, `POST /api/v1/accounts/login`, `POST /api/v1/accounts/refresh`, `POST /api/v1/accounts/forgot-password`, `POST /api/v1/accounts/reset-password`, `GET /api/v1/accounts/google/start`, `GET /api/v1/accounts/google/callback`, and `POST /api/v1/accounts/google/link/confirm`.
- Produces authenticated endpoints `POST /api/v1/accounts/logout`, `POST /api/v1/accounts/logout-all`, `GET /api/v1/account`, `PATCH /api/v1/account/profile`, `GET /api/v1/account/sessions`, `DELETE /api/v1/account/sessions/:id`, and `POST /api/v1/account/close`.
- Produces `middleware.PublicAccountRequired` and a mandatory `middleware.AdminRequired` group boundary.
- Sets refresh cookie name `wat_public_refresh` and Google flow cookie `wat_google_flow`.

- [ ] **Step 1: Write HTTP contract tests before registering routes**

```go
func TestLoginSetsHttpOnlyRefreshCookieWithoutReturningToken(t *testing.T) {
	app := newAccountHTTPTestApp(t)
	request := httptest.NewRequest(http.MethodPost, "/api/v1/accounts/login", strings.NewReader(`{"email":"a@example.com","password":"correct horse battery staple"}`))
	request.Header.Set("Content-Type", "application/json")
	response, err := app.Test(request)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, response.StatusCode)
	assert.Contains(t, response.Header.Get("Set-Cookie"), "wat_public_refresh=")
	assert.Contains(t, response.Header.Get("Set-Cookie"), "HttpOnly")
	assert.NotContains(t, readBody(t, response), "refresh_token")
}
```

Add contract tests for feature-disabled 404, validation/error codes with trace IDs, allowed Origin on refresh/logout, cookie clear, Google redirects, public token rejection on Admin dashboard, legacy `/auth/register` disabled, and Admin login regression.

- [ ] **Step 2: Run handler/middleware tests and verify failure**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/handlers ./internal/middleware -run 'Test(LoginSets|Account|Admin|LegacyAuth)'`

Expected: FAIL because account routes/middleware are absent.

- [ ] **Step 3: Implement handler DTOs and cookie helpers**

```go
func setRefreshCookie(c *fiber.Ctx, value string, expires time.Time, secure bool) {
	c.Cookie(&fiber.Cookie{Name: "wat_public_refresh", Value: value, Path: "/api/v1/accounts", HTTPOnly: true, Secure: secure, SameSite: fiber.CookieSameSiteLaxMode, Expires: expires})
}
```

Handlers map `accountauth.Error.Code` into the standard envelope with `code`, `field_errors`, and `trace_id`. They never return internal errors or refresh/action/provider tokens.

- [ ] **Step 4: Register feature-gated routes and scoped rate limits**

Mount distinct limiters for register, login, resend, forgot, refresh, and Google start/callback using validated config. The feature-gate middleware returns 404 when disabled. Keep contact rate limiting intact.

- [ ] **Step 5: Enforce the Admin boundary globally**

```go
admin := api.Group("/admin", middleware.AuthRequired, middleware.AdminRequired)
```

`AdminRequired` verifies active role, the legacy/Admin token audience, and rejects role-less users before dashboard or permissions. Disable legacy anonymous register while the public account module is enabled; keep Admin login response contract unchanged.

- [ ] **Step 6: Document every new schema and endpoint in OpenAPI**

Add request/response schemas, cookie behavior, OAuth redirects, error code envelope, Bearer security, and all routes. Mark refresh/action tokens write-only or absent from responses. Document Admin 403 behavior for role-less principals.

- [ ] **Step 7: Run HTTP, middleware, and route tests**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/handlers ./internal/middleware ./internal/routes`

Expected: PASS.

- [ ] **Step 8: Commit the API surface**

```bash
git add backend/internal/handlers/account_auth_handler* backend/internal/middleware backend/internal/routes/routes.go backend/cmd/app/main.go backend/docs/openapi.yaml
git commit -m "feat(auth): expose public account API"
```

### Task 8: Add the frontend account client and in-memory session runtime

**Files:**
- Create: `frontend/src/features/public/account/types.ts`
- Create: `frontend/src/features/public/account/schema.ts`
- Create: `frontend/src/features/public/account/schema.test.ts`
- Create: `frontend/src/features/public/account/api.ts`
- Create: `frontend/src/features/public/account/api.test.ts`
- Create: `frontend/src/features/public/account/queries.ts`
- Create: `frontend/src/features/public/account/AccountSessionProvider.tsx`
- Modify: `frontend/src/app/providers.tsx`
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`

**Interfaces:**
- Produces: `Account`, `AccountSession`, `AccountApiError`, `accountApi`, `accountKeys`, `useAccount`, and `useAccountSession`.
- Keeps the existing `src/services/api.ts` unchanged for Admin compatibility.

- [ ] **Step 1: Add executable TypeScript test support and failing schema tests**

Run: `cd frontend && npm install --save-dev tsx`

Add `"test:account": "tsx --test src/features/public/account/*.test.ts"`.

```ts
test("account schema rejects temple-member fields", () => {
  const result = accountSchema.safeParse({ ...validAccount, member_code: "WLP-1" });
  assert.equal(result.success, false);
});
```

Use `.strict()` Zod objects so unexpected private fields fail parsing.

- [ ] **Step 2: Run tests and verify missing schemas**

Run: `cd frontend && npm run test:account`

Expected: FAIL because `accountSchema` and client functions are missing.

- [ ] **Step 3: Define exact runtime-validated contracts**

```ts
export const accountSchema = z.object({
  id: z.string().uuid(), email: z.string().email(), email_verified: z.boolean(),
  account_status: z.enum(["pending_verification", "active", "disabled", "closed"]),
  display_name: z.string().min(2).max(80), avatar_url: z.string().url().or(z.literal("")),
  preferred_locale: z.enum(["th", "en", "de"]), providers: z.array(z.enum(["password", "google"])),
}).strict();
```

Define discriminated API error codes and field-error records without `any`.

- [ ] **Step 4: Implement a dedicated credentialed Axios client**

Use `withCredentials: true`, an in-module memory access token, and a single shared refresh promise so concurrent 401 responses cause one refresh. Exclude login/refresh endpoints from retry. Clear memory on refresh failure. Never read or write local storage.

- [ ] **Step 5: Implement query hooks and provider bootstrap**

On provider mount with feature enabled, call refresh once, then query `/account`. Expose `status: "loading" | "anonymous" | "authenticated"`, `account`, `login`, `logout`, and `logoutAll`. Keep remote account data in TanStack Query and invalidate `accountKeys.current()` after mutations.

- [ ] **Step 6: Run tests, lint, and type-check**

Run: `cd frontend && npm run test:account`

Expected: PASS, including a test proving two simultaneous 401s issue one refresh.

Run: `cd frontend && npm run lint && ./node_modules/.bin/tsc --noEmit`

Expected: PASS.

- [ ] **Step 7: Commit the frontend runtime**

```bash
git add frontend/package.json frontend/package-lock.json frontend/src/features/public/account frontend/src/app/providers.tsx
git commit -m "feat(auth): add public account client"
```

### Task 9: Build localized account routes, profile, and session management

**Files:**
- Create: `frontend/src/app/[locale]/(client)/(account)/layout.tsx`
- Create: `frontend/src/app/[locale]/(client)/(account)/register/page.tsx`
- Create: `frontend/src/app/[locale]/(client)/(account)/login/page.tsx`
- Create: `frontend/src/app/[locale]/(client)/(account)/verify-email/page.tsx`
- Create: `frontend/src/app/[locale]/(client)/(account)/forgot-password/page.tsx`
- Create: `frontend/src/app/[locale]/(client)/(account)/reset-password/page.tsx`
- Create: `frontend/src/app/[locale]/(client)/(account)/account/page.tsx`
- Create: `frontend/src/app/[locale]/(client)/(account)/account/sessions/page.tsx`
- Create: `frontend/src/features/public/account/components/AccountShell.tsx`
- Create: `frontend/src/features/public/account/components/RegisterForm.tsx`
- Create: `frontend/src/features/public/account/components/LoginForm.tsx`
- Create: `frontend/src/features/public/account/components/RecoveryForms.tsx`
- Create: `frontend/src/features/public/account/components/ProfileForm.tsx`
- Create: `frontend/src/features/public/account/components/SessionList.tsx`
- Create: `frontend/src/features/public/account/messages.test.ts`
- Modify: `frontend/src/messages/th.json`
- Modify: `frontend/src/messages/en.json`
- Modify: `frontend/src/messages/de.json`
- Modify: `frontend/src/components/layout/Navbar.tsx`

**Interfaces:**
- Consumes account hooks from Task 8.
- Produces complete password/Google account flows and direct test URLs while Community remains absent.

- [ ] **Step 1: Write failing locale-completeness and form-schema tests**

```ts
test("account message trees match in th en de", () => {
  assert.deepEqual(flattenKeys(th.Account), flattenKeys(en.Account));
  assert.deepEqual(flattenKeys(th.Account), flattenKeys(de.Account));
});
```

Add tests for password 12/128 bounds, display name 2/80 after trim, email normalization, and safe locale-preserving `returnTo` values.

- [ ] **Step 2: Run focused tests and verify missing Account messages**

Run: `cd frontend && npm run test:account`

Expected: FAIL because the `Account` message namespace and forms do not exist.

- [ ] **Step 3: Implement feature-gated route shell**

```tsx
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NEXT_PUBLIC_PUBLIC_ACCOUNT_AUTH_ENABLED !== "true") notFound();
  return <AccountShell>{children}</AccountShell>;
}
```

Keep page files composition-only. Add no Community navigation or placeholder Community screen.

- [ ] **Step 4: Implement registration/login/verification/recovery forms**

Use React Hook Form + Zod, 44px minimum controls, visible labels, field-level backend errors, loading/disabled states, keyboard focus on error summary, and locale-aware links. Google start uses the backend authorization URL and an allow-listed return path. Success screens explain email delivery without revealing account existence.

- [ ] **Step 5: Implement profile and session pages**

Profile edits display name, optional avatar URL, and preferred locale only. Session list identifies current session, supports per-session revoke, logout current, and logout all with confirmation. Closed/disabled states show localized recovery guidance without exposing security details.

- [ ] **Step 6: Add complete TH/EN/DE copy and conditional navigation**

Add identical key trees for titles, labels, descriptions, validation, backend error codes, email-sent states, Google-link approval, session actions, closure, and accessibility labels. Show account navigation only when the feature flag is enabled; show login or profile based on provider status.

- [ ] **Step 7: Run account tests and frontend verification**

Run: `cd frontend && npm run test:account && npm run lint && ./node_modules/.bin/tsc --noEmit && npm run build`

Expected: all commands PASS; build produces localized account routes only when the build-time flag is enabled.

- [ ] **Step 8: Commit the account UI**

```bash
git add 'frontend/src/app/[locale]/(client)/(account)' frontend/src/features/public/account/components frontend/src/messages frontend/src/components/layout/Navbar.tsx
git commit -m "feat(auth): add localized account UI"
```

### Task 10: Complete security events, release documentation, and end-to-end acceptance

**Files:**
- Create: `backend/internal/services/account_security_service.go`
- Create: `backend/internal/services/account_security_service_test.go`
- Create: `backend/internal/accountauth/client_info.go`
- Create: `backend/internal/accountauth/client_info_test.go`
- Create: `docs/AUTH_TESTING.md`
- Modify: `docs/DEPLOYMENT.md`
- Modify: `README.md`
- Modify: `backend/docs/openapi.yaml`

**Interfaces:**
- Produces allow-listed events for registration, verification, login success/failure, refresh reuse, reset, Google link, revoke, and closure.
- Produces the repeatable local/test acceptance procedure and production rollout/rollback checklist.

- [ ] **Step 1: Write failing redaction and coarse-IP tests**

```go
func TestSecurityEventDropsSecretsAndCoarsensIP(t *testing.T) {
	event := BuildSecurityEvent(ClientInfo{IP: "203.0.113.42", UserAgent: "Browser/1.0"}, map[string]any{
		"provider": "google", "refresh_token": "secret", "password": "secret",
	})
	assert.Equal(t, "203.0.113.0/24", event.IPPrefix)
	assert.NotContains(t, event.Metadata, "refresh_token")
	assert.NotContains(t, event.Metadata, "password")
}
```

Use a concrete `map[string]any` sanitizer with an allow-list of metadata keys; never serialize arbitrary request bodies.

- [ ] **Step 2: Run security tests and verify failure**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/accountauth ./internal/services -run 'TestSecurityEvent'`

Expected: FAIL because the event builder/service is missing.

- [ ] **Step 3: Implement security-event recording and wire all auth services**

Record success/failure with trace ID, provider, user ID when known, coarse IP prefix, and allow-listed reason codes. Do not fail the user operation solely because event persistence fails; emit one structured error containing the trace ID and event type, never secrets.

- [ ] **Step 4: Write the executable acceptance guide**

`docs/AUTH_TESTING.md` must contain exact local env flags, Google callback registration, capture-email retrieval, disposable database migration commands, test users, browser steps for password and Google flows, session rotation/reuse check, TH/EN/DE checks, keyboard checks, Admin regression, and cleanup. Use placeholders only for secrets and domains, never real credentials.

- [ ] **Step 5: Update deployment source of truth**

Document same-site cookie topology, both feature flags, Resend/Google secrets, migration `000023`, release order, health/smoke checks, disable-flags-first rollback, and the invariant that production rollback does not run destructive down migrations.

- [ ] **Step 6: Run the complete verification suite**

```bash
cd frontend && npm run test:account
cd frontend && npm run lint
cd frontend && ./node_modules/.bin/tsc --noEmit
cd frontend && npm run build
cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./...
cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go vet ./...
cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go build -o bin/server ./cmd/app
```

Expected: every command PASS. If the browser environment cannot reach Google, the mocked automated Google suite must pass and the live Google acceptance item remains explicitly unchecked; do not claim live OAuth acceptance.

- [ ] **Step 7: Execute browser acceptance with both feature flags enabled in test**

Verify password register → captured email → verify → login → refresh → profile → revoke/logout → forgot/reset, Google new account, Google matching-email approval, expired actions, disabled account, mobile/desktop, keyboard, all three locales, and unchanged Admin login/CMS. Confirm no `members` row was created for either public account.

- [ ] **Step 8: Review the final diff for contract and secret safety**

Run: `git diff --check && git status --short`

Expected: no whitespace errors; only planned source, migration, test, env-example, OpenAPI, and designated documentation files appear. Search staged content for `refresh_token`, `client_secret`, and password-like values and confirm occurrences are field names/tests/placeholders only.

- [ ] **Step 9: Commit final hardening and operations**

```bash
git add backend/internal/services/account_security_service* backend/internal/accountauth/client_info* docs/AUTH_TESTING.md docs/DEPLOYMENT.md README.md backend/docs/openapi.yaml
git commit -m "docs(auth): add account rollout and acceptance"
```

## Completion gate

Do not start the Community Q&A design or implementation from this plan. Completion means the product owner can independently test password and Google sign-in, verification, recovery, profile, and sessions; every automated/repository check above passes; Admin isolation is proven; and the owner explicitly approves the Auth experience.
