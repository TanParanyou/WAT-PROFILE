package services

import (
	"context"
	"errors"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"github.com/watloungporsai/wat-profile-backend/internal/community"
	"github.com/watloungporsai/wat-profile-backend/internal/config"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type CommunityModerationService struct {
	db      *gorm.DB
	cfg     config.CommunityConfig
	limiter *CommunityRateLimitService
	events  CommunityEventSink
	now     func() time.Time
}

var communityCategorySlugPattern = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)

func NewCommunityModerationService(db *gorm.DB, cfg config.CommunityConfig, events ...CommunityEventSink) *CommunityModerationService {
	if cfg.ReportLimit.Limit <= 0 || cfg.ReportLimit.Window <= 0 {
		cfg.ReportLimit = config.RateLimit{Limit: 10, Window: time.Hour}
	}
	var sink CommunityEventSink
	if len(events) > 0 {
		sink = events[0]
	}
	return &CommunityModerationService{db: db, cfg: cfg, limiter: NewCommunityRateLimitService(db), events: sink, now: time.Now}
}

func (s *CommunityModerationService) CreateReport(ctx context.Context, reporter uuid.UUID, clientIP string, input community.CreateReportInput) (community.ReportDTO, error) {
	if reporter == uuid.Nil {
		return community.ReportDTO{}, community.NewDomainError(community.CodeAccountNotEligible, "Sign in with a verified account to report content")
	}
	targetType, targetID, err := reportTarget(input)
	if err != nil {
		return community.ReportDTO{}, err
	}
	if _, ok := map[string]struct{}{"spam": {}, "harassment": {}, "misinformation": {}, "privacy": {}, "inappropriate": {}, "other": {}}[strings.ToLower(strings.TrimSpace(input.Reason))]; !ok {
		return community.ReportDTO{}, community.NewDomainError(community.CodeValidation, "Report reason is invalid").WithField("reason")
	}
	if len([]rune(input.Details)) > 2000 {
		return community.ReportDTO{}, community.NewDomainError(community.CodeValidation, "Report details are too long").WithField("details")
	}
	var report models.CommunityReport
	err = s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := s.limiter.ConsumeTx(ctx, tx, RateLimitRequest{SubjectType: "account", Subject: reporter.String(), Surface: "report", Limit: s.cfg.ReportLimit.Limit, Window: s.cfg.ReportLimit.Window}); err != nil {
			return err
		}
		if strings.TrimSpace(clientIP) != "" {
			if err := s.limiter.ConsumeTx(ctx, tx, RateLimitRequest{SubjectType: "ip", Subject: clientIP, Surface: "report", Limit: s.cfg.ReportLimit.Limit * 2, Window: s.cfg.ReportLimit.Window}); err != nil {
				return err
			}
		}
		if err := ensureReportTargetPublished(tx, targetType, targetID); err != nil {
			return err
		}
		report = models.CommunityReport{ID: uuid.New(), ReporterUserID: &reporter, Reason: strings.ToLower(strings.TrimSpace(input.Reason)), Details: strings.TrimSpace(input.Details), State: models.CommunityReportOpen}
		switch targetType {
		case "question":
			report.QuestionID = &targetID
		case "answer":
			report.AnswerID = &targetID
		case "comment":
			report.CommentID = &targetID
		}
		if err := tx.Create(&report).Error; err != nil {
			var pqErr *pq.Error
			if errors.As(err, &pqErr) && pqErr.Code == "23505" {
				return community.NewDomainError(community.CodeAlreadyReported, "You already reported this content")
			}
			return err
		}
		return nil
	})
	if err != nil {
		return community.ReportDTO{}, err
	}
	return reportDTO(report), nil
}

