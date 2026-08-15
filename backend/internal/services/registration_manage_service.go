package services

import (
	"context"
	"crypto/subtle"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/accountauth"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/registrations"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type RegistrationCancelInput struct {
	Reason string
}

func (s *RegistrationService) ResolveManage(ctx context.Context, rawToken string) (*registrations.Detail, error) {
	if s.db == nil {
		return nil, errors.New("registration database is not configured")
	}
	var detail *registrations.Detail
	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		registration, err := s.registrationByToken(ctx, tx, rawToken, false)
		if err != nil {
			return err
		}
		built := registrationDetail(registration)
		detail = &built
		return nil
	})
	return detail, err
}

func (s *RegistrationService) UpdateByToken(ctx context.Context, rawToken string, input registrations.UpdateInput) (*registrations.Detail, error) {
	return s.updateRegistration(ctx, input, func(tx *gorm.DB) (*models.EventRegistration, error) {
		return s.registrationByToken(ctx, tx, rawToken, true)
	})
}

func (s *RegistrationService) CancelByToken(ctx context.Context, rawToken string, input RegistrationCancelInput) error {
	return s.cancelRegistration(ctx, input, func(tx *gorm.DB) (*models.EventRegistration, error) {
		return s.registrationByToken(ctx, tx, rawToken, true)
	})
}

func (s *RegistrationService) ListByUser(ctx context.Context, userID uuid.UUID) ([]registrations.ListItem, error) {
	var rows []models.EventRegistration
	if err := s.db.WithContext(ctx).Preload("Event").Preload("Participants").Where("user_id = ?", userID).Order("created_at DESC, id DESC").Find(&rows).Error; err != nil {
		return nil, err
	}
	items := make([]registrations.ListItem, 0, len(rows))
	for index := range rows {
		items = append(items, registrationListItem(&rows[index]))
	}
	return items, nil
}

func (s *RegistrationService) UpdateByUser(ctx context.Context, userID uuid.UUID, id int, input registrations.UpdateInput) (*registrations.Detail, error) {
	return s.updateRegistration(ctx, input, func(tx *gorm.DB) (*models.EventRegistration, error) {
		var registration models.EventRegistration
		err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Preload("Event").Preload("Participants").Where("id = ? AND user_id = ?", id, userID).First(&registration).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, registrations.NewDomainError(registrations.CodeNotFound, "Registration not found", nil)
		}
		return &registration, err
	})
}

func (s *RegistrationService) CancelByUser(ctx context.Context, userID uuid.UUID, id int, input RegistrationCancelInput) error {
	return s.cancelRegistration(ctx, input, func(tx *gorm.DB) (*models.EventRegistration, error) {
		var registration models.EventRegistration
		err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Preload("Event").Preload("Participants").Where("id = ? AND user_id = ?", id, userID).First(&registration).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, registrations.NewDomainError(registrations.CodeNotFound, "Registration not found", nil)
		}
		return &registration, err
	})
}

func (s *RegistrationService) updateRegistration(ctx context.Context, input registrations.UpdateInput, loader func(*gorm.DB) (*models.EventRegistration, error)) (*registrations.Detail, error) {
	return s.updateRegistrationWithOptions(ctx, input, loader, false)
}

