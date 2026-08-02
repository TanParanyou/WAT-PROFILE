package accountauth

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

func testIssuer() *AccessTokenIssuer {
	return NewAccessTokenIssuer([]byte("test-secret"), SystemClock{}, 15*time.Minute)
}

// TestPublicAccountTokenRoundTrip verifies that a token issued for the
// public-account audience verifies with the matching secret and carries the
// expected subject, session, and auth-time claims.
func TestPublicAccountTokenRoundTrip(t *testing.T) {
	issuer := testIssuer()
	userID := uuid.New()
	sessionID := uuid.New()
	authTime := time.Now().Add(-5 * time.Minute)

	raw, err := issuer.Issue(userID, sessionID, authTime)
	if err != nil {
		t.Fatalf("issue: %v", err)
	}

	claims, err := VerifyPublicAccountToken(raw, []byte("test-secret"))
	if err != nil {
		t.Fatalf("verify: %v", err)
	}
	if claims.Subject != userID.String() {
		t.Fatalf("expected subject %s, got %s", userID, claims.Subject)
	}
	if claims.SessionID != sessionID.String() {
		t.Fatalf("expected session id %s, got %s", sessionID, claims.SessionID)
	}
	if claims.AuthTime != authTime.Unix() {
		t.Fatalf("expected auth_time %d, got %d", authTime.Unix(), claims.AuthTime)
	}
}

// TestVerifyPublicAccountTokenRejectsWrongSecret ensures a token signed with a
// different secret is rejected, never accepted.
func TestVerifyPublicAccountTokenRejectsWrongSecret(t *testing.T) {
	issuer := testIssuer()
	raw, err := issuer.Issue(uuid.New(), uuid.New(), time.Now())
	if err != nil {
		t.Fatalf("issue: %v", err)
	}
	if _, err := VerifyPublicAccountToken(raw, []byte("wrong-secret")); err == nil {
		t.Fatal("expected token with wrong secret to be rejected")
	}
}

// TestVerifyPublicAccountTokenRejectsMissingAudience ensures a token without
// the public-account audience (e.g. a JWT signed for another purpose) fails.
func TestVerifyPublicAccountTokenRejectsMissingAudience(t *testing.T) {
	now := time.Now()
	claims := PublicAccountClaims{
		SessionID: uuid.New().String(),
		AuthTime:  now.Unix(),
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    publicAccountIssuer,
			Subject:   uuid.New().String(),
			Audience:  jwt.ClaimStrings{"some-other-audience"},
			ExpiresAt: jwt.NewNumericDate(now.Add(15 * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(now),
			ID:        uuid.New().String(),
		},
	}
	raw, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte("test-secret"))
	if err != nil {
		t.Fatalf("sign: %v", err)
	}
	if _, err := VerifyPublicAccountToken(raw, []byte("test-secret")); err == nil {
		t.Fatal("expected token without public-account audience to be rejected")
	}
}
