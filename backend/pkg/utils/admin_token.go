package utils

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

const (
	adminTokenIssuer   = "wat-profile"
	adminTokenAudience = "admin"
)

// AdminClaims represents the claims of an Admin access token.
type AdminClaims struct {
	jwt.RegisteredClaims
}

// GenerateAdminAccessToken generates a short-lived JWT bound to the admin audience.
func GenerateAdminAccessToken(userID uuid.UUID) (string, error) {
	expiryTime := time.Now().Add(15 * time.Minute)
	if expiry := os.Getenv("ADMIN_ACCESS_EXPIRY"); expiry != "" {
		if duration, err := time.ParseDuration(expiry); err == nil {
			expiryTime = time.Now().Add(duration)
		}
	}

	now := time.Now()
	claims := AdminClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    adminTokenIssuer,
			Subject:   userID.String(),
			Audience:  jwt.ClaimStrings{adminTokenAudience},
			ExpiresAt: jwt.NewNumericDate(expiryTime),
			IssuedAt:  jwt.NewNumericDate(now),
			ID:        uuid.New().String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(getJWTSecret()))
}

// VerifyAdminAccessToken verifies an Admin access token and returns its claims.
// Member tokens and tokens without the admin audience are rejected.
func VerifyAdminAccessToken(raw string) (*AdminClaims, error) {
	token, err := jwt.ParseWithClaims(raw, &AdminClaims{}, func(token *jwt.Token) (interface{}, error) {
		if token.Method != jwt.SigningMethodHS256 {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(getJWTSecret()), nil
	}, jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}))
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*AdminClaims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid admin token")
	}

	if claims.Issuer != adminTokenIssuer {
		return nil, errors.New("invalid admin token issuer")
	}

	if !hasAudience(claims.Audience, adminTokenAudience) {
		return nil, errors.New("invalid admin token audience")
	}

	if claims.Subject == "" {
		return nil, errors.New("missing admin token subject")
	}

	return claims, nil
}

// NewAdminRefreshCredential creates an opaque refresh credential of the form
// <sessionID>.<secret> and returns it together with the SHA-256 hash of the
// secret portion. Only the hash should ever be persisted.
func NewAdminRefreshCredential(sessionID uuid.UUID) (raw, hash string, err error) {
	secret := make([]byte, 32)
	if _, err := rand.Read(secret); err != nil {
		return "", "", err
	}

	encoded := base64.RawURLEncoding.EncodeToString(secret)
	sum := sha256.Sum256([]byte(encoded))

	return sessionID.String() + "." + encoded, hex.EncodeToString(sum[:]), nil
}

// ParseAdminRefreshCredential parses an opaque refresh credential and returns
// the session identifier and the SHA-256 hash of the secret portion.
func ParseAdminRefreshCredential(raw string) (sessionID uuid.UUID, hash string, err error) {
	parts := strings.Split(raw, ".")
	if len(parts) != 2 || parts[0] == "" || parts[1] == "" {
		return uuid.Nil, "", errors.New("malformed admin refresh credential")
	}

	id, err := uuid.Parse(parts[0])
	if err != nil {
		return uuid.Nil, "", errors.New("malformed admin refresh credential session id")
	}

	sum := sha256.Sum256([]byte(parts[1]))
	return id, hex.EncodeToString(sum[:]), nil
}

func hasAudience(audiences jwt.ClaimStrings, expected string) bool {
	for _, aud := range audiences {
		if aud == expected {
			return true
		}
	}
	return false
}