func (s *CommunityModerationService) ListQueue(ctx context.Context, limit int) (community.ModerationQueueDTO, error) {
	if limit <= 0 {
		limit = 50
	}
	if limit > 200 {
		return community.ModerationQueueDTO{}, community.NewDomainError(community.CodeValidation, "Limit must be between 1 and 200")
	}
	result := community.ModerationQueueDTO{Items: make([]community.ModerationQueueItemDTO, 0), Reports: make([]community.ReportDTO, 0), Revisions: make([]community.RevisionDTO, 0)}
	var questions []models.CommunityQuestion
	if err := s.db.WithContext(ctx).Where("publication_status = ?", models.CommunityPublicationPendingReview).Order("created_at ASC, id ASC").Limit(limit).Find(&questions).Error; err != nil {
		return result, err
	}
	for _, question := range questions {
		result.Items = append(result.Items, community.ModerationQueueItemDTO{TargetType: "question", TargetID: question.ID, QuestionID: &question.ID, Title: question.Title, Body: question.Body, PublicationStatus: question.PublicationStatus, CreatedAt: question.CreatedAt})
	}
	var answers []models.CommunityAnswer
	if err := s.db.WithContext(ctx).Where("publication_status = ?", models.CommunityPublicationPendingReview).Order("created_at ASC, id ASC").Limit(limit).Find(&answers).Error; err != nil {
		return result, err
	}
	for _, answer := range answers {
		result.Items = append(result.Items, community.ModerationQueueItemDTO{TargetType: "answer", TargetID: answer.ID, QuestionID: &answer.QuestionID, Body: answer.Body, PublicationStatus: answer.PublicationStatus, CreatedAt: answer.CreatedAt})
	}
	var comments []models.CommunityComment
	if err := s.db.WithContext(ctx).Where("publication_status = ?", models.CommunityPublicationPendingReview).Order("created_at ASC, id ASC").Limit(limit).Find(&comments).Error; err != nil {
		return result, err
	}
	for _, comment := range comments {
		result.Items = append(result.Items, community.ModerationQueueItemDTO{TargetType: "comment", TargetID: comment.ID, QuestionID: &comment.QuestionID, Body: comment.Body, PublicationStatus: comment.PublicationStatus, CreatedAt: comment.CreatedAt})
	}
	var reports []models.CommunityReport
	if err := s.db.WithContext(ctx).Where("state IN ?", []models.CommunityReportState{models.CommunityReportOpen, models.CommunityReportReviewing}).Order("created_at ASC, id ASC").Limit(limit).Find(&reports).Error; err != nil {
		return result, err
	}
	for _, report := range reports {
		result.Reports = append(result.Reports, reportDTO(report))
	}
	var revisions []models.CommunityPostRevision
	if err := s.db.WithContext(ctx).Where("review_status = ?", models.CommunityRevisionPending).Order("created_at ASC, id ASC").Limit(limit).Find(&revisions).Error; err != nil {
		return result, err
	}
	for _, revision := range revisions {
		result.Revisions = append(result.Revisions, revisionDTO(revision))
	}
	return result, nil
}

func (s *CommunityModerationService) ListCategories(ctx context.Context) ([]community.AdminCategoryDTO, error) {
	var categories []models.CommunityCategory
	if err := s.db.WithContext(ctx).Order("sort_order ASC, slug ASC").Find(&categories).Error; err != nil {
		return nil, err
	}
	result := make([]community.AdminCategoryDTO, 0, len(categories))
	for _, category := range categories {
		result = append(result, adminCategoryDTO(category))
	}
	return result, nil
}

