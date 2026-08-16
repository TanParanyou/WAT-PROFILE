package services

import (
	"errors"
	"time"

	"github.com/watloungporsai/wat-profile-backend/internal/models"
)

var ErrRegistrationDeadlineAfterStart = errors.New("registration deadline must not be after event start")

func ValidateEventRegistrationDeadline(event *models.Event) error {
	if event == nil || event.RegistrationDeadline == nil {
		return nil
	}

	start := eventStartAt(event)
	if start == nil || event.RegistrationDeadline.Before(*start) || event.RegistrationDeadline.Equal(*start) {
		return nil
	}
	return ErrRegistrationDeadlineAfterStart
}

func eventStartAt(event *models.Event) *time.Time {
	if event == nil || event.StartDate.IsZero() {
		return nil
	}

	location, err := time.LoadLocation("Europe/Berlin")
	if err != nil {
		location = time.UTC
	}
	date := event.StartDate.In(location)
	start := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, location)
	if event.StartTime != nil {
		clock := event.StartTime.In(location)
		start = time.Date(date.Year(), date.Month(), date.Day(), clock.Hour(), clock.Minute(), clock.Second(), clock.Nanosecond(), location)
	}
	return &start
}
