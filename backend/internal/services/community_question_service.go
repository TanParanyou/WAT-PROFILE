package services

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"
	"unicode"

	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/community"
	"github.com/watloungporsai/wat-profile-backend/internal/config"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// CommunityEventSink is the transaction boundary used by later notification
// and moderation work. Keeping it injectable prevents the question service from
// coupling itself to a particular queue implementation.
type CommunityEventSink interface {
	RecordTx(context.Context, *gorm.DB, community.Event) error
}

type CommunityQuestionService struct {
	db      *gorm.DB
	cfg     config.CommunityConfig
	limiter *CommunityRateLimitService
	events  CommunityEventSink
	now     func() time.Time
}

func NewCommunityQuestionService(db *gorm.DB, cfg config.CommunityConfig, events CommunityEventSink) *CommunityQuestionService {
	if cfg.QuestionLimit.Limit <= 0 || cfg.QuestionLimit.Window <= 0 {
		cfg.QuestionLimit = config.RateLimit{Limit: 5, Window: time.Hour}
	}
	if cfg.QuestionDailyLimit.Limit <= 0 || cfg.QuestionDailyLimit.Window <= 0 {
		cfg.QuestionDailyLimit = config.RateLimit{Limit: 20, Window: 24 * time.Hour}
	}
	return &CommunityQuestionService{
		db: db, cfg: cfg, limiter: NewCommunityRateLimitService(db), events: events, now: time.Now,
	}
}

func (s *CommunityQuestionService) CreateQuestion(ctx context.Context, actor uuid.UUID, clientIP string, input community.CreateQuestionInput) (community.QuestionMutationDTO, error) {
	if actor == uuid.Nil {
		return community.QuestionMutationDTO{}, community.NewDomainError(community.CodeAccountNotEligible, "Community participation is not available for this account")
	}
	if input.ClientRequestID == uuid.Nil {
		return community.QuestionMutationDTO{}, community.NewDomainError(community.CodeValidation, "A valid idempotency key is required").WithField("client_request_id")
	}
	title, body, err := validateQuestionInput(input)
	if err != nil {
		return community.QuestionMutationDTO{}, err
	}
	var question models.CommunityQuestion
	err = s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var user models.User
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&user, "id = ?", actor).Error; err != nil {
			return err
		}
		if !user.IsActive || user.AccountStatus != models.AccountStatusActive || !user.EmailVerified {
			return community.NewDomainError(community.CodeAccountNotEligible, "Verify your email before participating in Community")
		}

		var category models.CommunityCategory
		if err := tx.Where("id = ? AND is_active = TRUE", input.CategoryID).First(&category).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return community.NewDomainError(community.CodeValidation, "Category is not available").WithField("category_id")
			}
			return err
		}

		state, err := s.lockMemberState(ctx, tx, actor)
		if err != nil {
			return err
		}
		if state.RestrictedUntil != nil && state.RestrictedUntil.After(s.now()) {
			state.TrustStatus = models.CommunityTrustRestricted
		}
		publication, err := community.DeterminePublication(state.TrustStatus, state.RestrictedUntil != nil && state.RestrictedUntil.After(s.now()))
		if err != nil {
			return err
		}

		var existing models.CommunityQuestion
		if err := tx.Where("author_user_id = ? AND client_request_id = ?", actor, input.ClientRequestID).First(&existing).Error; err == nil {
			if existing.CategoryID != input.CategoryID || existing.Locale != input.Locale || existing.Title != title || string(existing.Body) != string(input.Body) {
				return community.NewDomainError(community.CodeIdempotencyConflict, "The idempotency key was already used for a different question")
			}
			question = existing
			return nil
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}
		if err := s.limiter.ConsumeTx(ctx, tx, RateLimitRequest{SubjectType: "account", Subject: actor.String(), Surface: "question", Limit: s.cfg.QuestionLimit.Limit, Window: s.cfg.QuestionLimit.Window}); err != nil {
			return err
		}
		var dailyCount int64
		if err := tx.Model(&models.CommunityQuestion{}).Where("author_user_id = ? AND created_at >= ? AND publication_status <> ?", actor, s.now().Add(-s.cfg.QuestionDailyLimit.Window), models.CommunityPublicationDeleted).Count(&dailyCount).Error; err != nil {
			return err
		}
		if int(dailyCount) >= s.cfg.QuestionDailyLimit.Limit {
			return community.NewDomainError(community.CodeRateLimited, "Too many Community questions").WithRetryAfter(s.cfg.QuestionDailyLimit.Window)
		}
		if strings.TrimSpace(clientIP) != "" {
			if err := s.limiter.ConsumeTx(ctx, tx, RateLimitRequest{SubjectType: "ip", Subject: clientIP, Surface: "question", Limit: s.cfg.QuestionLimit.Limit * 2, Window: s.cfg.QuestionLimit.Window}); err != nil {
				return err
			}
		}

		id := uuid.New()
		question = models.CommunityQuestion{
			ID: id, AuthorUserID: &actor, CategoryID: category.ID, Locale: input.Locale,
			Title: title, Slug: questionSlug(title, id), Body: input.Body, BodyText: body,
			PublicationStatus: publication, LifecycleStatus: models.CommunityLifecycleOpen,
			Version: 1, ClientRequestID: input.ClientRequestID, LastActivityAt: s.now().UTC(),
		}
		if publication == models.CommunityPublicationPublished {
			publishedAt := s.now().UTC()
			question.PublishedAt = &publishedAt
		}
		if err := tx.Create(&question).Error; err != nil {
			return err
		}
		if err := s.recordRevision(ctx, tx, question, title, input.Body, publication == models.CommunityPublicationPublished); err != nil {
			return err
		}
		if s.events != nil {
			if err := s.events.RecordTx(ctx, tx, community.Event{Type: "community.question.created", DedupeKey: question.ID.String(), ActorUserID: &actor, TargetType: "question", TargetID: &question.ID}); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return community.QuestionMutationDTO{}, err
	}
	return s.mutationDTO(ctx, question, publicationRequiresReview(question.PublicationStatus))
}

