package services

import (
	"context"
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

type CommunityInteractionService struct {
	db      *gorm.DB
	cfg     config.CommunityConfig
	limiter *CommunityRateLimitService
	events  CommunityEventSink
	now     func() time.Time
}

func NewCommunityInteractionService(db *gorm.DB, cfg config.CommunityConfig, events CommunityEventSink) *CommunityInteractionService {
	if cfg.AnswerLimit.Limit <= 0 || cfg.AnswerLimit.Window <= 0 {
		cfg.AnswerLimit = config.RateLimit{Limit: 20, Window: time.Hour}
	}
	if cfg.CommentLimit.Limit <= 0 || cfg.CommentLimit.Window <= 0 {
		cfg.CommentLimit = config.RateLimit{Limit: 30, Window: time.Hour}
	}
	if cfg.VoteLimit.Limit <= 0 || cfg.VoteLimit.Window <= 0 {
		cfg.VoteLimit = config.RateLimit{Limit: 120, Window: time.Hour}
	}
	return &CommunityInteractionService{db: db, cfg: cfg, limiter: NewCommunityRateLimitService(db), events: events, now: time.Now}
}

func (s *CommunityInteractionService) CreateAnswer(ctx context.Context, actor uuid.UUID, clientIP string, questionID uuid.UUID, input community.CreateAnswerInput) (community.AnswerMutationDTO, error) {
	if actor == uuid.Nil || input.ClientRequestID == uuid.Nil {
		return community.AnswerMutationDTO{}, community.NewDomainError(community.CodeValidation, "A valid idempotency key is required")
	}
	bodyText, err := validateInteractionBody(input.Body, 5, 20000)
	if err != nil {
		return community.AnswerMutationDTO{}, err
	}
	var answer models.CommunityAnswer
	err = s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := s.requireVerifiedActor(ctx, tx, actor); err != nil {
			return err
		}
		var question models.CommunityQuestion
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&question, "id = ?", questionID).Error; err != nil {
			return interactionNotFound(err)
		}
		if err := ensureQuestionAcceptsContribution(question); err != nil {
			return err
		}
		publication, err := s.memberPublication(ctx, tx, actor)
		if err != nil {
			return err
		}
		var existing models.CommunityAnswer
		if err := tx.Where("question_id = ? AND author_user_id = ? AND client_request_id = ?", questionID, actor, input.ClientRequestID).First(&existing).Error; err == nil {
			if string(existing.Body) != string(input.Body) {
				return community.NewDomainError(community.CodeIdempotencyConflict, "The idempotency key was already used for a different answer")
			}
			answer = existing
			return nil
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}
		if err := s.consumeInteractionLimits(ctx, tx, actor, clientIP, "answer", s.cfg.AnswerLimit); err != nil {
			return err
		}
		answer = models.CommunityAnswer{ID: uuid.New(), QuestionID: questionID, AuthorUserID: &actor, Body: input.Body, BodyText: bodyText, PublicationStatus: publication, ClientRequestID: input.ClientRequestID, Version: 1}
		if publication == models.CommunityPublicationPublished {
			now := s.now().UTC()
			answer.PublishedAt = &now
			question.PublishedAnswerCount++
			question.LastActivityAt, question.UpdatedAt = now, now
			question.Version++
			communityUpdateLifecycle(&question)
			if err := tx.Save(&question).Error; err != nil {
				return err
			}
		}
		if err := tx.Create(&answer).Error; err != nil {
			return err
		}
		if err := recordInteractionRevision(tx, nil, &answer.ID, nil, &actor, nil, nil, nil, input.Body, models.CommunityRevisionNotRequired); err != nil {
			return err
		}
		if s.events != nil && question.AuthorUserID != nil {
			if err := s.events.RecordTx(ctx, tx, community.Event{Type: "community.answer.created", DedupeKey: "answer:" + answer.ID.String(), RecipientID: *question.AuthorUserID, ActorUserID: &actor, TargetType: "question", TargetID: &question.ID, EmailRequired: true}); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return community.AnswerMutationDTO{}, err
	}
	return s.answerMutation(ctx, answer, publicationRequiresReview(answer.PublicationStatus))
}

