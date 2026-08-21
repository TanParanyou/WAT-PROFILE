package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CommunityTrustStatus string

const (
	CommunityTrustNew        CommunityTrustStatus = "new"
	CommunityTrustTrusted    CommunityTrustStatus = "trusted"
	CommunityTrustRestricted CommunityTrustStatus = "restricted"
	CommunityTrustBanned     CommunityTrustStatus = "banned"
)

type CommunityPublicationStatus string

const (
	CommunityPublicationPendingReview CommunityPublicationStatus = "pending_review"
	CommunityPublicationPublished     CommunityPublicationStatus = "published"
	CommunityPublicationHidden        CommunityPublicationStatus = "hidden"
	CommunityPublicationDeleted       CommunityPublicationStatus = "deleted"
)

type CommunityLifecycleStatus string

const (
	CommunityLifecycleOpen     CommunityLifecycleStatus = "open"
	CommunityLifecycleAnswered CommunityLifecycleStatus = "answered"
	CommunityLifecycleResolved CommunityLifecycleStatus = "resolved"
	CommunityLifecycleLocked   CommunityLifecycleStatus = "locked"
	CommunityLifecycleArchived CommunityLifecycleStatus = "archived"
)

type CommunityRevisionReviewStatus string

const (
	CommunityRevisionNotRequired CommunityRevisionReviewStatus = "not_required"
	CommunityRevisionPending     CommunityRevisionReviewStatus = "pending"
	CommunityRevisionApproved    CommunityRevisionReviewStatus = "approved"
	CommunityRevisionRejected    CommunityRevisionReviewStatus = "rejected"
)

type CommunityCategory struct {
	ID               uuid.UUID     `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Slug             string        `gorm:"size:80;not null;uniqueIndex" json:"slug"`
	Name             MultiLangText `gorm:"type:jsonb;not null" json:"name"`
	Description      MultiLangText `gorm:"type:jsonb" json:"description,omitempty"`
	SortOrder        int           `gorm:"not null;default:0" json:"sort_order"`
	IsActive         bool          `gorm:"not null;default:true" json:"is_active"`
	CreatedByAdminID *uuid.UUID    `gorm:"type:uuid" json:"-"`
	UpdatedByAdminID *uuid.UUID    `gorm:"type:uuid" json:"-"`
	CreatedAt        time.Time     `json:"created_at"`
	UpdatedAt        time.Time     `json:"updated_at"`
}

func (c *CommunityCategory) BeforeCreate(_ *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

func (CommunityCategory) TableName() string { return "community_categories" }

type CommunityMemberState struct {
	UserID          uuid.UUID            `gorm:"type:uuid;primaryKey" json:"user_id"`
	TrustStatus     CommunityTrustStatus `gorm:"size:16;not null;default:new" json:"trust_status"`
	FirstApprovedAt *time.Time           `json:"first_approved_at,omitempty"`
	RestrictedUntil *time.Time           `json:"restricted_until,omitempty"`
	Version         int                  `gorm:"not null;default:1" json:"version"`
	CreatedAt       time.Time            `json:"created_at"`
	UpdatedAt       time.Time            `json:"updated_at"`
}

func (CommunityMemberState) TableName() string { return "community_member_states" }

type CommunityQuestion struct {
	ID                   uuid.UUID                  `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	AuthorUserID         *uuid.UUID                 `gorm:"type:uuid;index" json:"author_user_id,omitempty"`
	CategoryID           uuid.UUID                  `gorm:"type:uuid;not null;index" json:"category_id"`
	Locale               string                     `gorm:"size:2;not null;index" json:"locale"`
	Title                string                     `gorm:"size:200;not null" json:"title"`
	Slug                 string                     `gorm:"size:240;not null" json:"slug"`
	Body                 RichTextDocument           `gorm:"type:jsonb;not null" json:"body"`
	BodyText             string                     `gorm:"type:text;not null" json:"body_text"`
	PublicationStatus    CommunityPublicationStatus `gorm:"size:20;not null;default:pending_review;index" json:"publication_status"`
	LifecycleStatus      CommunityLifecycleStatus   `gorm:"size:16;not null;default:open;index" json:"lifecycle_status"`
	AcceptedAnswerID     *uuid.UUID                 `gorm:"type:uuid" json:"accepted_answer_id,omitempty"`
	PublishedAnswerCount int                        `gorm:"not null;default:0" json:"published_answer_count"`
	OfficialAnswerCount  int                        `gorm:"not null;default:0" json:"official_answer_count"`
	Version              int                        `gorm:"not null;default:1" json:"version"`
	ClientRequestID      uuid.UUID                  `gorm:"type:uuid;not null" json:"-"`
	LastActivityAt       time.Time                  `gorm:"not null;index" json:"last_activity_at"`
	PublishedAt          *time.Time                 `json:"published_at,omitempty"`
	HiddenAt             *time.Time                 `json:"hidden_at,omitempty"`
	DeletedAt            *time.Time                 `json:"deleted_at,omitempty"`
	CreatedAt            time.Time                  `json:"created_at"`
	UpdatedAt            time.Time                  `json:"updated_at"`
}

func (q *CommunityQuestion) BeforeCreate(_ *gorm.DB) error {
	if q.ID == uuid.Nil {
		q.ID = uuid.New()
	}
	return nil
}

func (CommunityQuestion) TableName() string { return "community_questions" }