func (s *CommunityQuestionService) UpdateQuestion(ctx context.Context, actor, questionID uuid.UUID, input community.UpdateQuestionInput) (community.QuestionMutationDTO, error) {
	title, body, err := validateQuestionContent(input.Title, input.Body)
	if err != nil {
		return community.QuestionMutationDTO{}, err
	}
	var question models.CommunityQuestion
	reviewRequired := false
	err = s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&question, "id = ?", questionID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return community.NewDomainError(community.CodeContentNotFound, "Question not found")
			}
			return err
		}
		if question.AuthorUserID == nil {
			return community.NewDomainError(community.CodeForbidden, "This question no longer has an editable owner")
		}
		significant := question.AcceptedAnswerID != nil || question.OfficialAnswerCount > 0
		if err := community.CanEdit(actor, *question.AuthorUserID, question.LifecycleStatus, question.PublicationStatus, significant, input.ExpectedVersion, question.Version); err != nil {
			var domainErr *community.DomainError
			if errors.As(err, &domainErr) && domainErr.Code == community.CodeReviewRequired && significant {
				// A significant edit is retained as a pending revision while the
				// last approved/public version remains visible.
				reviewRequired = true
			} else {
				return err
			}
		}
		if reviewRequired {
			return s.recordPendingRevision(ctx, tx, question, title, input.Body)
		}
		oldTitle, oldBody := question.Title, question.Body
		question.Title, question.Body, question.BodyText = title, input.Body, body
		question.Slug = questionSlug(title, question.ID)
		question.Version++
		question.LastActivityAt, question.UpdatedAt = s.now().UTC(), s.now().UTC()
		if err := tx.Save(&question).Error; err != nil {
			return err
		}
		return s.recordRevisionSnapshot(ctx, tx, question, oldTitle, oldBody, title, input.Body, models.CommunityRevisionNotRequired)
	})
	if err != nil {
		return community.QuestionMutationDTO{}, err
	}
	return s.mutationDTO(ctx, question, reviewRequired)
}

func (s *CommunityQuestionService) RequestQuestionDeletion(ctx context.Context, actor, questionID uuid.UUID, expectedVersion int) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var question models.CommunityQuestion
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&question, "id = ?", questionID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return community.NewDomainError(community.CodeContentNotFound, "Question not found")
			}
			return err
		}
		if question.AuthorUserID == nil {
			return community.NewDomainError(community.CodeForbidden, "This question no longer has an editable owner")
		}
		if err := community.CanDeleteQuestion(actor, *question.AuthorUserID, question.LifecycleStatus, question.PublishedAnswerCount); err != nil {
			return err
		}
		if expectedVersion <= 0 || expectedVersion != question.Version {
			return community.NewDomainError(community.CodeEditConflict, "This question changed; refresh and try again").WithVersion(question.Version)
		}
		now := s.now().UTC()
		question.PublicationStatus, question.DeletedAt = models.CommunityPublicationDeleted, &now
		question.Version++
		question.UpdatedAt, question.LastActivityAt = now, now
		return tx.Save(&question).Error
	})
}