func (s *CommunityModerationService) SaveCategory(ctx context.Context, adminID uuid.UUID, input community.CategoryInput) (community.AdminCategoryDTO, error) {
	slug := strings.ToLower(strings.TrimSpace(input.Slug))
	if len([]rune(slug)) < 2 || len([]rune(slug)) > 80 || !communityCategorySlugPattern.MatchString(slug) {
		return community.AdminCategoryDTO{}, community.NewDomainError(community.CodeValidation, "Category slug must use lowercase letters, numbers, and hyphens").WithField("slug")
	}
	for _, locale := range []string{"th", "en", "de"} {
		if strings.TrimSpace(input.Name[locale]) == "" {
			return community.AdminCategoryDTO{}, community.NewDomainError(community.CodeValidation, "Category names in th, en, and de are required").WithField("name")
		}
	}
	if input.SortOrder < 0 || input.SortOrder > 100000 {
		return community.AdminCategoryDTO{}, community.NewDomainError(community.CodeValidation, "Category sort order is invalid").WithField("sort_order")
	}
	if adminID == uuid.Nil {
		return community.AdminCategoryDTO{}, community.NewDomainError(community.CodeForbidden, "Admin identity is required")
	}
	var category models.CommunityCategory
	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		now := s.now().UTC()
		if input.ID == nil {
			category = models.CommunityCategory{ID: uuid.New(), Slug: slug, Name: input.Name, Description: input.Description, SortOrder: input.SortOrder, IsActive: input.IsActive, CreatedByAdminID: &adminID, UpdatedByAdminID: &adminID, CreatedAt: now, UpdatedAt: now}
		} else {
			if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&category, "id = ?", *input.ID).Error; err != nil {
				return moderationNotFound(err)
			}
			category.Slug, category.Name, category.Description, category.SortOrder, category.IsActive, category.UpdatedByAdminID, category.UpdatedAt = slug, input.Name, input.Description, input.SortOrder, input.IsActive, &adminID, now
		}
		if err := tx.Save(&category).Error; err != nil {
			var pqErr *pq.Error
			if errors.As(err, &pqErr) && pqErr.Code == "23505" {
				return community.NewDomainError(community.CodeConflict, "Category slug is already in use")
			}
			return err
		}
		return writeModerationAction(tx, adminID, "category_save", "category", category.ID, "Category saved", nil, models.JSONMap{"slug": category.Slug, "is_active": category.IsActive}, "")
	})
	if err != nil {
		return community.AdminCategoryDTO{}, err
	}
	return adminCategoryDTO(category), nil
}

func (s *CommunityModerationService) DeleteCategory(ctx context.Context, adminID, categoryID uuid.UUID, reason string) error {
	if len([]rune(strings.TrimSpace(reason))) < 2 {
		return community.NewDomainError(community.CodeValidation, "A reason is required").WithField("reason")
	}
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var category models.CommunityCategory
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&category, "id = ?", categoryID).Error; err != nil {
			return moderationNotFound(err)
		}
		var usage int64
		if err := tx.Model(&models.CommunityQuestion{}).Where("category_id = ?", categoryID).Count(&usage).Error; err != nil {
			return err
		}
		if usage > 0 {
			return community.NewDomainError(community.CodeConflict, "Category is in use and cannot be deleted")
		}
		if err := tx.Delete(&category).Error; err != nil {
			return err
		}
		return writeModerationAction(tx, adminID, "category_delete", "category", categoryID, strings.TrimSpace(reason), models.JSONMap{"slug": category.Slug}, models.JSONMap{}, "")
	})
}

func (s *CommunityModerationService) ReorderCategories(ctx context.Context, adminID uuid.UUID, input community.CategoryReorderInput) error {
	if len(input.IDs) == 0 || len(input.IDs) > 200 {
		return community.NewDomainError(community.CodeValidation, "Category IDs are required")
	}
	seen := make(map[uuid.UUID]struct{}, len(input.IDs))
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for index, id := range input.IDs {
			if id == uuid.Nil {
				return community.NewDomainError(community.CodeValidation, "Category ID is invalid")
			}
			if _, exists := seen[id]; exists {
				return community.NewDomainError(community.CodeValidation, "Category IDs must be unique")
			}
			seen[id] = struct{}{}
			var category models.CommunityCategory
			if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&category, "id = ?", id).Error; err != nil {
				return moderationNotFound(err)
			}
			if err := tx.Model(&category).Updates(map[string]interface{}{"sort_order": (index + 1) * 10, "updated_by_admin_id": adminID, "updated_at": s.now().UTC()}).Error; err != nil {
				return err
			}
		}
		return writeModerationAction(tx, adminID, "category_reorder", "category", input.IDs[0], "Category order updated", nil, models.JSONMap{"count": len(input.IDs)}, "")
	})
}

