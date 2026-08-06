package services

import (
	"context"
	"errors"
	"sync"
	"testing"
	"time"

	"gorm.io/gorm"

	"github.com/watloungporsai/wat-profile-backend/internal/accountauth"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
)

// fakeGoogleVerifier implements accountauth.GoogleVerifier with a canned identity.
type fakeGoogleVerifier struct {
	identity      accountauth.GoogleIdentity
	err           error
	mu            sync.Mutex
	recordedCode  string
	recordedVerif string
	recordedNonce string
}

func (f *fakeGoogleVerifier) AuthorizationURL(state, nonce, challenge string) string {
	return "https://accounts.google.com/o/oauth2/auth?state=" + state + "&nonce=" + nonce + "&code_challenge=" + challenge
}

func (f *fakeGoogleVerifier) VerifyCallback(ctx context.Context, code, verifier, nonce string) (accountauth.GoogleIdentity, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.recordedCode = code
	f.recordedVerif = verifier
	f.recordedNonce = nonce
	if f.err != nil {
		return accountauth.GoogleIdentity{}, f.err
	}
	return f.identity, nil
}

// googleFixture bundles the service under test and its collaborators.
type googleFixture struct {
	svc      *AccountGoogleService
	sender   *fakeEmailSender
	db       *gorm.DB
	store    *memoryGoogleFlowStore
	verifier *fakeGoogleVerifier
}

func newGoogleFixture(t *testing.T, identity accountauth.GoogleIdentity) *googleFixture {
	t.Helper()
	t.Setenv("GOOGLE_FLOW_SECRET", "test-flow-secret")
	t.Setenv("PUBLIC_ACCOUNT_FRONTEND_URL", "http://localhost:3000")

	db := newAccountTestDB(t)
	sender := &fakeEmailSender{}
	sessions := NewAccountSessionService(db, fixedClockAt(fixedNow()), accountauth.NewOpaqueToken, testAccessIssuer(t), 30*24*time.Hour)
	store := &memoryGoogleFlowStore{flows: map[string]googleFlowData{}}
	verifier := &fakeGoogleVerifier{identity: identity}

	svc := NewAccountGoogleService(db, fixedClockAt(fixedNow()), accountauth.NewOpaqueToken, sender, verifier, sessions, []byte("test-flow-secret"), "http://localhost:3000")
	svc.flows = store
	return &googleFixture{svc: svc, sender: sender, db: db, store: store, verifier: verifier}
}

// startFlow runs StartGoogle and returns the flow cookie.
func startFlow(t *testing.T, f *googleFixture, locale, returnTo string) string {
	t.Helper()
	result, err := f.svc.StartGoogle(context.Background(), locale, returnTo)
	if err != nil {
		t.Fatalf("StartGoogle: %v", err)
	}
	if result.FlowCookie == "" || result.AuthorizationURL == "" {
		t.Fatal("StartGoogle returned empty authorization URL or flow cookie")
	}
	return result.FlowCookie
}

func flowState(t *testing.T, flowCookie string) string {
	t.Helper()
	state, err := accountauth.ParseFlowCookie(flowCookie, []byte("test-flow-secret"))
	if err != nil {
		t.Fatalf("parse flow cookie: %v", err)
	}
	return state
}

func TestGoogleMatchingEmailRequiresApproval(t *testing.T) {
	f := newGoogleFixture(t, accountauth.GoogleIdentity{Subject: "google-sub", Email: "known@example.com", EmailVerified: true})
	seedVerifiedPasswordAccount(t, f.db, "known@example.com")

	flowCookie := startFlow(t, f, "en", "/account")
	result, err := f.svc.CompleteGoogle(context.Background(), "code", flowState(t, flowCookie), flowCookie, testClient())
	if err != nil {
		t.Fatalf("CompleteGoogle: %v", err)
	}
	if result.Status != GoogleCompletionApprovalSent {
		t.Fatalf("expected approval_sent, got %q", result.Status)
	}
	if result.Session.AccessToken != "" || result.Session.RefreshToken != "" {
		t.Fatal("approval flow must not issue a session")
	}
	var googleIdentities int64
	f.db.Model(&models.AuthIdentity{}).Where("provider = ? AND user_id = ?", "google", result.UserID).Count(&googleIdentities)
	if googleIdentities != 0 {
		t.Fatalf("expected no google identity, found %d", googleIdentities)
	}
	if f.sender.count() != 1 {
		t.Fatalf("expected 1 link-approval email, got %d", f.sender.count())
	}
	last := f.sender.messages[f.sender.count()-1]
	if last.ActionURL == "" {
		t.Fatal("link-approval email must contain an approval URL")
	}
	if !containsPrefix(last.ActionURL, "http://localhost:3000/en/account/link?token=") {
		t.Fatalf("unexpected approval URL %q", last.ActionURL)
	}
}

