package seeder

import (
	"fmt"
	"log"

	"gorm.io/gorm"
)

// Seeder manages system-wide database seeding
type Seeder struct {
	db *gorm.DB
}

// NewSeeder creates a new Seeder instance
func NewSeeder(db *gorm.DB) *Seeder {
	return &Seeder{db: db}
}

// SeedEssential seeds only essential data required for production
func (s *Seeder) SeedEssential() error {
	log.Println("==> Running Essential (Production) Seed...")

	if err := s.SeedRoles(); err != nil {
		return fmt.Errorf("seed roles: %w", err)
	}
	if err := s.SeedAdminUser(); err != nil {
		return fmt.Errorf("seed admin user: %w", err)
	}
	if err := s.SeedSettings(); err != nil {
		return fmt.Errorf("seed settings: %w", err)
	}
	if err := s.SeedDonationCategories(); err != nil {
		return fmt.Errorf("seed donation categories: %w", err)
	}
	if err := s.SeedWebsiteCMSBase(); err != nil {
		return fmt.Errorf("seed website cms base: %w", err)
	}
	if err := s.SeedChatbotKnowledgeBase(); err != nil {
		return fmt.Errorf("seed chatbot kb: %w", err)
	}

	log.Println("==> Essential Seed completed successfully!")
	return nil
}

// SeedFull seeds essential data plus rich demo/development data across all entities
func (s *Seeder) SeedFull() error {
	log.Println("==> Running Full (Development & Staging) Seed...")

	// 1. Roles & All Users
	if err := s.SeedRoles(); err != nil {
		return fmt.Errorf("seed roles: %w", err)
	}
	if err := s.SeedAllUsers(); err != nil {
		return fmt.Errorf("seed users: %w", err)
	}

	// 2. Settings
	if err := s.SeedSettings(); err != nil {
		return fmt.Errorf("seed settings: %w", err)
	}

	// 3. Monks
	if err := s.SeedMonks(); err != nil {
		return fmt.Errorf("seed monks: %w", err)
	}

	// 4. Events & Calendar Resources
	if err := s.SeedEventsAndCalendar(); err != nil {
		return fmt.Errorf("seed events: %w", err)
	}

	// 5. Schedules
	if err := s.SeedSchedules(); err != nil {
		return fmt.Errorf("seed schedules: %w", err)
	}

	// 6. Donations
	if err := s.SeedDonations(); err != nil {
		return fmt.Errorf("seed donations: %w", err)
	}

	// 7. Gallery
	if err := s.SeedGallery(); err != nil {
		return fmt.Errorf("seed gallery: %w", err)
	}

	// 8. Chanting
	if err := s.SeedChanting(); err != nil {
		return fmt.Errorf("seed chanting: %w", err)
	}

	// 9. Website CMS
	if err := s.SeedWebsiteCMSFull(); err != nil {
		return fmt.Errorf("seed website cms: %w", err)
	}

	// 10. Contact Inquiries
	if err := s.SeedInquiries(); err != nil {
		return fmt.Errorf("seed inquiries: %w", err)
	}

	// 11. Event Registrations
	if err := s.SeedRegistrations(); err != nil {
		return fmt.Errorf("seed registrations: %w", err)
	}

	// 12. Community Q&A
	if err := s.SeedCommunity(); err != nil {
		return fmt.Errorf("seed community: %w", err)
	}

	// 13. Chatbot Knowledge Base
	if err := s.SeedChatbotKnowledgeBase(); err != nil {
		return fmt.Errorf("seed chatbot kb: %w", err)
	}

	log.Println("==> Full Seed completed successfully across all 13 modules!")
	return nil
}
