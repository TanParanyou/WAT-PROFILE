package seeder

import (
	"testing"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func TestNewSeeder(t *testing.T) {
	dummyDB := &gorm.DB{}
	s := NewSeeder(dummyDB)
	if s == nil {
		t.Fatalf("expected initialized Seeder, got nil")
	}
	if s.db != dummyDB {
		t.Fatalf("expected db to be assigned")
	}
}

func TestSeeder_CreateSimpleRichText(t *testing.T) {
	th := "ข้อความภาษาไทย"
	en := "English text"
	de := "Deutscher Text"

	rt := createSimpleRichText(th, en, de)
	if len(rt["th"]) == 0 {
		t.Errorf("expected non-empty th rich text")
	}
	if len(rt["en"]) == 0 {
		t.Errorf("expected non-empty en rich text")
	}
	if len(rt["de"]) == 0 {
		t.Errorf("expected non-empty de rich text")
	}
}

func TestSeeder_ParseTime(t *testing.T) {
	valid := parseTime("05:30")
	if valid == nil {
		t.Fatalf("expected non-nil time for 05:30")
	}
	if valid.Hour() != 5 || valid.Minute() != 30 {
		t.Errorf("expected 05:30, got %02d:%02d", valid.Hour(), valid.Minute())
	}

	invalid := parseTime("invalid-time")
	if invalid != nil {
		t.Fatalf("expected nil for invalid time string, got %v", invalid)
	}
}

func TestSeeder_Integration_IfDBAvailable(t *testing.T) {
	dsn := "postgres://postgres:testpass@127.0.0.1:55433/wat_profile_test?sslmode=disable"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Skip("Test database not available; skipping live seed integration test")
	}

	s := NewSeeder(db)
	if err := s.SeedRoles(); err != nil {
		t.Fatalf("SeedRoles failed: %v", err)
	}
	if err := s.SeedSettings(); err != nil {
		t.Fatalf("SeedSettings failed: %v", err)
	}
}
