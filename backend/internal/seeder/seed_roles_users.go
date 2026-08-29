package seeder

import (
	"errors"
	"log"
	"os"

	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
)

func (s *Seeder) SeedRoles() error {
	log.Println("  -> Seeding roles...")

	roles := []models.Role{
		{
			Name:        "admin",
			Description: "System administrator with full access",
			Permissions: models.PermissionsMap{
				"dashboard":          "all",
				"events":             "all",
				"calendar_resources": "all",
				"monks":              "all",
				"gallery":            "all",
				"schedules":          "all",
				"donations":          "all",
				"members":            "all",
				"contacts":           "all",
				"settings":           "all",
				"users":              "all",
				"website":            "all",
				"audit_logs":         "all",
				"profile":            "update",
				"privacy_requests":   "all",
				"account_operations": "all",
				"chanting":           "all",
				"community":          "all",
				"chatbot":            "all",
				"news":               "all",
				"site_alerts":        "all",
			},
			IsActive:    true,
			AdminAccess: true,
			IsSystem:    true,
		},
		{
			Name:        "editor",
			Description: "Content editor - manages events, monks, gallery, schedules, website, news, alerts",
			Permissions: models.PermissionsMap{
				"dashboard":          "read",
				"events":             "all",
				"calendar_resources": "all",
				"monks":              "all",
				"gallery":            "all",
				"schedules":          "all",
				"contacts":           "read",
				"website":            "all",
				"profile":            "update",
				"chanting":           "all",
				"chatbot":            "all",
				"news":               "all",
				"site_alerts":        "all",
			},
			IsActive:    true,
			AdminAccess: true,
		},
		{
			Name:        "accountant",
			Description: "Finance manager - manages donations and view members",
			Permissions: models.PermissionsMap{
				"dashboard": "read",
				"donations": "all",
				"members":   "read",
				"profile":   "update",
			},
			IsActive:    true,
			AdminAccess: true,
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
			IsActive:    true,
			AdminAccess: false,
		},
	}

	for _, role := range roles {
		var existing models.Role
		if err := s.db.Where("name = ?", role.Name).First(&existing).Error; err != nil {
			if err := s.db.Create(&role).Error; err != nil {
				return err
			}
			log.Printf("     Created role: %s", role.Name)
		} else {
			// Update permissions in case role definition changed
			s.db.Model(&existing).Updates(models.Role{
				Description: role.Description,
				Permissions: role.Permissions,
				AdminAccess: role.AdminAccess,
			})
		}
	}
	return nil
}

func (s *Seeder) SeedAdminUser() error {
	log.Println("  -> Seeding admin user...")

	adminEmail := os.Getenv("ADMIN_EMAIL")
	adminPassword := os.Getenv("ADMIN_PASSWORD")
	adminName := os.Getenv("ADMIN_NAME")

	if os.Getenv("ENV") == "production" && adminPassword == "" {
		return errors.New("ADMIN_PASSWORD environment variable is required in production environment")
	}

	if adminEmail == "" {
		adminEmail = "admin@watloungporsai.de"
	}
	if adminPassword == "" {
		adminPassword = "changeme123"
	}
	if adminName == "" {
		adminName = "Wat Super Admin"
	}

	var adminRole models.Role
	if err := s.db.Where("name = ?", "admin").First(&adminRole).Error; err != nil {
		return err
	}

	var existing models.User
	if err := s.db.Where("email = ?", adminEmail).First(&existing).Error; err != nil {
		hashed, err := utils.HashAdminPassword(adminPassword)
		if err != nil {
			return err
		}
		admin := models.User{
			Email:         adminEmail,
			PasswordHash:  &hashed,
			Name:          adminName,
			RoleID:        &adminRole.ID,
			EmailVerified: true,
			IsActive:      true,
		}
		if err := s.db.Create(&admin).Error; err != nil {
			return err
		}
		log.Printf("     Created admin user: %s", adminEmail)
	}
	return nil
}

func (s *Seeder) SeedAllUsers() error {
	if err := s.SeedAdminUser(); err != nil {
		return err
	}

	if os.Getenv("ENV") == "production" {
		log.Println("  -> Skipping demo users seed in production environment")
		return nil
	}

	log.Println("  -> Seeding additional staff and member accounts...")

	users := []struct {
		Email    string
		Name     string
		Password string
		RoleName string
	}{
		{
			Email:    "editor@watloungporsai.de",
			Name:     "Wat Content Editor",
			Password: "changeme123",
			RoleName: "editor",
		},
		{
			Email:    "accountant@watloungporsai.de",
			Name:     "Wat Accountant",
			Password: "changeme123",
			RoleName: "accountant",
		},
		{
			Email:    "member@watloungporsai.de",
			Name:     "สมชาย ใจดี",
			Password: "changeme123",
			RoleName: "member",
		},
	}

	for _, u := range users {
		var role models.Role
		if err := s.db.Where("name = ?", u.RoleName).First(&role).Error; err != nil {
			continue
		}

		var existing models.User
		if err := s.db.Where("email = ?", u.Email).First(&existing).Error; err != nil {
			hashed, err := utils.HashAdminPassword(u.Password)
			if err != nil {
				return err
			}
			newUser := models.User{
				Email:         u.Email,
				PasswordHash:  &hashed,
				Name:          u.Name,
				RoleID:        &role.ID,
				EmailVerified: true,
				IsActive:      true,
			}
			if err := s.db.Create(&newUser).Error; err != nil {
				return err
			}
			log.Printf("     Created user: %s (%s)", u.Email, u.RoleName)

			// If member, ensure member record exists
			if u.RoleName == "member" {
				var existingMember models.Member
				if err := s.db.Where("user_id = ?", newUser.ID).First(&existingMember).Error; err != nil {
					memberRec := models.Member{
						UserID:           &newUser.ID,
						FirstNameTH:      "สมชาย",
						LastNameTH:       "ใจดี",
						FirstNameEN:      "Somchai",
						LastNameEN:       "Jaidee",
						Phone:            "+49 170 1234567",
						MemberCode:       "MEM-2026-0001",
						MembershipStatus: "active",
					}
					s.db.Create(&memberRec)
				}
			}
		}
	}
	return nil
}
