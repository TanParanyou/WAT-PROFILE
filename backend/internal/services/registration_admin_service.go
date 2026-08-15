package services

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"strings"

	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/registrations"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func (s *RegistrationService) AdminList(ctx context.Context, filter registrations.AdminListFilter) (registrations.AdminPage, error) {
	page := filter.Page
	if page <= 0 {
		page = 1
	}
	limit := filter.Limit
	if limit <= 0 {
		limit = 25
	}
	query := s.db.WithContext(ctx).Model(&models.EventRegistration{})
	search := strings.TrimSpace(filter.Search)
	if search != "" {
		term := "%" + search + "%"
		query = query.Where("first_name ILIKE ? OR last_name ILIKE ? OR email ILIKE ? OR phone ILIKE ? OR confirmation_code ILIKE ?", term, term, term, term, term)
	}
	if len(filter.Statuses) > 0 {
		query = query.Where("registration_status IN ?", filter.Statuses)
	}
	if len(filter.EventIDs) > 0 {
		query = query.Where("event_id IN ?", filter.EventIDs)
	}
	if len(filter.RegistrationTypes) > 0 {
		query = query.Where("registration_type IN ?", filter.RegistrationTypes)
	}
	if filter.From != nil {
		query = query.Where("created_at >= ?", *filter.From)
	}
	if filter.To != nil {
		query = query.Where("created_at < ?", filter.To.AddDate(0, 0, 1))
	}
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return registrations.AdminPage{}, err
	}
	var rows []models.EventRegistration
	sortColumn := registrationSortColumns[filter.Sort]
	if sortColumn == "" {
		sortColumn = "created_at"
	}
	order := strings.ToLower(filter.Order)
	if order != "asc" {
		order = "desc"
	}
	if err := query.Preload("Event").Preload("Participants").Order(sortColumn + " " + order + ", id " + order).Offset((page - 1) * limit).Limit(limit).Find(&rows).Error; err != nil {
		return registrations.AdminPage{}, err
	}
	items := make([]registrations.ListItem, 0, len(rows))
	for index := range rows {
		items = append(items, registrationListItem(&rows[index]))
	}
	return registrations.AdminPage{Items: items, Total: total, Page: page, Limit: limit}, nil
}

func (s *RegistrationService) AdminGet(ctx context.Context, id int) (*registrations.AdminDetail, error) {
	var row models.EventRegistration
	if err := s.db.WithContext(ctx).Preload("Event").Preload("Participants").First(&row, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, registrations.NewDomainError(registrations.CodeNotFound, "Registration not found", nil)
		}
		return nil, err
	}
	detail := adminRegistrationDetail(&row)
	return &detail, nil
}

func (s *RegistrationService) AdminUpdate(ctx context.Context, _ uuid.UUID, id int, input registrations.AdminUpdateInput) (*registrations.AdminDetail, error) {
	_, err := s.updateRegistrationWithOptions(ctx, input.UpdateInput, func(tx *gorm.DB) (*models.EventRegistration, error) {
		var registration models.EventRegistration
		err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Preload("Event").Preload("Participants").First(&registration, id).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, registrations.NewDomainError(registrations.CodeNotFound, "Registration not found", nil)
		}
		return &registration, err
	}, true)
	if err != nil {
		return nil, err
	}
	if strings.TrimSpace(input.CancellationReason) != "" {
		if err := s.db.WithContext(ctx).Model(&models.EventRegistration{}).Where("id = ?", id).Update("cancellation_reason", strings.TrimSpace(input.CancellationReason)).Error; err != nil {
			return nil, err
		}
	}
	return s.AdminGet(ctx, id)
}

