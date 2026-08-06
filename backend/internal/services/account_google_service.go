package services

import (
	"context"
	"crypto/hmac"
	"errors"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	"golang.org/x/oauth2"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/watloungporsai/wat-profile-backend/internal/accountauth"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
)

const (
	linkIdentityPurpose = "link_identity"
	flowTTL             = 10 * time.Minute
	linkResendWindow    = 60 * time.Second
)

// GoogleCompletionStatus reports the outcome of a Google sign-in attempt.
type GoogleCompletionStatus string

const (
	GoogleCompletionCreated      GoogleCompletionStatus = "created"
	GoogleCompletionSignedIn     GoogleCompletionStatus = "signed_in"
	GoogleCompletionApprovalSent GoogleCompletionStatus = "approval_sent"
)

// GoogleCompletion is the result of CompleteGoogle.
type GoogleCompletion struct {
	Status   GoogleCompletionStatus
	Session  accountauth.SessionResult
	UserID   uuid.UUID
	Locale   string
	ReturnTo string
}

// GoogleStartResult is the result of StartGoogle.
type GoogleStartResult struct {
	AuthorizationURL string
	FlowCookie       string
}

// GoogleLinkStatus is the observable link state for the current account.
type GoogleLinkStatus struct {
	Connected  bool
	Pending    bool
	RetryAfter time.Duration
}

// googleFlowData is server-side state for one OAuth flow, keyed by state.
type googleFlowData struct {
	Nonce      string
	Verifier   string
	Locale     string
	ReturnTo   string
	ExpiresAt  time.Time
	LinkUserID uuid.UUID
}

// googleFlowStore persists short-lived OAuth flow state.
type googleFlowStore interface {
	Put(ctx context.Context, state string, flow googleFlowData) error
	Take(ctx context.Context, state string) (googleFlowData, bool, error)
}

// memoryGoogleFlowStore is a non-persistent flow store for local/testing use.
type memoryGoogleFlowStore struct {
	mu    sync.Mutex
	flows map[string]googleFlowData
}

func (s *memoryGoogleFlowStore) Put(ctx context.Context, state string, flow googleFlowData) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.flows == nil {
		s.flows = map[string]googleFlowData{}
	}
	s.flows[state] = flow
	return nil
}

func (s *memoryGoogleFlowStore) Take(ctx context.Context, state string) (googleFlowData, bool, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	flow, ok := s.flows[state]
	if !ok {
		return googleFlowData{}, false, nil
	}
	delete(s.flows, state)
	return flow, true, nil
}

// postgresGoogleFlowStore keeps OAuth state in the shared database so a
// callback can land on any API instance and a process restart cannot orphan a
// flow. Take deletes under a row lock, making consumption one-time.
type postgresGoogleFlowStore struct {
	db    *gorm.DB
	clock accountauth.Clock
}

func (s *postgresGoogleFlowStore) Put(ctx context.Context, state string, flow googleFlowData) error {
	var linkUserID *uuid.UUID
	if flow.LinkUserID != uuid.Nil {
		linkUserID = &flow.LinkUserID
	}
	return s.db.WithContext(ctx).Create(&models.AuthOAuthFlow{
		StateHash:  accountauth.HashOpaqueToken(state),
		Nonce:      flow.Nonce,
		Verifier:   flow.Verifier,
		Locale:     flow.Locale,
		ReturnTo:   flow.ReturnTo,
		ExpiresAt:  flow.ExpiresAt,
		LinkUserID: linkUserID,
	}).Error
}

func (s *postgresGoogleFlowStore) Take(ctx context.Context, state string) (googleFlowData, bool, error) {
	var flow googleFlowData
	ok := false
	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var row models.AuthOAuthFlow
		err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("state_hash = ? AND expires_at > ?", accountauth.HashOpaqueToken(state), s.clock.Now()).
			First(&row).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil
		}
		if err != nil {
			return err
		}
		if err := tx.Delete(&row).Error; err != nil {
			return err
		}
		flow = googleFlowData{Nonce: row.Nonce, Verifier: row.Verifier, Locale: row.Locale, ReturnTo: row.ReturnTo, ExpiresAt: row.ExpiresAt}
		if row.LinkUserID != nil {
			flow.LinkUserID = *row.LinkUserID
		}
		ok = true
		return nil
	})
	return flow, ok, err
}

