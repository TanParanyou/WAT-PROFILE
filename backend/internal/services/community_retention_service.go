package services

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/config"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
)

// CommunityRetentionResult is intentionally count-only so maintenance logs
// never contain post content, email addresses, or reporter identity.
type CommunityRetentionResult struct {
	AuthorsAnonymized   int `json:"authors_anonymized"`
	ContentPurged       int `json:"content_purged"`
	TombstonesCreated   int `json:"tombstones_created"`
	NotificationsPurged int `json:"notifications_purged"`
	RateBucketsPurged   int `json:"rate_buckets_purged"`
	AuditRowsPurged     int `json:"audit_rows_purged"`
	CountersReconciled  int `json:"counters_reconciled"`
}

type CommunityRetentionService struct {
	db  *gorm.DB
	cfg config.CommunityConfig
	now func() time.Time
}

func NewCommunityRetentionService(db *gorm.DB, cfg config.CommunityConfig, clocks ...func() time.Time) *CommunityRetentionService {
	now := time.Now
	if len(clocks) > 0 && clocks[0] != nil {
		now = clocks[0]
	}
	return &CommunityRetentionService{db: db, cfg: cfg, now: now}
}

// RunDue performs bounded, repeatable maintenance. All operations are scoped
// to Community tables and use the configured retention windows.
func (s *CommunityRetentionService) RunDue(ctx context.Context, limit int) (CommunityRetentionResult, error) {
	if limit <= 0 {
		limit = 500
	}
	if limit > 5000 {
		limit = 5000
	}
	result := CommunityRetentionResult{}
	now := s.now().UTC()
	authorCutoff := now.Add(-s.cfg.AuthorLinkRetention)
	if s.cfg.AuthorLinkRetention <= 0 {
		authorCutoff = now.Add(-90 * 24 * time.Hour)
	}
	if err := s.anonymizeAuthors(ctx, authorCutoff, limit, &result); err != nil {
		return result, err
	}
	if err := s.tombstoneDeleted(ctx, now.Add(-s.cfg.SoftDeleteRetention), limit, &result); err != nil {
		return result, err
	}
	if err := s.purgeStandaloneDeleted(ctx, now.Add(-s.cfg.SoftDeleteRetention), limit, &result); err != nil {
		return result, err
	}
	notificationCutoff := now.Add(-s.cfg.NotificationRetention)
	if s.cfg.NotificationRetention <= 0 {
		notificationCutoff = now.Add(-180 * 24 * time.Hour)
	}
	if rows, err := s.deleteLimited(ctx, &models.CommunityNotification{}, "created_at < ? AND read_at IS NOT NULL", notificationCutoff, limit); err != nil {
		return result, err
	} else {
		result.NotificationsPurged = rows
	}
	if rows, err := s.deleteLimited(ctx, &models.CommunityRateLimitBucket{}, "expires_at < ?", now, limit); err != nil {
		return result, err
	} else {
		result.RateBucketsPurged = rows
	}
	auditCutoff := now.Add(-s.cfg.ModerationAuditRetention)
	if s.cfg.ModerationAuditRetention <= 0 {
		auditCutoff = now.Add(-730 * 24 * time.Hour)
	}
	if rows, err := s.deleteLimited(ctx, &models.CommunityModerationAction{}, "created_at < ?", auditCutoff, limit); err != nil {
		return result, err
	} else {
		result.AuditRowsPurged = rows
	}
	return result, nil
}

func (s *CommunityRetentionService) purgeStandaloneDeleted(ctx context.Context, cutoff time.Time, limit int, result *CommunityRetentionResult) error {
	var commentIDs []uuid.UUID
	if err := s.db.WithContext(ctx).Model(&models.CommunityComment{}).Where("publication_status = ? AND deleted_at IS NOT NULL AND deleted_at <= ?", models.CommunityPublicationDeleted, cutoff).Order("deleted_at ASC").Limit(limit).Pluck("id", &commentIDs).Error; err != nil {
		return err
	}
	if len(commentIDs) > 0 {
		deleted := s.db.WithContext(ctx).Where("id IN ?", commentIDs).Delete(&models.CommunityComment{})
		if deleted.Error != nil {
			return deleted.Error
		}
		result.ContentPurged += int(deleted.RowsAffected)
	}
	var answerIDs []uuid.UUID
	if err := s.db.WithContext(ctx).Model(&models.CommunityAnswer{}).Where("publication_status = ? AND deleted_at IS NOT NULL AND deleted_at <= ? AND NOT EXISTS (SELECT 1 FROM community_comments c WHERE c.answer_id = community_answers.id) AND NOT EXISTS (SELECT 1 FROM community_questions q WHERE q.accepted_answer_id = community_answers.id)", models.CommunityPublicationDeleted, cutoff).Order("deleted_at ASC").Limit(limit).Pluck("id", &answerIDs).Error; err != nil {
		return err
	}
	if len(answerIDs) > 0 {
		deleted := s.db.WithContext(ctx).Where("id IN ?", answerIDs).Delete(&models.CommunityAnswer{})
		if deleted.Error != nil {
			return deleted.Error
		}
		result.ContentPurged += int(deleted.RowsAffected)
	}
	var questionIDs []uuid.UUID
	if err := s.db.WithContext(ctx).Model(&models.CommunityQuestion{}).Where("publication_status = ? AND deleted_at IS NOT NULL AND deleted_at <= ? AND NOT EXISTS (SELECT 1 FROM community_answers a WHERE a.question_id = community_questions.id) AND NOT EXISTS (SELECT 1 FROM community_comments c WHERE c.question_id = community_questions.id)", models.CommunityPublicationDeleted, cutoff).Order("deleted_at ASC").Limit(limit).Pluck("id", &questionIDs).Error; err != nil {
		return err
	}
	if len(questionIDs) > 0 {
		deleted := s.db.WithContext(ctx).Where("id IN ?", questionIDs).Delete(&models.CommunityQuestion{})
		if deleted.Error != nil {
			return deleted.Error
		}
		result.ContentPurged += int(deleted.RowsAffected)
	}
	return nil
}