func (s *CommunityInteractionService) UpdateAnswer(ctx context.Context, actor, answerID uuid.UUID, input community.UpdateAnswerInput) (community.AnswerMutationDTO, error) {
	bodyText, err := validateInteractionBody(input.Body, 5, 20000)
	if err != nil {
		return community.AnswerMutationDTO{}, err
	}
	var answer models.CommunityAnswer
	reviewRequired := false
	err = s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&answer, "id = ?").Error; err != nil {
			return interactionNotFound(err)
		}
		var question models.CommunityQuestion
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&question, "id = ?", answer.QuestionID).Error; err != nil {
			return interactionNotFound(err)
		}
		if answer.AuthorUserID == nil {
			return community.NewDomainError(community.CodeForbidden, "This answer cannot be edited by a public account")
		}
		significant := answer.IsOfficial || (question.AcceptedAnswerID != nil && *question.AcceptedAnswerID == answer.ID)
		if err := community.CanEdit(actor, *answer.AuthorUserID, question.LifecycleStatus, answer.PublicationStatus, significant, input.ExpectedVersion, answer.Version); err != nil {
			var domainErr *community.DomainError
			if errors.As(err, &domainErr) && domainErr.Code == community.CodeReviewRequired && significant {
				reviewRequired = true
			} else {
				return err
			}
		}
		if reviewRequired {
			return recordInteractionRevision(tx, nil, &answer.ID, nil, &actor, nil, nil, &answer.Body, input.Body, models.CommunityRevisionPending)
		}
		oldBody := answer.Body
		answer.Body, answer.BodyText = input.Body, bodyText
		answer.Version++
		answer.UpdatedAt = s.now().UTC()
		if err := tx.Save(&answer).Error; err != nil {
			return err
		}
		if answer.PublicationStatus == models.CommunityPublicationPublished {
			question.LastActivityAt, question.UpdatedAt = s.now().UTC(), s.now().UTC()
			question.Version++
			if err := tx.Save(&question).Error; err != nil {
				return err
			}
		}
		return recordInteractionRevision(tx, nil, &answer.ID, nil, &actor, nil, nil, &oldBody, input.Body, models.CommunityRevisionNotRequired)
	})
	if err != nil {
		return community.AnswerMutationDTO{}, err
	}
	return s.answerMutation(ctx, answer, reviewRequired)
}

func (s *CommunityInteractionService) CreateComment(ctx context.Context, actor uuid.UUID, clientIP string, questionID uuid.UUID, input community.CreateCommentInput) (community.CommentMutationDTO, error) {
	if actor == uuid.Nil || input.ClientRequestID == uuid.Nil {
		return community.CommentMutationDTO{}, community.NewDomainError(community.CodeValidation, "A valid idempotency key is required")
	}
	bodyText, err := validateInteractionBody(input.Body, 2, 2000)
	if err != nil {
		return community.CommentMutationDTO{}, err
	}
	var comment models.CommunityComment
	err = s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := s.requireVerifiedActor(ctx, tx, actor); err != nil {
			return err
		}
		var question models.CommunityQuestion
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&question, "id = ?", questionID).Error; err != nil {
			return interactionNotFound(err)
		}
		if err := ensureQuestionAcceptsContribution(question); err != nil {
			return err
		}
		if input.AnswerID != nil {
			var answer models.CommunityAnswer
			if err := tx.Where("id = ? AND question_id = ?", *input.AnswerID, questionID).First(&answer).Error; err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					return community.NewDomainError(community.CodeContentNotFound, "Answer not found")
				}
				return err
			}
			if answer.PublicationStatus != models.CommunityPublicationPublished {
				return community.NewDomainError(community.CodeContentPending, "Only published answers can receive comments")
			}
		}
		publication, err := s.memberPublication(ctx, tx, actor)
		if err != nil {
			return err
		}
		var existing models.CommunityComment
		if err := tx.Where("question_id = ? AND author_user_id = ? AND client_request_id = ?", questionID, actor, input.ClientRequestID).First(&existing).Error; err == nil {
			if string(existing.Body) != string(input.Body) {
				return community.NewDomainError(community.CodeIdempotencyConflict, "The idempotency key was already used for a different comment")
			}
			comment = existing
			return nil
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}
		if err := s.consumeInteractionLimits(ctx, tx, actor, clientIP, "comment", s.cfg.CommentLimit); err != nil {
			return err
		}
		comment = models.CommunityComment{ID: uuid.New(), QuestionID: questionID, AnswerID: input.AnswerID, AuthorUserID: &actor, Body: input.Body, BodyText: bodyText, PublicationStatus: publication, ClientRequestID: input.ClientRequestID, Version: 1}
		if publication == models.CommunityPublicationPublished {
			now := s.now().UTC()
			comment.PublishedAt = &now
			question.LastActivityAt, question.UpdatedAt = now, now
			question.Version++
			if err := tx.Save(&question).Error; err != nil {
				return err
			}
		}
		if err := tx.Create(&comment).Error; err != nil {
			return err
		}
		if err := recordInteractionRevision(tx, nil, nil, &comment.ID, &actor, nil, nil, nil, input.Body, models.CommunityRevisionNotRequired); err != nil {
			return err
		}
		if s.events != nil && question.AuthorUserID != nil {
			if err := s.events.RecordTx(ctx, tx, community.Event{Type: "community.comment.created", DedupeKey: "comment:" + comment.ID.String(), RecipientID: *question.AuthorUserID, ActorUserID: &actor, TargetType: "question", TargetID: &question.ID, EmailRequired: true}); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return community.CommentMutationDTO{}, err
	}
	return s.commentMutation(ctx, comment, publicationRequiresReview(comment.PublicationStatus))
}

