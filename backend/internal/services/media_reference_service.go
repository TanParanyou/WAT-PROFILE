package services

import (
	"context"
	"fmt"
	"strings"

	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
)

type MediaReference struct {
	Kind  string `json:"kind"`
	ID    string `json:"id"`
	Label string `json:"label"`
	Href  string `json:"href"`
}

type MediaReferenceService struct {
	db *gorm.DB
}

func NewMediaReferenceService(db *gorm.DB) *MediaReferenceService {
	return &MediaReferenceService{db: db}
}

func (s *MediaReferenceService) FindReferences(ctx context.Context, mediaURL string) ([]MediaReference, error) {
	if strings.TrimSpace(mediaURL) == "" {
		return nil, nil
	}
	var refs []MediaReference
	add := func(kind, id, label, href string) {
		refs = append(refs, MediaReference{Kind: kind, ID: id, Label: label, Href: href})
	}

	var events []models.Event
	if err := s.db.WithContext(ctx).Where("image_url = ?", mediaURL).Find(&events).Error; err != nil {
		return nil, err
	}
	for _, event := range events {
		add("event", fmt.Sprint(event.ID), event.Slug, "/events/"+event.Slug)
	}

	var galleries []models.Gallery
	if err := s.db.WithContext(ctx).Where("image_url = ? OR thumbnail_url = ?", mediaURL, mediaURL).Find(&galleries).Error; err != nil {
		return nil, err
	}
	for _, gallery := range galleries {
		add("gallery", fmt.Sprint(gallery.ID), "Gallery image", "/gallery")
	}

	var monks []models.Monk
	if err := s.db.WithContext(ctx).Where("image_url = ?", mediaURL).Find(&monks).Error; err != nil {
		return nil, err
	}
	for _, monk := range monks {
		add("monk", fmt.Sprint(monk.ID), "Monk profile", "/monks")
	}

	var members []models.Member
	if err := s.db.WithContext(ctx).Where("profile_image_url = ?", mediaURL).Find(&members).Error; err != nil {
		return nil, err
	}
	for _, member := range members {
		add("member", fmt.Sprint(member.ID), member.MemberCode, "/admin/members/"+fmt.Sprint(member.ID))
	}

	likeURL := "%" + mediaURL + "%"
	var pages []models.ContentPage
	if err := s.db.WithContext(ctx).
		Where("body::text LIKE ? OR settings::text LIKE ? OR published_body::text LIKE ? OR published_settings::text LIKE ?", likeURL, likeURL, likeURL, likeURL).
		Find(&pages).Error; err != nil {
		return nil, err
	}
	for _, page := range pages {
		add("website_page", page.ID, page.PageKey, "/admin/website/pages/"+page.PageKey)
	}

	var sections []models.ContentSection
	if err := s.db.WithContext(ctx).
		Where("body::text LIKE ? OR settings::text LIKE ? OR published_body::text LIKE ? OR published_settings::text LIKE ?", likeURL, likeURL, likeURL, likeURL).
		Find(&sections).Error; err != nil {
		return nil, err
	}
	for _, section := range sections {
		add("website_section", section.ID, section.SectionKey, "/admin/website/pages/"+section.PageID)
	}

	return refs, nil
}
