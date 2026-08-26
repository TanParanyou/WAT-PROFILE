package seeder

import (
	"log"
	"time"

	"github.com/watloungporsai/wat-profile-backend/internal/models"
)

func (s *Seeder) SeedInquiries() error {
	log.Println("  -> Seeding contact inquiries with lifecycle states...")

	now := time.Now()
	repliedTime := now.AddDate(0, 0, -1)

	var admin models.User
	s.db.Where("email = ?", "admin@watloungporsai.de").First(&admin)

	inquiries := []models.ContactInquiry{
		{
			Name:                "Anna Schmidt",
			Email:               "anna.schmidt@example.de",
			Phone:               "+49 172 1122334",
			Subject:             "Frage zur Wochenend-Meditation für Anfänger",
			Message:             "Guten Tag, ich möchte gerne wissen, ob das Wochenend-Retreat auch für Personen ohne Vorkenntnisse im Buddhismus geeignet ist. Vielen Dank!",
			CommunicationLocale: "de",
			InquiryType:         "event",
			Status:              "replied",
			RepliedByID:         &admin.ID,
			RepliedAt:           &repliedTime,
			ReplyMessage:        "Liebe Anna, ja, unsere Retreats sind ausdrücklich auch für Anfänger offen. Sie sind herzlich willkommen!",
		},
		{
			Name:                "ประสิทธิ์ มงคลสุข",
			Email:               "prasit@example.com",
			Phone:               "+49 176 8899001",
			Subject:             "ขออนุญาตนำภัตตาหารมาถวายเพลวันอาทิตย์นี้",
			Message:             "นมัสการพระคุณเจ้า โยมและครอบครัวประสงค์จะนำอาหารไทยมาถวายเพลในวันอาทิตย์นี้ จำนวนประมาณ 4-5 คนครับ",
			CommunicationLocale: "th",
			InquiryType:         "general",
			Status:              "read",
		},
		{
			Name:                "Michael Weber",
			Email:               "m.weber@example.de",
			Subject:             "Directions from Frankfurt Hbf",
			Message:             "Hello, what is the most convenient train route to visit the temple from Frankfurt Main Station on weekends?",
			CommunicationLocale: "en",
			InquiryType:         "general",
			Status:              "new",
		},
	}

	for _, inq := range inquiries {
		var existing models.ContactInquiry
		if err := s.db.Where("email = ? AND subject = ?", inq.Email, inq.Subject).First(&existing).Error; err != nil {
			s.db.Create(&inq)
			log.Printf("     Created contact inquiry: %s (%s)", inq.Subject, inq.Status)
		}
	}
	return nil
}