func TestGoogleNewAccountCreatesActiveUser(t *testing.T) {
	f := newGoogleFixture(t, accountauth.GoogleIdentity{Subject: "new-google-sub", Email: "New.User@Example.com", EmailVerified: true, DisplayName: "New User"})

	flowCookie := startFlow(t, f, "de", "")
	result, err := f.svc.CompleteGoogle(context.Background(), "code", flowState(t, flowCookie), flowCookie, testClient())
	if err != nil {
		t.Fatalf("CompleteGoogle: %v", err)
	}
	if result.Status != GoogleCompletionCreated {
		t.Fatalf("expected created, got %q", result.Status)
	}
	if result.Session.AccessToken == "" || result.Session.RefreshToken == "" {
		t.Fatal("new account must receive a session")
	}

	var user models.User
	if err := f.db.First(&user, "id = ?", result.UserID).Error; err != nil {
		t.Fatalf("user not found: %v", err)
	}
	if user.Email != "new.user@example.com" || user.AccountStatus != models.AccountStatusActive || !user.IsActive {
		t.Fatalf("unexpected user state: %+v", user)
	}
	if user.RoleID != nil {
		t.Fatal("new public account must not receive a role")
	}
	var profile models.AccountProfile
	if err := f.db.First(&profile, "user_id = ?", result.UserID).Error; err != nil {
		t.Fatalf("profile not found: %v", err)
	}
	if profile.DisplayName != "New User" || profile.PreferredLocale != "de" {
		t.Fatalf("unexpected profile: %+v", profile)
	}
	var googleIdentity models.AuthIdentity
	if err := f.db.First(&googleIdentity, "user_id = ? AND provider = ?", result.UserID, "google").Error; err != nil {
		t.Fatalf("google identity not found: %v", err)
	}
	if googleIdentity.ProviderSubject != "new-google-sub" {
		t.Fatalf("unexpected subject %q", googleIdentity.ProviderSubject)
	}
	if got := rowCount(t, f.db, "members"); got != 0 {
		t.Fatalf("expected no members rows, got %d", got)
	}
}

func TestGoogleExistingLinkedIdentitySignsIn(t *testing.T) {
	f := newGoogleFixture(t, accountauth.GoogleIdentity{Subject: "linked-sub", Email: "linked@example.com", EmailVerified: true})
	user := seedVerifiedPasswordAccount(t, f.db, "linked@example.com")
	f.db.Create(&models.AuthIdentity{UserID: user.ID, Provider: "google", ProviderSubject: "linked-sub", ProviderEmail: "linked@example.com"})

	flowCookie := startFlow(t, f, "en", "/account")
	result, err := f.svc.CompleteGoogle(context.Background(), "code", flowState(t, flowCookie), flowCookie, testClient())
	if err != nil {
		t.Fatalf("CompleteGoogle: %v", err)
	}
	if result.Status != GoogleCompletionSignedIn {
		t.Fatalf("expected signed_in, got %q", result.Status)
	}
	if result.Session.AccessToken == "" {
		t.Fatal("signed-in flow must issue an access token")
	}
	if result.UserID != user.ID {
		t.Fatal("must sign in the linked user")
	}
	if got := rowCount(t, f.db, "members"); got != 0 {
		t.Fatalf("expected no members rows, got %d", got)
	}
}

func TestGoogleUnverifiedEmailRejected(t *testing.T) {
	f := newGoogleFixture(t, accountauth.GoogleIdentity{Subject: "unverified-sub", Email: "unverified@example.com", EmailVerified: false})

	flowCookie := startFlow(t, f, "en", "")
	_, err := f.svc.CompleteGoogle(context.Background(), "code", flowState(t, flowCookie), flowCookie, testClient())
	if err == nil || accountauth.ErrorCode(err) != accountauth.CodeTokenInvalid {
		t.Fatalf("expected token-invalid error for unverified email, got %v", err)
	}
}