func (s *CommunityInteractionService) UpdateComment(ctx context.Context, actor, commentID uuid.UUID, input community.UpdateCommentInput) (community.CommentMutationDTO, error) {
	bodyText, err := validateInteractionBody(input.Body, 2, 2000)
	if err != nil {
		return community.CommentMutationDTO{}, err
	}
	var comment models.CommunityComment
	err = s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&comment, "id = ?", commentID).Error; err != nil {
			return interactionNotFound(err)
		}
		var question models.CommunityQuestion
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&question, "id = ?", comment.QuestionID).Error; err != nil {
			return interactionNotFound(err)
		}
		if comment.AuthorUserID == nil {
			return community.NewDomainError(community.CodeForbidden, "This comment cannot be edited by a public account")
		}
		if err := community.CanEdit(actor, *comment.AuthorUserID, question.LifecycleStatus, comment.PublicationStatus, false, input.ExpectedVersion, comment.Version); err != nil {
			return err
		}
		oldBody := comment.Body
		comment.Body, comment.BodyText = input.Body, bodyText
		comment.Version++
		comment.UpdatedAt = s.now().UTC()
		if err := tx.Save(&comment).Error; err != nil {
			return err
		}
		if comment.PublicationStatus == models.CommunityPublicationPublished {
			question.LastActivityAt, question.UpdatedAt = s.now().UTC(), s.now().UTC()
			question.Version++
			if err := tx.Save(&question).Error; err != nil {
				return err
			}
		}
		return recordInteractionRevision(tx, nil, nil, &comment.ID, &actor, nil, nil, &oldBody, input.Body, models.CommunityRevisionNotRequired)
	})
	if err != nil {
		return community.CommentMutationDTO{}, err
	}
	return s.commentMutation(ctx, comment, false)
}

func (s *CommunityInteractionService) AcceptAnswer(ctx context.Context, actor, answerID uuid.UUID, input community.AcceptAnswerInput) (community.AcceptanceResultDTO, error) {
	var result community.AcceptanceResultDTO
	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var answer models.CommunityAnswer
		if err := tx.Where("id = ?", answerID).First(&answer).Error; err != nil {
			return interactionNotFound(err)
		}
		var question models.CommunityQuestion
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&question, "id = ?", answer.QuestionID).Error; err != nil {
			return interactionNotFound(err)
		}
		if question.AuthorUserID == nil || *question.AuthorUserID != actor {
			return community.NewDomainError(community.CodeForbidden, "Only the question owner can accept an answer")
		}
		if question.LifecycleStatus == models.CommunityLifecycleLocked || question.LifecycleStatus == models.CommunityLifecycleArchived {
			return community.NewDomainError(community.CodeQuestionLocked, "This question is locked")
		}
		if answer.QuestionID != question.ID || answer.PublicationStatus != models.CommunityPublicationPublished {
			return community.NewDomainError(community.CodeContentPending, "Only a published answer can be accepted")
		}
		if input.ExpectedVersion <= 0 || input.ExpectedVersion != question.Version {
			return community.NewDomainError(community.CodeEditConflict, "This question changed; refresh and try again").WithVersion(question.Version)
		}
		question.AcceptedAnswerID = &answer.ID
		question.Version++
		question.LastActivityAt, question.UpdatedAt = s.now().UTC(), s.now().UTC()
		communityUpdateLifecycle(&question)
		if err := tx.Save(&question).Error; err != nil {
			return err
		}
		if s.events != nil && answer.AuthorUserID != nil {
			if err := s.events.RecordTx(ctx, tx, community.Event{Type: "community.accepted", DedupeKey: "accepted:" + answer.ID.String(), RecipientID: *answer.AuthorUserID, ActorUserID: &actor, TargetType: "question", TargetID: &question.ID, EmailRequired: true}); err != nil {
				return err
			}
		}
		result = community.AcceptanceResultDTO{QuestionID: question.ID, AcceptedAnswerID: answer.ID, Version: question.Version}
		return nil
	})
	return result, err
}