func (s *RegistrationService) updateRegistrationWithOptions(ctx context.Context, input registrations.UpdateInput, loader func(*gorm.DB) (*models.EventRegistration, error), allowAfterDeadline bool) (*registrations.Detail, error) {
	var detail *registrations.Detail
	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		registration, err := loader(tx)
		if err != nil {
			return err
		}
		if registration == nil {
			return registrations.NewDomainError(registrations.CodeNotFound, "Registration not found", nil)
		}
		if registration.RegistrationStatus == "cancelled" {
			return registrations.NewDomainError(registrations.CodeNotEditable, "This registration can no longer be edited", nil)
		}
		var event models.Event
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&event, registration.EventID).Error; err != nil {
			return err
		}
		if !allowAfterDeadline {
			if cutoff := registrationEditCutoff(&event); cutoff != nil && !s.now().Before(*cutoff) {
				return registrations.NewDomainError(registrations.CodeNotEditable, "The registration deadline has passed", nil)
			}
		}
		var currentParticipants []models.EventRegistrationParticipant
		if err := tx.Where("registration_id = ?", registration.ID).Find(&currentParticipants).Error; err != nil {
			return err
		}
		currentActive := activeParticipantCountForRegistration(currentParticipants)
		availability, err := s.availabilityForEvent(ctx, tx, &event, s.now(), false)
		if err != nil {
			return err
		}
		if availability.MaxParticipants != nil && availability.ReservedParticipants-currentActive+len(input.Participants) > *availability.MaxParticipants {
			return registrations.NewDomainError(registrations.CodeFull, "There is not enough capacity for this group", nil)
		}

		existing := make(map[int64]models.EventRegistrationParticipant, len(currentParticipants))
		for _, participant := range currentParticipants {
			existing[participant.ID] = participant
		}
		seen := make(map[int64]struct{}, len(input.Participants))
		added := false
		for index, inputParticipant := range input.Participants {
			if inputParticipant.ID == nil {
				participant := models.EventRegistrationParticipant{RegistrationID: registration.ID, FirstName: inputParticipant.FirstName, LastName: inputParticipant.LastName, DietaryRestrictions: inputParticipant.DietaryRestrictions, SpecialNeeds: inputParticipant.SpecialNeeds, AdditionalNotes: inputParticipant.AdditionalNotes, AttendanceStatus: "registered"}
				if err := tx.Create(&participant).Error; err != nil {
					return err
				}
				added = true
				continue
			}
			participant, ok := existing[*inputParticipant.ID]
			if !ok {
				return registrations.NewDomainError(registrations.CodeValidation, "Registration details are invalid", map[string]string{fmt.Sprintf("participants.%d.id", index): "Participant does not belong to this registration"})
			}
			if participant.AttendanceStatus == "cancelled" {
				added = true
			}
			participant.FirstName = inputParticipant.FirstName
			participant.LastName = inputParticipant.LastName
			participant.DietaryRestrictions = inputParticipant.DietaryRestrictions
			participant.SpecialNeeds = inputParticipant.SpecialNeeds
			participant.AdditionalNotes = inputParticipant.AdditionalNotes
			participant.AttendanceStatus = "registered"
			participant.CancelledAt = nil
			if err := tx.Save(&participant).Error; err != nil {
				return err
			}
			seen[participant.ID] = struct{}{}
		}
		now := s.now()
		for _, participant := range currentParticipants {
			if _, ok := seen[participant.ID]; ok {
				continue
			}
			if participant.AttendanceStatus == "cancelled" {
				continue
			}
			participant.AttendanceStatus = "cancelled"
			participant.CancelledAt = &now
			if err := tx.Save(&participant).Error; err != nil {
				return err
			}
		}

		registration.FirstName = input.Contact.FirstName
		registration.LastName = input.Contact.LastName
		registration.Email = input.Contact.Email
		registration.Phone = input.Contact.Phone
		registration.Locale = input.Locale
		if added && registration.RegistrationStatus == "confirmed" {
			registration.RegistrationStatus = "pending"
		}
		if err := tx.Model(&models.EventRegistration{}).Where("id = ?", registration.ID).Updates(map[string]interface{}{
			"first_name": registration.FirstName, "last_name": registration.LastName, "email": registration.Email,
			"phone": registration.Phone, "locale": registration.Locale, "registration_status": registration.RegistrationStatus,
		}).Error; err != nil {
			return mapRegistrationDatabaseError(err)
		}
		if added && registration.RegistrationStatus == "pending" {
			if _, err := s.outbox.EnqueueTx(tx, OutboxJobInput{
				JobKey: fmt.Sprintf("registration:review_required:%d:%d", registration.ID, now.UnixNano()), Kind: "registration.review_required", AggregateType: "event_registration", AggregateID: fmt.Sprintf("%d", registration.ID),
				Payload: models.JSONMap{"registration_id": registration.ID, "locale": registration.Locale}, AvailableAt: now,
			}); err != nil {
				return err
			}
		}
		var fresh models.EventRegistration
		if err := tx.Preload("Event").Preload("Participants").First(&fresh, registration.ID).Error; err != nil {
			return err
		}
		built := registrationDetail(&fresh)
		detail = &built
		return nil
	})
	return detail, err
}