func TestGoogleFlowExpiredRejected(t *testing.T) {
	f := newGoogleFixture(t, accountauth.GoogleIdentity{Subject: "expired-sub", Email: "expired@example.com", EmailVerified: true})
	flowCookie := startFlow(t, f, "en", "")

	expiredSvc := NewAccountGoogleService(f.db, fixedClockAt(fixedNow().Add(11*time.Minute)), accountauth.NewOpaqueToken, f.sender, f.verifier, f.sessions(), []byte("test-flow-secret"), "http://localhost:3000")
	_, err := expiredSvc.CompleteGoogle(context.Background(), "code", flowState(t, flowCookie), flowCookie, testClient())
	if err == nil || accountauth.ErrorCode(err) != accountauth.CodeTokenInvalid {
		t.Fatalf("expected token-invalid for expired flow, got %v", err)
	}
}

func (f *googleFixture) sessions() *AccountSessionService {
	return f.svc.sessions
}

func TestGoogleFlowConsumedOnce(t *testing.T) {
	f := newGoogleFixture(t, accountauth.GoogleIdentity{Subject: "once-sub", Email: "once@example.com", EmailVerified: true})
	flowCookie := startFlow(t, f, "en", "")

	if _, err := f.svc.CompleteGoogle(context.Background(), "code", flowState(t, flowCookie), flowCookie, testClient()); err != nil {
		t.Fatalf("first CompleteGoogle: %v", err)
	}
	_, err := f.svc.CompleteGoogle(context.Background(), "code", flowState(t, flowCookie), flowCookie, testClient())
	if err == nil || accountauth.ErrorCode(err) != accountauth.CodeTokenInvalid {
		t.Fatalf("expected token-invalid on flow reuse, got %v", err)
	}
}

func TestGoogleTamperedFlowCookieRejected(t *testing.T) {
	f := newGoogleFixture(t, accountauth.GoogleIdentity{Subject: "tamper-sub", Email: "tamper@example.com", EmailVerified: true})
	flowCookie := startFlow(t, f, "en", "")
	tampered := flipLastByte(flowCookie)

	_, err := f.svc.CompleteGoogle(context.Background(), "code", flowState(t, flowCookie), tampered, testClient())
	if err == nil || accountauth.ErrorCode(err) != accountauth.CodeTokenInvalid {
		t.Fatalf("expected token-invalid for tampered cookie, got %v", err)
	}
}

func TestGoogleCallbackStateMustMatchCookieAndDoesNotConsumeOnMismatch(t *testing.T) {
	f := newGoogleFixture(t, accountauth.GoogleIdentity{Subject: "state-sub", Email: "state@example.com", EmailVerified: true})
	flowCookie := startFlow(t, f, "en", "")
	state := flowState(t, flowCookie)
	if _, err := f.svc.CompleteGoogle(context.Background(), "code", "wrong-state", flowCookie, testClient()); accountauth.ErrorCode(err) != accountauth.CodeTokenInvalid {
		t.Fatalf("expected token-invalid for mismatched callback state, got %v", err)
	}
	if _, err := f.svc.CompleteGoogle(context.Background(), "code", state, flowCookie, testClient()); err != nil {
		t.Fatalf("matching callback state should still consume a valid flow: %v", err)
	}
}

func TestGoogleSignInPersistsCoarseSecurityContext(t *testing.T) {
	f := newGoogleFixture(t, accountauth.GoogleIdentity{Subject: "audit-sub", Email: "audit@example.com", EmailVerified: true})
	f.svc.security = NewAccountSecurityService(f.db, fixedClockAt(fixedNow()))
	flowCookie := startFlow(t, f, "en", "")
	client := accountauth.ClientInfo{IP: "203.0.113.42", TraceID: "google-trace-test"}
	result, err := f.svc.CompleteGoogle(context.Background(), "code", flowState(t, flowCookie), flowCookie, client)
	if err != nil {
		t.Fatalf("CompleteGoogle: %v", err)
	}
	var event models.AuthSecurityEvent
	if err := f.db.Where("event_type = ? AND user_id = ?", "google_sign_in", result.UserID).Order("created_at DESC").First(&event).Error; err != nil {
		t.Fatalf("google security event not persisted: %v", err)
	}
	if event.Outcome != "success" || event.Provider != "google" || event.RequestTraceID != client.TraceID || event.IPPrefix != "203.0.113.0/24" {
		t.Fatalf("unexpected google security event: %+v", event)
	}
}