type CommunityAnswer struct {
	ID                uuid.UUID                  `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	QuestionID        uuid.UUID                  `gorm:"type:uuid;not null;index" json:"question_id"`
	AuthorUserID      *uuid.UUID                 `gorm:"type:uuid;index" json:"author_user_id,omitempty"`
	AuthorAdminID     *uuid.UUID                 `gorm:"type:uuid;index" json:"author_admin_id,omitempty"`
	Body              RichTextDocument           `gorm:"type:jsonb;not null" json:"body"`
	BodyText          string                     `gorm:"type:text;not null" json:"body_text"`
	PublicationStatus CommunityPublicationStatus `gorm:"size:20;not null;default:pending_review;index" json:"publication_status"`
	IsOfficial        bool                       `gorm:"not null;default:false;index" json:"is_official"`
	OfficialByAdminID *uuid.UUID                 `gorm:"type:uuid" json:"official_by_admin_id,omitempty"`
	OfficialAt        *time.Time                 `json:"official_at,omitempty"`
	HelpfulCount      int                        `gorm:"not null;default:0" json:"helpful_count"`
	Version           int                        `gorm:"not null;default:1" json:"version"`
	ClientRequestID   uuid.UUID                  `gorm:"type:uuid;not null" json:"-"`
	PublishedAt       *time.Time                 `json:"published_at,omitempty"`
	HiddenAt          *time.Time                 `json:"hidden_at,omitempty"`
	DeletedAt         *time.Time                 `json:"deleted_at,omitempty"`
	CreatedAt         time.Time                  `json:"created_at"`
	UpdatedAt         time.Time                  `json:"updated_at"`
}

func (a *CommunityAnswer) BeforeCreate(_ *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}

func (CommunityAnswer) TableName() string { return "community_answers" }

type CommunityComment struct {
	ID                uuid.UUID                  `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	QuestionID        uuid.UUID                  `gorm:"type:uuid;not null;index" json:"question_id"`
	AnswerID          *uuid.UUID                 `gorm:"type:uuid;index" json:"answer_id,omitempty"`
	AuthorUserID      *uuid.UUID                 `gorm:"type:uuid;index" json:"author_user_id,omitempty"`
	Body              RichTextDocument           `gorm:"type:jsonb;not null" json:"body"`
	BodyText          string                     `gorm:"type:text;not null" json:"body_text"`
	PublicationStatus CommunityPublicationStatus `gorm:"size:20;not null;default:pending_review;index" json:"publication_status"`
	Version           int                        `gorm:"not null;default:1" json:"version"`
	ClientRequestID   uuid.UUID                  `gorm:"type:uuid;not null" json:"-"`
	PublishedAt       *time.Time                 `json:"published_at,omitempty"`
	HiddenAt          *time.Time                 `json:"hidden_at,omitempty"`
	DeletedAt         *time.Time                 `json:"deleted_at,omitempty"`
	CreatedAt         time.Time                  `json:"created_at"`
	UpdatedAt         time.Time                  `json:"updated_at"`
}

func (c *CommunityComment) BeforeCreate(_ *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

func (CommunityComment) TableName() string { return "community_comments" }

type CommunityAnswerVote struct {
	AnswerID  uuid.UUID `gorm:"type:uuid;primaryKey" json:"answer_id"`
	UserID    uuid.UUID `gorm:"type:uuid;primaryKey" json:"user_id"`
	CreatedAt time.Time `json:"created_at"`
}

func (CommunityAnswerVote) TableName() string { return "community_answer_votes" }

type CommunityPostRevision struct {
	ID              uuid.UUID                     `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	QuestionID      *uuid.UUID                    `gorm:"type:uuid;index" json:"question_id,omitempty"`
	AnswerID        *uuid.UUID                    `gorm:"type:uuid;index" json:"answer_id,omitempty"`
	CommentID       *uuid.UUID                    `gorm:"type:uuid;index" json:"comment_id,omitempty"`
	EditorUserID    *uuid.UUID                    `gorm:"type:uuid" json:"editor_user_id,omitempty"`
	EditorAdminID   *uuid.UUID                    `gorm:"type:uuid" json:"editor_admin_id,omitempty"`
	TitleBefore     *string                       `gorm:"size:200" json:"title_before,omitempty"`
	TitleAfter      *string                       `gorm:"size:200" json:"title_after,omitempty"`
	BodyBefore      RichTextDocument              `gorm:"type:jsonb;not null" json:"body_before"`
	BodyAfter       RichTextDocument              `gorm:"type:jsonb;not null" json:"body_after"`
	ReviewStatus    CommunityRevisionReviewStatus `gorm:"size:16;not null;default:not_required" json:"review_status"`
	ReviewerAdminID *uuid.UUID                    `gorm:"type:uuid" json:"reviewer_admin_id,omitempty"`
	DecisionAt      *time.Time                    `json:"decision_at,omitempty"`
	CreatedAt       time.Time                     `json:"created_at"`
}

func (r *CommunityPostRevision) BeforeCreate(_ *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	if len(r.BodyBefore) == 0 {
		r.BodyBefore = RichTextDocument(`{"type":"doc","content":[]}`)
	}
	if len(r.BodyAfter) == 0 {
		r.BodyAfter = RichTextDocument(`{"type":"doc","content":[]}`)
	}
	return nil
}

func (CommunityPostRevision) TableName() string { return "community_post_revisions" }