func (s *CommunityModerationService) DecideRevision(ctx context.Context, adminID, revisionID uuid.UUID, input community.RevisionDecisionInput, traceID string) error {
	reason := strings.TrimSpace(input.Reason)
	if len([]rune(reason)) < 2 || len([]rune(reason)) > 2000 {
		return community.NewDomainError(community.CodeValidation, "A revision decision reason between 2 and 2000 characters is required").WithField("reason")
	}
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var revision models.CommunityPostRevision
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&revision, "id = ?", revisionID).Error; err != nil {
			return moderationNotFound(err)
		}
		if revision.ReviewStatus != models.CommunityRevisionPending {
			return community.NewDomainError(community.CodeConflict, "Revision has already been decided")
		}
		if input.Approve {
			if err := applyRevision(tx, revision); err != nil {
				return err
			}
			revision.ReviewStatus = models.CommunityRevisionApproved
		} else {
			revision.ReviewStatus = models.CommunityRevisionRejected
		}
		now := s.now().UTC()
		revision.ReviewerAdminID, revision.DecisionAt = &adminID, &now
		if err := tx.Save(&revision).Error; err != nil {
			return err
		}
		return writeModerationAction(tx, adminID, "revision_"+string(revision.ReviewStatus), revisionTargetType(revision), revisionTargetID(revision), reason, models.JSONMap{"review_status": models.CommunityRevisionPending}, models.JSONMap{"review_status": revision.ReviewStatus}, traceID)
	})
}

func (s *CommunityModerationService) Moderate(ctx context.Context, adminID uuid.UUID, targetType string, targetID uuid.UUID, input community.ModerationInput, traceID string) error {
	action := strings.ToLower(strings.TrimSpace(input.Action))
	reason := strings.TrimSpace(input.Reason)
	if len([]rune(reason)) < 2 || len([]rune(reason)) > 2000 {
		return community.NewDomainError(community.CodeValidation, "A moderation reason between 2 and 2000 characters is required").WithField("reason")
	}
	if !allowedModerationAction(targetType, action) {
		return community.NewDomainError(community.CodeValidation, "Moderation action is invalid").WithField("action")
	}
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		switch targetType {
		case "question":
			return s.moderateQuestion(ctx, tx, adminID, targetID, action, reason, traceID)
		case "answer":
			return s.moderateAnswer(ctx, tx, adminID, targetID, action, reason, traceID)
		case "comment":
			return s.moderateComment(ctx, tx, adminID, targetID, action, reason, traceID)
		case "member":
			return s.moderateMember(ctx, tx, adminID, targetID, action, reason, traceID)
		default:
			return community.NewDomainError(community.CodeValidation, "Moderation target is invalid")
		}
	})
}

func (s *CommunityModerationService) ResolveReport(ctx context.Context, adminID, reportID uuid.UUID, state models.CommunityReportState, reason, traceID string) error {
	if state != models.CommunityReportResolved && state != models.CommunityReportDismissed {
		return community.NewDomainError(community.CodeValidation, "Report decision is invalid")
	}
	if len([]rune(strings.TrimSpace(reason))) < 2 {
		return community.NewDomainError(community.CodeValidation, "A reason is required").WithField("reason")
	}
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var report models.CommunityReport
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&report, "id = ?", reportID).Error; err != nil {
			return moderationNotFound(err)
		}
		if report.State == models.CommunityReportResolved || report.State == models.CommunityReportDismissed {
			return community.NewDomainError(community.CodeConflict, "Report has already been decided")
		}
		now := s.now().UTC()
		report.State, report.ResolverAdminID, report.DecidedAt = state, &adminID, &now
		if err := tx.Save(&report).Error; err != nil {
			return err
		}
		if err := tx.Create(&models.CommunityModerationAction{ActorAdminID: adminID, Action: string(state), TargetType: "report", TargetID: report.ID, Reason: reason, RequestTraceID: traceID}).Error; err != nil {
			return err
		}
		return s.recordModerationEvent(ctx, tx, adminID, string(state), report.ReporterUserID, report.ID, traceID)
	})
}