func (s *CommunityInteractionService) ToggleHelpful(ctx context.Context, actor, answerID uuid.UUID, clientIP string) (community.HelpfulResultDTO, error) {
	return s.setHelpful(ctx, actor, answerID, clientIP, nil)
}

func (s *CommunityInteractionService) SetHelpful(ctx context.Context, actor, answerID uuid.UUID, clientIP string, helpful bool) (community.HelpfulResultDTO, error) {
	return s.setHelpful(ctx, actor, answerID, clientIP, &helpful)
}

func (s *CommunityInteractionService) setHelpful(ctx context.Context, actor, answerID uuid.UUID, clientIP string, requested *bool) (community.HelpfulResultDTO, error) {
	var result community.HelpfulResultDTO
	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var answer models.CommunityAnswer
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&answer, "id = ?", answerID).Error; err != nil {
			return interactionNotFound(err)
		}
		var question models.CommunityQuestion
		if err := tx.First(&question, "id = ?", answer.QuestionID).Error; err != nil {
			return interactionNotFound(err)
		}
		if err := community.CanVote(actor, publicOwnerID(answer.AuthorUserID), question.LifecycleStatus, answer.PublicationStatus); err != nil {
			return err
		}
		if err := s.consumeInteractionLimits(ctx, tx, actor, clientIP, "vote", s.cfg.VoteLimit); err != nil {
			return err
		}
		vote := models.CommunityAnswerVote{AnswerID: answer.ID, UserID: actor, CreatedAt: s.now().UTC()}
		var existing models.CommunityAnswerVote
		existsErr := tx.First(&existing, "answer_id = ? AND user_id = ?", answer.ID, actor).Error
		if existsErr != nil && !errors.Is(existsErr, gorm.ErrRecordNotFound) {
			return existsErr
		}
		hasVoted := !errors.Is(existsErr, gorm.ErrRecordNotFound)
		desired := !hasVoted
		if requested != nil {
			desired = *requested
		}
		if desired && !hasVoted {
			if err := tx.Create(&vote).Error; err != nil {
				return err
			}
		} else if !desired && hasVoted {
			if err := tx.Delete(&existing).Error; err != nil {
				return err
			}
		}
		var count int64
		if err := tx.Model(&models.CommunityAnswerVote{}).Where("answer_id = ?", answer.ID).Count(&count).Error; err != nil {
			return err
		}
		answer.HelpfulCount = int(count)
		answer.UpdatedAt = s.now().UTC()
		if err := tx.Save(&answer).Error; err != nil {
			return err
		}
		if desired && s.events != nil && answer.AuthorUserID != nil {
			if err := s.events.RecordTx(ctx, tx, community.Event{Type: "community.helpful", DedupeKey: "helpful:" + answer.ID.String() + ":" + actor.String(), RecipientID: *answer.AuthorUserID, ActorUserID: &actor, TargetType: "answer", TargetID: &answer.ID, EmailRequired: true}); err != nil {
				return err
			}
		}
		result = community.HelpfulResultDTO{AnswerID: answer.ID, HasVoted: desired, HelpfulCount: answer.HelpfulCount}
		return nil
	})
	return result, err
}

