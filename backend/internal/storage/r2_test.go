package storage

import (
	"os"
	"testing"
)

func TestNewR2Service_MissingEnv(t *testing.T) {
	// Clear envs
	os.Unsetenv("R2_ACCOUNT_ID")
	os.Unsetenv("R2_ACCESS_KEY_ID")
	os.Unsetenv("R2_SECRET_ACCESS_KEY")
	os.Unsetenv("R2_BUCKET_NAME")
	os.Unsetenv("R2_PUBLIC_URL")

	svc, err := NewR2Service()
	if err == nil {
		t.Fatalf("expected error when R2 credentials are not set, got nil")
	}
	if svc != nil {
		t.Fatalf("expected nil service when error occurs, got %v", svc)
	}
}

func TestNewR2Service_WithEnv(t *testing.T) {
	// Set dummy credentials
	os.Setenv("R2_ACCOUNT_ID", "test-account-id")
	os.Setenv("R2_ACCESS_KEY_ID", "test-access-key")
	os.Setenv("R2_SECRET_ACCESS_KEY", "test-secret-key")
	os.Setenv("R2_BUCKET_NAME", "test-bucket")
	os.Setenv("R2_PUBLIC_URL", "https://r2.example.com")
	defer func() {
		os.Unsetenv("R2_ACCOUNT_ID")
		os.Unsetenv("R2_ACCESS_KEY_ID")
		os.Unsetenv("R2_SECRET_ACCESS_KEY")
		os.Unsetenv("R2_BUCKET_NAME")
		os.Unsetenv("R2_PUBLIC_URL")
	}()

	svc, err := NewR2Service()
	if err != nil {
		t.Fatalf("unexpected error initializing R2Service: %v", err)
	}
	if svc == nil {
		t.Fatalf("expected initialized R2Service, got nil")
	}
	if svc.bucket != "test-bucket" {
		t.Errorf("expected bucket test-bucket, got %s", svc.bucket)
	}
	if svc.publicURL != "https://r2.example.com" {
		t.Errorf("expected publicURL https://r2.example.com, got %s", svc.publicURL)
	}
}
