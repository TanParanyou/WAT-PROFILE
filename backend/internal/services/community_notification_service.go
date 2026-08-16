package services

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/community"
	"github.com/watloungporsai/wat-profile-backend/internal/config"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type CommunityNotificationService struct {
	db     *gorm.DB
	cfg    config.CommunityConfig
	outbox *OperationOutboxService
	now    func() time.Time
}

func NewCommunityNotificationService(db *gorm.DB, cfg config.CommunityConfig, outbox ...*OperationOutboxService) *CommunityNotificationService {
	var jobs *OperationOutboxService
	if len(outbox) > 0 {
		jobs = outbox[0]
	}
	return &CommunityNotificationService{db: db, cfg: cfg, outbox: jobs, now: time.Now}
}

// RecordTx implements CommunityEventSink. The notification row and optional
// email outbox job are committed with the originating Community mutation.
func (s *CommunityNotificationService) RecordTx(ctx context.Context, tx *gorm.DB, event community.Event) error {
	if event.RecipientID == uuid.Nil || event.Type == "" {
		return nil
	}
	if event.ActorUserID != nil && *event.ActorUserID == event.RecipientID {
		return nil
	}
	dedupe := strings.TrimSpace(event.DedupeKey)
	if dedupe == "" {
		target := "-"
		if event.TargetID != nil {
			target = event.TargetID.String()
		}
		dedupe = event.Type + ":" + event.RecipientID.String() + ":" + target
	}
	notification := models.CommunityNotification{ID: uuid.New(), RecipientUserID: event.RecipientID, EventType: event.Type, ActorUserID: event.ActorUserID, ActorAdminID: event.ActorAdminID, TargetType: event.TargetType, TargetID: event.TargetID, DedupeKey: dedupe, CreatedAt: s.now().UTC()}
	result := tx.WithContext(ctx).Clauses(clause.OnConflict{DoNothing: true}).Create(&notification)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 || !s.cfg.EmailEnabled || s.outbox == nil || !event.EmailRequired {
		return nil
	}
	emailEnabled, err := s.emailEnabledTx(ctx, tx, event)
	if err != nil {
		return err
	}
	if !emailEnabled {
		return nil
	}
	_, err = s.outbox.EnqueueTx(tx, OutboxJobInput{JobKey: "community:notification:email:" + notification.ID.String(), Kind: "community.notification.email", AggregateType: "community_notification", AggregateID: notification.ID.String(), Payload: models.JSONMap{}})
	return err
}

func (s *CommunityNotificationService) List(ctx context.Context, userID uuid.UUID, input community.NotificationListInput) (community.NotificationPageDTO, error) {
	if userID == uuid.Nil {
		return community.NotificationPageDTO{}, community.NewDomainError(community.CodeForbidden, "Account is required")
	}
	limit := input.Limit
	if limit <= 0 {
		limit = 20
	}
	if limit > 50 {
		return community.NotificationPageDTO{}, community.NewDomainError(community.CodeValidation, "Limit must be between 1 and 50")
	}
	query := s.db.WithContext(ctx).Where("recipient_user_id = ?", userID).Order("created_at DESC, id DESC").Limit(limit + 1)
	if input.UnreadOnly {
		query = query.Where("read_at IS NULL")
	}
	if strings.TrimSpace(input.Cursor) != "" {
		cursor, err := decodeNotificationCursor(input.Cursor)
		if err != nil {
			return community.NotificationPageDTO{}, err
		}
		query = query.Where("(created_at, id) < (?, ?)", cursor.CreatedAt, cursor.ID)
	}
	var rows []models.CommunityNotification
	if err := query.Find(&rows).Error; err != nil {
		return community.NotificationPageDTO{}, err
	}
	next := ""
	if len(rows) > limit {
		last := rows[limit-1]
		next = encodeNotificationCursor(notificationCursor{CreatedAt: last.CreatedAt, ID: last.ID})
		rows = rows[:limit]
	}
	var unread int64
	if err := s.db.WithContext(ctx).Model(&models.CommunityNotification{}).Where("recipient_user_id = ? AND read_at IS NULL", userID).Count(&unread).Error; err != nil {
		return community.NotificationPageDTO{}, err
	}
	items := make([]community.NotificationDTO, 0, len(rows))
	for _, row := range rows {
		items = append(items, community.NotificationDTO{ID: row.ID, EventType: row.EventType, TargetType: row.TargetType, TargetID: row.TargetID, ReadAt: row.ReadAt, CreatedAt: row.CreatedAt})
	}
	return community.NotificationPageDTO{Items: items, NextCursor: next, UnreadCount: int(unread)}, nil
}

func (s *CommunityNotificationService) MarkRead(ctx context.Context, userID, notificationID uuid.UUID) error {
	if userID == uuid.Nil {
		return community.NewDomainError(community.CodeForbidden, "Account is required")
	}
	now := s.now().UTC()
	result := s.db.WithContext(ctx).Model(&models.CommunityNotification{}).Where("id = ? AND recipient_user_id = ?", notificationID, userID).Updates(map[string]interface{}{"read_at": now})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return community.NewDomainError(community.CodeContentNotFound, "Notification not found")
	}
	return nil
}

