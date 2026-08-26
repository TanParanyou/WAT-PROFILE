package seeder

import (
	"log"

	"github.com/watloungporsai/wat-profile-backend/internal/models"
)

func (s *Seeder) SeedSettings() error {
	log.Println("  -> Seeding site settings...")

	settings := []models.Setting{
		// General
		{Key: "site_name", Value: "วัดหลวงพ่อใส", Type: "string", Category: "general", IsPublic: true},
		{Key: "site_name_en", Value: "Wat Loung Por Sai", Type: "string", Category: "general", IsPublic: true},
		{Key: "site_name_de", Value: "Wat Loung Por Sai", Type: "string", Category: "general", IsPublic: true},
		{Key: "site_tagline", Value: "พื้นที่แห่งการปฏิบัติ เพื่อความสงบและความสุขที่แท้จริง", Type: "string", Category: "general", IsPublic: true},
		{Key: "site_tagline_en", Value: "A Sanctuary for Practice, Peace, and True Happiness", Type: "string", Category: "general", IsPublic: true},
		{Key: "site_tagline_de", Value: "Ein Ort der Praxis für Frieden und wahres Glück", Type: "string", Category: "general", IsPublic: true},
		{Key: "default_timezone", Value: "Europe/Berlin", Type: "string", Category: "general", IsPublic: true},

		// Contact
		{Key: "contact_email", Value: "info@watloungporsai.de", Type: "string", Category: "contact", IsPublic: true},
		{Key: "contact_phone", Value: "+49 69 12345678", Type: "string", Category: "contact", IsPublic: true},
		{Key: "address", Value: "Waldstraße 108, 60528 Frankfurt am Main, Germany", Type: "string", Category: "contact", IsPublic: true},
		{Key: "opening_hours", Value: "ทุกวัน 06:00 - 20:00 น. (Daily 06:00 - 20:00 CET)", Type: "string", Category: "contact", IsPublic: true},
		{Key: "google_maps_url", Value: "https://maps.google.com/?q=50.1109,8.6821", Type: "string", Category: "contact", IsPublic: true},

		// Social
		{Key: "facebook_url", Value: "https://facebook.com/watloungporsai", Type: "string", Category: "social", IsPublic: true},
		{Key: "youtube_url", Value: "https://youtube.com/@watloungporsai", Type: "string", Category: "social", IsPublic: true},
		{Key: "line_id", Value: "@watloungporsai", Type: "string", Category: "social", IsPublic: true},

		// Donation & Bank Information (EPC-QR compatible for SEPA)
		{Key: "bank_name", Value: "Deutsche Bank", Type: "string", Category: "donation", IsPublic: true},
		{Key: "account_holder", Value: "Wat Loung Por Sai e.V.", Type: "string", Category: "donation", IsPublic: true},
		{Key: "iban", Value: "DE89370400440532013000", Type: "string", Category: "donation", IsPublic: true},
		{Key: "bic", Value: "DBETDEDDFRA", Type: "string", Category: "donation", IsPublic: true},
		{Key: "paypal_email", Value: "donation@watloungporsai.de", Type: "string", Category: "donation", IsPublic: false},

		// Appearance & Hero Background
		{Key: "hero_bg_image", Value: "https://r2.watloungporsai.de/hero/hero-temple-main.jpg", Type: "string", Category: "appearance", IsPublic: true},
		{Key: "event_alert_enabled", Value: "false", Type: "boolean", Category: "features", IsPublic: true},
		{Key: "public_account_auth_enabled", Value: "true", Type: "boolean", Category: "features", IsPublic: true},
		{Key: "community_enabled", Value: "true", Type: "boolean", Category: "features", IsPublic: true},
		{Key: "chatbot_enabled", Value: "true", Type: "boolean", Category: "features", IsPublic: true},
		{Key: "chatbot_system_prompt_extra", Value: "", Type: "string", Category: "features", IsPublic: false},
	}

	for _, setting := range settings {
		var existing models.Setting
		if err := s.db.Where("key = ?", setting.Key).First(&existing).Error; err != nil {
			if err := s.db.Create(&setting).Error; err != nil {
				return err
			}
			log.Printf("     Created setting: %s", setting.Key)
		}
	}
	return nil
}