func (s *CommunityQuestionService) ListMyActivity(ctx context.Context, actor uuid.UUID) (community.MemberActivityDTO, error) {
	var rows []models.CommunityQuestion
	if err := s.db.WithContext(ctx).Where("author_user_id = ?", actor).Order("updated_at DESC, id DESC").Limit(100).Find(&rows).Error; err != nil {
		return community.MemberActivityDTO{}, err
	}
	result := community.MemberActivityDTO{Questions: make([]community.MemberQuestionDTO, 0, len(rows))}
	for _, question := range rows {
		var category models.CommunityCategory
		if err := s.db.WithContext(ctx).Where("id = ?", question.CategoryID).First(&category).Error; err != nil {
			return community.MemberActivityDTO{}, err
		}
		result.Questions = append(result.Questions, community.MemberQuestionDTO{
			ID: question.ID, Category: community.CategoryDTO{ID: category.ID, Slug: category.Slug, Name: category.Name, Description: category.Description, SortOrder: category.SortOrder},
			Locale: question.Locale, Title: question.Title, Slug: question.Slug, PublicationStatus: question.PublicationStatus,
			LifecycleStatus: question.LifecycleStatus, Version: question.Version, CreatedAt: question.CreatedAt, UpdatedAt: question.UpdatedAt, PublishedAt: question.PublishedAt,
		})
	}
	return result, nil
}

func (s *CommunityQuestionService) GetOwnedQuestion(ctx context.Context, actor, questionID uuid.UUID) (community.QuestionMutationDTO, error) {
	var question models.CommunityQuestion
	if err := s.db.WithContext(ctx).Where("id = ? AND author_user_id = ?", questionID, actor).First(&question).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return community.QuestionMutationDTO{}, community.NewDomainError(community.CodeContentNotFound, "Question not found")
		}
		return community.QuestionMutationDTO{}, err
	}
	return s.mutationDTO(ctx, question, false)
}

func (s *CommunityQuestionService) ViewerState(ctx context.Context, actor, questionID uuid.UUID) (community.ViewerStateDTO, error) {
	var question models.CommunityQuestion
	if err := s.db.WithContext(ctx).First(&question, "id = ?", questionID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return community.ViewerStateDTO{}, community.NewDomainError(community.CodeContentNotFound, "Question not found")
		}
		return community.ViewerStateDTO{}, err
	}
	state := community.ViewerStateDTO{IsAuthenticated: true}
	if question.AuthorUserID == nil || *question.AuthorUserID != actor {
		return state, nil
	}
	state.CanEdit = question.PublicationStatus != models.CommunityPublicationDeleted && question.PublicationStatus != models.CommunityPublicationHidden && question.LifecycleStatus != models.CommunityLifecycleLocked && question.LifecycleStatus != models.CommunityLifecycleArchived
	state.CanDelete = state.CanEdit && question.PublishedAnswerCount == 0
	state.CanAccept = state.CanEdit && question.PublicationStatus == models.CommunityPublicationPublished && question.PublishedAnswerCount > 0
	state.IsPendingOwner = question.PublicationStatus == models.CommunityPublicationPendingReview
	return state, nil
}

func (s *CommunityQuestionService) lockMemberState(ctx context.Context, tx *gorm.DB, userID uuid.UUID) (models.CommunityMemberState, error) {
	seed := models.CommunityMemberState{UserID: userID, TrustStatus: models.CommunityTrustNew, Version: 1}
	if err := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&seed).Error; err != nil {
		return models.CommunityMemberState{}, err
	}
	var state models.CommunityMemberState
	if err := tx.WithContext(ctx).Clauses(clause.Locking{Strength: "UPDATE"}).First(&state, "user_id = ?", userID).Error; err != nil {
		return models.CommunityMemberState{}, err
	}
	return state, nil
}

func (s *CommunityQuestionService) recordRevision(ctx context.Context, tx *gorm.DB, question models.CommunityQuestion, title string, body models.RichTextDocument, published bool) error {
	status := models.CommunityRevisionPending
	if published {
		status = models.CommunityRevisionNotRequired
	}
	return s.recordRevisionSnapshot(ctx, tx, question, "", nil, title, body, status)
}

func (s *CommunityQuestionService) recordPendingRevision(ctx context.Context, tx *gorm.DB, question models.CommunityQuestion, title string, body models.RichTextDocument) error {
	return s.recordRevisionSnapshot(ctx, tx, question, question.Title, question.Body, title, body, models.CommunityRevisionPending)
}

