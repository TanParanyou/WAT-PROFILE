package services

import (
	"context"
	"errors"
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

const (
	OutboxPending    = "pending"
	OutboxProcessing = "processing"
	OutboxSucceeded  = "succeeded"
	OutboxFailed     = "failed"
)

type OutboxJobInput struct {
	JobKey        string
	Kind          string
	AggregateType string
	AggregateID   string
	Payload       models.JSONMap
	AvailableAt   time.Time
	MaxAttempts   int
}

type OperationOutboxService struct {
	db  *gorm.DB
	now func() time.Time
}

func NewOperationOutboxService(db *gorm.DB, clocks ...func() time.Time) *OperationOutboxService {
	now := time.Now
	if len(clocks) > 0 && clocks[0] != nil {
		now = clocks[0]
	}
	return &OperationOutboxService{db: db, now: now}
}

// Enqueue is safe to call after a domain transaction commits. Use EnqueueTx
// when the job must commit atomically with the domain mutation.
func (s *OperationOutboxService) Enqueue(input OutboxJobInput) (*models.OperationOutbox, error) {
	return s.EnqueueTx(s.db, input)
}

func (s *OperationOutboxService) EnqueueTx(db *gorm.DB, input OutboxJobInput) (*models.OperationOutbox, error) {
	if db == nil {
		return nil, errors.New("outbox database is not configured")
	}
	input.JobKey = strings.TrimSpace(input.JobKey)
	input.Kind = strings.TrimSpace(input.Kind)
	if input.JobKey == "" || input.Kind == "" {
		return nil, errors.New("outbox job key and kind are required")
	}
	if input.AvailableAt.IsZero() {
		input.AvailableAt = s.now()
	}
	if input.MaxAttempts <= 0 {
		input.MaxAttempts = 8
	}
	if input.Payload == nil {
		input.Payload = models.JSONMap{}
	}
	job := &models.OperationOutbox{
		JobKey: input.JobKey, Kind: input.Kind, AggregateType: input.AggregateType,
		AggregateID: input.AggregateID, Payload: input.Payload, Status: OutboxPending,
		MaxAttempts: input.MaxAttempts, AvailableAt: input.AvailableAt,
	}
	result := db.Clauses(clause.OnConflict{DoNothing: true}).Create(job)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 1 {
		return job, nil
	}
	var existing models.OperationOutbox
	if err := db.Where("job_key = ?", input.JobKey).First(&existing).Error; err != nil {
		return nil, err
	}
	if existing.Status != OutboxSucceeded && existing.Status != OutboxProcessing {
		updates := map[string]interface{}{
			"kind": input.Kind, "aggregate_type": input.AggregateType, "aggregate_id": input.AggregateID,
			"payload": input.Payload, "status": OutboxPending, "available_at": input.AvailableAt,
			"last_error": "", "locked_at": nil, "locked_by": "", "completed_at": nil,
		}
		if err := db.Model(&existing).Updates(updates).Error; err != nil {
			return nil, err
		}
		_ = db.First(&existing, existing.ID).Error
	}
	return &existing, nil
}

func (s *OperationOutboxService) ClaimDue(ctx context.Context, workerID string, limit int) ([]models.OperationOutbox, error) {
	return s.ClaimDueKinds(ctx, workerID, limit)
}

func (s *OperationOutboxService) ClaimDueKinds(ctx context.Context, workerID string, limit int, kinds ...string) ([]models.OperationOutbox, error) {
	if s.db == nil {
		return nil, errors.New("outbox database is not configured")
	}
	if limit <= 0 {
		limit = 10
	}
	now := s.now()
	tx := s.db.WithContext(ctx).Begin()
	if tx.Error != nil {
		return nil, tx.Error
	}
	var jobs []models.OperationOutbox
	query := tx.Clauses(clause.Locking{Strength: "UPDATE", Options: "SKIP LOCKED"}).
		Where("((status IN ? AND available_at <= ?) OR (status = ? AND locked_at < ?)) AND attempts < max_attempts", []string{OutboxPending, OutboxFailed}, now, OutboxProcessing, now.Add(-15*time.Minute)).
		Order("available_at ASC, created_at ASC").Limit(limit)
	if len(kinds) > 0 {
		query = query.Where("kind IN ?", kinds)
	}
	if err := query.Find(&jobs).Error; err != nil {
		tx.Rollback()
		return nil, err
	}
	for i := range jobs {
		if err := tx.Model(&jobs[i]).Updates(map[string]interface{}{
			"status": OutboxProcessing, "attempts": gorm.Expr("attempts + 1"), "locked_at": now, "locked_by": workerID,
		}).Error; err != nil {
			tx.Rollback()
			return nil, err
		}
		jobs[i].Status = OutboxProcessing
		jobs[i].Attempts++
		jobs[i].LockedAt = &now
		jobs[i].LockedBy = workerID
	}
	if err := tx.Commit().Error; err != nil {
		return nil, err
	}
	return jobs, nil
}

func (s *OperationOutboxService) Complete(id uuid.UUID, workerIDs ...string) error {
	now := s.now()
	query := s.db.Model(&models.OperationOutbox{}).Where("id = ? AND status = ?", id, OutboxProcessing)
	if len(workerIDs) > 0 && workerIDs[0] != "" {
		query = query.Where("locked_by = ?", workerIDs[0])
	}
	result := query.Updates(map[string]interface{}{
		"status": OutboxSucceeded, "completed_at": now, "locked_at": nil, "locked_by": "", "last_error": "",
	})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("outbox job is no longer owned by worker")
	}
	return nil
}

