package services

import (
	"time"

	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/publiccontent"
	"gorm.io/gorm"
)

type PublicContentService struct {
	db *gorm.DB
}

func NewPublicContentService(db *gorm.DB) *PublicContentService {
	return &PublicContentService{db: db}
}

// GetAbout loads PAGE-ABOUT.
func (s *PublicContentService) GetAbout() (*publiccontent.AboutContent, error) {
	var page models.ContentPage
	if err := s.db.Where("page_key = ?", "PAGE-ABOUT").First(&page).Error; err != nil {
		return nil, err
	}
	return publiccontent.AboutFromPage(&page), nil
}

// SaveAbout updates and immediately publishes PAGE-ABOUT.
func (s *PublicContentService) SaveAbout(req *publiccontent.AboutContent) (*publiccontent.AboutContent, error) {
	var page models.ContentPage
	err := s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("page_key = ?", "PAGE-ABOUT").First(&page).Error; err != nil {
			return err
		}

		publiccontent.ApplyAbout(&page, req)

		now := time.Now()
		page.Status = models.ContentStatusPublished
		page.PublishedTitle = page.Title
		page.PublishedDescription = page.Description
		page.PublishedSeo = page.Seo
		page.PublishedBody = page.Body
		page.PublishedAt = &now

		if err := tx.Save(&page).Error; err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return publiccontent.AboutFromPage(&page), nil
}

// GetContact loads PAGE-CONTACT.
func (s *PublicContentService) GetContact() (*publiccontent.ContactContent, error) {
	var page models.ContentPage
	if err := s.db.Where("page_key = ?", "PAGE-CONTACT").First(&page).Error; err != nil {
		return nil, err
	}
	return publiccontent.ContactFromPage(&page), nil
}

// SaveContact updates and immediately publishes PAGE-CONTACT.
func (s *PublicContentService) SaveContact(req *publiccontent.ContactContent) (*publiccontent.ContactContent, error) {
	var page models.ContentPage
	err := s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("page_key = ?", "PAGE-CONTACT").First(&page).Error; err != nil {
			return err
		}

		publiccontent.ApplyContact(&page, req)

		now := time.Now()
		page.Status = models.ContentStatusPublished
		page.PublishedTitle = page.Title
		page.PublishedDescription = page.Description
		page.PublishedSeo = page.Seo
		page.PublishedBody = page.Body
		page.PublishedAt = &now

		if err := tx.Save(&page).Error; err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return publiccontent.ContactFromPage(&page), nil
}

// GetPrivacy loads PAGE-PRIVACY.
func (s *PublicContentService) GetPrivacy() (*publiccontent.PrivacyContent, error) {
	var page models.ContentPage
	if err := s.db.Where("page_key = ?", "PAGE-PRIVACY").First(&page).Error; err != nil {
		return nil, err
	}
	return publiccontent.PrivacyFromPage(&page), nil
}

// SavePrivacy updates and immediately publishes PAGE-PRIVACY.
func (s *PublicContentService) SavePrivacy(req *publiccontent.PrivacyContent) (*publiccontent.PrivacyContent, error) {
	var page models.ContentPage
	err := s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("page_key = ?", "PAGE-PRIVACY").First(&page).Error; err != nil {
			return err
		}

		req.Body.LastUpdated = time.Now()
		publiccontent.ApplyPrivacy(&page, req)

		now := time.Now()
		page.Status = models.ContentStatusPublished
		page.PublishedTitle = page.Title
		page.PublishedDescription = page.Description
		page.PublishedSeo = page.Seo
		page.PublishedBody = page.Body
		page.PublishedAt = &now

		if err := tx.Save(&page).Error; err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return publiccontent.PrivacyFromPage(&page), nil
}

// GetImpressum loads PAGE-IMPRESSUM.
func (s *PublicContentService) GetImpressum() (*publiccontent.ImpressumContent, error) {
	var page models.ContentPage
	if err := s.db.Where("page_key = ?", "PAGE-IMPRESSUM").First(&page).Error; err != nil {
		return nil, err
	}
	return publiccontent.ImpressumFromPage(&page), nil
}

// SaveImpressum updates and immediately publishes PAGE-IMPRESSUM.
func (s *PublicContentService) SaveImpressum(req *publiccontent.ImpressumContent) (*publiccontent.ImpressumContent, error) {
	var page models.ContentPage
	err := s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("page_key = ?", "PAGE-IMPRESSUM").First(&page).Error; err != nil {
			return err
		}

		publiccontent.ApplyImpressum(&page, req)

		now := time.Now()
		page.Status = models.ContentStatusPublished
		page.PublishedTitle = page.Title
		page.PublishedDescription = page.Description
		page.PublishedSeo = page.Seo
		page.PublishedBody = page.Body
		page.PublishedAt = &now

		if err := tx.Save(&page).Error; err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return publiccontent.ImpressumFromPage(&page), nil
}