func (s *CommunityQuestionService) recordRevisionSnapshot(_ context.Context, tx *gorm.DB, question models.CommunityQuestion, oldTitle string, oldBody models.RichTextDocument, newTitle string, newBody models.RichTextDocument, status models.CommunityRevisionReviewStatus) error {
	var oldTitlePtr *string
	if oldTitle != "" {
		oldTitlePtr = &oldTitle
	}
	return tx.Create(&models.CommunityPostRevision{
		QuestionID: &question.ID, EditorUserID: question.AuthorUserID, TitleBefore: oldTitlePtr, TitleAfter: &newTitle,
		BodyBefore: oldBody, BodyAfter: newBody, ReviewStatus: status,
	}).Error
}

func (s *CommunityQuestionService) mutationDTO(ctx context.Context, question models.CommunityQuestion, reviewRequired bool) (community.QuestionMutationDTO, error) {
	var category models.CommunityCategory
	if err := s.db.WithContext(ctx).Where("id = ?", question.CategoryID).First(&category).Error; err != nil {
		return community.QuestionMutationDTO{}, err
	}
	author := s.publicAuthor(ctx, question.AuthorUserID)
	return community.QuestionMutationDTO{
		Question: community.QuestionListItemDTO{ID: question.ID, Category: community.CategoryDTO{ID: category.ID, Slug: category.Slug, Name: category.Name, Description: category.Description, SortOrder: category.SortOrder}, Locale: question.Locale, Title: question.Title, Slug: question.Slug, LifecycleStatus: question.LifecycleStatus, PublishedAnswerCount: question.PublishedAnswerCount, OfficialAnswerCount: question.OfficialAnswerCount, LastActivityAt: question.LastActivityAt, CreatedAt: question.CreatedAt, Author: author},
		Body:     question.Body, PublicationStatus: question.PublicationStatus, LifecycleStatus: question.LifecycleStatus, Version: question.Version, ReviewRequired: reviewRequired,
	}, nil
}

func (s *CommunityQuestionService) publicAuthor(ctx context.Context, userID *uuid.UUID) *community.PublicAuthorDTO {
	if userID == nil {
		return nil
	}
	var row struct {
		ID          uuid.UUID
		DisplayName string
		AvatarURL   string
	}
	if err := s.db.WithContext(ctx).Table("users AS u").Select("u.id, COALESCE(ap.display_name, u.name) AS display_name, COALESCE(ap.avatar_url, u.avatar_url, '') AS avatar_url").Joins("LEFT JOIN account_profiles AS ap ON ap.user_id = u.id").Where("u.id = ?", *userID).Scan(&row).Error; err != nil || row.ID == uuid.Nil {
		return &community.PublicAuthorDTO{UserID: *userID, DisplayName: "Former member"}
	}
	return &community.PublicAuthorDTO{UserID: row.ID, DisplayName: row.DisplayName, AvatarURL: row.AvatarURL}
}

func validateQuestionInput(input community.CreateQuestionInput) (string, string, error) {
	if input.CategoryID == uuid.Nil {
		return "", "", community.NewDomainError(community.CodeValidation, "Category is required").WithField("category_id")
	}
	if input.Locale != "th" && input.Locale != "en" && input.Locale != "de" {
		return "", "", community.NewDomainError(community.CodeValidation, "Locale must be th, en, or de").WithField("locale")
	}
	return validateQuestionContent(input.Title, input.Body)
}

func validateQuestionContent(rawTitle string, rawBody models.RichTextDocument) (string, string, error) {
	title := strings.TrimSpace(rawTitle)
	if n := len([]rune(title)); n < 10 || n > 200 {
		return "", "", community.NewDomainError(community.CodeValidation, "Question title must be between 10 and 200 characters").WithField("title")
	}
	body, err := community.ValidateRichText(rawBody, community.RichTextLimits{MinText: 20, MaxText: 20000})
	if err != nil {
		return "", "", community.NewDomainError(community.CodeValidation, err.Error()).WithField("body")
	}
	return title, body, nil
}

func questionSlug(title string, id uuid.UUID) string {
	var builder strings.Builder
	lastDash := false
	for _, r := range strings.ToLower(title) {
		if unicode.IsLetter(r) || unicode.IsNumber(r) {
			builder.WriteRune(r)
			lastDash = false
		} else if builder.Len() > 0 && !lastDash {
			builder.WriteByte('-')
			lastDash = true
		}
	}
	base := strings.Trim(builder.String(), "-")
	if base == "" {
		base = "question"
	}
	return fmt.Sprintf("%s-%s", base, id.String()[:8])
}

func publicationRequiresReview(status models.CommunityPublicationStatus) bool {
	return status == models.CommunityPublicationPendingReview
}