func (s *CommunityRetentionService) ReconcileCounts(ctx context.Context, limit int) error {
	_, err := NewCommunityInteractionService(s.db, s.cfg, nil).ReconcileCounters(ctx, limit)
	return err
}

func (s *CommunityRetentionService) anonymizeAuthors(ctx context.Context, cutoff time.Time, limit int, result *CommunityRetentionResult) error {
	for _, table := range []string{"community_questions", "community_answers", "community_comments"} {
		query := "UPDATE " + table + " SET author_user_id = NULL WHERE author_user_id IN (SELECT id FROM users WHERE account_status = ? AND closed_at IS NOT NULL AND closed_at <= ?) AND author_user_id IS NOT NULL AND id IN (SELECT id FROM " + table + " ORDER BY created_at ASC LIMIT ?)"
		rows := s.db.WithContext(ctx).Exec(query, models.AccountStatusClosed, cutoff, limit)
		if rows.Error != nil {
			return rows.Error
		}
		result.AuthorsAnonymized += int(rows.RowsAffected)
	}
	return nil
}

func (s *CommunityRetentionService) tombstoneDeleted(ctx context.Context, cutoff time.Time, limit int, result *CommunityRetentionResult) error {
	tombstone, _ := json.Marshal(map[string]interface{}{"type": "doc", "content": []interface{}{map[string]interface{}{"type": "paragraph", "content": []interface{}{map[string]interface{}{"type": "text", "text": "This content is no longer available."}}}}})
	for _, item := range []struct {
		table string
		body  string
		title bool
	}{
		{table: "community_questions", body: "This question is no longer available.", title: true},
		{table: "community_answers", body: "This answer is no longer available.", title: false},
		{table: "community_comments", body: "This comment is no longer available.", title: false},
	} {
		set := "body = ?, body_text = ?"
		if item.title {
			set += ", title = 'Content removed'"
		}
		query := "UPDATE " + item.table + " SET " + set + " WHERE publication_status = ? AND deleted_at IS NOT NULL AND deleted_at <= ? AND body_text <> ? AND id IN (SELECT id FROM " + item.table + " ORDER BY deleted_at ASC LIMIT ?)"
		rows := s.db.WithContext(ctx).Exec(query, tombstone, item.body, models.CommunityPublicationDeleted, cutoff, item.body, limit)
		if rows.Error != nil {
			return rows.Error
		}
		result.TombstonesCreated += int(rows.RowsAffected)
	}
	return nil
}

func (s *CommunityRetentionService) deleteLimited(ctx context.Context, model interface{}, where string, arg interface{}, limit int) (int, error) {
	if _, ok := model.(*models.CommunityRateLimitBucket); ok {
		var keys []struct {
			SubjectHash     string
			SubjectType     string
			Surface         string
			WindowStartedAt time.Time
		}
		if err := s.db.WithContext(ctx).Table("community_rate_limit_buckets").Where(where, arg).Order("expires_at ASC").Limit(limit).Find(&keys).Error; err != nil {
			return 0, err
		}
		deleted := 0
		for _, key := range keys {
			result := s.db.WithContext(ctx).Where("subject_hash = ? AND subject_type = ? AND surface = ? AND window_started_at = ?", key.SubjectHash, key.SubjectType, key.Surface, key.WindowStartedAt).Delete(model)
			if result.Error != nil {
				return deleted, result.Error
			}
			deleted += int(result.RowsAffected)
		}
		return deleted, nil
	}
	var ids []string
	query := s.db.WithContext(ctx).Model(model).Where(where, arg).Order("created_at ASC").Limit(limit).Pluck("id", &ids)
	if query.Error != nil {
		return 0, query.Error
	}
	if len(ids) == 0 {
		return 0, nil
	}
	deleted := s.db.WithContext(ctx).Where("id IN ?", ids).Delete(model)
	return int(deleted.RowsAffected), deleted.Error
}
