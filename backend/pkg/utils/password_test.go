package utils

import "testing"

func TestHashPassword(t *testing.T) {
	password := "mysecurepassword"
	hash, err := HashPassword(password)
	if err != nil {
		t.Fatalf("Failed to hash password: %v", err)
	}

	if hash == password {
		t.Fatalf("Hash should not be equal to password")
	}

	if !CheckPasswordHash(password, hash) {
		t.Fatalf("Password verification failed")
	}

	if CheckPasswordHash("wrongpassword", hash) {
		t.Fatalf("Password verification should fail for wrong password")
	}
}
