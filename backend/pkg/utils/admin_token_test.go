package utils

import (
	"encoding/hex"
	"strings"
	"testing"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

func TestAdminAccessTokenRequiresAdminAudience(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret-for-admin-token")

	userID := uuid.New()
	raw, err := GenerateAdminAccessToken(userID)
	if err != nil {
		t.Fatalf("Failed to generate admin access token: %v", err)
	}

	claims, err := VerifyAdminAccessToken(raw)
	if err != nil {
		t.Fatalf("Failed to verify admin access token: %v", err)
	}

	if claims.Subject != userID.String() {
		t.Fatalf("Expected subject %s, got %s", userID.String(), claims.Subject)
	}

	hasAdminAudience := false
	for _, aud := range claims.Audience {
		if aud == "admin" {
			hasAdminAudience = true
			break
		}
	}
	if !hasAdminAudience {
		t.Fatalf("Expected audience to include admin, got %v", claims.Audience)
	}

	if claims.Issuer != "wat-profile" {
		t.Fatalf("Expected issuer wat-profile, got %s", claims.Issuer)
	}

	if _, err := uuid.Parse(claims.ID); err != nil {
		t.Fatalf("Expected jti to be a valid UUID, got %q: %v", claims.ID, err)
	}

	if claims.ExpiresAt == nil || claims.IssuedAt == nil {
		t.Fatalf("Expected exp and iat to be set")
	}
}

func TestAdminAccessTokenRejectsMemberToken(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret-for-admin-token")

	userID := uuid.New()
	claims := jwt.MapClaims{
		"user_id": userID.String(),
		"email":   "admin@example.com",
		"role":    "admin",
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	raw, err := token.SignedString([]byte("test-secret-for-admin-token"))
	if err != nil {
		t.Fatalf("Failed to sign member token: %v", err)
	}

	if _, err := VerifyAdminAccessToken(raw); err == nil {
		t.Fatalf("Expected verification to fail for token without aud=admin")
	}
}

func TestAdminRefreshCredentialRoundTrip(t *testing.T) {
	sessionID := uuid.New()
	raw, hash, err := NewAdminRefreshCredential(sessionID)
	if err != nil {
		t.Fatalf("Failed to create admin refresh credential: %v", err)
	}

	parts := strings.Split(raw, ".")
	if len(parts) != 2 {
		t.Fatalf("Expected credential of the form <sessionID>.<secret>, got %q", raw)
	}

	parsedID, parsedHash, err := ParseAdminRefreshCredential(raw)
	if err != nil {
		t.Fatalf("Failed to parse admin refresh credential: %v", err)
	}

	if parsedID != sessionID {
		t.Fatalf("Expected session ID %s, got %s", sessionID.String(), parsedID.String())
	}

	if parsedHash != hash {
		t.Fatalf("Expected parsed hash %s to match original %s", parsedHash, hash)
	}

	if len(hash) != 64 {
		t.Fatalf("Expected SHA-256 hex hash of length 64, got %d", len(hash))
	}

	if _, err := hex.DecodeString(hash); err != nil {
		t.Fatalf("Expected hash to be valid hex: %v", err)
	}

	if _, _, err := ParseAdminRefreshCredential("invalid-format"); err == nil {
		t.Fatalf("Expected parse to fail for malformed credential")
	}
}