func (s *RegistrationService) cancelRegistration(ctx context.Context, input RegistrationCancelInput, loader func(*gorm.DB) (*models.EventRegistration, error)) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		registration, err := loader(tx)
		if err != nil {
			return err
		}
		if registration == nil {
			return registrations.NewDomainError(registrations.CodeNotFound, "Registration not found", nil)
		}
		if registration.RegistrationStatus == "cancelled" {
			return nil
		}
		var event models.Event
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&event, registration.EventID).Error; err != nil {
			return err
		}
		if cutoff := registrationEditCutoff(&event); cutoff != nil && !s.now().Before(*cutoff) {
			return registrations.NewDomainError(registrations.CodeNotEditable, "The registration deadline has passed", nil)
		}
		now := s.now()
		updates := map[string]interface{}{
			"registration_status": "cancelled", "cancellation_reason": strings.TrimSpace(input.Reason), "cancellation_origin": "registrant", "cancelled_at": now,
			"manage_token_hash": "", "manage_token_expires_at": nil,
		}
		if err := tx.Model(&models.EventRegistration{}).Where("id = ?", registration.ID).Updates(updates).Error; err != nil {
			return err
		}
		if err := tx.Model(&models.EventRegistrationParticipant{}).Where("registration_id = ? AND attendance_status <> ?", registration.ID, "cancelled").Updates(map[string]interface{}{"attendance_status": "cancelled", "cancelled_at": now}).Error; err != nil {
			return err
		}
		_, err = s.outbox.EnqueueTx(tx, OutboxJobInput{
			JobKey: fmt.Sprintf("registration:cancelled:%d:%d", registration.ID, now.UnixNano()), Kind: "registration.cancelled", AggregateType: "event_registration", AggregateID: fmt.Sprintf("%d", registration.ID),
			Payload: models.JSONMap{"registration_id": registration.ID, "locale": registration.Locale, "cancellation_origin": "registrant"}, AvailableAt: now,
		})
		return err
	})
}

func (s *RegistrationService) registrationByToken(ctx context.Context, db *gorm.DB, rawToken string, forUpdate bool) (*models.EventRegistration, error) {
	rawToken = strings.TrimSpace(rawToken)
	if rawToken == "" {
		return nil, registrations.NewDomainError(registrations.CodeTokenInvalid, "This management link is invalid", nil)
	}
	hash := accountauth.HashOpaqueToken(rawToken)
	query := db.WithContext(ctx).Preload("Event").Preload("Participants").Where("manage_token_hash = ?", hash)
	if forUpdate {
		query = query.Clauses(clause.Locking{Strength: "UPDATE"})
	}
	var registration models.EventRegistration
	if err := query.First(&registration).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, registrations.NewDomainError(registrations.CodeTokenInvalid, "This management link is invalid", nil)
		}
		return nil, err
	}
	if subtle.ConstantTimeCompare([]byte(registration.ManageTokenHash), []byte(hash)) != 1 {
		return nil, registrations.NewDomainError(registrations.CodeTokenInvalid, "This management link is invalid", nil)
	}
	if registration.ManageTokenExpiresAt == nil || !s.now().Before(*registration.ManageTokenExpiresAt) {
		return nil, registrations.NewDomainError(registrations.CodeTokenExpired, "This management link has expired", nil)
	}
	return &registration, nil
}

func registrationEditCutoff(event *models.Event) *time.Time {
	if event == nil {
		return nil
	}
	if event.RegistrationDeadline != nil {
		return event.RegistrationDeadline
	}
	return eventRegistrationStart(event)
}

func activeParticipantCountForRegistration(participants []models.EventRegistrationParticipant) int {
	count := 0
	for _, participant := range participants {
		if participant.AttendanceStatus != "cancelled" {
			count++
		}
	}
	return count
}
