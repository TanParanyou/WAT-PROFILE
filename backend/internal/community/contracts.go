package community

import (
	"time"

	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
)

type CreateQuestionInput struct {
	CategoryID      uuid.UUID               `json:"category_id"`
	Locale          string                  `json:"locale"`
	Title           string                  `json:"title"`
	Body            models.RichTextDocument `json:"body"`
	ClientRequestID uuid.UUID               `json:"client_request_id"`
}

type UpdateQuestionInput struct {
	Title           string                  `json:"title"`
	Body            models.RichTextDocument `json:"body"`
	ExpectedVersion int                     `json:"expected_version"`
}

type CreateAnswerInput struct {
	Body            models.RichTextDocument `json:"body"`
	ClientRequestID uuid.UUID               `json:"client_request_id"`
}

type UpdateAnswerInput struct {
	Body            models.RichTextDocument `json:"body"`
	ExpectedVersion int                     `json:"expected_version"`
}

type CreateCommentInput struct {
	AnswerID        *uuid.UUID              `json:"answer_id,omitempty"`
	Body            models.RichTextDocument `json:"body"`
	ClientRequestID uuid.UUID               `json:"client_request_id"`
}

type UpdateCommentInput struct {
	Body            models.RichTextDocument `json:"body"`
	ExpectedVersion int                     `json:"expected_version"`
}

type AcceptAnswerInput struct {
	ExpectedVersion int `json:"expected_version"`
}

type CreateReportInput struct {
	QuestionID *uuid.UUID `json:"question_id,omitempty"`
	AnswerID   *uuid.UUID `json:"answer_id,omitempty"`
	CommentID  *uuid.UUID `json:"comment_id,omitempty"`
	Reason     string     `json:"reason"`
	Details    string     `json:"details,omitempty"`
}

type QuestionCursor struct {
	LastActivityAt time.Time `json:"last_activity_at"`
	ID             uuid.UUID `json:"id"`
}

type QuestionListInput struct {
	CategoryID *uuid.UUID
	Locale     string
	Lifecycle  string
	Search     string
	Cursor     string
	Limit      int
}

type AnswerCursor struct {
	HelpfulCount int       `json:"helpful_count"`
	PublishedAt  time.Time `json:"published_at"`
	ID           uuid.UUID `json:"id"`
}

type PublicAuthorDTO struct {
	UserID      uuid.UUID `json:"user_id"`
	DisplayName string    `json:"display_name"`
	AvatarURL   string    `json:"avatar_url,omitempty"`
}

type CategoryDTO struct {
	ID          uuid.UUID            `json:"id"`
	Slug        string               `json:"slug"`
	Name        models.MultiLangText `json:"name"`
	Description models.MultiLangText `json:"description,omitempty"`
	SortOrder   int                  `json:"sort_order"`
}

type QuestionListItemDTO struct {
	ID                   uuid.UUID                       `json:"id"`
	Category             CategoryDTO                     `json:"category"`
	Locale               string                          `json:"locale"`
	Title                string                          `json:"title"`
	Slug                 string                          `json:"slug"`
	LifecycleStatus      models.CommunityLifecycleStatus `json:"lifecycle_status"`
	PublishedAnswerCount int                             `json:"published_answer_count"`
	OfficialAnswerCount  int                             `json:"official_answer_count"`
	LastActivityAt       time.Time                       `json:"last_activity_at"`
	CreatedAt            time.Time                       `json:"created_at"`
	Author               *PublicAuthorDTO                `json:"author,omitempty"`
}

type QuestionListDTO struct {
	Items      []QuestionListItemDTO `json:"items"`
	NextCursor string                `json:"next_cursor,omitempty"`
}

type ViewerStateDTO struct {
	IsAuthenticated bool `json:"is_authenticated"`
	CanEdit         bool `json:"can_edit"`
	CanDelete       bool `json:"can_delete"`
	CanAccept       bool `json:"can_accept"`
	HasVoted        bool `json:"has_voted"`
	IsPendingOwner  bool `json:"is_pending_owner"`
}

type AnswerDTO struct {
	ID                uuid.UUID                         `json:"id"`
	QuestionID        uuid.UUID                         `json:"question_id"`
	Body              models.RichTextDocument           `json:"body"`
	BodyText          string                            `json:"body_text,omitempty"`
	Author            *PublicAuthorDTO                  `json:"author,omitempty"`
	PublicationStatus models.CommunityPublicationStatus `json:"publication_status"`
	IsOfficial        bool                              `json:"is_official"`
	HelpfulCount      int                               `json:"helpful_count"`
	CreatedAt         time.Time                         `json:"created_at"`
	PublishedAt       *time.Time                        `json:"published_at,omitempty"`
	Version           int                               `json:"version"`
}

