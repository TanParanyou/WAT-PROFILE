package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CommunityReportState string

const (
	CommunityReportOpen      CommunityReportState = "open"
	CommunityReportReviewing CommunityReportState = "reviewing"
	CommunityReportResolved  CommunityReportState = "resolved"
	CommunityReportDismissed CommunityReportState = "dismissed"
)

type CommunityReport struct {
	ID              uuid.UUID            `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	ReporterUserID  *uuid.UUID           `gorm:"type:uuid;index" json:"-"`
	QuestionID      *uuid.UUID           `gorm:"type:uuid;index" json:"question_id,omitempty"`
	AnswerID        *uuid.UUID           `gorm:"type:uuid;index" json:"answer_id,omitempty"`
	CommentID       *uuid.UUID           `gorm:"type:uuid;index" json:"comment_id,omitempty"`
	Reason          string               `gorm:"size:32;not null" json:"reason"`
	Details         string               `gorm:"type:text" json:"-"`
	State           CommunityReportState `gorm:"size:16;not null;default:open;index" json:"state"`
	ResolverAdminID *uuid.UUID           `gorm:"type:uuid" json:"-"`
	DecidedAt       *time.Time           `json:"-"`
	CreatedAt       time.Time            `gorm:"index" json:"created_at"`
}

func (r *CommunityReport) BeforeCreate(_ *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}

func (CommunityReport) TableName() string { return "community_reports" }

type CommunityModerationAction struct {
	ID             uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	ActorAdminID   uuid.UUID `gorm:"type:uuid;not null;index" json:"actor_admin_id"`
	Action         string    `gorm:"size:40;not null" json:"action"`
	TargetType     string    `gorm:"size:24;not null" json:"target_type"`
	TargetID       uuid.UUID `gorm:"type:uuid;not null;index" json:"target_id"`
	Reason         string    `gorm:"type:text;not null" json:"reason"`
	PreviousState  JSONMap   `gorm:"type:jsonb;not null;default:'{}'" json:"previous_state"`
	NextState      JSONMap   `gorm:"type:jsonb;not null;default:'{}'" json:"next_state"`
	RequestTraceID string    `gorm:"size:64" json:"request_trace_id,omitempty"`
	CreatedAt      time.Time `gorm:"index" json:"created_at"`
}

func (a *CommunityModerationAction) BeforeCreate(_ *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}

func (CommunityModerationAction) TableName() string { return "community_moderation_actions" }

type CommunityRateLimitBucket struct {
	SubjectHash     string    `gorm:"size:64;primaryKey" json:"-"`
	SubjectType     string    `gorm:"size:16;primaryKey" json:"-"`
	Surface         string    `gorm:"size:16;primaryKey" json:"-"`
	WindowStartedAt time.Time `gorm:"primaryKey" json:"-"`
	Count           int       `gorm:"not null;default:0" json:"-"`
	ExpiresAt       time.Time `gorm:"not null;index" json:"-"`
}

func (CommunityRateLimitBucket) TableName() string { return "community_rate_limit_buckets" }
