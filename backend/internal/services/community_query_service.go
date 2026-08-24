package services

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/community"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
)

type CommunityQueryService struct {
	db *gorm.DB
}

func NewCommunityQueryService(db *gorm.DB) *CommunityQueryService {
	return &CommunityQueryService{db: db}
}

type communityQuestionListRow struct {
	ID                   uuid.UUID
	CategoryID           uuid.UUID
	CategorySlug         string
	CategoryName         []byte `gorm:"column:category_name"`
	CategoryDescription  []byte `gorm:"column:category_description"`
	Locale               string
	Title                string
	Slug                 string
	LifecycleStatus      models.CommunityLifecycleStatus
	PublishedAnswerCount int
	OfficialAnswerCount  int
	LastActivityAt       time.Time
	CreatedAt            time.Time
	AuthorID             *uuid.UUID
	AuthorDisplayName    *string
	AuthorAvatarURL      *string
}

type communityAuthorRow struct {
	ID          uuid.UUID
	DisplayName string
	AvatarURL   string
}

func (s *CommunityQueryService) ListCategories(ctx context.Context) ([]community.CategoryDTO, error) {
	var categories []models.CommunityCategory
	if err := s.db.WithContext(ctx).Where("is_active = ?", true).Order("sort_order ASC, id ASC").Find(&categories).Error; err != nil {
		return nil, err
	}
	result := make([]community.CategoryDTO, 0, len(categories))
	for _, category := range categories {
		result = append(result, community.CategoryDTO{
			ID: category.ID, Slug: category.Slug, Name: category.Name,
			Description: category.Description, SortOrder: category.SortOrder,
		})
	}
	return result, nil
}

func (s *CommunityQueryService) ListQuestions(ctx context.Context, input community.QuestionListInput) (community.QuestionListDTO, error) {
	limit := input.Limit
	if limit <= 0 {
		limit = 20
	}
	if limit > 50 {
		return community.QuestionListDTO{}, fmt.Errorf("limit must be between 1 and 50")
	}

	query := s.db.WithContext(ctx).Table("community_questions AS q").
		Select(`q.id, q.category_id, c.slug AS category_slug, c.name AS category_name,
			c.description AS category_description, q.locale, q.title, q.slug,
			q.lifecycle_status, q.published_answer_count, q.official_answer_count,
			q.last_activity_at, q.created_at, q.author_user_id AS author_id,
			CASE WHEN u.account_status = 'closed' OR u.is_active = FALSE THEN 'Former member' ELSE COALESCE(ap.display_name, u.name) END AS author_display_name,
			CASE WHEN u.account_status = 'closed' OR u.is_active = FALSE THEN '' ELSE COALESCE(ap.avatar_url, u.avatar_url, '') END AS author_avatar_url`).
		Joins("JOIN community_categories AS c ON c.id = q.category_id AND c.is_active = TRUE").
		Joins("LEFT JOIN users AS u ON u.id = q.author_user_id").
		Joins("LEFT JOIN account_profiles AS ap ON ap.user_id = q.author_user_id").
		Where("q.publication_status = ?", models.CommunityPublicationPublished)

	if input.CategoryID != nil {
		query = query.Where("q.category_id = ?", *input.CategoryID)
	}
	if input.Locale != "" && input.Locale != "all" {
		query = query.Where("q.locale = ?", input.Locale)
	}
	if input.Lifecycle != "" {
		query = query.Where("q.lifecycle_status = ?", input.Lifecycle)
	}
	if search := strings.TrimSpace(input.Search); search != "" {
		pattern := "%" + escapeLike(search) + "%"
		query = query.Where("(q.title ILIKE ? ESCAPE '\\' OR q.body_text ILIKE ? ESCAPE '\\')", pattern, pattern)
	}
	if input.Cursor != "" {
		cursor, err := community.DecodeCursor(input.Cursor)
		if err != nil {
			return community.QuestionListDTO{}, err
		}
		query = query.Where("(q.last_activity_at, q.id) < (?, ?)", cursor.LastActivityAt, cursor.ID)
	}

	var rows []communityQuestionListRow
	if err := query.Order("q.last_activity_at DESC, q.id DESC").Limit(limit + 1).Scan(&rows).Error; err != nil {
		return community.QuestionListDTO{}, err
	}
	result := community.QuestionListDTO{Items: make([]community.QuestionListItemDTO, 0, min(len(rows), limit))}
	for _, row := range rows[:min(len(rows), limit)] {
		result.Items = append(result.Items, questionListItemFromRow(row))
	}
	if len(rows) > limit {
		last := rows[limit-1]
		result.NextCursor = community.EncodeCursor(community.QuestionCursor{LastActivityAt: last.LastActivityAt, ID: last.ID})
	}
	return result, nil
}