// AccountGoogleService implements Google authorization-code + PKCE sign-in,
// new-account creation, and approval-based linking to an existing email.
type AccountGoogleService struct {
	db          *gorm.DB
	clock       accountauth.Clock
	tokenGen    accountauth.TokenGenerator
	sender      accountauth.EmailSender
	verifier    accountauth.GoogleVerifier
	sessions    *AccountSessionService
	flows       googleFlowStore
	flowSecret  []byte
	frontendURL string
	security    accountauth.SecurityRecorder
}

// NewAccountGoogleService builds the Google auth service. The flow store
// defaults to a PostgreSQL-backed implementation; tests and isolated local
// flows may swap s.flows for memoryGoogleFlowStore.
func NewAccountGoogleService(db *gorm.DB, clock accountauth.Clock, tokenGen accountauth.TokenGenerator, sender accountauth.EmailSender, verifier accountauth.GoogleVerifier, sessions *AccountSessionService, flowSecret []byte, frontendURL string, recorders ...accountauth.SecurityRecorder) *AccountGoogleService {
	return &AccountGoogleService{
		db:          db,
		clock:       clock,
		tokenGen:    tokenGen,
		sender:      sender,
		verifier:    verifier,
		sessions:    sessions,
		flows:       &postgresGoogleFlowStore{db: db, clock: clock},
		flowSecret:  flowSecret,
		frontendURL: frontendURL,
		security:    pickSecurityRecorder(recorders),
	}
}

// StartGoogle begins an OAuth flow and returns the Google authorization URL
// plus the signed flow cookie that must be stored by the client.
func (s *AccountGoogleService) StartGoogle(ctx context.Context, locale, returnTo string) (GoogleStartResult, error) {
	locale = accountauth.SafeLocale(locale)
	if err := validateReturnTo(returnTo); err != nil {
		return GoogleStartResult{}, err
	}

	state, _, err := accountauth.NewOpaqueToken()
	if err != nil {
		return GoogleStartResult{}, err
	}
	nonce, _, err := accountauth.NewOpaqueToken()
	if err != nil {
		return GoogleStartResult{}, err
	}
	verifier, _, err := accountauth.NewOpaqueToken()
	if err != nil {
		return GoogleStartResult{}, err
	}
	challenge := oauth2.S256ChallengeFromVerifier(verifier)

	flow := googleFlowData{
		Nonce:     nonce,
		Verifier:  verifier,
		Locale:    locale,
		ReturnTo:  returnTo,
		ExpiresAt: s.clock.Now().Add(flowTTL),
	}
	if err := s.flows.Put(ctx, state, flow); err != nil {
		return GoogleStartResult{}, err
	}

	cookie, err := accountauth.SignFlowCookie(state, s.flowSecret)
	if err != nil {
		return GoogleStartResult{}, err
	}

	return GoogleStartResult{
		AuthorizationURL: s.verifier.AuthorizationURL(state, nonce, challenge),
		FlowCookie:       cookie,
	}, nil
}

// GoogleLinkStatus reports whether the account already has a Google identity
// and whether an unapproved link request is still pending.
func (s *AccountGoogleService) GoogleLinkStatus(ctx context.Context, userID uuid.UUID) (GoogleLinkStatus, error) {
	now := s.clock.Now()
	var status GoogleLinkStatus

	var connected int64
	if err := s.db.WithContext(ctx).Model(&models.AuthIdentity{}).
		Where("user_id = ? AND provider = ?", userID, "google").
		Count(&connected).Error; err != nil {
		return status, err
	}
	status.Connected = connected > 0

	var token models.AuthActionToken
	err := s.db.WithContext(ctx).
		Where("user_id = ? AND purpose = ? AND consumed_at IS NULL AND expires_at > ?", userID, linkIdentityPurpose, now).
		Order("created_at DESC").
		First(&token).Error
	if err == nil {
		status.Pending = true
		if retry := token.CreatedAt.Add(linkResendWindow).Sub(now); retry > 0 {
			status.RetryAfter = retry
		}
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return status, err
	}
	return status, nil
}

