package seeder

import (
	"log"
	"time"

	"github.com/watloungporsai/wat-profile-backend/internal/models"
)

func (s *Seeder) SeedRegistrations() error {
	log.Println("  -> Seeding event registrations...")

	var retreat models.Event
	if err := s.db.Where("slug = ?", "weekend-mindfulness-retreat").First(&retreat).Error; err != nil {
		log.Println("     Event weekend-mindfulness-retreat not found, skipping registrations seed")
		return nil
	}

	now := time.Now()
	confirmedTime := now.AddDate(0, 0, -3)

	registrations := []struct {
		Reg          models.EventRegistration
		Participants []models.EventRegistrationParticipant
	}{
		{
			Reg: models.EventRegistration{
				EventID:             retreat.ID,
				RegistrationType:    "guest",
				Locale:              "de",
				FirstName:           "Julia",
				LastName:            "Schneider",
				Email:               "julia.schneider@example.de",
				Phone:               "+49 173 4455667",
				DietaryRestrictions: "Vegetarian",
				SpecialNeeds:        "Need ground floor room if possible",
				RegistrationStatus:  "confirmed",
				ConfirmationCode:    "REG-2026-0001",
				ConfirmedAt:         &confirmedTime,
			},
			Participants: []models.EventRegistrationParticipant{
				{
					FirstName:           "Julia",
					LastName:            "Schneider",
					DietaryRestrictions: "Vegetarian",
				},
				{
					FirstName:           "Stefan",
					LastName:            "Schneider",
					DietaryRestrictions: "None",
				},
			},
		},
		{
			Reg: models.EventRegistration{
				EventID:             retreat.ID,
				RegistrationType:    "guest",
				Locale:              "th",
				FirstName:           "วิไล",
				LastName:            "รัตนพงศ์",
				Email:               "wilai@example.com",
				Phone:               "+49 152 9988776",
				DietaryRestrictions: "ทานมังสวิรัติในวันพระ",
				RegistrationStatus:  "pending",
				ConfirmationCode:    "REG-2026-0002",
			},
			Participants: []models.EventRegistrationParticipant{
				{
					FirstName:           "วิไล",
					LastName:            "รัตนพงศ์",
					DietaryRestrictions: "Vegetarian",
				},
			},
		},
	}

	for _, item := range registrations {
		var existing models.EventRegistration
		if err := s.db.Where("confirmation_code = ?", item.Reg.ConfirmationCode).First(&existing).Error; err != nil {
			if err := s.db.Create(&item.Reg).Error; err != nil {
				return err
			}
			for _, p := range item.Participants {
				p.RegistrationID = item.Reg.ID
				s.db.Create(&p)
			}
			log.Printf("     Created registration: %s (%s)", item.Reg.ConfirmationCode, item.Reg.RegistrationStatus)
		}
	}
	return nil
}
