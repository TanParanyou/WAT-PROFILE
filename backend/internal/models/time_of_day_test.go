package models

import (
	"testing"
	"time"
)

func TestTimeOfDayNormalizesDatabaseValues(t *testing.T) {
	var value TimeOfDay
	if err := value.Scan([]byte("09:15:00")); err != nil {
		t.Fatal(err)
	}
	if value != "09:15" {
		t.Fatalf("expected normalized time, got %q", value)
	}

	if err := value.Scan(time.Date(0, time.January, 1, 17, 45, 0, 0, time.UTC)); err != nil {
		t.Fatal(err)
	}
	if value != "17:45" {
		t.Fatalf("expected time.Time normalization, got %q", value)
	}
}

func TestTimeOfDayValueRejectsInvalidValues(t *testing.T) {
	value := TimeOfDay("25:00")
	if _, err := value.Value(); err == nil {
		t.Fatal("expected invalid time to be rejected")
	}
}
