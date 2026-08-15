package registrations

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"io"
)

const tokenCipherDomain = "event-registration-manage-v1:"

type TokenCipher struct {
	aead cipher.AEAD
}

func NewTokenCipher(secret []byte) (*TokenCipher, error) {
	if len(secret) < 32 {
		return nil, errors.New("registration token cipher secret must be at least 32 bytes")
	}
	digest := sha256.Sum256(append([]byte(tokenCipherDomain), secret...))
	block, err := aes.NewCipher(digest[:])
	if err != nil {
		return nil, err
	}
	aead, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}
	return &TokenCipher{aead: aead}, nil
}

func (c *TokenCipher) Seal(plain string) (string, error) {
	if c == nil || c.aead == nil {
		return "", errors.New("registration token cipher is not initialized")
	}
	nonce := make([]byte, c.aead.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}
	sealed := c.aead.Seal(nonce, nonce, []byte(plain), nil)
	return base64.RawURLEncoding.EncodeToString(sealed), nil
}

func (c *TokenCipher) Open(encoded string) (string, error) {
	if c == nil || c.aead == nil {
		return "", errors.New("registration token cipher is not initialized")
	}
	sealed, err := base64.RawURLEncoding.DecodeString(encoded)
	if err != nil {
		return "", errors.New("registration token ciphertext is invalid")
	}
	if len(sealed) < c.aead.NonceSize() {
		return "", errors.New("registration token ciphertext is too short")
	}
	nonce, ciphertext := sealed[:c.aead.NonceSize()], sealed[c.aead.NonceSize():]
	plain, err := c.aead.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", errors.New("registration token ciphertext authentication failed")
	}
	return string(plain), nil
}