func (s *CommunityQueryService) GetQuestion(ctx context.Context, id uuid.UUID) (community.QuestionDetailDTO, error) {
	var question models.CommunityQuestion
	if err := s.db.WithContext(ctx).Where("id = ? AND publication_status = ?", id, models.CommunityPublicationPublished).First(&question).Error; err != nil {
		return community.QuestionDetailDTO{}, err
	}
	var category models.CommunityCategory
	if err := s.db.WithContext(ctx).Where("id = ? AND is_active = ?", question.CategoryID, true).First(&category).Error; err != nil {
		return community.QuestionDetailDTO{}, err
	}

	var answers []models.CommunityAnswer
	if err := s.db.WithContext(ctx).
		Where("question_id = ? AND publication_status = ?", id, models.CommunityPublicationPublished).
		Order("is_official DESC, helpful_count DESC, published_at ASC NULLS LAST, id ASC").Find(&answers).Error; err != nil {
		return community.QuestionDetailDTO{}, err
	}
	var comments []models.CommunityComment
	if err := s.db.WithContext(ctx).
		Where("question_id = ? AND publication_status = ?", id, models.CommunityPublicationPublished).
		Order("created_at ASC, id ASC").Find(&comments).Error; err != nil {
		return community.QuestionDetailDTO{}, err
	}

	ids := make([]uuid.UUID, 0, 1+len(answers)+len(comments))
	if question.AuthorUserID != nil {
		ids = append(ids, *question.AuthorUserID)
	}
	for _, answer := range answers {
		if answer.AuthorUserID != nil {
			ids = append(ids, *answer.AuthorUserID)
		}
	}
	for _, comment := range comments {
		if comment.AuthorUserID != nil {
			ids = append(ids, *comment.AuthorUserID)
		}
	}
	authors, err := s.loadAuthors(ctx, ids)
	if err != nil {
		return community.QuestionDetailDTO{}, err
	}

	questionItem := community.QuestionListItemDTO{
		ID:       question.ID,
		Category: community.CategoryDTO{ID: category.ID, Slug: category.Slug, Name: category.Name, Description: category.Description, SortOrder: category.SortOrder},
		Locale:   question.Locale, Title: question.Title, Slug: question.Slug,
		LifecycleStatus: question.LifecycleStatus, PublishedAnswerCount: question.PublishedAnswerCount,
		OfficialAnswerCount: question.OfficialAnswerCount, LastActivityAt: question.LastActivityAt,
		CreatedAt: question.CreatedAt, Author: authorForID(authors, question.AuthorUserID),
	}
	result := community.QuestionDetailDTO{
		Question: questionItem, Body: question.Body, BodyText: question.BodyText,
		Answers: make([]community.AnswerDTO, 0, len(answers)), Comments: make([]community.CommentDTO, 0, len(comments)),
		AcceptedAnswerID: question.AcceptedAnswerID, Version: question.Version,
		LastActivityAt: question.LastActivityAt,
	}
	for _, answer := range answers {
		result.Answers = append(result.Answers, community.AnswerDTO{
			ID: answer.ID, QuestionID: answer.QuestionID, Body: answer.Body,
			Author: authorForID(authors, answer.AuthorUserID), PublicationStatus: answer.PublicationStatus,
			IsOfficial: answer.IsOfficial, HelpfulCount: answer.HelpfulCount, CreatedAt: answer.CreatedAt,
			PublishedAt: answer.PublishedAt, Version: answer.Version,
		})
	}
	for _, comment := range comments {
		result.Comments = append(result.Comments, community.CommentDTO{
			ID: comment.ID, QuestionID: comment.QuestionID, AnswerID: comment.AnswerID, Body: comment.Body,
			Author: authorForID(authors, comment.AuthorUserID), PublicationStatus: comment.PublicationStatus,
			CreatedAt: comment.CreatedAt, Version: comment.Version,
		})
	}
	return result, nil
}

