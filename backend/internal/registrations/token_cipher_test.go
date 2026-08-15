package registrations

import "testing"

func TestTokenCipherRoundTripRejectsTampering(t *testing.T) {
	cipher, err := NewTokenCipher([]byte("0123456789abcdef0123456789abcdef"))
	if err != nil {
		t.Fatal(err)
	}
	sealed, err := cipher.Seal("secret-token")
	if err != nil {
		t.Fatal(err)
	}
	plain, err := cipher.Open(sealed)
	if err != nil || plain != "secret-token" {
		t.Fatalf("plain=%q err=%v", plain, err)
	}
	sealedBytes := []byte(sealed)
	sealedBytes[len(sealedBytes)-1] ^= 1
	if _, err := cipher.Open(string(sealedBytes)); err == nil {
		t.Fatal("tampered ciphertext must fail")
	}
}

func TestNewTokenCipherRejectsShortSecret(t *testing.T) {
	if _, err := NewTokenCipher([]byte("short")); err == nil {
		t.Fatal("short secret must fail")
	}
}