func (s *CommunityModerationService) moderateQuestion(ctx context.Context, tx *gorm.DB, adminID, id uuid.UUID, action, reason, traceID string) error {
	var question models.CommunityQuestion
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&question, "id = ?", id).Error; err != nil {
		return moderationNotFound(err)
	}
	previous := models.JSONMap{"publication_status": question.PublicationStatus, "lifecycle_status": question.LifecycleStatus}
	now := s.now().UTC()
	switch action {
	case "approve":
		if question.PublicationStatus != models.CommunityPublicationPendingReview {
			return community.NewDomainError(community.CodeConflict, "Question is not pending review")
		}
		question.PublicationStatus, question.PublishedAt = models.CommunityPublicationPublished, &now
		question.Version++
		if question.AuthorUserID != nil {
			if err := markMemberTrusted(tx, *question.AuthorUserID, now); err != nil {
				return err
			}
		}
	case "reject", "hide":
		question.PublicationStatus, question.HiddenAt = models.CommunityPublicationHidden, &now
		question.Version++
	case "restore":
		question.PublicationStatus, question.HiddenAt = models.CommunityPublicationPublished, nil
		if question.PublishedAt == nil {
			question.PublishedAt = &now
		}
		question.Version++
	case "lock":
		question.LifecycleStatus, question.Version = models.CommunityLifecycleLocked, question.Version+1
	case "unlock":
		question.LifecycleStatus, question.Version = recalculatedLifecycle(question), question.Version+1
	case "archive":
		question.LifecycleStatus, question.Version = models.CommunityLifecycleArchived, question.Version+1
	case "unarchive":
		question.LifecycleStatus, question.Version = recalculatedLifecycle(question), question.Version+1
	default:
		return community.NewDomainError(community.CodeValidation, "Moderation action is invalid")
	}
	question.UpdatedAt, question.LastActivityAt = now, now
	if err := tx.Save(&question).Error; err != nil {
		return err
	}
	return s.writeModerationAction(ctx, tx, adminID, action, "question", question.ID, reason, previous, models.JSONMap{"publication_status": question.PublicationStatus, "lifecycle_status": question.LifecycleStatus}, traceID, question.AuthorUserID)
}

func (s *CommunityModerationService) moderateAnswer(ctx context.Context, tx *gorm.DB, adminID, id uuid.UUID, action, reason, traceID string) error {
	var answer models.CommunityAnswer
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&answer, "id = ?", id).Error; err != nil {
		return moderationNotFound(err)
	}
	var question models.CommunityQuestion
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&question, "id = ?", answer.QuestionID).Error; err != nil {
		return moderationNotFound(err)
	}
	previous := models.JSONMap{"publication_status": answer.PublicationStatus, "is_official": answer.IsOfficial}
	now := s.now().UTC()
	switch action {
	case "approve":
		if answer.PublicationStatus != models.CommunityPublicationPendingReview {
			return community.NewDomainError(community.CodeConflict, "Answer is not pending review")
		}
		answer.PublicationStatus, answer.PublishedAt = models.CommunityPublicationPublished, &now
		question.PublishedAnswerCount++
		if answer.AuthorUserID != nil {
			if err := markMemberTrusted(tx, *answer.AuthorUserID, now); err != nil {
				return err
			}
		}
	case "reject", "hide":
		answer.PublicationStatus, answer.HiddenAt = models.CommunityPublicationHidden, &now
	case "restore":
		answer.PublicationStatus, answer.HiddenAt = models.CommunityPublicationPublished, nil
		if answer.PublishedAt == nil {
			answer.PublishedAt = &now
		}
	case "official":
		if answer.PublicationStatus != models.CommunityPublicationPublished {
			return community.NewDomainError(community.CodeContentPending, "Only published answers can be official")
		}
		if !answer.IsOfficial {
			answer.IsOfficial, answer.OfficialByAdminID, answer.OfficialAt = true, &adminID, &now
			question.OfficialAnswerCount++
		}
	case "unofficial":
		if answer.IsOfficial {
			answer.IsOfficial, answer.OfficialByAdminID, answer.OfficialAt = false, nil, nil
			if question.OfficialAnswerCount > 0 {
				question.OfficialAnswerCount--
			}
		}
	default:
		return community.NewDomainError(community.CodeValidation, "Moderation action is invalid")
	}
	communityUpdateLifecycle(&question)
	question.Version++
	question.LastActivityAt, question.UpdatedAt = now, now
	answer.UpdatedAt = now
	if err := tx.Save(&answer).Error; err != nil {
		return err
	}
	if err := tx.Save(&question).Error; err != nil {
		return err
	}
	return s.writeModerationAction(ctx, tx, adminID, action, "answer", answer.ID, reason, previous, models.JSONMap{"publication_status": answer.PublicationStatus, "is_official": answer.IsOfficial}, traceID, answer.AuthorUserID)
}

