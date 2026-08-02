package accountauth

import (
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"net/url"
	"strings"
	"time"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/idtoken"
)

const googleFlowTTL = 10 * time.Minute

// googleVerifier adapts the Google OAuth2 authorization-code + PKCE flow to
// the GoogleVerifier contract. It also validates the returned ID token.
type googleVerifier struct {
	config *oauth2.Config
}

// NewGoogleVerifier builds a GoogleVerifier from server-side configuration.
func NewGoogleVerifier(clientID, clientSecret, redirectURL string) (GoogleVerifier, error) {
	if strings.TrimSpace(clientID) == "" {
		return nil, errors.New("google client id is required")
	}
	if strings.TrimSpace(clientSecret) == "" {
		return nil, errors.New("google client secret is required")
	}
	parsed, err := url.Parse(redirectURL)
	if err != nil || parsed.Host == "" || (parsed.Scheme != "http" && parsed.Scheme != "https") {
		return nil, fmt.Errorf("google redirect url must be a valid http(s) URL, got %q", redirectURL)
	}
	return &googleVerifier{
		config: &oauth2.Config{
			ClientID:     clientID,
			ClientSecret: clientSecret,
			RedirectURL:  redirectURL,
			Endpoint:     google.Endpoint,
			Scopes:       []string{"openid", "email", "profile"},
		},
	}, nil
}

// AuthorizationURL builds the Google consent URL with state, nonce, and PKCE.
// challenge is the already-hashed S256 code challenge (S256ChallengeFromVerifier).
func (g *googleVerifier) AuthorizationURL(state, nonce, challenge string) string {
	return g.config.AuthCodeURL(
		state,
		oauth2.SetAuthURLParam("code_challenge", challenge),
		oauth2.SetAuthURLParam("code_challenge_method", "S256"),
		oauth2.SetAuthURLParam("nonce", nonce),
		oauth2.SetAuthURLParam("prompt", "select_account"),
	)
}

// VerifyCallback exchanges the authorization code, validates the ID token,
// and returns the verified Google identity.
func (g *googleVerifier) VerifyCallback(ctx context.Context, code, verifier, nonce string) (GoogleIdentity, error) {
	token, err := g.config.Exchange(ctx, code, oauth2.VerifierOption(verifier))
	if err != nil {
		return GoogleIdentity{}, ErrTokenInvalid
	}
	idTokenRaw, ok := token.Extra("id_token").(string)
	if !ok || idTokenRaw == "" {
		return GoogleIdentity{}, ErrTokenInvalid
	}
	payload, err := idtoken.Validate(ctx, idTokenRaw, g.config.ClientID)
	if err != nil {
		return GoogleIdentity{}, ErrTokenInvalid
	}
	// In google.golang.org/api v0.247.0 the nonce, email, and email_verified
	// claims live in the Claims map rather than as Payload fields.
	claimString := func(key string) string {
		value, _ := payload.Claims[key].(string)
		return value
	}
	claimBool := func(key string) bool {
		value, _ := payload.Claims[key].(bool)
		return value
	}
	if claimString("nonce") != nonce {
		return GoogleIdentity{}, ErrTokenInvalid
	}
	if !claimBool("email_verified") {
		return GoogleIdentity{}, ErrTokenInvalid
	}
	identity := GoogleIdentity{
		Subject:       payload.Subject,
		Email:         claimString("email"),
		EmailVerified: true,
	}
	if name, ok := payload.Claims["name"].(string); ok && name != "" {
		identity.DisplayName = name
	}
	if picture, ok := payload.Claims["picture"].(string); ok && picture != "" {
		identity.AvatarURL = picture
	}
	return identity, nil
}

// SignFlowCookie signs the Google flow state identifier so the browser cannot
// forge or tamper with flow cookies.
func SignFlowCookie(state string, secret []byte) (string, error) {
	if len(secret) == 0 {
		return "", errors.New("flow signing secret is required")
	}
	mac := hmac.New(sha256.New, secret)
	mac.Write([]byte(state))
	sig := hex.EncodeToString(mac.Sum(nil))
	encoded := base64.RawURLEncoding.EncodeToString([]byte(state))
	return encoded + "." + sig, nil
}

// ParseFlowCookie verifies the HMAC signature and returns the flow state.
func ParseFlowCookie(raw string, secret []byte) (string, error) {
	parts := strings.SplitN(raw, ".", 2)
	if len(parts) != 2 {
		return "", ErrTokenInvalid
	}
	stateBytes, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return "", ErrTokenInvalid
	}
	mac := hmac.New(sha256.New, secret)
	mac.Write(stateBytes)
	expected := hex.EncodeToString(mac.Sum(nil))
	if !hmac.Equal([]byte(expected), []byte(parts[1])) {
		return "", ErrTokenInvalid
	}
	return string(stateBytes), nil
}

// randomURLSafeBytes returns n cryptographically random bytes as a raw
// URL-safe base64 string.
func randomURLSafeBytes(n int) (string, error) {
	buf := make([]byte, n)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(buf), nil
}
