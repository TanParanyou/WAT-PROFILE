package seeder

import (
	"encoding/json"
	"log"
	"time"

	"github.com/watloungporsai/wat-profile-backend/internal/models"
)

// SeedNewsAndAlerts seeds initial news categories, demo articles, and site alerts
func (s *Seeder) SeedNewsAndAlerts() error {
	log.Println("  -> Seeding news categories, articles, and site alerts...")

	// 1. Categories
	categories := []models.NewsCategory{
		{
			Slug: "temple-news",
			Name: models.MultiLangText{
				"th": "ข่าวประชาสัมพันธ์วัด",
				"en": "Temple News & Announcements",
				"de": "Tempel-Nachrichten & Ankündigungen",
			},
			Description: models.MultiLangText{
				"th": "ข่าวสาร งานบุญ และความเคลื่อนไหวทั่วไปของวัดหลวงพ่อใส",
				"en": "General news, merit events, and updates from Wat Loung Por Sai",
				"de": "Allgemeine Neuigkeiten und Aktivitäten von Wat Loung Por Sai",
			},
			IsActive:     true,
			DisplayOrder: 1,
		},
		{
			Slug: "dhamma-stories",
			Name: models.MultiLangText{
				"th": "เกร็ดธรรมะและเรื่องราว",
				"en": "Dhamma Stories & Articles",
				"de": "Dhamma-Geschichten & Artikel",
			},
			Description: models.MultiLangText{
				"th": "บทความธรรมะและข้อคิดสำหรับการดำเนินชีวิตและการปฏิบัติจิต",
				"en": "Dhamma reflections and stories for mindful daily practice",
				"de": "Dhamma-Reflexionen und Geschichten für die tägliche Praxis",
			},
			IsActive:     true,
			DisplayOrder: 2,
		},
		{
			Slug: "activity-reports",
			Name: models.MultiLangText{
				"th": "ภาพบรรยากาศและรายงานกิจกรรม",
				"en": "Activity Reports & Highlights",
				"de": "Aktivitätsberichte & Eindrücke",
			},
			Description: models.MultiLangText{
				"th": "รายงานสรุปกิจกรรมและประมวลภาพงานบุญที่ผ่านมา",
				"en": "Summary reports and photo reviews of past temple ceremonies",
				"de": "Zusammenfassungen und Rückblicke vergangener Veranstaltungen",
			},
			IsActive:     true,
			DisplayOrder: 3,
		},
	}

	for _, cat := range categories {
		var existing models.NewsCategory
		if err := s.db.Where("slug = ?", cat.Slug).First(&existing).Error; err != nil {
			if err := s.db.Create(&cat).Error; err != nil {
				log.Printf("Failed to seed category %s: %v", cat.Slug, err)
			}
		}
	}

	// 2. Demo Articles
	var templeCat models.NewsCategory
	s.db.Where("slug = ?", "temple-news").First(&templeCat)

	now := time.Now()
	thContent, _ := json.Marshal(map[string]interface{}{
		"type": "doc",
		"content": []map[string]interface{}{
			{
				"type": "paragraph",
				"content": []map[string]interface{}{
					{"type": "text", "text": "ขอเชิญชวนสาธุชนทุกท่านร่วมอนุโมทนาบุญในการปรับปรุงศาลาปฏิบัติธรรมหลังใหม่ ซึ่งได้ดำเนินการเสร็จสิ้นเรียบร้อยแล้ว โดยได้รับการสนับสนุนจากญาติโยมทั้งชาวไทยและชาวเยอรมัน ศาลาใหม่นี้พร้อมรองรับการจัดกิจกรรมปฏิบัติธรรม นั่งสมาธิ และฟังพระธรรมเทศนาอย่างสงบและเรียบร้อย"},
				},
			},
		},
	})
	enContent, _ := json.Marshal(map[string]interface{}{
		"type": "doc",
		"content": []map[string]interface{}{
			{
				"type": "paragraph",
				"content": []map[string]interface{}{
					{"type": "text", "text": "We welcome all practitioners to visit our newly renovated meditation hall. Completed with the kind support of the Thai and German communities, the hall offers a peaceful environment for meditation, chanting, and Dhamma talks."},
				},
			},
		},
	})
	deContent, _ := json.Marshal(map[string]interface{}{
		"type": "doc",
		"content": []map[string]interface{}{
			{
				"type": "paragraph",
				"content": []map[string]interface{}{
					{"type": "text", "text": "Wir laden alle Praktizierenden herzlich in unsere neu renovierte Meditationshalle ein. Sie bietet einen ruhigen Ort für Meditation und Dhamma-Vorträge."},
				},
			},
		},
	})

	articles := []models.NewsArticle{
		{
			Slug: "wat-renovation-completion-2026",
			Title: models.MultiLangText{
				"th": "ปรับปรุงศาลาปฏิบัติธรรมหลังใหม่เสร็จสมบูรณ์ พร้อมรองรับผู้มาปฏิบัติธรรม",
				"en": "Meditation Hall Renovation Completed, Ready to Welcome Practitioners",
				"de": "Renovierung der Meditationshalle abgeschlossen",
			},
			Excerpt: models.MultiLangText{
				"th": "วัดหลวงพ่อใสขออนุโมทนาบุญกับญาติโยมทุกท่านที่ร่วมบุญปรับปรุงศาลาปฏิบัติธรรม ขณะนี้พร้อมเปิดใช้งานแล้ว",
				"en": "Wat Loung Por Sai rejoices in the merits of all supporters. The newly renovated meditation hall is now open.",
				"de": "Die renovierte Meditationshalle ist fertiggestellt und bereit für Praktizierende.",
			},
			Content: models.LocalizedRichText{
				"th": thContent,
				"en": enContent,
				"de": deContent,
			},
			CoverImageURL: "/images/hero-bg.jpg",
			CategoryID:    &templeCat.ID,
			AuthorName:    "Wat Loung Por Sai",
			PublishStatus: "published",
			PublishedAt:   &now,
			IsFeatured:    true,
			IsPinned:      true,
			ViewCount:     128,
		},
	}

	for _, art := range articles {
		var existing models.NewsArticle
		if err := s.db.Where("slug = ?", art.Slug).First(&existing).Error; err != nil {
			if err := s.db.Create(&art).Error; err != nil {
				log.Printf("Failed to seed article %s: %v", art.Slug, err)
			}
		}
	}

	// 3. Demo Site Alert
	alerts := []models.SiteAlert{
		{
			Title: models.MultiLangText{
				"th": "ข้อควรปฏิบัติในการมาวัดช่วงฤดูหนาว",
				"en": "Winter Visit Guidelines",
				"de": "Hinweise für Tempelbesuche im Winter",
			},
			Message: models.MultiLangText{
				"th": "เนื่องจากสภาพอากาศมีหิมะตก ขอให้ผู้เดินทางสวมเสื้อผ้าให้อบอุ่น และใช้ทางเข้าหลักฝั่งศาลาใหญ่",
				"en": "Due to winter weather, please dress warmly and use the main entrance of the main hall.",
				"de": "Bitte kleiden Sie sich warm und nutzen Sie den Haupteingang der Haupthalle.",
			},
			Severity:      "info",
			DisplayType:   "top_banner",
			Scope:         "all_pages",
			ActionText:    models.MultiLangText{"th": "ดูแผนที่และการเดินทาง", "en": "View Transport Info", "de": "Anfahrt ansehen"},
			ActionURL:     "/contact",
			StartsAt:      &now,
			IsActive:      true,
			DisplayOrder:  1,
			IsDismissible: true,
		},
	}

	for _, alert := range alerts {
		var existing models.SiteAlert
		if err := s.db.Where("title->>'th' = ?", alert.Title["th"]).First(&existing).Error; err != nil {
			if err := s.db.Create(&alert).Error; err != nil {
				log.Printf("Failed to seed site alert: %v", err)
			}
		}
	}

	return nil
}