func (s *CommunityModerationService) moderateComment(ctx context.Context, tx *gorm.DB, adminID, id uuid.UUID, action, reason, traceID string) error {
	var comment models.CommunityComment
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&comment, "id = ?", id).Error; err != nil {
		return moderationNotFound(err)
	}
	var question models.CommunityQuestion
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&question, "id = ?", comment.QuestionID).Error; err != nil {
		return moderationNotFound(err)
	}
	previous := models.JSONMap{"publication_status": comment.PublicationStatus}
	now := s.now().UTC()
	switch action {
	case "approve":
		if comment.PublicationStatus != models.CommunityPublicationPendingReview {
			return community.NewDomainError(community.CodeConflict, "Comment is not pending review")
		}
		comment.PublicationStatus, comment.PublishedAt = models.CommunityPublicationPublished, &now
		if comment.AuthorUserID != nil {
			if err := markMemberTrusted(tx, *comment.AuthorUserID, now); err != nil {
				return err
			}
		}
	case "reject", "hide":
		comment.PublicationStatus, comment.HiddenAt = models.CommunityPublicationHidden, &now
	case "restore":
		comment.PublicationStatus, comment.HiddenAt = models.CommunityPublicationPublished, nil
		if comment.PublishedAt == nil {
			comment.PublishedAt = &now
		}
	default:
		return community.NewDomainError(community.CodeValidation, "Moderation action is invalid")
	}
	comment.UpdatedAt = now
	if err := tx.Save(&comment).Error; err != nil {
		return err
	}
	question.Version++
	question.LastActivityAt, question.UpdatedAt = now, now
	if err := tx.Save(&question).Error; err != nil {
		return err
	}
	return s.writeModerationAction(ctx, tx, adminID, action, "comment", comment.ID, reason, previous, models.JSONMap{"publication_status": comment.PublicationStatus}, traceID, comment.AuthorUserID)
}

func (s *CommunityModerationService) moderateMember(ctx context.Context, tx *gorm.DB, adminID, id uuid.UUID, action, reason, traceID string) error {
	var state models.CommunityMemberState
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&state, "user_id = ?", id).Error; err != nil {
		return moderationNotFound(err)
	}
	previous := models.JSONMap{"trust_status": state.TrustStatus}
	now := s.now().UTC()
	switch action {
	case "restrict":
		state.TrustStatus, state.RestrictedUntil = models.CommunityTrustRestricted, moderationTimePtr(now.Add(7*24*time.Hour))
	case "unrestrict":
		state.TrustStatus, state.RestrictedUntil = models.CommunityTrustTrusted, nil
	case "ban":
		state.TrustStatus, state.RestrictedUntil = models.CommunityTrustBanned, nil
	default:
		return community.NewDomainError(community.CodeValidation, "Moderation action is invalid")
	}
	state.Version++
	state.UpdatedAt = now
	if err := tx.Save(&state).Error; err != nil {
		return err
	}
	return s.writeModerationAction(ctx, tx, adminID, action, "member", id, reason, previous, models.JSONMap{"trust_status": state.TrustStatus}, traceID, &id)
}

func reportTarget(input community.CreateReportInput) (string, uuid.UUID, error) {
	count := 0
	var targetType string
	var targetID uuid.UUID
	if input.QuestionID != nil {
		count++
		targetType, targetID = "question", *input.QuestionID
	}
	if input.AnswerID != nil {
		count++
		targetType, targetID = "answer", *input.AnswerID
	}
	if input.CommentID != nil {
		count++
		targetType, targetID = "comment", *input.CommentID
	}
	if count != 1 || targetID == uuid.Nil {
		return "", uuid.Nil, community.NewDomainError(community.CodeValidation, "Exactly one report target is required")
	}
	return targetType, targetID, nil
}

func ensureReportTargetPublished(tx *gorm.DB, targetType string, id uuid.UUID) error {
	var status models.CommunityPublicationStatus
	switch targetType {
	case "question":
		var value models.CommunityQuestion
		if err := tx.Select("publication_status").First(&value, "id = ?", id).Error; err != nil {
			return moderationNotFound(err)
		}
		status = value.PublicationStatus
	case "answer":
		var value models.CommunityAnswer
		if err := tx.Select("publication_status").First(&value, "id = ?", id).Error; err != nil {
			return moderationNotFound(err)
		}
		status = value.PublicationStatus
	case "comment":
		var value models.CommunityComment
		if err := tx.Select("publication_status").First(&value, "id = ?", id).Error; err != nil {
			return moderationNotFound(err)
		}
		status = value.PublicationStatus
	}
	if status != models.CommunityPublicationPublished {
		return community.NewDomainError(community.CodeContentNotFound, "Content not found")
	}
	return nil
}