func (s *CommunityNotificationService) MarkAllRead(ctx context.Context, userID uuid.UUID) error {
	if userID == uuid.Nil {
		return community.NewDomainError(community.CodeForbidden, "Account is required")
	}
	now := s.now().UTC()
	return s.db.WithContext(ctx).Model(&models.CommunityNotification{}).Where("recipient_user_id = ? AND read_at IS NULL", userID).Updates(map[string]interface{}{"read_at": now}).Error
}

func (s *CommunityNotificationService) UpdatePreferences(ctx context.Context, userID uuid.UUID, input community.NotificationPreferencesInput) error {
	if userID == uuid.Nil {
		return community.NewDomainError(community.CodeForbidden, "Account is required")
	}
	allowed := notificationPreferenceDefaults()
	clean := models.JSONMap{}
	for key, value := range input.EmailPreferences {
		if _, ok := allowed[key]; !ok {
			return community.NewDomainError(community.CodeValidation, "Notification preference is invalid").WithField("email_preferences")
		}
		clean[key] = value
	}
	for key, value := range allowed {
		if _, ok := clean[key]; !ok {
			clean[key] = value
		}
	}
	now := s.now().UTC()
	preference := models.CommunityNotificationPreference{UserID: userID, EmailPreferences: clean, CreatedAt: now, UpdatedAt: now}
	return s.db.WithContext(ctx).Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "user_id"}}, DoUpdates: clause.Assignments(map[string]interface{}{"email_preferences": clean, "updated_at": now})}).Create(&preference).Error
}

func (s *CommunityNotificationService) GetPreferences(ctx context.Context, userID uuid.UUID) (community.NotificationPreferencesDTO, error) {
	if userID == uuid.Nil {
		return community.NotificationPreferencesDTO{}, community.NewDomainError(community.CodeForbidden, "Account is required")
	}
	preferences := notificationPreferenceDefaults()
	var row models.CommunityNotificationPreference
	if err := s.db.WithContext(ctx).First(&row, "user_id = ?", userID).Error; err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return community.NotificationPreferencesDTO{}, err
	}
	for key, value := range row.EmailPreferences {
		if enabled, ok := value.(bool); ok {
			preferences[key] = enabled
		}
	}
	return community.NotificationPreferencesDTO{EmailPreferences: preferences}, nil
}

func notificationPreferenceDefaults() map[string]bool {
	return map[string]bool{
		"answer_created":      true,
		"comment_created":     true,
		"accepted_answer":     true,
		"helpful_vote":        true,
		"official_answer":     true,
		"first_contribution":  true,
		"revision_decision":   true,
		"moderation_decision": true,
	}
}

func (s *CommunityNotificationService) emailEnabledTx(ctx context.Context, tx *gorm.DB, event community.Event) (bool, error) {
	// Enforcement and moderation notices are essential account communications.
	if event.Type == "community.moderation" {
		return true, nil
	}
	key := map[string]string{
		"community.answer.created":  "answer_created",
		"community.comment.created": "comment_created",
		"community.accepted":        "accepted_answer",
		"community.helpful":         "helpful_vote",
		"community.official":        "official_answer",
		"community.approval":        "first_contribution",
		"community.revision":        "revision_decision",
	}[event.Type]
	if key == "" {
		return true, nil
	}
	var row models.CommunityNotificationPreference
	if err := tx.WithContext(ctx).First(&row, "user_id = ?", event.RecipientID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return true, nil
		}
		return false, err
	}
	value, ok := row.EmailPreferences[key]
	enabled, ok := value.(bool)
	if !ok {
		return true, nil
	}
	return enabled, nil
}

func (s *CommunityNotificationService) Purge(ctx context.Context, before time.Time, limit int) (int64, error) {
	if limit <= 0 {
		limit = 1000
	}
	var rows []models.CommunityNotification
	if err := s.db.WithContext(ctx).Select("id").Where("created_at < ?", before).Order("created_at ASC").Limit(limit).Find(&rows).Error; err != nil {
		return 0, err
	}
	if len(rows) == 0 {
		return 0, nil
	}
	ids := make([]uuid.UUID, 0, len(rows))
	for _, row := range rows {
		ids = append(ids, row.ID)
	}
	result := s.db.WithContext(ctx).Where("id IN ?", ids).Delete(&models.CommunityNotification{})
	return result.RowsAffected, result.Error
}

type notificationCursor struct {
	CreatedAt time.Time `json:"created_at"`
	ID        uuid.UUID `json:"id"`
}

func encodeNotificationCursor(cursor notificationCursor) string {
	raw, _ := json.Marshal(cursor)
	return base64.RawURLEncoding.EncodeToString(raw)
}

func decodeNotificationCursor(raw string) (notificationCursor, error) {
	decoded, err := base64.RawURLEncoding.DecodeString(raw)
	if err != nil {
		return notificationCursor{}, community.NewDomainError(community.CodeValidation, "Notification cursor is invalid").WithField("cursor")
	}
	var cursor notificationCursor
	if err := json.Unmarshal(decoded, &cursor); err != nil || cursor.ID == uuid.Nil || cursor.CreatedAt.IsZero() {
		return notificationCursor{}, community.NewDomainError(community.CodeValidation, "Notification cursor is invalid").WithField("cursor")
	}
	return cursor, nil
}
