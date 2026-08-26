package seeder

import (
	"log"

	"github.com/watloungporsai/wat-profile-backend/internal/services"
)

func (s *Seeder) SeedWebsiteCMSBase() error {
	log.Println("  -> Seeding website CMS base pages...")
	contentService := services.NewContentService(s.db)

	if err := contentService.EnsureHomePageSeed(); err != nil {
		return err
	}
	if err := contentService.EnsureAboutPageSeed(); err != nil {
		return err
	}
	if err := contentService.EnsureContactPageSeed(); err != nil {
		return err
	}
	if err := contentService.EnsurePrivacyPageSeed(); err != nil {
		return err
	}
	if err := contentService.EnsureImpressumPageSeed(); err != nil {
		return err
	}
	return nil
}

func (s *Seeder) SeedWebsiteCMSFull() error {
	return s.SeedWebsiteCMSBase()
}