// StartGoogleLink begins an authenticated OAuth flow bound to the current
// account. It reuses the anonymous PKCE flow but persists the target user so
// the callback can never infer the account from the Google email alone.
func (s *AccountGoogleService) StartGoogleLink(ctx context.Context, userID uuid.UUID, authTime time.Time, locale, returnTo string) (GoogleStartResult, error) {
	now := s.clock.Now()
	if now.Sub(authTime) > maxReauthAge {
		return GoogleStartResult{}, accountauth.NewError(accountauth.CodeReauthRequired, "Please re-authenticate to continue.")
	}

	var linked int64
	if err := s.db.WithContext(ctx).Model(&models.AuthIdentity{}).
		Where("user_id = ? AND provider = ?", userID, "google").
		Count(&linked).Error; err != nil {
		return GoogleStartResult{}, err
	}
	if linked > 0 {
		return GoogleStartResult{}, accountauth.NewError(accountauth.CodeGoogleAlreadyLinked, "Google is already connected to this account.")
	}

	var pending models.AuthActionToken
	err := s.db.WithContext(ctx).
		Where("user_id = ? AND purpose = ? AND consumed_at IS NULL AND expires_at > ? AND created_at > ?", userID, linkIdentityPurpose, now, now.Add(-linkResendWindow)).
		Order("created_at DESC").
		First(&pending).Error
	if err == nil {
		retry := pending.CreatedAt.Add(linkResendWindow).Sub(now)
		if retry < 0 {
			retry = 0
		}
		return GoogleStartResult{}, &accountauth.Error{
			Code:       accountauth.CodeGoogleLinkPending,
			Message:    "A Google approval request is already pending.",
			RetryAfter: retry,
		}
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return GoogleStartResult{}, err
	}

	locale = accountauth.SafeLocale(locale)
	if err := validateReturnTo(returnTo); err != nil {
		return GoogleStartResult{}, err
	}

	state, _, err := accountauth.NewOpaqueToken()
	if err != nil {
		return GoogleStartResult{}, err
	}
	nonce, _, err := accountauth.NewOpaqueToken()
	if err != nil {
		return GoogleStartResult{}, err
	}
	verifier, _, err := accountauth.NewOpaqueToken()
	if err != nil {
		return GoogleStartResult{}, err
	}
	challenge := oauth2.S256ChallengeFromVerifier(verifier)

	flow := googleFlowData{
		Nonce:      nonce,
		Verifier:   verifier,
		Locale:     locale,
		ReturnTo:   returnTo,
		ExpiresAt:  now.Add(flowTTL),
		LinkUserID: userID,
	}
	if err := s.flows.Put(ctx, state, flow); err != nil {
		return GoogleStartResult{}, err
	}

	cookie, err := accountauth.SignFlowCookie(state, s.flowSecret)
	if err != nil {
		return GoogleStartResult{}, err
	}

	return GoogleStartResult{
		AuthorizationURL: s.verifier.AuthorizationURL(state, nonce, challenge),
		FlowCookie:       cookie,
	}, nil
}

