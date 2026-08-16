package services

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/registrations"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var activeRegistrationStatuses = []string{"pending", "confirmed", "attended"}

func (s *RegistrationService) Create(ctx context.Context, eventID int, identity registrations.Identity, input registrations.CreateInput) (*registrations.Detail, error) {
	if s.db == nil {
		return nil, errors.New("registration database is not configured")
	}
	if s.outbox == nil {
		return nil, errors.New("registration outbox is not configured")
	}
	if s.cipherErr != nil {
		return nil, fmt.Errorf("registration token cipher is not configured: %w", s.cipherErr)
	}
	if s.cipher == nil {
		return nil, errors.New("registration token cipher is not configured")
	}
	now := s.now()
	var detail *registrations.Detail
	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var event models.Event
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&event, eventID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return registrations.NewDomainError(registrations.CodeNotFound, "Event not found", nil)
			}
			return err
		}

		availability, err := s.availabilityForEvent(ctx, tx, &event, now, false)
		if err != nil {
			return err
		}
		if !availability.CanRegister {
			return domainErrorForAvailability(availability)
		}

		var existing models.EventRegistration
		duplicateErr := tx.Where(
			"event_id = ? AND lower(email) = lower(?) AND registration_status IN ?",
			event.ID, input.Contact.Email, activeRegistrationStatuses,
		).First(&existing).Error
		if duplicateErr == nil {
			return registrations.NewDomainError(registrations.CodeDuplicate, "This email is already registered for this event", nil)
		}
		if !errors.Is(duplicateErr, gorm.ErrRecordNotFound) {
			return duplicateErr
		}

		if availability.MaxParticipants != nil && availability.RegisteredCount+len(input.Participants) > *availability.MaxParticipants {
			return registrations.NewDomainError(registrations.CodeFull, "There is not enough capacity for this group", nil)
		}

		plainToken, tokenHash, err := s.tokenGen()
		if err != nil {
			return err
		}
		ciphertext, err := s.cipher.Seal(plainToken)
		if err != nil {
			return err
		}
		registration := models.EventRegistration{
			EventID:              event.ID,
			RegistrationType:     identity.RegistrationType(),
			UserID:               identity.UserID,
			MemberID:             identity.MemberID,
			Locale:               input.Locale,
			PrivacyNoticeVersion: input.PrivacyNoticeVersion,
			PrivacyConsentAt:     &now,
			ManageTokenHash:      tokenHash,
			ManageTokenExpiresAt: eventRegistrationStart(&event),
			FirstName:            input.Contact.FirstName,
			LastName:             input.Contact.LastName,
			Email:                input.Contact.Email,
			Phone:                input.Contact.Phone,
			RegistrationStatus:   "pending",
			ConfirmationCode:     generateConfirmationCode(),
		}
		if err := tx.Create(&registration).Error; err != nil {
			return mapRegistrationDatabaseError(err)
		}

		participants := make([]models.EventRegistrationParticipant, 0, len(input.Participants))
		for _, inputParticipant := range input.Participants {
			participants = append(participants, models.EventRegistrationParticipant{
				RegistrationID:      registration.ID,
				FirstName:           inputParticipant.FirstName,
				LastName:            inputParticipant.LastName,
				DietaryRestrictions: inputParticipant.DietaryRestrictions,
				SpecialNeeds:        inputParticipant.SpecialNeeds,
				AdditionalNotes:     inputParticipant.AdditionalNotes,
				AttendanceStatus:    "registered",
			})
		}
		if err := tx.Create(&participants).Error; err != nil {
			return err
		}

		if _, err := s.outbox.EnqueueTx(tx, OutboxJobInput{
			JobKey:        fmt.Sprintf("registration:received:%d:1", registration.ID),
			Kind:          "registration.received",
			AggregateType: "event_registration",
			AggregateID:   fmt.Sprintf("%d", registration.ID),
			Payload: models.JSONMap{
				"registration_id":       registration.ID,
				"locale":                registration.Locale,
				"token_ciphertext":      ciphertext,
				"registration_revision": 1,
			},
			AvailableAt: now,
		}); err != nil {
			return err
		}

		registration.Event = &event
		registration.Participants = participants
		built := registrationDetail(&registration)
		detail = &built
		return nil
	})
	if err != nil {
		return nil, err
	}
	return detail, nil
}

func (s *RegistrationService) Availability(ctx context.Context, eventID int) (registrations.Availability, error) {
	if s.db == nil {
		return registrations.Availability{}, errors.New("registration database is not configured")
	}
	var event models.Event
	if err := s.db.WithContext(ctx).First(&event, eventID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return registrations.Availability{}, registrations.NewDomainError(registrations.CodeNotFound, "Event not found", nil)
		}
		return registrations.Availability{}, err
	}
	return s.availabilityForEvent(ctx, s.db.WithContext(ctx), &event, s.now(), false)
}

