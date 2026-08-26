package seeder

import (
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
)

func (s *Seeder) SeedCommunity() error {
	log.Println("  -> Seeding Community Q&A categories and sample discussions...")

	// 1. Categories
	categories := []models.CommunityCategory{
		{
			Slug: "meditation-practice",
			Name: models.MultiLangText{
				"th": "การปฏิบัติธรรมและการเจริญสติ",
				"en": "Meditation & Mindfulness Practice",
				"de": "Meditation & Achtsamkeitspraxis",
			},
			Description: models.MultiLangText{
				"th": "คำถามเกี่ยวกับการฝึกสมาธิ การเดินจงกรม และการนำธรรมะไปใช้ในชีวิตประจำวัน",
				"en": "Questions regarding sitting/walking meditation and applying Dhamma daily",
				"de": "Fragen zu Meditation und der Anwendung des Dhamma im Alltag",
			},
			SortOrder: 1,
			IsActive:  true,
		},
		{
			Slug: "temple-visit",
			Name: models.MultiLangText{
				"th": "การเตรียมตัวมาเยือนวัดและข้อปฏิบัติ",
				"en": "Visiting Guidelines & Temple Etiquette",
				"de": "Besucherrichtlinien & Tempel-Etikette",
			},
			Description: models.MultiLangText{
				"th": "ข้อแนะนำการแต่งกาย การเดินทาง และการปฏิบัติตนเมื่อมาวัด",
				"en": "Dress code, travel advice, and customary etiquette for temple visitors",
				"de": "Kleiderordnung, Anreise und Verhaltensregeln für Tempelbesucher",
			},
			SortOrder: 2,
			IsActive:  true,
		},
	}

	for _, cat := range categories {
		var existing models.CommunityCategory
		if err := s.db.Where("slug = ?", cat.Slug).First(&existing).Error; err != nil {
			s.db.Create(&cat)
			log.Printf("     Created community category: %s", cat.Slug)
		}
	}

	var visitCat models.CommunityCategory
	s.db.Where("slug = ?", "temple-visit").First(&visitCat)
	if visitCat.ID == uuid.Nil {
		return nil
	}

	now := time.Now()
	pubTime := now.AddDate(0, 0, -7)

	var admin models.User
	s.db.Where("email = ?", "admin@watloungporsai.de").First(&admin)

	// Sample Question
	questionTitle := "ชาวต่างชาติที่ไม่มีพื้นฐานศาสนาพุทธ สามารถมาร่วมปฏิบัติธรรมได้ไหม?"
	var existingQ models.CommunityQuestion
	if err := s.db.Where("title = ?", questionTitle).First(&existingQ).Error; err != nil {
		q := models.CommunityQuestion{
			CategoryID:           visitCat.ID,
			Locale:               "th",
			Title:                questionTitle,
			Slug:                 "can-beginners-and-foreigners-join-meditation",
			Body:                 models.RichTextDocument(`{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"สวัสดีครับ อยากสอบถามว่าถ้ามีเพื่อนชาวเยอรมันที่สนใจสมาธิ แต่ไม่เคยศึกษาศาสนาพุทธมาก่อน สามารถพามาร่วมกิจกรรมวันอาทิตย์ได้หรือไม่ครับ"}]}]}`),
			BodyText:             "สวัสดีครับ อยากสอบถามว่าถ้ามีเพื่อนชาวเยอรมันที่สนใจสมาธิ แต่ไม่เคยศึกษาศาสนาพุทธมาก่อน สามารถพามาร่วมกิจกรรมวันอาทิตย์ได้หรือไม่ครับ",
			PublicationStatus:    models.CommunityPublicationPublished,
			LifecycleStatus:      models.CommunityLifecycleAnswered,
			PublishedAnswerCount: 1,
			OfficialAnswerCount:  1,
			LastActivityAt:       now,
			PublishedAt:          &pubTime,
		}
		if err := s.db.Create(&q).Error; err != nil {
			return err
		}

		// Official Answer from Admin / Monk
		ans := models.CommunityAnswer{
			QuestionID:        q.ID,
			AuthorAdminID:     &admin.ID,
			Body:              models.RichTextDocument(`{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"ยินดีต้อนรับเป็นอย่างยิ่งครับ ทางวัดเปิดกว้างสำหรับทุกคนโดยไม่จำกัดเชื้อชาติหรือพื้นฐานทางศาสนา ในวันอาทิตย์พระอาจารย์มีคำบรรยายและแนะนำสมาธิเป็นภาษาอังกฤษและเยอรมันด้วยครับ"}]}]}`),
			BodyText:          "ยินดีต้อนรับเป็นอย่างยิ่งครับ ทางวัดเปิดกว้างสำหรับทุกคนโดยไม่จำกัดเชื้อชาติหรือพื้นฐานทางศาสนา ในวันอาทิตย์พระอาจารย์มีคำบรรยายและแนะนำสมาธิเป็นภาษาอังกฤษและเยอรมันด้วยครับ",
			PublicationStatus: models.CommunityPublicationPublished,
			IsOfficial:        true,
			OfficialByAdminID: &admin.ID,
			OfficialAt:        &pubTime,
			HelpfulCount:      12,
			PublishedAt:       &pubTime,
		}
		s.db.Create(&ans)
		s.db.Model(&q).Update("accepted_answer_id", ans.ID)
		log.Printf("     Created community Q&A: %s", questionTitle)
	}

	return nil
}
