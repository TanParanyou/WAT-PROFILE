package models

import (
	"reflect"
	"testing"
)

// TestAccountProfileUsesPublicFieldsOnly guards the community-safe boundary of
// the public account profile: it must never carry temple-member private fields.
func TestAccountProfileUsesPublicFieldsOnly(t *testing.T) {
	profileType := reflect.TypeOf(AccountProfile{})
	for _, forbidden := range []string{"Phone", "BirthDate", "Address", "MemberCode"} {
		if _, ok := profileType.FieldByName(forbidden); ok {
			t.Fatalf("account profile must not contain %s", forbidden)
		}
	}
}

// TestAccountStatusValues ensures every status used by the auth flows is valid.
func TestAccountStatusValues(t *testing.T) {
	for _, status := range []AccountStatus{
		AccountStatusPendingVerification,
		AccountStatusActive,
		AccountStatusDisabled,
		AccountStatusClosed,
	} {
		if !status.Valid() {
			t.Fatalf("expected %q to be valid", status)
		}
	}
	if AccountStatus("garbage").Valid() {
		t.Fatal("expected unknown account status to be invalid")
	}
}

// TestAuthSessionTokenHashHidden ensures the refresh-token hash can never be
// serialized to clients through the model JSON tags.
func TestAuthSessionTokenHashHidden(t *testing.T) {
	sessionType := reflect.TypeOf(AuthSession{})
	field, ok := sessionType.FieldByName("TokenHash")
	if !ok {
		t.Fatal("AuthSession.TokenHash must exist")
	}
	if field.Tag.Get("json") != "-" {
		t.Fatalf("AuthSession.TokenHash must be json-hidden, got %q", field.Tag.Get("json"))
	}
}

// TestAuthIdentityCredentialHashHidden ensures the password hash can never be
// serialized to clients through the model JSON tags.
func TestAuthIdentityCredentialHashHidden(t *testing.T) {
	identityType := reflect.TypeOf(AuthIdentity{})
	field, ok := identityType.FieldByName("CredentialHash")
	if !ok {
		t.Fatal("AuthIdentity.CredentialHash must exist")
	}
	if field.Tag.Get("json") != "-" {
		t.Fatalf("AuthIdentity.CredentialHash must be json-hidden, got %q", field.Tag.Get("json"))
	}
}