func (s *RegistrationService) AdminSetStatus(ctx context.Context, actorID uuid.UUID, id int, input registrations.StatusInput) (*registrations.AdminDetail, error) {
	status := strings.TrimSpace(input.Status)
	if status != "pending" && status != "confirmed" && status != "cancelled" && status != "attended" {
		return nil, registrations.NewDomainError(registrations.CodeValidation, "Registration status is invalid", map[string]string{"status": "Unsupported status"})
	}
	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var registration models.EventRegistration
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&registration, id).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return registrations.NewDomainError(registrations.CodeNotFound, "Registration not found", nil)
			}
			return err
		}
		var event models.Event
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&event, registration.EventID).Error; err != nil {
			return err
		}
		if registration.RegistrationStatus == "cancelled" && status != "cancelled" {
			return registrations.NewDomainError(registrations.CodeConflict, "A cancelled registration cannot be reopened", nil)
		}
		if status == "cancelled" && strings.TrimSpace(input.Reason) == "" {
			return registrations.NewDomainError(registrations.CodeValidation, "A cancellation reason is required", map[string]string{"reason": "Reason is required"})
		}
		now := s.now()
		updates := map[string]interface{}{"registration_status": status}
		if status == "confirmed" {
			updates["confirmed_at"] = now
		}
		if status == "attended" {
			updates["attended"] = true
			updates["attended_at"] = now
		} else {
			updates["attended"] = false
			updates["attended_at"] = nil
		}
		if status == "cancelled" {
			updates["cancellation_reason"] = strings.TrimSpace(input.Reason)
			updates["cancellation_origin"] = "admin"
			updates["cancelled_at"] = now
			updates["manage_token_hash"] = nil
			updates["manage_token_expires_at"] = nil
			if err := tx.Model(&models.EventRegistrationParticipant{}).Where("registration_id = ? AND attendance_status <> ?", id, "cancelled").Updates(map[string]interface{}{"attendance_status": "cancelled", "cancelled_at": now}).Error; err != nil {
				return err
			}
		}
		if err := tx.Model(&models.EventRegistration{}).Where("id = ?", id).Updates(updates).Error; err != nil {
			return mapRegistrationDatabaseError(err)
		}
		kind := ""
		switch status {
		case "confirmed":
			kind = "registration.confirmed"
		case "cancelled":
			kind = "registration.cancelled"
		}
		if kind != "" {
			if s.outbox == nil {
				return errors.New("registration outbox is not configured")
			}
			if _, err := s.outbox.EnqueueTx(tx, OutboxJobInput{JobKey: fmt.Sprintf("registration:%s:%d:%d", status, id, now.UnixNano()), Kind: kind, AggregateType: "event_registration", AggregateID: strconv.Itoa(id), Payload: models.JSONMap{"registration_id": id, "actor_id": actorID.String(), "locale": registration.Locale}, AvailableAt: now}); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return s.AdminGet(ctx, id)
}

func (s *RegistrationService) AdminSetAttendance(ctx context.Context, _ uuid.UUID, registrationID, participantID int, input registrations.AttendanceInput) (*registrations.AdminDetail, error) {
	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var participant models.EventRegistrationParticipant
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id = ? AND registration_id = ?", participantID, registrationID).First(&participant).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return registrations.NewDomainError(registrations.CodeNotFound, "Participant not found", nil)
			}
			return err
		}
		if participant.AttendanceStatus == "cancelled" {
			return registrations.NewDomainError(registrations.CodeConflict, "A cancelled participant cannot be checked in", nil)
		}
		now := s.now()
		if input.Attended {
			participant.AttendanceStatus = "attended"
			participant.AttendedAt = &now
			participant.CancelledAt = nil
		} else {
			participant.AttendanceStatus = "registered"
			participant.AttendedAt = nil
		}
		return tx.Save(&participant).Error
	})
	if err != nil {
		return nil, err
	}
	return s.AdminGet(ctx, registrationID)
}

func (s *RegistrationService) AdminRotateManageLink(ctx context.Context, _ uuid.UUID, id int) error {
	if s.cipherErr != nil || s.cipher == nil {
		return errors.New("registration token cipher is not configured")
	}
	if s.outbox == nil {
		return errors.New("registration outbox is not configured")
	}
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var registration models.EventRegistration
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Preload("Event").First(&registration, id).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return registrations.NewDomainError(registrations.CodeNotFound, "Registration not found", nil)
			}
			return err
		}
		if registration.RegistrationStatus == "cancelled" {
			return registrations.NewDomainError(registrations.CodeNotEditable, "A cancelled registration has no active management link", nil)
		}
		plain, hash, err := s.tokenGen()
		if err != nil {
			return err
		}
		ciphertext, err := s.cipher.Seal(plain)
		if err != nil {
			return err
		}
		expiresAt := eventRegistrationStart(registration.Event)
		if err := tx.Model(&models.EventRegistration{}).Where("id = ?", id).Updates(map[string]interface{}{"manage_token_hash": hash, "manage_token_expires_at": expiresAt}).Error; err != nil {
			return err
		}
		now := s.now()
		_, err = s.outbox.EnqueueTx(tx, OutboxJobInput{JobKey: fmt.Sprintf("registration:manage-link:%d:%d", id, now.UnixNano()), Kind: "registration.received", AggregateType: "event_registration", AggregateID: strconv.Itoa(id), Payload: models.JSONMap{"registration_id": id, "locale": registration.Locale, "token_ciphertext": ciphertext}, AvailableAt: now})
		return err
	})
}

func adminRegistrationDetail(row *models.EventRegistration) registrations.AdminDetail {
	return registrations.AdminDetail{Detail: registrationDetail(row), UserID: row.UserID, MemberID: row.MemberID, PrivacyNoticeVersion: row.PrivacyNoticeVersion, PrivacyConsentAt: row.PrivacyConsentAt, CancellationReason: row.CancellationReason, CancellationOrigin: row.CancellationOrigin}
}
