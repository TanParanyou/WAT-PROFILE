package main

import (
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/watloungporsai/wat-profile-backend/internal/config"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
)

func main() {
	// Load .env
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system env")
	}

	// Connect database
	if err := config.InitDatabase(); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Run migrations
	if err := config.MigrateModels(); err != nil {
		log.Fatalf("Failed to migrate: %v", err)
	}

	// Seed roles
	seedRoles()

	// Seed admin user
	seedAdminUser()

	// Seed default settings
	seedSettings()

	// Seed website CMS
	seedWebsiteCMS()

	// Seed donation categories
	seedDonationCategories()

	log.Println("Seed completed successfully!")
}

func seedRoles() {
	log.Println("Seeding roles...")

	roles := []models.Role{
		{
			Name:        "admin",
			Description: "System administrator with full access",
			Permissions: models.PermissionsMap{
				"events":     "all",
				"monks":      "all",
				"gallery":    "all",
				"schedules":  "all",
				"donations":  "all",
				"members":    "all",
				"contacts":   "all",
				"settings":   "all",
				"users":      "all",
				"website":    "all",
				"audit_logs": "all",
			},
			IsActive: true,
		},
		{
			Name:        "editor",
			Description: "Content editor - manages events, monks, gallery, schedules",
			Permissions: models.PermissionsMap{
				"events":    "all",
				"monks":     "all",
				"gallery":   "all",
				"schedules": "all",
				"contacts":  "read",
				"website":   "all",
			},
			IsActive: true,
		},
		{
			Name:        "accountant",
			Description: "Finance manager - manages donations and views members",
			Permissions: models.PermissionsMap{
				"donations": "all",
				"members":   "read",
			},
			IsActive: true,
		},
		{
			Name:        "member",
			Description: "Registered temple member",
			Permissions: models.PermissionsMap{
				"events":        "read",
				"monks":         "read",
				"gallery":       "read",
				"donations":     "create",
				"registrations": "create",
			},
			IsActive: true,
		},
	}

	for _, role := range roles {
		var existing models.Role
		if err := config.DB.Where("name = ?", role.Name).First(&existing).Error; err != nil {
			config.DB.Create(&role)
			log.Printf("  Created role: %s", role.Name)
		} else {
			log.Printf("  Role already exists: %s", role.Name)
		}
	}
}

func seedAdminUser() {
	log.Println("Seeding admin user...")

	adminEmail := os.Getenv("ADMIN_EMAIL")
	adminPassword := os.Getenv("ADMIN_PASSWORD")
	adminName := os.Getenv("ADMIN_NAME")

	if adminEmail == "" {
		adminEmail = "admin@watloungporsai.de"
	}
	if adminPassword == "" {
		adminPassword = "changeme123"
	}
	if adminName == "" {
		adminName = "Wat Admin"
	}

	// Check if admin already exists
	var existing models.User
	if err := config.DB.Where("email = ?", adminEmail).First(&existing).Error; err == nil {
		log.Printf("  Admin user already exists: %s", adminEmail)
		return
	}

	// Get admin role
	var adminRole models.Role
	if err := config.DB.Where("name = ?", "admin").First(&adminRole).Error; err != nil {
		log.Fatalf("  Admin role not found. Run seedRoles first.")
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(adminPassword)
	if err != nil {
		log.Fatalf("  Failed to hash password: %v", err)
	}

	// Create admin user
	admin := models.User{
		Email:         adminEmail,
		PasswordHash:  hashedPassword,
		Name:          adminName,
		RoleID:        &adminRole.ID,
		EmailVerified: true,
		IsActive:      true,
	}

	if err := config.DB.Create(&admin).Error; err != nil {
		log.Fatalf("  Failed to create admin user: %v", err)
	}

	log.Printf("  Created admin user: %s", adminEmail)
}

func seedSettings() {
	log.Println("Seeding default settings...")

	settings := []models.Setting{
		{Key: "site_name", Value: "วัดหลวงพ่อใส", Type: "string", Category: "general", IsPublic: true},
		{Key: "site_name_en", Value: "Wat Loung Por Sai", Type: "string", Category: "general", IsPublic: true},
		{Key: "site_name_de", Value: "Wat Loung Por Sai", Type: "string", Category: "general", IsPublic: true},
		{Key: "contact_email", Value: "info@watloungporsai.de", Type: "string", Category: "contact", IsPublic: true},
		{Key: "contact_phone", Value: "", Type: "string", Category: "contact", IsPublic: true},
		{Key: "address", Value: "", Type: "string", Category: "contact", IsPublic: true},
		{Key: "facebook_url", Value: "", Type: "string", Category: "social", IsPublic: true},
		{Key: "youtube_url", Value: "", Type: "string", Category: "social", IsPublic: true},
		{Key: "line_id", Value: "", Type: "string", Category: "social", IsPublic: true},
		{Key: "bank_account_info", Value: "", Type: "json", Category: "donation", IsPublic: true},
		{Key: "paypal_email", Value: "", Type: "string", Category: "donation", IsPublic: false},
	}

	for _, setting := range settings {
		var existing models.Setting
		if err := config.DB.Where("key = ?", setting.Key).First(&existing).Error; err != nil {
			config.DB.Create(&setting)
			log.Printf("  Created setting: %s", setting.Key)
		}
	}
}

func seedDonationCategories() {
	log.Println("Seeding donation categories...")

	categories := []models.DonationCategory{
		{
			Name:         models.MultiLangText{"en": "General Donation", "th": "ทำบุญทั่วไป", "de": "Allgemeine Spende"},
			Description:  models.MultiLangText{"en": "General temple donation", "th": "บริจาคทั่วไปเพื่อกิจการของวัด", "de": "Allgemeine Tempelspende"},
			IsActive:     true,
			DisplayOrder: 1,
		},
		{
			Name:         models.MultiLangText{"en": "Building Fund", "th": "ทุนก่อสร้าง", "de": "Baufonds"},
			Description:  models.MultiLangText{"en": "Temple construction and renovation", "th": "เพื่อการก่อสร้างและบูรณะวัด", "de": "Tempelkonstruktion und Renovierung"},
			IsActive:     true,
			DisplayOrder: 2,
		},
		{
			Name:         models.MultiLangText{"en": "Sangha Dana", "th": "ถวายสังฆทาน", "de": "Sangha Dana"},
			Description:  models.MultiLangText{"en": "Offering to the monastic community", "th": "ถวายปัจจัยแด่พระสงฆ์", "de": "Opfergabe an die Mönchsgemeinschaft"},
			IsActive:     true,
			DisplayOrder: 3,
		},
		{
			Name:         models.MultiLangText{"en": "Meditation Course", "th": "คอร์สปฏิบัติธรรม", "de": "Meditationskurs"},
			Description:  models.MultiLangText{"en": "Support meditation retreat programs", "th": "สนับสนุนโครงการปฏิบัติธรรม", "de": "Unterstützung von Meditationsretreat-Programmen"},
			IsActive:     true,
			DisplayOrder: 4,
		},
	}

	for _, cat := range categories {
		var existing models.DonationCategory
		enName := cat.Name["en"]
		if err := config.DB.Where("name->>'en' = ?", enName).First(&existing).Error; err != nil {
			config.DB.Create(&cat)
			log.Printf("  Created category: %s", enName)
		}
	}
}

func seedWebsiteCMS() {
	log.Println("Seeding website CMS...")
	if err := services.NewContentService(config.DB).EnsureContactPageSeed(); err != nil {
		log.Printf("  Failed to seed website CMS: %v", err)
	}
}