func TestStartGoogleValidatesReturnTo(t *testing.T) {
	f := newGoogleFixture(t, accountauth.GoogleIdentity{Subject: "rt-sub", Email: "rt@example.com", EmailVerified: true})

	if _, err := f.svc.StartGoogle(context.Background(), "en", "https://evil.com/steal"); err == nil {
		t.Fatal("expected absolute external returnTo to be rejected")
	}
	if _, err := f.svc.StartGoogle(context.Background(), "en", "//evil.com"); err == nil {
		t.Fatal("expected protocol-relative returnTo to be rejected")
	}
	if _, err := f.svc.StartGoogle(context.Background(), "en", "/account"); err != nil {
		t.Fatalf("expected relative returnTo to be accepted, got %v", err)
	}
	if _, err := f.svc.StartGoogle(context.Background(), "en", ""); err != nil {
		t.Fatalf("expected empty returnTo to be accepted, got %v", err)
	}
}

func TestStartGoogleLinkRejectsStaleAuthentication(t *testing.T) {
	f := newGoogleFixture(t, accountauth.GoogleIdentity{Subject: "link-stale-sub", Email: "link-stale@example.com", EmailVerified: true})
	user := seedVerifiedPasswordAccount(t, f.db, "link-stale@example.com")

	_, err := f.svc.StartGoogleLink(context.Background(), user.ID, fixedNow().Add(-11*time.Minute), "en", "/account")
	if err == nil || accountauth.ErrorCode(err) != accountauth.CodeReauthRequired {
		t.Fatalf("expected reauth-required for stale auth, got %v", err)
	}
	if got := rowCount(t, f.db, "auth_oauth_flows"); got != 0 {
		t.Fatalf("expected no stored flow on stale auth, got %d", got)
	}
}

func TestStartGoogleLinkRejectsAlreadyLinkedAccount(t *testing.T) {
	f := newGoogleFixture(t, accountauth.GoogleIdentity{Subject: "link-already-sub", Email: "link-already@example.com", EmailVerified: true})
	user := seedVerifiedPasswordAccount(t, f.db, "link-already@example.com")
	f.db.Create(&models.AuthIdentity{UserID: user.ID, Provider: "google", ProviderSubject: "link-already-sub", ProviderEmail: "link-already@example.com"})

	_, err := f.svc.StartGoogleLink(context.Background(), user.ID, fixedNow(), "en", "/account")
	if err == nil || accountauth.ErrorCode(err) != accountauth.CodeGoogleAlreadyLinked {
		t.Fatalf("expected already-linked error, got %v", err)
	}
}

func TestStartGoogleLinkRejectsPendingCooldown(t *testing.T) {
	f := newGoogleFixture(t, accountauth.GoogleIdentity{Subject: "link-pending-sub", Email: "link-pending@example.com", EmailVerified: true})
	user := seedVerifiedPasswordAccount(t, f.db, "link-pending@example.com")
	f.db.Create(&models.AuthActionToken{
		UserID:    user.ID,
		Purpose:   "link_identity",
		TokenHash: accountauth.HashOpaqueToken("pending-link-token"),
		Payload:   models.JSONMap{"provider": "google", "subject": "link-pending-sub"},
		ExpiresAt: fixedNow().Add(30 * time.Minute),
		CreatedAt: fixedNow().Add(-10 * time.Second),
	})

	_, err := f.svc.StartGoogleLink(context.Background(), user.ID, fixedNow(), "en", "/account")
	if err == nil || accountauth.ErrorCode(err) != accountauth.CodeGoogleLinkPending {
		t.Fatalf("expected link-pending error, got %v", err)
	}
	var accountErr *accountauth.Error
	if !errors.As(err, &accountErr) {
		t.Fatalf("expected typed account error, got %v", err)
	}
	if accountErr.RetryAfter <= 0 {
		t.Fatalf("expected positive retry-after for pending cooldown, got %v", accountErr.RetryAfter)
	}
	if got := rowCount(t, f.db, "auth_oauth_flows"); got != 0 {
		t.Fatalf("expected no second flow stored on cooldown, got %d", got)
	}
}