// ReconcileCounters repairs cached answer helpful counts and question answer
// counters from their source-of-truth rows. It is intentionally bounded so a
// scheduled job can run incrementally without holding a long transaction.
func (s *CommunityInteractionService) ReconcileCounters(ctx context.Context, limit int) (int, error) {
	if limit <= 0 {
		limit = 500
	}
	if limit > 5000 {
		return 0, community.NewDomainError(community.CodeValidation, "Limit must be between 1 and 5000")
	}
	updated := 0
	var answers []models.CommunityAnswer
	if err := s.db.WithContext(ctx).Limit(limit).Find(&answers).Error; err != nil {
		return 0, err
	}
	for _, answer := range answers {
		var count int64
		if err := s.db.WithContext(ctx).Model(&models.CommunityAnswerVote{}).Where("answer_id = ?", answer.ID).Count(&count).Error; err != nil {
			return updated, err
		}
		if answer.HelpfulCount != int(count) {
			if err := s.db.WithContext(ctx).Model(&models.CommunityAnswer{}).Where("id = ?", answer.ID).Update("helpful_count", count).Error; err != nil {
				return updated, err
			}
			updated++
		}
	}
	var questions []models.CommunityQuestion
	if err := s.db.WithContext(ctx).Limit(limit).Find(&questions).Error; err != nil {
		return updated, err
	}
	for _, question := range questions {
		var publishedCount int64
		if err := s.db.WithContext(ctx).Model(&models.CommunityAnswer{}).Where("question_id = ? AND publication_status = ?", question.ID, models.CommunityPublicationPublished).Count(&publishedCount).Error; err != nil {
			return updated, err
		}
		var officialCount int64
		if err := s.db.WithContext(ctx).Model(&models.CommunityAnswer{}).Where("question_id = ? AND publication_status = ? AND is_official = TRUE", question.ID, models.CommunityPublicationPublished).Count(&officialCount).Error; err != nil {
			return updated, err
		}
		if question.PublishedAnswerCount != int(publishedCount) || question.OfficialAnswerCount != int(officialCount) {
			if err := s.db.WithContext(ctx).Model(&models.CommunityQuestion{}).Where("id = ?", question.ID).Updates(map[string]interface{}{"published_answer_count": publishedCount, "official_answer_count": officialCount}).Error; err != nil {
				return updated, err
			}
			updated++
		}
	}
	return updated, nil
}

func (s *CommunityInteractionService) requireVerifiedActor(ctx context.Context, tx *gorm.DB, actor uuid.UUID) error {
	var user models.User
	if err := tx.WithContext(ctx).Clauses(clause.Locking{Strength: "UPDATE"}).First(&user, "id = ?", actor).Error; err != nil {
		return err
	}
	if !user.IsActive || user.AccountStatus != models.AccountStatusActive || !user.EmailVerified {
		return community.NewDomainError(community.CodeAccountNotEligible, "Verify your email before participating in Community")
	}
	return nil
}

func (s *CommunityInteractionService) memberPublication(ctx context.Context, tx *gorm.DB, actor uuid.UUID) (models.CommunityPublicationStatus, error) {
	seed := models.CommunityMemberState{UserID: actor, TrustStatus: models.CommunityTrustNew, Version: 1}
	if err := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&seed).Error; err != nil {
		return "", err
	}
	var state models.CommunityMemberState
	if err := tx.WithContext(ctx).Clauses(clause.Locking{Strength: "UPDATE"}).First(&state, "user_id = ?", actor).Error; err != nil {
		return "", err
	}
	restricted := state.RestrictedUntil != nil && state.RestrictedUntil.After(s.now())
	return community.DeterminePublication(state.TrustStatus, restricted)
}

func (s *CommunityInteractionService) consumeInteractionLimits(ctx context.Context, tx *gorm.DB, actor uuid.UUID, clientIP, surface string, limit config.RateLimit) error {
	if err := s.limiter.ConsumeTx(ctx, tx, RateLimitRequest{SubjectType: "account", Subject: actor.String(), Surface: surface, Limit: limit.Limit, Window: limit.Window}); err != nil {
		return err
	}
	if strings.TrimSpace(clientIP) != "" {
		return s.limiter.ConsumeTx(ctx, tx, RateLimitRequest{SubjectType: "ip", Subject: clientIP, Surface: surface, Limit: limit.Limit * 2, Window: limit.Window})
	}
	return nil
}

func (s *CommunityInteractionService) answerMutation(ctx context.Context, answer models.CommunityAnswer, reviewRequired bool) (community.AnswerMutationDTO, error) {
	return community.AnswerMutationDTO{Answer: s.answerDTO(ctx, answer), ReviewRequired: reviewRequired}, nil
}

func (s *CommunityInteractionService) commentMutation(ctx context.Context, comment models.CommunityComment, reviewRequired bool) (community.CommentMutationDTO, error) {
	return community.CommentMutationDTO{Comment: s.commentDTO(ctx, comment), ReviewRequired: reviewRequired}, nil
}

