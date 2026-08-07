package services

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/listquery"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var (
	ErrAdminAccountNotFound      = errors.New("public account not found")
	ErrAdminAccountInvalidReason = errors.New("invalid account operation reason")
	ErrAdminAccountConflict      = errors.New("account operation is not allowed for this account status")
)

const (
	AccountOperationReasonSecurityReview  = "security_review"
	AccountOperationReasonPolicyViolation = "policy_violation"
	AccountOperationReasonUserRequest     = "user_request"
	AccountOperationReasonSupportRequest  = "support_request"
)

var allowedAccountOperationReasons = map[string]struct{}{
	AccountOperationReasonSecurityReview:  {},
	AccountOperationReasonPolicyViolation: {},
	AccountOperationReasonUserRequest:     {},
	AccountOperationReasonSupportRequest:  {},
}

// AdminAccountSummary is the intentionally limited representation exposed to
// Admin. It contains no credentials, session material, storage keys, or
// request-identifying security metadata.
type AdminAccountSummary struct {
	ID            uuid.UUID            `json:"id"`
	Email         string               `json:"email"`
	DisplayName   string               `json:"display_name"`
	AccountStatus models.AccountStatus `json:"account_status"`
	EmailVerified bool                 `json:"email_verified"`
	Providers     []string             `json:"providers"`
	LastLoginAt   *time.Time           `json:"last_login_at,omitempty"`
	ClosedAt      *time.Time           `json:"closed_at,omitempty"`
	PurgeAfter    *time.Time           `json:"purge_after,omitempty"`
	CreatedAt     time.Time            `json:"created_at"`
}