type CommentDTO struct {
	ID                uuid.UUID                         `json:"id"`
	QuestionID        uuid.UUID                         `json:"question_id"`
	AnswerID          *uuid.UUID                        `json:"answer_id,omitempty"`
	Body              models.RichTextDocument           `json:"body"`
	Author            *PublicAuthorDTO                  `json:"author,omitempty"`
	PublicationStatus models.CommunityPublicationStatus `json:"publication_status"`
	CreatedAt         time.Time                         `json:"created_at"`
	Version           int                               `json:"version"`
}

type QuestionDetailDTO struct {
	Question QuestionListItemDTO     `json:"question"`
	Body     models.RichTextDocument `json:"body"`
	// BodyText is an internal search projection and must never be exposed by the
	// public detail response.
	BodyText         string       `json:"-"`
	Answers          []AnswerDTO  `json:"answers"`
	Comments         []CommentDTO `json:"comments"`
	AcceptedAnswerID *uuid.UUID   `json:"accepted_answer_id,omitempty"`
	Version          int          `json:"version"`
	LastActivityAt   time.Time    `json:"last_activity_at"`
}

type QuestionMutationDTO struct {
	Question          QuestionListItemDTO               `json:"question"`
	Body              models.RichTextDocument           `json:"body"`
	PublicationStatus models.CommunityPublicationStatus `json:"publication_status"`
	LifecycleStatus   models.CommunityLifecycleStatus   `json:"lifecycle_status"`
	Version           int                               `json:"version"`
	ReviewRequired    bool                              `json:"review_required"`
}

type MemberQuestionDTO struct {
	ID                uuid.UUID                         `json:"id"`
	Category          CategoryDTO                       `json:"category"`
	Locale            string                            `json:"locale"`
	Title             string                            `json:"title"`
	Slug              string                            `json:"slug"`
	PublicationStatus models.CommunityPublicationStatus `json:"publication_status"`
	LifecycleStatus   models.CommunityLifecycleStatus   `json:"lifecycle_status"`
	Version           int                               `json:"version"`
	CreatedAt         time.Time                         `json:"created_at"`
	UpdatedAt         time.Time                         `json:"updated_at"`
	PublishedAt       *time.Time                        `json:"published_at,omitempty"`
}

type MemberActivityDTO struct {
	Questions []MemberQuestionDTO `json:"questions"`
}

type NotificationListInput struct {
	UnreadOnly bool
	Limit      int
	Cursor     string
}

type NotificationPreferencesInput struct {
	EmailPreferences map[string]bool `json:"email_preferences"`
}

type NotificationPageDTO struct {
	Items       []NotificationDTO `json:"items"`
	NextCursor  string            `json:"next_cursor,omitempty"`
	UnreadCount int               `json:"unread_count"`
}

type NotificationDTO struct {
	ID         uuid.UUID  `json:"id"`
	EventType  string     `json:"event_type"`
	TargetType string     `json:"target_type"`
	TargetID   *uuid.UUID `json:"target_id,omitempty"`
	ReadAt     *time.Time `json:"read_at,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
}

type Event struct {
	Type          string
	DedupeKey     string
	RecipientID   uuid.UUID
	ActorUserID   *uuid.UUID
	ActorAdminID  *uuid.UUID
	TargetType    string
	TargetID      *uuid.UUID
	EmailRequired bool
}

type HelpfulResultDTO struct {
	AnswerID     uuid.UUID `json:"answer_id"`
	HasVoted     bool      `json:"has_voted"`
	HelpfulCount int       `json:"helpful_count"`
}

type AnswerMutationDTO struct {
	Answer         AnswerDTO `json:"answer"`
	ReviewRequired bool      `json:"review_required"`
}

type CommentMutationDTO struct {
	Comment        CommentDTO `json:"comment"`
	ReviewRequired bool       `json:"review_required"`
}

type AcceptanceResultDTO struct {
	QuestionID       uuid.UUID `json:"question_id"`
	AcceptedAnswerID uuid.UUID `json:"accepted_answer_id"`
	Version          int       `json:"version"`
}