func (s *CommunityInteractionService) answerDTO(ctx context.Context, answer models.CommunityAnswer) community.AnswerDTO {
	return community.AnswerDTO{ID: answer.ID, QuestionID: answer.QuestionID, Body: answer.Body, Author: interactionAuthor(ctx, s.db, answer.AuthorUserID), PublicationStatus: answer.PublicationStatus, IsOfficial: answer.IsOfficial, HelpfulCount: answer.HelpfulCount, CreatedAt: answer.CreatedAt, PublishedAt: answer.PublishedAt, Version: answer.Version}
}

func (s *CommunityInteractionService) commentDTO(ctx context.Context, comment models.CommunityComment) community.CommentDTO {
	return community.CommentDTO{ID: comment.ID, QuestionID: comment.QuestionID, AnswerID: comment.AnswerID, Body: comment.Body, Author: interactionAuthor(ctx, s.db, comment.AuthorUserID), PublicationStatus: comment.PublicationStatus, CreatedAt: comment.CreatedAt, Version: comment.Version}
}

func validateInteractionBody(body models.RichTextDocument, min, max int) (string, error) {
	plain, err := community.ValidateRichText(body, community.RichTextLimits{MinText: min, MaxText: max})
	if err != nil {
		return "", community.NewDomainError(community.CodeValidation, err.Error()).WithField("body")
	}
	return plain, nil
}

func ensureQuestionAcceptsContribution(question models.CommunityQuestion) error {
	if question.PublicationStatus != models.CommunityPublicationPublished {
		return community.NewDomainError(community.CodeContentPending, "Only published questions can receive contributions")
	}
	if question.LifecycleStatus == models.CommunityLifecycleLocked || question.LifecycleStatus == models.CommunityLifecycleArchived {
		return community.NewDomainError(community.CodeQuestionLocked, "This question is locked")
	}
	return nil
}

func interactionNotFound(err error) error {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return community.NewDomainError(community.CodeContentNotFound, "Community content not found")
	}
	return err
}

func communityUpdateLifecycle(question *models.CommunityQuestion) {
	question.LifecycleStatus = community.RecalculateLifecycle(community.LifecycleInput{PublishedAnswers: question.PublishedAnswerCount, AcceptedExists: question.AcceptedAnswerID != nil, OfficialAnswers: question.OfficialAnswerCount, WasLocked: question.LifecycleStatus == models.CommunityLifecycleLocked, WasArchived: question.LifecycleStatus == models.CommunityLifecycleArchived})
}

func publicOwnerID(value *uuid.UUID) uuid.UUID {
	if value == nil {
		return uuid.Nil
	}
	return *value
}

func interactionAuthor(ctx context.Context, db *gorm.DB, userID *uuid.UUID) *community.PublicAuthorDTO {
	if userID == nil {
		return nil
	}
	var row struct {
		ID          uuid.UUID
		DisplayName string
		AvatarURL   string
	}
	if err := db.WithContext(ctx).Table("users AS u").Select("u.id, COALESCE(ap.display_name, u.name) AS display_name, COALESCE(ap.avatar_url, u.avatar_url, '') AS avatar_url").Joins("LEFT JOIN account_profiles AS ap ON ap.user_id = u.id").Where("u.id = ?", *userID).Scan(&row).Error; err != nil || row.ID == uuid.Nil {
		return &community.PublicAuthorDTO{UserID: *userID, DisplayName: "Former member"}
	}
	return &community.PublicAuthorDTO{UserID: row.ID, DisplayName: row.DisplayName, AvatarURL: row.AvatarURL}
}

func recordInteractionRevision(tx *gorm.DB, questionID, answerID, commentID, editorUserID *uuid.UUID, titleBefore, titleAfter *string, bodyBefore *models.RichTextDocument, bodyAfter models.RichTextDocument, status models.CommunityRevisionReviewStatus) error {
	return tx.Create(&models.CommunityPostRevision{QuestionID: questionID, AnswerID: answerID, CommentID: commentID, EditorUserID: editorUserID, TitleBefore: titleBefore, TitleAfter: titleAfter, BodyBefore: valueOrEmptyDocument(bodyBefore), BodyAfter: bodyAfter, ReviewStatus: status}).Error
}

func valueOrEmptyDocument(value *models.RichTextDocument) models.RichTextDocument {
	if value == nil {
		return nil
	}
	return *value
}