// AdminAccountSecurityEvent is a redacted projection of a public-account
// security event. IP prefix, trace ID, metadata, and user-agent data stay
// server-side.
type AdminAccountSecurityEvent struct {
	ID        uuid.UUID `json:"id"`
	EventType string    `json:"event_type"`
	Outcome   string    `json:"outcome"`
	Provider  string    `json:"provider,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

type AdminAccountListOptions struct {
	Common    listquery.Common
	Statuses  []string
	Providers []string
}

type adminAccountSummaryRow struct {
	ID            uuid.UUID            `gorm:"column:id"`
	Email         string               `gorm:"column:email"`
	DisplayName   string               `gorm:"column:display_name"`
	AccountStatus models.AccountStatus `gorm:"column:account_status"`
	EmailVerified bool                 `gorm:"column:email_verified"`
	LastLoginAt   *time.Time           `gorm:"column:last_login_at"`
	ClosedAt      *time.Time           `gorm:"column:closed_at"`
	PurgeAfter    *time.Time           `gorm:"column:purge_after"`
	CreatedAt     time.Time            `gorm:"column:created_at"`
}

var adminAccountSortColumns = map[string]string{
	"created_at":    "users.created_at",
	"last_login_at": "users.last_login_at",
	"email":         "users.email",
	"display_name":  "account_profiles.display_name",
	"purge_after":   "users.purge_after",
}

var adminAccountEventSortColumns = map[string]string{
	"created_at": "auth_security_events.created_at",
	"event_type": "auth_security_events.event_type",
}

type AdminAccountOperationsService struct {
	db *gorm.DB
}

func NewAdminAccountOperationsService(db *gorm.DB) *AdminAccountOperationsService {
	return &AdminAccountOperationsService{db: db}
}

func ValidateAccountOperationReason(reason string) bool {
	_, ok := allowedAccountOperationReasons[strings.TrimSpace(reason)]
	return ok
}

func (s *AdminAccountOperationsService) List(options AdminAccountListOptions) ([]AdminAccountSummary, int64, error) {
	query := s.summaryQuery()
	if options.Common.Search != "" {
		search := "%" + strings.TrimSpace(options.Common.Search) + "%"
		query = query.Where("users.email ILIKE ? OR account_profiles.display_name ILIKE ? OR users.name ILIKE ?", search, search, search)
	}
	if len(options.Statuses) > 0 {
		query = query.Where("users.account_status IN ?", options.Statuses)
	}
	if len(options.Providers) > 0 {
		query = query.Where("EXISTS (SELECT 1 FROM auth_identities provider_filter WHERE provider_filter.user_id = users.id AND provider_filter.provider IN ?)", options.Providers)
	}
	if options.Common.From != nil {
		query = query.Where("users.created_at >= ?", *options.Common.From)
	}
	if options.Common.To != nil {
		query = query.Where("users.created_at <= ?", *options.Common.To)
	}

	var total int64
	if err := query.Session(&gorm.Session{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	sortColumn := adminAccountSortColumns[options.Common.Sort]
	if sortColumn == "" {
		sortColumn = adminAccountSortColumns["created_at"]
	}
	order := "DESC"
	if strings.EqualFold(options.Common.Order, "asc") {
		order = "ASC"
	}

	var rows []adminAccountSummaryRow
	if err := query.Order(fmt.Sprintf("%s %s", sortColumn, order)).
		Offset((options.Common.Page - 1) * options.Common.Limit).
		Limit(options.Common.Limit).
		Find(&rows).Error; err != nil {
		return nil, 0, err
	}

	items, err := s.enrichSummaries(rows)
	return items, total, err
}

func (s *AdminAccountOperationsService) Get(id uuid.UUID) (AdminAccountSummary, error) {
	var row adminAccountSummaryRow
	if err := s.summaryQuery().Where("users.id = ?", id).First(&row).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return AdminAccountSummary{}, ErrAdminAccountNotFound
		}
		return AdminAccountSummary{}, err
	}
	items, err := s.enrichSummaries([]adminAccountSummaryRow{row})
	if err != nil {
		return AdminAccountSummary{}, err
	}
	return items[0], nil
}

func (s *AdminAccountOperationsService) ListSecurityEvents(id uuid.UUID, common listquery.Common) ([]AdminAccountSecurityEvent, int64, error) {
	if _, err := s.Get(id); err != nil {
		return nil, 0, err
	}

	query := s.db.Model(&models.AuthSecurityEvent{}).Where("auth_security_events.user_id = ?", id)
	if common.Search != "" {
		query = query.Where("auth_security_events.event_type ILIKE ?", "%"+strings.TrimSpace(common.Search)+"%")
	}
	if common.From != nil {
		query = query.Where("auth_security_events.created_at >= ?", *common.From)
	}
	if common.To != nil {
		query = query.Where("auth_security_events.created_at <= ?", *common.To)
	}

	var total int64
	if err := query.Session(&gorm.Session{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	sortColumn := adminAccountEventSortColumns[common.Sort]
	if sortColumn == "" {
		sortColumn = adminAccountEventSortColumns["created_at"]
	}
	order := "DESC"
	if strings.EqualFold(common.Order, "asc") {
		order = "ASC"
	}

	var events []models.AuthSecurityEvent
	if err := query.Select("auth_security_events.id, auth_security_events.event_type, auth_security_events.outcome, auth_security_events.provider, auth_security_events.created_at").
		Order(fmt.Sprintf("%s %s", sortColumn, order)).
		Offset((common.Page - 1) * common.Limit).
		Limit(common.Limit).
		Find(&events).Error; err != nil {
		return nil, 0, err
	}

	result := make([]AdminAccountSecurityEvent, 0, len(events))
	for _, event := range events {
		result = append(result, AdminAccountSecurityEvent{
			ID:        event.ID,
			EventType: event.EventType,
			Outcome:   event.Outcome,
			Provider:  event.Provider,
			CreatedAt: event.CreatedAt,
		})
	}
	return result, total, nil
}

func (s *AdminAccountOperationsService) Disable(id uuid.UUID, reason string) (AdminAccountSummary, error) {
	if !ValidateAccountOperationReason(reason) {
		return AdminAccountSummary{}, ErrAdminAccountInvalidReason
	}
	if err := s.db.Transaction(func(tx *gorm.DB) error {
		user, err := s.lockPublicAccount(tx, id)
		if err != nil {
			return err
		}
		if user.AccountStatus != models.AccountStatusActive || !user.IsActive {
			return ErrAdminAccountConflict
		}
		now := time.Now()
		if err := tx.Model(&models.User{}).Where("id = ?", user.ID).Updates(map[string]interface{}{
			"account_status": models.AccountStatusDisabled,
			"is_active":      false,
			"updated_at":     now,
		}).Error; err != nil {
			return err
		}
		return revokePublicSessions(tx, user.ID, now, "admin_disabled")
	}); err != nil {
		return AdminAccountSummary{}, err
	}
	return s.Get(id)
}

func (s *AdminAccountOperationsService) Enable(id uuid.UUID, reason string) (AdminAccountSummary, error) {
	if !ValidateAccountOperationReason(reason) {
		return AdminAccountSummary{}, ErrAdminAccountInvalidReason
	}
	if err := s.db.Transaction(func(tx *gorm.DB) error {
		user, err := s.lockPublicAccount(tx, id)
		if err != nil {
			return err
		}
		if user.AccountStatus != models.AccountStatusDisabled || !user.EmailVerified {
			return ErrAdminAccountConflict
		}
		return tx.Model(&models.User{}).Where("id = ?", user.ID).Updates(map[string]interface{}{
			"account_status": models.AccountStatusActive,
			"is_active":      true,
			"updated_at":     time.Now(),
		}).Error
	}); err != nil {
		return AdminAccountSummary{}, err
	}
	return s.Get(id)
}

func (s *AdminAccountOperationsService) LogoutAll(id uuid.UUID, reason string) (AdminAccountSummary, error) {
	if !ValidateAccountOperationReason(reason) {
		return AdminAccountSummary{}, ErrAdminAccountInvalidReason
	}
	if err := s.db.Transaction(func(tx *gorm.DB) error {
		user, err := s.lockPublicAccount(tx, id)
		if err != nil {
			return err
		}
		if user.AccountStatus != models.AccountStatusActive && user.AccountStatus != models.AccountStatusDisabled {
			return ErrAdminAccountConflict
		}
		return revokePublicSessions(tx, user.ID, time.Now(), "admin_logout_all")
	}); err != nil {
		return AdminAccountSummary{}, err
	}
	return s.Get(id)
}

func (s *AdminAccountOperationsService) summaryQuery() *gorm.DB {
	return s.db.Table("users").
		Select("users.id, users.email, COALESCE(NULLIF(account_profiles.display_name, ''), users.name) AS display_name, users.account_status, users.email_verified, users.last_login_at, users.closed_at, users.purge_after, users.created_at").
		Joins("INNER JOIN account_profiles ON account_profiles.user_id = users.id")
}

func (s *AdminAccountOperationsService) lockPublicAccount(tx *gorm.DB, id uuid.UUID) (models.User, error) {
	var user models.User
	err := tx.Table("users").
		Clauses(clause.Locking{Strength: "UPDATE"}).
		Joins("INNER JOIN account_profiles ON account_profiles.user_id = users.id").
		Where("users.id = ?", id).
		First(&user).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return models.User{}, ErrAdminAccountNotFound
	}
	return user, err
}

func revokePublicSessions(tx *gorm.DB, userID uuid.UUID, now time.Time, reason string) error {
	return tx.Model(&models.AuthSession{}).
		Where("user_id = ? AND revoked_at IS NULL", userID).
		Updates(map[string]interface{}{
			"revoked_at":     now,
			"revoked_reason": reason,
			"updated_at":     now,
		}).Error
}

func (s *AdminAccountOperationsService) enrichSummaries(rows []adminAccountSummaryRow) ([]AdminAccountSummary, error) {
	if len(rows) == 0 {
		return []AdminAccountSummary{}, nil
	}
	ids := make([]uuid.UUID, 0, len(rows))
	for _, row := range rows {
		ids = append(ids, row.ID)
	}
	var identities []models.AuthIdentity
	if err := s.db.Select("user_id, provider").Where("user_id IN ?", ids).Find(&identities).Error; err != nil {
		return nil, err
	}
	providers := make(map[uuid.UUID]map[string]struct{}, len(ids))
	for _, identity := range identities {
		if providers[identity.UserID] == nil {
			providers[identity.UserID] = make(map[string]struct{})
		}
		providers[identity.UserID][identity.Provider] = struct{}{}
	}

	result := make([]AdminAccountSummary, 0, len(rows))
	for _, row := range rows {
		providerValues := make([]string, 0, len(providers[row.ID]))
		for provider := range providers[row.ID] {
			providerValues = append(providerValues, provider)
		}
		// Keep the provider order stable for the API and UI.
		if len(providerValues) == 2 {
			if providerValues[0] == "google" {
				providerValues[0], providerValues[1] = providerValues[1], providerValues[0]
			}
		}
		result = append(result, AdminAccountSummary{
			ID:            row.ID,
			Email:         row.Email,
			DisplayName:   row.DisplayName,
			AccountStatus: row.AccountStatus,
			EmailVerified: row.EmailVerified,
			Providers:     providerValues,
			LastLoginAt:   row.LastLoginAt,
			ClosedAt:      row.ClosedAt,
			PurgeAfter:    row.PurgeAfter,
			CreatedAt:     row.CreatedAt,
		})
	}
	return result, nil
}