func allowedModerationAction(targetType, action string) bool {
	allowed := map[string]map[string]struct{}{
		"question": {"approve": {}, "reject": {}, "hide": {}, "restore": {}, "lock": {}, "unlock": {}, "archive": {}, "unarchive": {}},
		"answer":   {"approve": {}, "reject": {}, "hide": {}, "restore": {}, "official": {}, "unofficial": {}},
		"comment":  {"approve": {}, "reject": {}, "hide": {}, "restore": {}},
		"member":   {"restrict": {}, "unrestrict": {}, "ban": {}},
	}
	_, ok := allowed[targetType][action]
	return ok
}

func markMemberTrusted(tx *gorm.DB, userID uuid.UUID, now time.Time) error {
	state := models.CommunityMemberState{UserID: userID, TrustStatus: models.CommunityTrustTrusted, FirstApprovedAt: &now, Version: 1}
	if err := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&state).Error; err != nil {
		return err
	}
	return tx.Model(&models.CommunityMemberState{}).Where("user_id = ? AND trust_status = ?", userID, models.CommunityTrustNew).Updates(map[string]interface{}{"trust_status": models.CommunityTrustTrusted, "first_approved_at": now, "version": gorm.Expr("version + 1"), "updated_at": now}).Error
}

func recalculatedLifecycle(question models.CommunityQuestion) models.CommunityLifecycleStatus {
	return community.RecalculateLifecycle(community.LifecycleInput{PublishedAnswers: question.PublishedAnswerCount, AcceptedExists: question.AcceptedAnswerID != nil, OfficialAnswers: question.OfficialAnswerCount})
}

func writeModerationAction(tx *gorm.DB, adminID uuid.UUID, action, targetType string, targetID uuid.UUID, reason string, previous, next models.JSONMap, traceID string) error {
	return tx.Create(&models.CommunityModerationAction{ActorAdminID: adminID, Action: action, TargetType: targetType, TargetID: targetID, Reason: reason, PreviousState: previous, NextState: next, RequestTraceID: traceID}).Error
}

func (s *CommunityModerationService) writeModerationAction(ctx context.Context, tx *gorm.DB, adminID uuid.UUID, action, targetType string, targetID uuid.UUID, reason string, previous, next models.JSONMap, traceID string, recipient *uuid.UUID) error {
	if err := writeModerationAction(tx, adminID, action, targetType, targetID, reason, previous, next, traceID); err != nil {
		return err
	}
	return s.recordModerationEvent(ctx, tx, adminID, action, recipient, targetID, traceID)
}

func (s *CommunityModerationService) recordModerationEvent(ctx context.Context, tx *gorm.DB, adminID uuid.UUID, action string, recipient *uuid.UUID, targetID uuid.UUID, traceID string) error {
	if s.events == nil || recipient == nil {
		return nil
	}
	eventType := "community.moderation"
	if action == "official" {
		eventType = "community.official"
	}
	return s.events.RecordTx(ctx, tx, community.Event{Type: eventType, DedupeKey: "moderation:" + action + ":" + targetID.String() + ":" + traceID, RecipientID: *recipient, ActorAdminID: &adminID, TargetType: "moderation", TargetID: &targetID, EmailRequired: true})
}

func moderationNotFound(err error) error {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return community.NewDomainError(community.CodeContentNotFound, "Community content not found")
	}
	return err
}

func reportDTO(report models.CommunityReport) community.ReportDTO {
	targetType, targetID := "", uuid.Nil
	if report.QuestionID != nil {
		targetType, targetID = "question", *report.QuestionID
	} else if report.AnswerID != nil {
		targetType, targetID = "answer", *report.AnswerID
	} else if report.CommentID != nil {
		targetType, targetID = "comment", *report.CommentID
	}
	return community.ReportDTO{ID: report.ID, TargetType: targetType, TargetID: targetID, Reason: report.Reason, Details: report.Details, State: report.State, CreatedAt: report.CreatedAt}
}