// CompleteGoogle verifies the callback and signs in, creates, or starts
// approval linking for the matching account.
func (s *AccountGoogleService) CompleteGoogle(ctx context.Context, code, callbackState, flowCookie string, client accountauth.ClientInfo) (GoogleCompletion, error) {
	state, err := accountauth.ParseFlowCookie(flowCookie, s.flowSecret)
	if err != nil {
		s.recordGoogleSecurity(ctx, "failure", "", client)
		return GoogleCompletion{}, accountauth.NewError(accountauth.CodeTokenInvalid, "The sign-in link is invalid or has expired.")
	}
	if callbackState == "" || !hmac.Equal([]byte(state), []byte(callbackState)) {
		s.recordGoogleSecurity(ctx, "failure", "", client)
		return GoogleCompletion{}, accountauth.NewError(accountauth.CodeTokenInvalid, "The sign-in link is invalid or has expired.")
	}
	flow, ok, err := s.flows.Take(ctx, state)
	if err != nil {
		return GoogleCompletion{}, err
	}
	if !ok {
		s.recordGoogleSecurity(ctx, "failure", "", client)
		return GoogleCompletion{}, accountauth.NewError(accountauth.CodeTokenInvalid, "The sign-in link is invalid or has expired.")
	}
	if s.clock.Now().After(flow.ExpiresAt) {
		s.recordGoogleSecurity(ctx, "failure", "", client)
		return GoogleCompletion{}, accountauth.NewError(accountauth.CodeTokenInvalid, "The sign-in link is invalid or has expired.")
	}

	identity, err := s.verifier.VerifyCallback(ctx, code, flow.Verifier, flow.Nonce)
	if err != nil {
		s.recordGoogleSecurity(ctx, "failure", "", client)
		return GoogleCompletion{}, accountauth.NewError(accountauth.CodeTokenInvalid, "The sign-in link is invalid or has expired.")
	}
	if !identity.EmailVerified {
		s.recordGoogleSecurity(ctx, "failure", "", client)
		return GoogleCompletion{}, accountauth.NewError(accountauth.CodeTokenInvalid, "Google could not verify this email address.")
	}

	now := s.clock.Now()

	// Authenticated link flow: complete the approval handoff instead of the
	// anonymous sign-in / registration branch.
	if flow.LinkUserID != uuid.Nil {
		return s.completeAuthenticatedGoogleLink(ctx, flow, identity, client, now)
	}

	// Already linked identity: sign in.
	var linked models.AuthIdentity
	err = s.db.WithContext(ctx).Where("provider = ? AND provider_subject = ?", "google", identity.Subject).First(&linked).Error
	if err == nil {
		session, err := s.sessionForUser(ctx, linked.UserID, client, now)
		if err != nil {
			return GoogleCompletion{}, err
		}
		s.recordGoogleSecurity(ctx, "success", linked.UserID.String(), client)
		return GoogleCompletion{Status: GoogleCompletionSignedIn, Session: session, UserID: linked.UserID, Locale: flow.Locale, ReturnTo: flow.ReturnTo}, nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return GoogleCompletion{}, err
	}

	email := accountauth.NormalizeEmail(identity.Email)

	// No matching google identity: check whether any account uses this email.
	var existing models.User
	err = s.db.WithContext(ctx).Where("lower(btrim(email)) = ?", email).First(&existing).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		// New account.
		user, err := s.createGoogleAccount(ctx, identity, email, flow.Locale, client, now)
		if err != nil {
			return GoogleCompletion{}, err
		}
		s.recordGoogleSecurity(ctx, "success", user.userID.String(), client)
		return GoogleCompletion{Status: GoogleCompletionCreated, Session: user.session, UserID: user.userID, Locale: flow.Locale, ReturnTo: flow.ReturnTo}, nil
	}
	if err != nil {
		return GoogleCompletion{}, err
	}

	// Existing account with this email: require explicit approval before linking.
	if code := s.sessions.sessionStatusCode(existing); code != "" {
		return GoogleCompletion{}, accountauth.NewError(code, "This account is not allowed to sign in.")
	}

	raw, _, err := s.tokenGen()
	if err != nil {
		return GoogleCompletion{}, err
	}
	tokenHash := accountauth.HashOpaqueToken(raw)

	err = s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&models.AuthActionToken{}).
			Where("user_id = ? AND purpose = ? AND consumed_at IS NULL", existing.ID, linkIdentityPurpose).
			Update("consumed_at", now).Error; err != nil {
			return err
		}
		payload := models.JSONMap{
			"provider":     "google",
			"subject":      identity.Subject,
			"email":        identity.Email,
			"display_name": identity.DisplayName,
			"avatar_url":   identity.AvatarURL,
		}
		return tx.Create(&models.AuthActionToken{
			UserID:    existing.ID,
			Purpose:   linkIdentityPurpose,
			TokenHash: tokenHash,
			Payload:   payload,
			ExpiresAt: now.Add(actionTokenTTL),
		}).Error
	})
	if err != nil {
		return GoogleCompletion{}, err
	}

	s.sendLinkApprovalEmail(ctx, existing, identity, flow.Locale, raw)
	s.recordGoogleSecurity(ctx, "success", existing.ID.String(), client)
	return GoogleCompletion{Status: GoogleCompletionApprovalSent, UserID: existing.ID, Locale: flow.Locale, ReturnTo: flow.ReturnTo}, nil
}

