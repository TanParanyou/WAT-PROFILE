package services

import (
	"errors"
	"testing"
	"time"

	"github.com/watloungporsai/wat-profile-backend/internal/models"
)

func TestValidateEventRegistrationDeadline(t *testing.T) {
	berlin, err := time.LoadLocation("Europe/Berlin")
	if err != nil {
		t.Fatal(err)
	}

	start := time.Date(2026, 8, 31, 9, 0, 0, 0, berlin)
	tests := []struct {
		name     string
		deadline *time.Time
		wantErr  bool
	}{
		{name: "before start", deadline: timePtr(start.Add(-time.Second))},
		{name: "at start", deadline: timePtr(start)},
		{name: "after start", deadline: timePtr(start.Add(time.Second)), wantErr: true},
		{name: "no deadline"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			event := models.Event{StartDate: start, StartTime: timePtr(start), RegistrationDeadline: tt.deadline}
			err := ValidateEventRegistrationDeadline(&event)
			if tt.wantErr {
				if !errors.Is(err, ErrRegistrationDeadlineAfterStart) {
					t.Fatalf("error=%v, want %v", err, ErrRegistrationDeadlineAfterStart)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
		})
	}
}

func TestValidateEventRegistrationDeadlineUsesBerlinCalendarStart(t *testing.T) {
	berlin, err := time.LoadLocation("Europe/Berlin")
	if err != nil {
		t.Fatal(err)
	}

	// These values are UTC instants for 31 August 2026, 09:00 in Berlin.
	startDate := time.Date(2026, 8, 30, 22, 0, 0, 0, time.UTC)
	startTime := time.Date(2026, 8, 31, 7, 0, 0, 0, time.UTC)
	deadline := time.Date(2026, 8, 31, 7, 0, 0, 0, time.UTC)

	event := models.Event{StartDate: startDate, StartTime: &startTime, RegistrationDeadline: &deadline}
	if err := ValidateEventRegistrationDeadline(&event); err != nil {
		t.Fatalf("deadline equal to Berlin start should be valid: %v", err)
	}

	deadline = deadline.Add(time.Second)
	if err := ValidateEventRegistrationDeadline(&event); !errors.Is(err, ErrRegistrationDeadlineAfterStart) {
		t.Fatalf("deadline after Berlin start error=%v", err)
	}

	if got := startDate.In(berlin).Format(time.RFC3339); got != "2026-08-31T00:00:00+02:00" {
		t.Fatalf("start date in Berlin=%s", got)
	}
}

func TestValidateEventRegistrationDeadlineWithoutStartTimeUsesMidnight(t *testing.T) {
	berlin, err := time.LoadLocation("Europe/Berlin")
	if err != nil {
		t.Fatal(err)
	}

	startDate := time.Date(2026, 8, 30, 22, 0, 0, 0, time.UTC)
	deadline := time.Date(2026, 8, 30, 23, 59, 59, 0, berlin)
	event := models.Event{StartDate: startDate, RegistrationDeadline: &deadline}
	if err := ValidateEventRegistrationDeadline(&event); err != nil {
		t.Fatalf("deadline before Berlin midnight should be valid: %v", err)
	}

	deadline = time.Date(2026, 8, 31, 0, 0, 1, 0, berlin)
	if err := ValidateEventRegistrationDeadline(&event); !errors.Is(err, ErrRegistrationDeadlineAfterStart) {
		t.Fatalf("deadline after Berlin midnight error=%v", err)
	}
}

func timePtr(value time.Time) *time.Time {
	return &value
}
