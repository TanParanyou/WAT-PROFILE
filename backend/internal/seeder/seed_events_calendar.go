package seeder

import (
	"log"
	"time"

	"github.com/watloungporsai/wat-profile-backend/internal/models"
)

func (s *Seeder) SeedEventsAndCalendar() error {
	log.Println("  -> Seeding event categories, calendar resources, and events...")

	// 1. Event Categories
	categories := []models.EventCategory{
		{
			Name: models.MultiLangText{
				"th": "งานบุญประเพณี",
				"en": "Traditional Ceremony",
				"de": "Traditionelle Zeremonie",
			},
			Description: models.MultiLangText{
				"th": "งานบุญวันสำคัญทางพระพุทธศาสนาและประเพณีไทย",
				"en": "Major Buddhist holidays and traditional ceremonies",
				"de": "Wichtige buddhistische Feiertage und traditionelle Zeremonien",
			},
			IsActive:     true,
			DisplayOrder: 1,
		},
		{
			Name: models.MultiLangText{
				"th": "คอร์สปฏิบัติธรรม",
				"en": "Meditation Retreat",
				"de": "Meditationsretreat",
			},
			Description: models.MultiLangText{
				"th": "หลักสูตรฝึกสมาธิภาวนาและเจริญสติทั้งระยะสั้นและระยะยาว",
				"en": "Short and long-term Vipassana meditation courses",
				"de": "Kurz- und langfristige Vipassana-Meditationskurse",
			},
			IsActive:     true,
			DisplayOrder: 2,
		},
		{
			Name: models.MultiLangText{
				"th": "กิจกรรมวันพระ",
				"en": "Uposatha Day",
				"de": "Uposatha-Tag",
			},
			Description: models.MultiLangText{
				"th": "การทำบุญตักบาตร ฟังพระธรรมเทศนา และรักษาอุโบสถศีล",
				"en": "Almsgiving, Dhamma talks, and precept observance on lunar observance days",
				"de": "Almosen, Dhamma-Vorträge und Tugendregeln an Mondtagen",
			},
			IsActive:     true,
			DisplayOrder: 3,
		},
	}

	for _, cat := range categories {
		var existing models.EventCategory
		thName := cat.Name["th"]
		if err := s.db.Where("name->>'th' = ?", thName).First(&existing).Error; err != nil {
			s.db.Create(&cat)
		}
	}

	// 2. Calendar Resources
	cap150 := 150
	cap30 := 30
	resources := []models.CalendarResource{
		{
			Slug:         "main-sala",
			ResourceType: "location",
			Title: models.MultiLangText{
				"th": "ศาลาปฏิบัติธรรมใหญ่",
				"en": "Main Meditation Hall",
				"de": "Haupt-Meditationshalle",
			},
			Color:        "#4F46E5",
			Capacity:     &cap150,
			Metadata:     models.JSONMap{"notes": "รองรับพิธีใหญ่และทำวัตรสวดมนต์"},
			IsPublic:     true,
			IsActive:     true,
			DisplayOrder: 1,
		},
		{
			Slug:         "guest-kuti",
			ResourceType: "location",
			Title: models.MultiLangText{
				"th": "กุฏิรับรองผู้ปฏิบัติธรรม",
				"en": "Retreat Guest Quarters",
				"de": "Gästeunterkunft für Retreats",
			},
			Color:        "#059669",
			Capacity:     &cap30,
			Metadata:     models.JSONMap{"notes": "ห้องพักแยกชาย-หญิง สำหรับคอร์สค้างคืน"},
			IsPublic:     true,
			IsActive:     true,
			DisplayOrder: 2,
		},
	}

	for _, res := range resources {
		var existing models.CalendarResource
		if err := s.db.Where("slug = ?", res.Slug).First(&existing).Error; err != nil {
			s.db.Create(&res)
		}
	}

	// Retrieve category IDs
	var ceremonyCat, retreatCat models.EventCategory
	s.db.Where("name->>'th' = ?", "งานบุญประเพณี").First(&ceremonyCat)
	s.db.Where("name->>'th' = ?", "คอร์สปฏิบัติธรรม").First(&retreatCat)

	now := time.Now()
	retreatStart := now.AddDate(0, 1, 10)
	retreatEnd := retreatStart.AddDate(0, 0, 2)
	deadline := retreatStart.AddDate(0, 0, -3)
	maxP := 30

	// 3. Events
	events := []models.Event{
		{
			Slug: "vesak-festival-2026",
			Title: models.MultiLangText{
				"th": "พิธีวันวิสาขบูชา ประจำปี 2026",
				"en": "Vesak Day Celebration 2026",
				"de": "Vesakh-Fest Feier 2026",
			},
			Description: createSimpleRichText(
				"ขอเชิญพุทธศาสนิกชนร่วมทำบุญตักบาตร ถวายภัตตาหารเพล ฟังพระธรรมเทศนา และเวียนเทียนรอบอุโบสถ เนื่องในวันวิสาขบูชา วันสำคัญสากลของโลก",
				"We cordially invite everyone to join us for almsgiving, Dhamma reflection, and candlelit circumambulation in celebration of Vesak Day.",
				"Wir laden alle herzlich ein, mit uns Almosen zu geben, Dhamma-Vorträgen zu lauschen und an der traditionellen Kerzenprozession zum Vesakh-Fest teilzunehmen.",
			),
			StartDate:       time.Date(2026, 5, 24, 9, 0, 0, 0, time.UTC),
			EndDate:         time.Date(2026, 5, 24, 16, 0, 0, 0, time.UTC),
			Location:        models.MultiLangText{"th": "ศาลาใหญ่ วัดหลวงพ่อใส", "en": "Main Sala, Wat Loung Por Sai", "de": "Hauptsala, Wat Loung Por Sai"},
			ImageURL:        "https://r2.watloungporsai.de/events/vesak.jpg",
			CategoryID:      &ceremonyCat.ID,
			EventType:       "ceremony",
			IsActive:        true,
			PublishStatus:   "published",
			DonationEnabled: true,
			DisplayOrder:    1,
		},
		{
			Slug: "weekend-mindfulness-retreat",
			Title: models.MultiLangText{
				"th": "คอร์สเจริญสติภาวนาสุดสัปดาห์ (3 วัน 2 คืน)",
				"en": "Weekend Mindfulness Meditation Retreat (3 Days / 2 Nights)",
				"de": "Wochenend-Achtsamkeitsretreat (3 Tage / 2 Nächte)",
			},
			Description: createSimpleRichText(
				"หลักสูตรเรียนรู้การเจริญสติในชีวิตประจำวัน ฝึกสมาธิ เดินจงกรม นั่งสมาธิ และรับฟังคำแนะนำจากพระวิปัสสนาจารย์ เหมาะสำหรับทั้งผู้เริ่มต้นและผู้มีประสบการณ์",
				"An intensive weekend retreat focused on Vipassana mindfulness, walking meditation, sitting practice, and personal Dhamma guidance.",
				"Ein intensives Wochenend-Retreat mit Fokus auf Vipassana-Achtsamkeit, Gehmeditation, Sitzpraxis und persönlicher Dhamma-Begleitung.",
			),
			StartDate:            retreatStart,
			EndDate:              retreatEnd,
			Location:             models.MultiLangText{"th": "ศาลาปฏิบัติธรรมและกุฏิรับรอง", "en": "Meditation Hall & Quarters", "de": "Meditationshalle & Unterkunft"},
			ImageURL:             "https://r2.watloungporsai.de/events/retreat.jpg",
			CategoryID:           &retreatCat.ID,
			EventType:            "meditation_course",
			MaxParticipants:      &maxP,
			RegistrationEnabled:  true,
			RegistrationDeadline: &deadline,
			IsActive:             true,
			PublishStatus:        "published",
			DonationEnabled:      true,
			DisplayOrder:         2,
			DressCode: models.MultiLangText{
				"th": "ชุดขาวสุภาพ หรือเสื้อผ้าสีอ่อนที่สวมใส่สบาย",
				"en": "Polite white attire or comfortable light-colored clothing",
				"de": "Höfliche weiße Kleidung oder bequeme helle Kleidung",
			},
			WhatToBring: models.MultiLangText{
				"th": "ของใช้ส่วนตัว ยาประจำตัว ไฟฉาย",
				"en": "Personal toiletries, necessary medication, flashlight",
				"de": "Persönliche Toilettenartikel, notwendige Medikamente, Taschenlampe",
			},
		},
		{
			Slug: "kathina-ceremony-2026",
			Title: models.MultiLangText{
				"th": "งานทอดกฐินสามัคคี ประจำปี 2026",
				"en": "Annual Royal Kathina Robe Offering Ceremony 2026",
				"de": "Jährliche Kathina-Zeremonie 2026",
			},
			Description: createSimpleRichText(
				"งานบุญทอดกฐินสามัคคีประจำปี เพื่อสมทบทุนค่าน้ำค่าไฟและบูรณะเสนาสนะวัดหลวงพ่อใส ประเทศเยอรมนี",
				"Annual Kathina robe offering ceremony to support temple operations, maintenance, and resident Sangha.",
				"Jährliche Kathina-Robe-Opferzeremonie zur Unterstützung des Tempelbetriebs und der ansässigen Mönche.",
			),
			StartDate:       time.Date(2026, 10, 18, 9, 30, 0, 0, time.UTC),
			EndDate:         time.Date(2026, 10, 18, 16, 30, 0, 0, time.UTC),
			Location:        models.MultiLangText{"th": "วัดหลวงพ่อใส เยอรมนี", "en": "Wat Loung Por Sai, Germany", "de": "Wat Loung Por Sai, Deutschland"},
			ImageURL:        "https://r2.watloungporsai.de/events/kathina.jpg",
			CategoryID:      &ceremonyCat.ID,
			EventType:       "ceremony",
			IsActive:        true,
			PublishStatus:   "published",
			DonationEnabled: true,
			DisplayOrder:    3,
		},
	}

	for _, event := range events {
		var existing models.Event
		if err := s.db.Where("slug = ?", event.Slug).First(&existing).Error; err != nil {
			if err := s.db.Create(&event).Error; err != nil {
				return err
			}
			log.Printf("     Created event: %s", event.Slug)
		} else {
			s.db.Model(&existing).Updates(event)
		}
	}
	return nil
}