// completeAuthenticatedGoogleLink handles the callback for a link flow bound to
// an authenticated account. It never issues a session; it only sends the
// single-use approval token to the account email after validating the target,
// the email match, and the identity availability.
func (s *AccountGoogleService) completeAuthenticatedGoogleLink(ctx context.Context, flow googleFlowData, identity accountauth.GoogleIdentity, client accountauth.ClientInfo, now time.Time) (GoogleCompletion, error) {
	var target models.User
	if err := s.db.WithContext(ctx).First(&target, "id = ?", flow.LinkUserID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			s.recordGoogleSecurity(ctx, "failure", flow.LinkUserID.String(), client)
			return GoogleCompletion{}, accountauth.NewError(accountauth.CodeTokenInvalid, "The sign-in link is invalid or has expired.")
		}
		return GoogleCompletion{}, err
	}
	if code := s.sessions.sessionStatusCode(target); code != "" {
		return GoogleCompletion{}, accountauth.NewError(code, "This account is not allowed to link a Google identity.")
	}

	if accountauth.NormalizeEmail(identity.Email) != accountauth.NormalizeEmail(target.Email) {
		s.recordGoogleSecurity(ctx, "failure", flow.LinkUserID.String(), client)
		return GoogleCompletion{}, accountauth.NewError(accountauth.CodeGoogleEmailMismatch, "Use the same Google email as this account.")
	}

	var existing models.AuthIdentity
	err := s.db.WithContext(ctx).Where("provider = ? AND provider_subject = ?", "google", identity.Subject).First(&existing).Error
	if err == nil {
		if existing.UserID == flow.LinkUserID {
			s.recordGoogleSecurity(ctx, "failure", flow.LinkUserID.String(), client)
			return GoogleCompletion{}, accountauth.NewError(accountauth.CodeGoogleAlreadyLinked, "Google is already connected to this account.")
		}
		s.recordGoogleSecurity(ctx, "failure", flow.LinkUserID.String(), client)
		return GoogleCompletion{}, accountauth.NewError(accountauth.CodeGoogleIdentityInUse, "This Google account is already linked to another account.")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return GoogleCompletion{}, err
	}

	raw, _, err := s.tokenGen()
	if err != nil {
		return GoogleCompletion{}, err
	}
	tokenHash := accountauth.HashOpaqueToken(raw)

	err = s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&models.AuthActionToken{}).
			Where("user_id = ? AND purpose = ? AND consumed_at IS NULL", flow.LinkUserID, linkIdentityPurpose).
			Update("consumed_at", now).Error; err != nil {
			return err
		}
		payload := models.JSONMap{
			"provider":     "google",
			"subject":      identity.Subject,
			"email":        identity.Email,
			"display_name": identity.DisplayName,
			"avatar_url":   identity.AvatarURL,
		}
		return tx.Create(&models.AuthActionToken{
			UserID:    flow.LinkUserID,
			Purpose:   linkIdentityPurpose,
			TokenHash: tokenHash,
			Payload:   payload,
			ExpiresAt: now.Add(actionTokenTTL),
		}).Error
	})
	if err != nil {
		return GoogleCompletion{}, err
	}

	s.sendLinkApprovalEmail(ctx, target, identity, flow.Locale, raw)
	s.recordGoogleSecurity(ctx, "success", flow.LinkUserID.String(), client)
	return GoogleCompletion{Status: GoogleCompletionApprovalSent, UserID: flow.LinkUserID, Locale: flow.Locale, ReturnTo: flow.ReturnTo}, nil
}