func TestGoogleLinkStatusReportsConnectedAndPending(t *testing.T) {
	f := newGoogleFixture(t, accountauth.GoogleIdentity{Subject: "status-sub", Email: "status@example.com", EmailVerified: true})
	user := seedVerifiedPasswordAccount(t, f.db, "status@example.com")

	status, err := f.svc.GoogleLinkStatus(context.Background(), user.ID)
	if err != nil {
		t.Fatalf("GoogleLinkStatus: %v", err)
	}
	if status.Connected || status.Pending {
		t.Fatalf("expected clean initial status, got %+v", status)
	}

	f.db.Create(&models.AuthActionToken{
		UserID:    user.ID,
		Purpose:   "link_identity",
		TokenHash: accountauth.HashOpaqueToken("status-link-token"),
		Payload:   models.JSONMap{"provider": "google", "subject": "status-sub"},
		ExpiresAt: fixedNow().Add(30 * time.Minute),
		CreatedAt: fixedNow().Add(-10 * time.Second),
	})
	status, err = f.svc.GoogleLinkStatus(context.Background(), user.ID)
	if err != nil {
		t.Fatalf("GoogleLinkStatus: %v", err)
	}
	if !status.Pending {
		t.Fatal("expected pending true with unconsumed link token")
	}
	if status.RetryAfter <= 0 {
		t.Fatalf("expected positive retry-after for pending status, got %v", status.RetryAfter)
	}

	f.db.Create(&models.AuthIdentity{UserID: user.ID, Provider: "google", ProviderSubject: "status-sub", ProviderEmail: "status@example.com"})
	status, err = f.svc.GoogleLinkStatus(context.Background(), user.ID)
	if err != nil {
		t.Fatalf("GoogleLinkStatus: %v", err)
	}
	if !status.Connected {
		t.Fatal("expected connected true after google identity added")
	}
}

func TestStartGooglePreservesLocale(t *testing.T) {
	f := newGoogleFixture(t, accountauth.GoogleIdentity{Subject: "loc-sub", Email: "loc@example.com", EmailVerified: true})

	flowCookie := startFlow(t, f, "de", "")
	state, err := accountauth.ParseFlowCookie(flowCookie, []byte("test-flow-secret"))
	if err != nil {
		t.Fatalf("parse flow cookie: %v", err)
	}
	flow, ok, err := f.store.Take(context.Background(), state)
	if err != nil {
		t.Fatalf("take flow: %v", err)
	}
	if !ok {
		t.Fatal("flow not found in store")
	}
	if flow.Locale != "de" {
		t.Fatalf("expected locale de, got %q", flow.Locale)
	}
}

func TestConfirmGoogleLinkInsertsIdentityAndSessions(t *testing.T) {
	f := newGoogleFixture(t, accountauth.GoogleIdentity{Subject: "confirm-sub", Email: "confirm@example.com", EmailVerified: true})
	user := seedVerifiedPasswordAccount(t, f.db, "confirm@example.com")

	// Build a link_identity action token directly.
	raw := "link-raw-token"
	f.db.Create(&models.AuthActionToken{
		UserID:    user.ID,
		Purpose:   "link_identity",
		TokenHash: accountauth.HashOpaqueToken(raw),
		Payload:   models.JSONMap{"provider": "google", "subject": "confirm-sub", "email": "confirm@example.com"},
		ExpiresAt: fixedNow().Add(30 * time.Minute),
	})

	result, err := f.svc.ConfirmGoogleLink(context.Background(), raw, testClient())
	if err != nil {
		t.Fatalf("ConfirmGoogleLink: %v", err)
	}
	if result.AccessToken == "" || result.RefreshToken == "" {
		t.Fatal("expected a session after linking")
	}

	var googleIdentity models.AuthIdentity
	if err := f.db.First(&googleIdentity, "user_id = ? AND provider = ?", user.ID, "google").Error; err != nil {
		t.Fatalf("google identity not created: %v", err)
	}
	if googleIdentity.ProviderSubject != "confirm-sub" {
		t.Fatalf("unexpected subject %q", googleIdentity.ProviderSubject)
	}
	var consumed models.AuthActionToken
	if err := f.db.First(&consumed, "token_hash = ?", accountauth.HashOpaqueToken(raw)).Error; err != nil {
		t.Fatalf("token not found: %v", err)
	}
	if consumed.ConsumedAt == nil {
		t.Fatal("link token must be consumed")
	}
}