func categoryDTO(category models.CommunityCategory) community.CategoryDTO {
	return community.CategoryDTO{ID: category.ID, Slug: category.Slug, Name: category.Name, Description: category.Description, SortOrder: category.SortOrder}
}

func adminCategoryDTO(category models.CommunityCategory) community.AdminCategoryDTO {
	return community.AdminCategoryDTO{CategoryDTO: categoryDTO(category), IsActive: category.IsActive}
}

func revisionDTO(revision models.CommunityPostRevision) community.RevisionDTO {
	return community.RevisionDTO{ID: revision.ID, TargetType: revisionTargetType(revision), TargetID: revisionTargetID(revision), TitleBefore: revision.TitleBefore, TitleAfter: revision.TitleAfter, BodyBefore: revision.BodyBefore, BodyAfter: revision.BodyAfter, ReviewStatus: revision.ReviewStatus, EditorUserID: revision.EditorUserID, CreatedAt: revision.CreatedAt}
}

func revisionTargetType(revision models.CommunityPostRevision) string {
	if revision.QuestionID != nil {
		return "question"
	}
	if revision.AnswerID != nil {
		return "answer"
	}
	if revision.CommentID != nil {
		return "comment"
	}
	return "unknown"
}

func revisionTargetID(revision models.CommunityPostRevision) uuid.UUID {
	if revision.QuestionID != nil {
		return *revision.QuestionID
	}
	if revision.AnswerID != nil {
		return *revision.AnswerID
	}
	if revision.CommentID != nil {
		return *revision.CommentID
	}
	return uuid.Nil
}

func applyRevision(tx *gorm.DB, revision models.CommunityPostRevision) error {
	if revision.QuestionID != nil {
		if revision.TitleAfter == nil {
			return community.NewDomainError(community.CodeValidation, "Question revision title is missing")
		}
		title, bodyText, err := validateQuestionContent(*revision.TitleAfter, revision.BodyAfter)
		if err != nil {
			return err
		}
		var question models.CommunityQuestion
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&question, "id = ?", *revision.QuestionID).Error; err != nil {
			return moderationNotFound(err)
		}
		question.Title, question.Body, question.BodyText = title, revision.BodyAfter, bodyText
		question.Slug = questionSlug(title, question.ID)
		question.Version++
		question.UpdatedAt, question.LastActivityAt = time.Now().UTC(), time.Now().UTC()
		return tx.Save(&question).Error
	}
	bodyText, err := validateInteractionBody(revision.BodyAfter, 2, 20000)
	if err != nil {
		return err
	}
	if revision.AnswerID != nil {
		var answer models.CommunityAnswer
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&answer, "id = ?", *revision.AnswerID).Error; err != nil {
			return moderationNotFound(err)
		}
		answer.Body, answer.BodyText, answer.Version, answer.UpdatedAt = revision.BodyAfter, bodyText, answer.Version+1, time.Now().UTC()
		if err := tx.Save(&answer).Error; err != nil {
			return err
		}
		return touchQuestionActivity(tx, answer.QuestionID, answer.UpdatedAt)
	}
	if revision.CommentID != nil {
		var comment models.CommunityComment
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&comment, "id = ?", *revision.CommentID).Error; err != nil {
			return moderationNotFound(err)
		}
		comment.Body, comment.BodyText, comment.Version, comment.UpdatedAt = revision.BodyAfter, bodyText, comment.Version+1, time.Now().UTC()
		if err := tx.Save(&comment).Error; err != nil {
			return err
		}
		return touchQuestionActivity(tx, comment.QuestionID, comment.UpdatedAt)
	}
	return community.NewDomainError(community.CodeValidation, "Revision target is invalid")
}

func touchQuestionActivity(tx *gorm.DB, questionID uuid.UUID, now time.Time) error {
	var question models.CommunityQuestion
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&question, "id = ?", questionID).Error; err != nil {
		return moderationNotFound(err)
	}
	question.Version++
	question.LastActivityAt, question.UpdatedAt = now, now
	return tx.Save(&question).Error
}

func moderationTimePtr(value time.Time) *time.Time { return &value }