func (s *CommunityQueryService) loadAuthors(ctx context.Context, ids []uuid.UUID) (map[uuid.UUID]community.PublicAuthorDTO, error) {
	unique := make(map[uuid.UUID]struct{}, len(ids))
	for _, id := range ids {
		if id != uuid.Nil {
			unique[id] = struct{}{}
		}
	}
	if len(unique) == 0 {
		return map[uuid.UUID]community.PublicAuthorDTO{}, nil
	}
	requested := make([]uuid.UUID, 0, len(unique))
	for id := range unique {
		requested = append(requested, id)
	}
	var rows []communityAuthorRow
	err := s.db.WithContext(ctx).Table("users AS u").
		Select("u.id, CASE WHEN u.account_status = 'closed' OR u.is_active = FALSE THEN 'Former member' ELSE COALESCE(ap.display_name, u.name) END AS display_name, CASE WHEN u.account_status = 'closed' OR u.is_active = FALSE THEN '' ELSE COALESCE(ap.avatar_url, u.avatar_url, '') END AS avatar_url").
		Joins("LEFT JOIN account_profiles AS ap ON ap.user_id = u.id").
		Where("u.id IN ?", requested).Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	result := make(map[uuid.UUID]community.PublicAuthorDTO, len(rows))
	for _, row := range rows {
		result[row.ID] = community.PublicAuthorDTO{UserID: row.ID, DisplayName: row.DisplayName, AvatarURL: row.AvatarURL}
	}
	return result, nil
}

func parseMultiLangJSON(raw []byte) models.MultiLangText {
	if len(raw) == 0 {
		return models.MultiLangText{}
	}
	var res models.MultiLangText
	if err := json.Unmarshal(raw, &res); err != nil {
		return models.MultiLangText{}
	}
	return res
}

func questionListItemFromRow(row communityQuestionListRow) community.QuestionListItemDTO {
	var author *community.PublicAuthorDTO
	if row.AuthorID != nil {
		author = &community.PublicAuthorDTO{UserID: *row.AuthorID}
		if row.AuthorDisplayName != nil {
			author.DisplayName = *row.AuthorDisplayName
		}
		if row.AuthorAvatarURL != nil {
			author.AvatarURL = *row.AuthorAvatarURL
		}
	}
	return community.QuestionListItemDTO{
		ID: row.ID,
		Category: community.CategoryDTO{
			ID:          row.CategoryID,
			Slug:        row.CategorySlug,
			Name:        parseMultiLangJSON(row.CategoryName),
			Description: parseMultiLangJSON(row.CategoryDescription),
		},
		Locale:               row.Locale,
		Title:                row.Title,
		Slug:                 row.Slug,
		LifecycleStatus:      row.LifecycleStatus,
		PublishedAnswerCount: row.PublishedAnswerCount,
		OfficialAnswerCount:  row.OfficialAnswerCount,
		LastActivityAt:       row.LastActivityAt,
		CreatedAt:            row.CreatedAt,
		Author:               author,
	}
}

func authorForID(authors map[uuid.UUID]community.PublicAuthorDTO, id *uuid.UUID) *community.PublicAuthorDTO {
	if id == nil {
		return nil
	}
	author, ok := authors[*id]
	if !ok {
		return &community.PublicAuthorDTO{UserID: *id, DisplayName: "Former member"}
	}
	return &author
}

func escapeLike(value string) string {
	value = strings.ReplaceAll(value, `\`, `\\`)
	value = strings.ReplaceAll(value, "%", `\%`)
	return strings.ReplaceAll(value, "_", `\_`)
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