// IdentityForUser resolves the optional temple-member relationship without
// creating or mutating a Member row. Public Account ownership always remains
// the UserID even when a linked Member exists.
func (s *RegistrationService) IdentityForUser(ctx context.Context, userID uuid.UUID) (registrations.Identity, error) {
	identity := registrations.Identity{UserID: &userID}
	if s.db == nil {
		return identity, errors.New("registration database is not configured")
	}
	var member models.Member
	err := s.db.WithContext(ctx).Where("user_id = ?", userID).First(&member).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return identity, nil
	}
	if err != nil {
		return identity, err
	}
	identity.MemberID = &member.ID
	return identity, nil
}

func (s *RegistrationService) availabilityForEvent(ctx context.Context, db *gorm.DB, event *models.Event, now time.Time, lock bool) (registrations.Availability, error) {
	query := db.WithContext(ctx).Model(&models.EventRegistrationParticipant{}).
		Joins("JOIN event_registrations ON event_registrations.id = event_registration_participants.registration_id")
	if lock {
		query = query.Clauses(clause.Locking{Strength: "UPDATE"})
	}
	var activeCount int64
	if err := query.Where(
		"event_registrations.event_id = ? AND event_registrations.registration_status IN ? AND event_registration_participants.attendance_status <> ?",
		event.ID, activeRegistrationStatuses, "cancelled",
	).Count(&activeCount).Error; err != nil {
		return registrations.Availability{}, err
	}
	startAt := time.Time{}
	if start := eventRegistrationStart(event); start != nil {
		startAt = *start
	}
	return registrations.DeriveAvailability(registrations.EventWindow{
		Enabled:         event.RegistrationEnabled,
		Deadline:        event.RegistrationDeadline,
		StartsAt:        startAt,
		MaxParticipants: event.MaxParticipants,
	}, now, int(activeCount)), nil
}

func (s *RegistrationService) now() time.Time {
	if s.clock == nil {
		return time.Now()
	}
	return s.clock.Now()
}

func eventRegistrationStart(event *models.Event) *time.Time {
	return eventStartAt(event)
}

func domainErrorForAvailability(availability registrations.Availability) *registrations.DomainError {
	code := registrations.CodeClosed
	message := "Registration is closed for this event"
	if availability.UnavailableCode != nil {
		code = *availability.UnavailableCode
	}
	switch code {
	case registrations.CodeDisabled:
		message = "Registration is not enabled for this event"
	case registrations.CodeFull:
		message = "This event is full"
	}
	return registrations.NewDomainError(code, message, nil)
}

func mapRegistrationDatabaseError(err error) error {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" && strings.Contains(pgErr.ConstraintName, "active_email") {
		return registrations.NewDomainError(registrations.CodeDuplicate, "This email is already registered for this event", nil)
	}
	return err
}

func registrationDetail(registration *models.EventRegistration) registrations.Detail {
	participants := make([]registrations.Participant, 0, len(registration.Participants))
	for _, participant := range registration.Participants {
		participants = append(participants, registrations.Participant{
			ID:                  participant.ID,
			FirstName:           participant.FirstName,
			LastName:            participant.LastName,
			DietaryRestrictions: participant.DietaryRestrictions,
			SpecialNeeds:        participant.SpecialNeeds,
			AdditionalNotes:     participant.AdditionalNotes,
			AttendanceStatus:    participant.AttendanceStatus,
			AttendedAt:          participant.AttendedAt,
			CancelledAt:         participant.CancelledAt,
		})
	}
	eventSummary := registrations.EventSummary{}
	if registration.Event != nil {
		eventSummary = registrations.EventSummary{
			ID: registration.Event.ID, Slug: registration.Event.Slug, Title: registration.Event.Title,
			StartDate: registration.Event.StartDate, EndDate: registration.Event.EndDate,
			StartTime: registration.Event.StartTime, EndTime: registration.Event.EndTime,
		}
	}
	return registrations.Detail{
		ID: registration.ID, RegistrationType: registration.RegistrationType, RegistrationStatus: registration.RegistrationStatus,
		ConfirmationCode: registration.ConfirmationCode,
		Contact:          registrations.ContactInput{FirstName: registration.FirstName, LastName: registration.LastName, Email: registration.Email, Phone: registration.Phone},
		Participants:     participants, ParticipantCount: len(participants), Event: eventSummary,
		CreatedAt: registration.CreatedAt, UpdatedAt: registration.UpdatedAt, ConfirmedAt: registration.ConfirmedAt, CancelledAt: registration.CancelledAt,
	}
}

func registrationListItem(registration *models.EventRegistration) registrations.ListItem {
	detail := registrationDetail(registration)
	return registrations.ListItem{
		ID: detail.ID, RegistrationType: detail.RegistrationType, RegistrationStatus: detail.RegistrationStatus,
		ConfirmationCode: detail.ConfirmationCode, Contact: detail.Contact, Participants: detail.Participants,
		ParticipantCount: detail.ParticipantCount, Event: detail.Event, CreatedAt: detail.CreatedAt,
	}
}
