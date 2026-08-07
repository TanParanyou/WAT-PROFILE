package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// OperationOutbox is a durable, idempotent background operation. Payloads are
// intentionally hidden from JSON responses because they may contain private
// object keys or actor identifiers.
type OperationOutbox struct {
	ID            uuid.UUID  `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	JobKey        string     `gorm:"size:255;uniqueIndex;not null" json:"-"`
	Kind          string     `gorm:"size:80;not null;index" json:"kind"`
	AggregateType string     `gorm:"size:80;not null" json:"aggregate_type"`
	AggregateID   string     `gorm:"size:120;not null" json:"aggregate_id"`
	Payload       JSONMap    `gorm:"type:jsonb;not null;default:'{}'" json:"-"`
	Status        string     `gorm:"size:20;not null;index" json:"status"`
	Attempts      int        `gorm:"not null;default:0" json:"attempts"`
	MaxAttempts   int        `gorm:"not null;default:8" json:"max_attempts"`
	AvailableAt   time.Time  `gorm:"not null;index" json:"available_at"`
	LockedAt      *time.Time `json:"locked_at,omitempty"`
	LockedBy      string     `gorm:"size:120" json:"-"`
	LastError     string     `gorm:"type:text" json:"-"`
	CompletedAt   *time.Time `json:"completed_at,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

func (o *OperationOutbox) BeforeCreate(_ *gorm.DB) error {
	if o.ID == uuid.Nil {
		o.ID = uuid.New()
	}
	if o.Status == "" {
		o.Status = "pending"
	}
	if o.MaxAttempts <= 0 {
		o.MaxAttempts = 8
	}
	if o.AvailableAt.IsZero() {
		o.AvailableAt = time.Now()
	}
	return nil
}

func (o *OperationOutbox) TableName() string { return "operation_outbox" }
