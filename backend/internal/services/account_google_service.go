package services

import (
	"context"
	"errors"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	"golang.org/x/oauth2"
	"gorm.io/gorm"

	"github.com/watloungporsai/wat-profile-backend/internal/accountauth"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
)

const (
	linkIdentityPurpose = "link_identity"
	flowTTL             = 10 * time.Minute
)

// GoogleCompletionStatus reports the outcome of a Google sign-in attempt.
type GoogleCompletionStatus string

const (
	GoogleCompletionCreated       GoogleCompletionStatus = "created"
	GoogleCompletionSignedIn      GoogleCompletionStatus = "signed_in"
	GoogleCompletionApprovalSent  GoogleCompletionStatus = "approval_sent"
)

// GoogleCompletion is the result of CompleteGoogle.
type GoogleCompletion struct {
	Status  GoogleCompletionStatus
	Session accountauth.SessionResult
	UserID  uuid.UUID
}

// GoogleStartResult is the result of StartGoogle.
type GoogleStartResult struct {
	AuthorizationURL string
	FlowCookie       string
}

// googleFlowData is server-side state for one OAuth flow, keyed by state.
type googleFlowData struct {
	Nonce     string
	Verifier  string
	Locale    string
	ReturnTo  string
	ExpiresAt time.Time
}

// googleFlowStore persists short-lived OAuth flow state.
type googleFlowStore interface {
	Put(ctx context.Context, state string, flow googleFlowData) error
	Take(ctx context.Context, state string) (googleFlowData, bool)
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

func (s *memoryGoogleFlowStore) Take(ctx context.Context, state string) (googleFlowData, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	flow, ok := s.flows[state]
	if !ok {
		return googleFlowData{}, false
	}
	delete(s.flows, state)
	return flow, true
}

// AccountGoogleService implements Google authorization-code + PKCE sign-in,
// new-account creation, and approval-based linking to an existing email.
type AccountGoogleService struct {
	db         *gorm.DB
	clock      accountauth.Clock
	tokenGen   accountauth.TokenGenerator
	sender     accountauth.EmailSender
	verifier   accountauth.GoogleVerifier
	sessions   *AccountSessionService
	flows      googleFlowStore
	flowSecret []byte
	frontendURL string
}

// NewAccountGoogleService builds the Google auth service. The flow store
// defaults to an in-memory implementation; callers may swap s.flows for a
// persistent store before first use.
func NewAccountGoogleService(db *gorm.DB, clock accountauth.Clock, tokenGen accountauth.TokenGenerator, sender accountauth.EmailSender, verifier accountauth.GoogleVerifier, sessions *AccountSessionService, flowSecret []byte, frontendURL string) *AccountGoogleService {
	return &AccountGoogleService{
		db:          db,
		clock:       clock,
		tokenGen:    tokenGen,
		sender:      sender,
		verifier:    verifier,
		sessions:    sessions,
		flows:       &memoryGoogleFlowStore{flows: map[string]googleFlowData{}},
		flowSecret:  flowSecret,
		frontendURL: frontendURL,
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

// CompleteGoogle verifies the callback and signs in, creates, or starts
// approval linking for the matching account.
func (s *AccountGoogleService) CompleteGoogle(ctx context.Context, code, flowCookie string, client accountauth.ClientInfo) (GoogleCompletion, error) {
	state, err := accountauth.ParseFlowCookie(flowCookie, s.flowSecret)
	if err != nil {
		return GoogleCompletion{}, accountauth.NewError(accountauth.CodeTokenInvalid, "The sign-in link is invalid or has expired.")
	}
	flow, ok := s.flows.Take(ctx, state)
	if !ok {
		return GoogleCompletion{}, accountauth.NewError(accountauth.CodeTokenInvalid, "The sign-in link is invalid or has expired.")
	}
	if s.clock.Now().After(flow.ExpiresAt) {
		return GoogleCompletion{}, accountauth.NewError(accountauth.CodeTokenInvalid, "The sign-in link is invalid or has expired.")
	}

	identity, err := s.verifier.VerifyCallback(ctx, code, flow.Verifier, flow.Nonce)
	if err != nil {
		return GoogleCompletion{}, accountauth.NewError(accountauth.CodeTokenInvalid, "The sign-in link is invalid or has expired.")
	}
	if !identity.EmailVerified {
		return GoogleCompletion{}, accountauth.NewError(accountauth.CodeTokenInvalid, "Google could not verify this email address.")
	}

	now := s.clock.Now()

	// Already linked identity: sign in.
	var linked models.AuthIdentity
	err = s.db.WithContext(ctx).Where("provider = ? AND provider_subject = ?", "google", identity.Subject).First(&linked).Error
	if err == nil {
		session, err := s.sessionForUser(ctx, linked.UserID, client, now)
		if err != nil {
			return GoogleCompletion{}, err
		}
		return GoogleCompletion{Status: GoogleCompletionSignedIn, Session: session, UserID: linked.UserID}, nil
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
		return GoogleCompletion{Status: GoogleCompletionCreated, Session: user.session, UserID: user.userID}, nil
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
	return GoogleCompletion{Status: GoogleCompletionApprovalSent, UserID: existing.ID}, nil
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
			ExpiresIn:    s.sessions.refreshTTL,
		}
		return nil
	})
	if err != nil {
		return accountauth.SessionResult{}, err
	}
	return session, nil
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
				ExpiresIn:    s.sessions.refreshTTL,
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
			ExpiresIn:    s.sessions.refreshTTL,
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