// ConfirmGoogleLink approves a pending google link using a single-use action
// token and starts a session.
func (s *AccountGoogleService) ConfirmGoogleLink(ctx context.Context, actionToken string, client accountauth.ClientInfo) (accountauth.SessionResult, error) {
	if actionToken == "" {
		return accountauth.SessionResult{}, accountauth.NewError(accountauth.CodeTokenInvalid, "The link is invalid or has expired.")
	}
	tokenHash := accountauth.HashOpaqueToken(actionToken)
	now := s.clock.Now()

	var session accountauth.SessionResult
	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var token models.AuthActionToken
		err := tx.Where("token_hash = ? AND purpose = ? AND consumed_at IS NULL AND expires_at > ?",
			tokenHash, linkIdentityPurpose, now).First(&token).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return accountauth.NewError(accountauth.CodeTokenInvalid, "The link is invalid or has expired.")
		}
		if err != nil {
			return err
		}

		res := tx.Model(&models.AuthActionToken{}).
			Where("id = ? AND consumed_at IS NULL", token.ID).
			Update("consumed_at", now)
		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected != 1 {
			return accountauth.NewError(accountauth.CodeTokenInvalid, "The link is invalid or has expired.")
		}

		var user models.User
		if err := tx.First(&user, "id = ?", token.UserID).Error; err != nil {
			return err
		}
		if code := s.sessions.sessionStatusCode(user); code != "" {
			return accountauth.NewError(code, "This account is not allowed to sign in.")
		}

		subject, _ := token.Payload["subject"].(string)
		email, _ := token.Payload["email"].(string)
		if subject == "" {
			return accountauth.NewError(accountauth.CodeTokenInvalid, "The link is invalid or has expired.")
		}

		identity := models.AuthIdentity{
			UserID:          token.UserID,
			Provider:        "google",
			ProviderSubject: subject,
			ProviderEmail:   email,
		}
		if err := tx.Create(&identity).Error; err != nil {
			if isIdentityConflict(err) {
				return accountauth.NewError(accountauth.CodeTokenInvalid, "The link is invalid or has expired.")
			}
			return err
		}

		created, err := s.sessions.createSession(tx, token.UserID, uuid.New(), client, now)
		if err != nil {
			return err
		}
		accessToken, err := s.sessions.issuer.Issue(token.UserID, created.row.ID, now)
		if err != nil {
			return err
		}
		session = accountauth.SessionResult{
			AccessToken:  accessToken,
			RefreshToken: created.refreshToken,
			ExpiresIn:    s.sessions.issuer.TTL(),
		}
		return nil
	})
	if err != nil {
		return accountauth.SessionResult{}, err
	}
	s.recordGoogleSecurity(ctx, "success", "", client)
	return session, nil
}

func (s *AccountGoogleService) recordGoogleSecurity(ctx context.Context, outcome, userID string, client accountauth.ClientInfo) {
	s.security.Record(ctx, accountauth.SecurityEvent{
		UserID: userID, EventType: "google_sign_in", Outcome: outcome, Provider: "google",
		TraceID: client.TraceID, IPPrefix: accountauth.CoarseIPPrefix(client.IP),
	})
}

// googleAccountResult carries the created account and its session.
type googleAccountResult struct {
	userID  uuid.UUID
	session accountauth.SessionResult
}

