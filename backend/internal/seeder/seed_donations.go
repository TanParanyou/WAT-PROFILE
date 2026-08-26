package seeder

import (
	"log"
	"time"

	"github.com/watloungporsai/wat-profile-backend/internal/models"
)

func (s *Seeder) SeedDonationCategories() error {
	log.Println("  -> Seeding donation categories...")

	categories := []models.DonationCategory{
		{
			Name:         models.MultiLangText{"th": "ทำบุญทั่วไป", "en": "General Donation", "de": "Allgemeine Spende"},
			Description:  models.MultiLangText{"th": "บริจาคทั่วไปเพื่อกิจการและการทำนุบำรุงวัด", "en": "General temple donation and maintenance", "de": "Allgemeine Tempelspende und Instandhaltung"},
			IsActive:     true,
			DisplayOrder: 1,
		},
		{
			Name:         models.MultiLangText{"th": "กองทุนก่อสร้างศาลาและบูรณะเสนาสนะ", "en": "Building & Renovation Fund", "de": "Bau- und Renovierungsfonds"},
			Description:  models.MultiLangText{"th": "เพื่อการก่อสร้าง ต่อเติม และบูรณะอาคารสถานที่", "en": "Temple construction, expansion, and renovation", "de": "Tempelbau, Erweiterung und Renovierung"},
			IsActive:     true,
			DisplayOrder: 2,
		},
		{
			Name:         models.MultiLangText{"th": "ค่าน้ำค่าไฟและสาธารณูปโภค", "en": "Temple Utilities Fund", "de": "Nebenkostenfonds"},
			Description:  models.MultiLangText{"th": "ค่ากระแสไฟฟ้า ค่าความร้อน (Heizung) และค่าน้ำประปาของวัด", "en": "Electricity, heating, and water utility expenses", "de": "Strom-, Heizungs- und Wasserkosten des Tempels"},
			IsActive:     true,
			DisplayOrder: 3,
		},
		{
			Name:         models.MultiLangText{"th": "ถวายสังฆทานและภัตตาหาร", "en": "Sangha Dana & Monastic Food", "de": "Sangha Dana & Mahlzeiten"},
			Description:  models.MultiLangText{"th": "ถวายปัจจัยสี่แด่คณะสงฆ์และภัตตาหารประจำวัน", "en": "Four requisites offering for the monastic Sangha", "de": "Vier Erfordernisse für die Mönchsgemeinschaft"},
			IsActive:     true,
			DisplayOrder: 4,
		},
		{
			Name:         models.MultiLangText{"th": "กองทุนเผยแผ่ธรรมะและการศึกษา", "en": "Dhamma Education Fund", "de": "Dhamma-Bildungsfonds"},
			Description:  models.MultiLangText{"th": "สนับสนุนหนังสือธรรมะ การจัดคอร์สปฏิบัติธรรม และสื่อการสอน", "en": "Dhamma books, meditation retreats, and educational media", "de": "Dhamma-Bücher, Meditationskurse und Lehrmaterialien"},
			IsActive:     true,
			DisplayOrder: 5,
		},
	}

	for _, cat := range categories {
		var existing models.DonationCategory
		enName := cat.Name["en"]
		if err := s.db.Where("name->>'en' = ?", enName).First(&existing).Error; err != nil {
			if err := s.db.Create(&cat).Error; err != nil {
				return err
			}
			log.Printf("     Created donation category: %s", enName)
		}
	}
	return nil
}

func (s *Seeder) SeedDonations() error {
	if err := s.SeedDonationCategories(); err != nil {
		return err
	}

	log.Println("  -> Seeding sample donation records...")

	var genCat, utilCat models.DonationCategory
	s.db.Where("name->>'en' = ?", "General Donation").First(&genCat)
	s.db.Where("name->>'en' = ?", "Temple Utilities Fund").First(&utilCat)

	now := time.Now()

	donations := []models.Donation{
		{
			ReceiptNumber:       "DON-2026-0001",
			DonorType:           "guest",
			DonorName:           "Hans Müller",
			DonorEmail:          "hans.mueller@example.de",
			DonorPhone:          "+49 171 9876543",
			Amount:              100.00,
			Currency:            "EUR",
			DonationDate:        now.AddDate(0, 0, -5),
			DonationMethod:      "bank_transfer",
			CategoryID:          &utilCat.ID,
			ReceiptRequested:    true,
			Status:              "confirmed",
			Source:              "self_reported",
			CommunicationLocale: "de",
			Notes:               "Spende für Heizungskosten",
		},
		{
			ReceiptNumber:       "DON-2026-0002",
			DonorType:           "guest",
			DonorName:           "สมใจ ศรัทธายิ่ง",
			DonorEmail:          "somjai@example.com",
			DonorPhone:          "+49 160 5551234",
			Amount:              250.00,
			Currency:            "EUR",
			DonationDate:        now.AddDate(0, 0, -2),
			DonationMethod:      "bank_transfer",
			CategoryID:          &genCat.ID,
			ReceiptRequested:    false,
			Status:              "pending",
			Source:              "self_reported",
			CommunicationLocale: "th",
			Notes:               "ร่วมทำบุญค่าน้ำค่าไฟและบำรุงวัด",
		},
		{
			ReceiptNumber:       "DON-2026-0003",
			DonorType:           "anonymous",
			Amount:              50.00,
			Currency:            "EUR",
			DonationDate:        now.AddDate(0, 0, -1),
			DonationMethod:      "cash",
			CategoryID:          &genCat.ID,
			IsAnonymous:         true,
			Status:              "confirmed",
			Source:              "staff_recorded",
			CommunicationLocale: "th",
			Notes:               "ตู้บริจาคในศาลาใหญ่",
		},
	}

	for _, don := range donations {
		var existing models.Donation
		if err := s.db.Where("receipt_number = ?", don.ReceiptNumber).First(&existing).Error; err != nil {
			if err := s.db.Create(&don).Error; err != nil {
				return err
			}
			log.Printf("     Created donation record: %s (€%.2f)", don.ReceiptNumber, don.Amount)
		}
	}
	return nil
}