func TestConfirmGoogleLinkExpiredRejected(t *testing.T) {
	f := newGoogleFixture(t, accountauth.GoogleIdentity{Subject: "exp-link-sub", Email: "exp-link@example.com", EmailVerified: true})
	user := seedVerifiedPasswordAccount(t, f.db, "exp-link@example.com")

	raw := "expired-link-token"
	f.db.Create(&models.AuthActionToken{
		UserID:    user.ID,
		Purpose:   "link_identity",
		TokenHash: accountauth.HashOpaqueToken(raw),
		Payload:   models.JSONMap{"provider": "google", "subject": "exp-link-sub"},
		ExpiresAt: fixedNow().Add(-1 * time.Minute),
	})

	_, err := f.svc.ConfirmGoogleLink(context.Background(), raw, testClient())
	if err == nil || accountauth.ErrorCode(err) != accountauth.CodeTokenInvalid {
		t.Fatalf("expected token-invalid for expired link token, got %v", err)
	}
}

func TestConfirmGoogleLinkRaceSingleUse(t *testing.T) {
	f := newGoogleFixture(t, accountauth.GoogleIdentity{Subject: "race-link-sub", Email: "race-link@example.com", EmailVerified: true})
	user := seedVerifiedPasswordAccount(t, f.db, "race-link@example.com")

	raw := "race-link-token"
	f.db.Create(&models.AuthActionToken{
		UserID:    user.ID,
		Purpose:   "link_identity",
		TokenHash: accountauth.HashOpaqueToken(raw),
		Payload:   models.JSONMap{"provider": "google", "subject": "race-link-sub"},
		ExpiresAt: fixedNow().Add(30 * time.Minute),
	})

	results := make(chan error, 2)
	for i := 0; i < 2; i++ {
		go func() {
			_, err := f.svc.ConfirmGoogleLink(context.Background(), raw, testClient())
			results <- err
		}()
	}
	successes := 0
	for i := 0; i < 2; i++ {
		if err := <-results; err == nil {
			successes++
		}
	}
	if successes != 1 {
		t.Fatalf("expected exactly 1 success, got %d", successes)
	}
}

func TestConfirmGoogleLinkClosedAccountRejected(t *testing.T) {
	f := newGoogleFixture(t, accountauth.GoogleIdentity{Subject: "closed-link-sub", Email: "closed-link@example.com", EmailVerified: true})
	user := seedVerifiedPasswordAccount(t, f.db, "closed-link@example.com")
	f.db.Model(&user).Updates(map[string]interface{}{"account_status": string(models.AccountStatusClosed), "is_active": false})

	raw := "closed-link-token"
	f.db.Create(&models.AuthActionToken{
		UserID:    user.ID,
		Purpose:   "link_identity",
		TokenHash: accountauth.HashOpaqueToken(raw),
		Payload:   models.JSONMap{"provider": "google", "subject": "closed-link-sub"},
		ExpiresAt: fixedNow().Add(30 * time.Minute),
	})

	_, err := f.svc.ConfirmGoogleLink(context.Background(), raw, testClient())
	if err == nil {
		t.Fatal("expected closed account rejection")
	}
}

func TestGoogleDisabledAccountRejected(t *testing.T) {
	f := newGoogleFixture(t, accountauth.GoogleIdentity{Subject: "disabled-sub", Email: "disabled@example.com", EmailVerified: true})
	user := seedVerifiedPasswordAccount(t, f.db, "disabled@example.com")
	f.db.Model(&user).Updates(map[string]interface{}{"account_status": string(models.AccountStatusDisabled)})

	flowCookie := startFlow(t, f, "en", "")
	_, err := f.svc.CompleteGoogle(context.Background(), "code", flowState(t, flowCookie), flowCookie, testClient())
	if err == nil || accountauth.ErrorCode(err) != accountauth.CodeAccountDisabled {
		t.Fatalf("expected account-disabled error, got %v", err)
	}
}

// flipLastByte flips the final byte of a non-empty string (used to tamper cookies/tokens).
func flipLastByte(s string) string {
	if s == "" {
		return s
	}
	b := []byte(s)
	last := b[len(b)-1]
	if last == 'a' {
		b[len(b)-1] = 'b'
	} else {
		b[len(b)-1] = 'a'
	}
	return string(b)
}

// containsPrefix reports whether s starts with prefix.
func containsPrefix(s, prefix string) bool {
	return len(s) >= len(prefix) && s[:len(prefix)] == prefix
}

var _ accountauth.GoogleVerifier = (*fakeGoogleVerifier)(nil)