// createGoogleAccount creates a role-less active user, profile, and google
// identity in one transaction, then starts a session.
func (s *AccountGoogleService) createGoogleAccount(ctx context.Context, identity accountauth.GoogleIdentity, email, locale string, client accountauth.ClientInfo, now time.Time) (googleAccountResult, error) {
	displayName := strings.TrimSpace(identity.DisplayName)
	if displayName == "" {
		displayName = strings.TrimSpace(strings.SplitN(email, "@", 2)[0])
	}

	var result googleAccountResult
	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		user := models.User{
			Email:         email,
			Name:          displayName,
			EmailVerified: true,
			IsActive:      true,
			AccountStatus: models.AccountStatusActive,
		}
		if err := tx.Create(&user).Error; err != nil {
			return err
		}
		if err := tx.Create(&models.AccountProfile{
			UserID:          user.ID,
			DisplayName:     displayName,
			AvatarURL:       strings.TrimSpace(identity.AvatarURL),
			PreferredLocale: locale,
		}).Error; err != nil {
			return err
		}
		if err := tx.Create(&models.AuthIdentity{
			UserID:          user.ID,
			Provider:        "google",
			ProviderSubject: identity.Subject,
			ProviderEmail:   email,
		}).Error; err != nil {
			return err
		}

		created, err := s.sessions.createSession(tx, user.ID, uuid.New(), client, now)
		if err != nil {
			return err
		}
		accessToken, err := s.sessions.issuer.Issue(user.ID, created.row.ID, now)
		if err != nil {
			return err
		}
		result = googleAccountResult{
			userID: user.ID,
			session: accountauth.SessionResult{
				AccessToken:  accessToken,
				RefreshToken: created.refreshToken,
				ExpiresIn:    s.sessions.issuer.TTL(),
			},
		}
		return tx.Model(&models.User{}).Where("id = ?", user.ID).Update("last_login_at", now).Error
	})
	if err != nil {
		return googleAccountResult{}, err
	}
	return result, nil
}

// sessionForUser creates a session for an already-linked account.
func (s *AccountGoogleService) sessionForUser(ctx context.Context, userID uuid.UUID, client accountauth.ClientInfo, now time.Time) (accountauth.SessionResult, error) {
	var session accountauth.SessionResult
	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		created, err := s.sessions.createSession(tx, userID, uuid.New(), client, now)
		if err != nil {
			return err
		}
		accessToken, err := s.sessions.issuer.Issue(userID, created.row.ID, now)
		if err != nil {
			return err
		}
		session = accountauth.SessionResult{
			AccessToken:  accessToken,
			RefreshToken: created.refreshToken,
			ExpiresIn:    s.sessions.issuer.TTL(),
		}
		return tx.Model(&models.User{}).Where("id = ?", userID).Update("last_login_at", now).Error
	})
	if err != nil {
		return accountauth.SessionResult{}, err
	}
	return session, nil
}

// sendLinkApprovalEmail delivers the localized link-approval email.
func (s *AccountGoogleService) sendLinkApprovalEmail(ctx context.Context, user models.User, identity accountauth.GoogleIdentity, locale, raw string) {
	if s.sender == nil {
		return
	}
	actionURL := s.frontendURL + "/" + locale + "/account/link?token=" + raw
	subject, body, err := accountauth.RenderEmail("link_approval", locale, accountauth.EmailTemplateVar{
		DisplayName: user.Name,
		ActionURL:   actionURL,
	})
	if err != nil {
		return
	}
	_ = s.sender.Send(ctx, accountauth.EmailMessage{
		To:        user.Email,
		Locale:    locale,
		Subject:   subject,
		Body:      body,
		ActionURL: actionURL,
	})
}

// isIdentityConflict reports whether err is a PostgreSQL unique-violation on
// the (provider, provider_subject) google identity.
func isIdentityConflict(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}

// validateReturnTo allows only empty or relative same-site paths.
func validateReturnTo(returnTo string) error {
	returnTo = strings.TrimSpace(returnTo)
	if returnTo == "" {
		return nil
	}
	if strings.HasPrefix(returnTo, "//") || strings.Contains(returnTo, "://") || strings.Contains(returnTo, "\\") {
		return accountauth.NewFieldError(accountauth.CodeValidation, "return_to", "The return destination is not allowed.")
	}
	if !strings.HasPrefix(returnTo, "/") {
		return accountauth.NewFieldError(accountauth.CodeValidation, "return_to", "The return destination is not allowed.")
	}
	if _, err := url.Parse(returnTo); err != nil {
		return accountauth.NewFieldError(accountauth.CodeValidation, "return_to", "The return destination is not allowed.")
	}
	return nil
}