func (s *OperationOutboxService) Fail(id uuid.UUID, reason error, workerIDs ...string) error {
	if reason == nil {
		reason = errors.New("outbox job failed")
	}
	var job models.OperationOutbox
	if err := s.db.First(&job, "id = ?", id).Error; err != nil {
		return err
	}
	delay := outboxRetryDelay(job.Attempts)
	next := s.now().Add(delay)
	query := s.db.Model(&job).Where("status = ?", OutboxProcessing)
	if len(workerIDs) > 0 && workerIDs[0] != "" {
		query = query.Where("locked_by = ?", workerIDs[0])
	}
	result := query.Updates(map[string]interface{}{
		"status": OutboxFailed, "available_at": next, "locked_at": nil, "locked_by": "", "last_error": truncateOutboxError(reason.Error()),
	})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("outbox job is no longer owned by worker")
	}
	return nil
}

func (s *OperationOutboxService) RunOnce(ctx context.Context, workerID string, limit int, dispatch func(context.Context, models.OperationOutbox) error) (int, error) {
	return s.RunOnceKinds(ctx, workerID, limit, dispatch)
}

func (s *OperationOutboxService) RunOnceKinds(ctx context.Context, workerID string, limit int, dispatch func(context.Context, models.OperationOutbox) error, kinds ...string) (int, error) {
	jobs, err := s.ClaimDueKinds(ctx, workerID, limit, kinds...)
	if err != nil {
		return 0, err
	}
	for _, job := range jobs {
		if err := dispatch(ctx, job); err != nil {
			if failErr := s.Fail(job.ID, err, workerID); failErr != nil {
				return len(jobs), fmt.Errorf("record outbox failure: %w", failErr)
			}
			continue
		}
		if err := s.Complete(job.ID, workerID); err != nil {
			return len(jobs), err
		}
	}
	return len(jobs), nil
}

func truncateOutboxError(value string) string {
	value = strings.TrimSpace(value)
	if len(value) > 2000 {
		return value[:2000]
	}
	return value
}

func outboxRetryDelay(attempt int) time.Duration {
	delayMinutes := math.Min(60, math.Pow(2, float64(max(attempt-1, 0))))
	return time.Duration(delayMinutes * float64(time.Minute))
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
