package accountauth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
)

const (
	// tokenBytes is the entropy of one opaque token (32 bytes = 256 bits).
	tokenBytes = 32
)

// NewOpaqueToken generates a cryptographically random URL-safe opaque token
// and returns both the plain value (delivered to the client exactly once) and
// its SHA-256 hex hash (the only value stored at rest). The plain token is
// never persisted.
func NewOpaqueToken() (plain string, hash string, err error) {
	buf := make([]byte, tokenBytes)
	if _, err = rand.Read(buf); err != nil {
		return "", "", err
	}
	plain = base64.RawURLEncoding.EncodeToString(buf)
	return plain, HashOpaqueToken(plain), nil
}

// HashOpaqueToken returns the SHA-256 hex digest of a plain opaque token.
func HashOpaqueToken(plain string) string {
	sum := sha256.Sum256([]byte(plain))
	return hex.EncodeToString(sum[:])
}
