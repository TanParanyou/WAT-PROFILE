package seeder

import (
	"log"

	"github.com/watloungporsai/wat-profile-backend/internal/models"
)

func (s *Seeder) SeedChatbotKnowledgeBase() error {
	log.Println("  -> Seeding chatbot knowledge base...")

	items := []struct {
		Category string
		Question models.MultiLangText
		Answer   models.MultiLangText
		Keywords []string
		Priority int
	}{
		{
			Category: "visiting",
			Question: models.MultiLangText{
				"th": "ข้อปฏิบัติและการแต่งกายเมื่อมาวัด",
				"en": "Visiting guidelines and dress code",
				"de": "Besucherregeln und Kleiderordnung",
			},
			Answer: models.MultiLangText{
				"th": "ขอความกรุณาแต่งกายสุภาพเรียบร้อย สวมเสื้อผ้าที่ปกปิดไหล่และเข่า ไม่สวมเสื้อผ้าที่รัดรูปหรือบางเกินไป ถอดรองเท้าก่อนเข้าศาลาหรืออุโบสถ และรักษาความสงบเรียบร้อยภายในบริเวณวัด",
				"en": "Please dress respectfully with shoulders and knees covered. Avoid tight or revealing clothing. Remove your shoes before entering the main hall or shrine, and maintain a quiet, peaceful atmosphere.",
				"de": "Bitte kleiden Sie sich respektvoll und bedecken Sie Schultern und Knie. Vermeiden Sie zu enge Kleidung. Ziehen Sie vor dem Betreten der Haupthalle die Schuhe aus und bewahren Sie die Stille im Tempelbereich.",
			},
			Keywords: []string{"แต่งกาย", "เสื้อผ้า", "ข้อปฏิบัติ", "dress code", "rules", "etiquette", "Kleidung", "Regeln"},
			Priority: 10,
		},
		{
			Category: "practice",
			Question: models.MultiLangText{
				"th": "การเข้าร่วมปฏิบัติธรรมและเจริญสติภาวนา",
				"en": "Joining meditation and Dharma practice",
				"de": "Teilnahme an Meditation und Praxis",
			},
			Answer: models.MultiLangText{
				"th": "ทางวัดเปิดต้อนรับทุกท่าน ทั้งผู้เริ่มต้นและผู้มีประสบการณ์ กิจกรรมปฏิบัติธรรมมีทั้งการเดินจงกรม นั่งสมาธิ และฟังพระธรรมเทศนา ทุกวันอาทิตย์และช่วงวันสำคัญทางศาสนา สามารถเข้าร่วมได้โดยไม่มีค่าใช้จ่าย",
				"en": "The temple welcomes everyone, both beginners and experienced practitioners. Meditation sessions include walking meditation, sitting meditation, and Dhamma talks every Sunday and on Buddhist holidays. Participation is free of charge.",
				"de": "Der Tempel heißt alle willkommen, sowohl Anfänger als auch Erfahrene. Die Meditation umfasst Gehmeditation, Sitzmeditation und Lehrreden an jedem Sonntag sowie an Feiertagen. Die Teilnahme ist kostenlos.",
			},
			Keywords: []string{"ปฏิบัติธรรม", "สมาธิ", "ภาวนา", "meditation", "mindfulness", "Dharma", "Achtsamkeit"},
			Priority: 9,
		},
		{
			Category: "general",
			Question: models.MultiLangText{
				"th": "เวลาเปิด-ปิด และการเดินทางมาวัด",
				"en": "Opening hours and how to get to the temple",
				"de": "Öffnungszeiten und Anfahrt zum Tempel",
			},
			Answer: models.MultiLangText{
				"th": "วัดเปิดทุกวัน เวลา 06:00 - 20:00 น. (เวลายุโรปกลาง CET) ตั้งอยู่ที่ Waldstraße 108, 60528 Frankfurt am Main สามารถเดินทางด้วยรถยนต์หรือระบบขนส่งสาธารณะได้อย่างสะดวก",
				"en": "The temple is open daily from 06:00 to 20:00 CET. We are located at Waldstraße 108, 60528 Frankfurt am Main, Germany. Accessible easily by car and public transport.",
				"de": "Der Tempel ist täglich von 06:00 bis 20:00 Uhr (MEZ) geöffnet. Adresse: Waldstraße 108, 60528 Frankfurt am Main. Bequem mit dem Auto und öffentlichen Verkehrsmitteln erreichbar.",
			},
			Keywords: []string{"เวลาเปิด", "เปิดปิด", "ที่อยู่", "เดินทาง", "แผนที่", "hours", "address", "location", "directions", "Öffnungszeiten", "Adresse", "Anfahrt"},
			Priority: 8,
		},
		{
			Category: "ordination",
			Question: models.MultiLangText{
				"th": "การบวชพระ หรือบวชเนกขัมมะ (ถือศีล 8)",
				"en": "Ordination and temporary retreat (8 Precepts)",
				"de": "Mönchsordination und Retreat (8 Tugendregeln)",
			},
			Answer: models.MultiLangText{
				"th": "ผู้ที่มีความประสงค์จะบวชพระหรือบวชเนกขัมมะ (ถือศีล 8 พักค้างที่วัด) กรุณาติดต่อล่วงหน้าอย่างน้อย 2 สัปดาห์ เพื่อเตรียมความพร้อมและนัดหมายสนทนากับพระอาจารย์",
				"en": "Those interested in monastic ordination or temporary retreat (observing 8 precepts at the temple) should contact the temple at least 2 weeks in advance for preparation and consultation with the senior monks.",
				"de": "Interessierte an einer Mönchsordination oder einem Retreat (8 Tugendregeln mit Übernachtung) werden gebeten, sich mindestens 2 Wochen im Voraus anzumelden, um Vorbereitungen mit den Mönchen zu besprechen.",
			},
			Keywords: []string{"บวช", "ถือศีล", "เนกขัมมะ", "ordination", "monk", "retreat", "precepts", "Ordination", "Klosteraufenthalt"},
			Priority: 7,
		},
	}

	for _, item := range items {
		var count int64
		s.db.Model(&models.ChatbotKnowledgeBase{}).Where("category = ? AND question->>'th' = ?", item.Category, item.Question.Get("th")).Count(&count)
		if count == 0 {
			kb := models.ChatbotKnowledgeBase{
				Category: item.Category,
				Question: item.Question,
				Answer:   item.Answer,
				Keywords: models.StringSlice(item.Keywords),
				Priority: item.Priority,
				IsActive: true,
			}
			if err := s.db.Create(&kb).Error; err != nil {
				return err
			}
			log.Printf("     Created chatbot KB item: %s", item.Question.Get("th"))
		}
	}

	return nil
}
