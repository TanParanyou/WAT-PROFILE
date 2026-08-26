package seeder

import (
	"encoding/json"
	"log"

	"github.com/watloungporsai/wat-profile-backend/internal/models"
)

func createSimpleRichText(th, en, de string) models.LocalizedRichText {
	mkDoc := func(text string) json.RawMessage {
		doc := map[string]interface{}{
			"type": "doc",
			"content": []map[string]interface{}{
				{
					"type": "paragraph",
					"content": []map[string]interface{}{
						{
							"type": "text",
							"text": text,
						},
					},
				},
			},
		}
		b, _ := json.Marshal(doc)
		return json.RawMessage(b)
	}

	return models.LocalizedRichText{
		"th": mkDoc(th),
		"en": mkDoc(en),
		"de": mkDoc(de),
	}
}

func (s *Seeder) SeedMonks() error {
	log.Println("  -> Seeding monks directory...")

	monks := []models.Monk{
		{
			Slug:     "luang-por-suthas",
			ImageURL: "https://r2.watloungporsai.de/monks/luang-por-suthas.jpg",
			Name: models.MultiLangText{
				"th": "พระครูวิเทศธรรมภาณ (สุทัศน์)",
				"en": "Phra Kru Viteddhammabhan (Suthas)",
				"de": "Phra Kru Viteddhammabhan (Suthas)",
			},
			Title: models.MultiLangText{
				"th": "เจ้าอาวาสวัดหลวงพ่อใส",
				"en": "Abbot of Wat Loung Por Sai",
				"de": "Abt des Wat Loung Por Sai",
			},
			DharmaName: models.MultiLangText{
				"th": "ญาณสํวโร",
				"en": "Yanasamvaro",
				"de": "Yanasamvaro",
			},
			Education: models.MultiLangText{
				"th": "นักธรรมเอก, พุทธศาสตรบัณฑิต",
				"en": "Nak Tham Ek, B.A. Buddhist Studies",
				"de": "Höherer Dhamma-Abschluss, B.A. Buddhistische Studien",
			},
			Bio: createSimpleRichText(
				"พระครูวิเทศธรรมภาณ ได้รับการแต่งตั้งเป็นเจ้าอาวาสวัดหลวงพ่อใส ท่านได้อุทิศตนเพื่อการเผยแผ่พระพุทธศาสนาและการปฏิบัติวิปัสสนากรรมฐานในประเทศเยอรมนีมากว่า 20 ปี",
				"Phra Kru Viteddhammabhan has served as Abbot of Wat Loung Por Sai, dedicating over 20 years to spreading Theravada Buddhism and Vipassana meditation in Germany.",
				"Phra Kru Viteddhammabhan dient als Abt des Wat Loung Por Sai und widmet sich seit über 20 Jahren der Verbreitung des Theravada-Buddhismus und der Vipassana-Meditation in Deutschland.",
			),
			Position:     "abbot",
			DisplayOrder: 1,
			IsActive:     true,
		},
		{
			Slug:     "phra-maha-pairote",
			ImageURL: "https://r2.watloungporsai.de/monks/phra-maha-pairote.jpg",
			Name: models.MultiLangText{
				"th": "พระมหาไพโรจน์",
				"en": "Phra Maha Pairote",
				"de": "Phra Maha Pairote",
			},
			Title: models.MultiLangText{
				"th": "รองเจ้าอาวาสและพระวิปัสสนาจารย์",
				"en": "Vice Abbot & Meditation Teacher",
				"de": "Stellvertretender Abt & Meditationslehrer",
			},
			DharmaName: models.MultiLangText{
				"th": "ปญฺญาวชิโร",
				"en": "Panyavachiro",
				"de": "Panyavachiro",
			},
			Education: models.MultiLangText{
				"th": "เปรียญธรรม ๗ ประโยค",
				"en": "Pali Grade 7",
				"de": "Pali-Grad 7",
			},
			Bio: createSimpleRichText(
				"พระมหาไพโรจน์ เป็นพระวิทยากรผู้เชี่ยวชาญด้านพระไตรปิฎกและการสอนสมาธิภาวนาสำหรับทั้งชาวไทยและชาวเยอรมัน",
				"Phra Maha Pairote specializes in Tipitaka studies and conducts bilingual meditation sessions for Thai and international practitioners.",
				"Phra Maha Pairote ist spezialisiert auf Tipitaka-Studien und leitet zweisprachige Meditationskurse für thailändische und internationale Praktizierende.",
			),
			Position:     "vice_abbot",
			DisplayOrder: 2,
			IsActive:     true,
		},
		{
			Slug:     "phra-ajahn-suchart",
			ImageURL: "https://r2.watloungporsai.de/monks/phra-ajahn-suchart.jpg",
			Name: models.MultiLangText{
				"th": "พระอาจารย์สุชาติ",
				"en": "Phra Ajahn Suchart",
				"de": "Phra Ajahn Suchart",
			},
			Title: models.MultiLangText{
				"th": "พระวิทยากรประจำหลักสูตรปฏิบัติธรรม",
				"en": "Resident Meditation Teacher",
				"de": "Ansässiger Meditationslehrer",
			},
			DharmaName: models.MultiLangText{
				"th": "สุจิตฺโต",
				"en": "Suchitto",
				"de": "Suchitto",
			},
			Education: models.MultiLangText{
				"th": "นักธรรมเอก",
				"en": "Nak Tham Ek",
				"de": "Nak Tham Ek",
			},
			Bio: createSimpleRichText(
				"พระอาจารย์สุชาติ มีประสบการณ์การปฏิบัติธรรมตามแนวทางพระป่า และเป็นผู้ดูแลการอบรมการเจริญสติในชีวิตประจำวัน",
				"Phra Ajahn Suchart practices in the Thai Forest Tradition and guides daily mindfulness training.",
				"Phra Ajahn Suchart praktiziert in der thailändischen Waldtradition und leitet das tägliche Achtsamkeitstraining.",
			),
			Position:     "monk",
			DisplayOrder: 3,
			IsActive:     true,
		},
	}

	for _, monk := range monks {
		var existing models.Monk
		if err := s.db.Where("slug = ?", monk.Slug).First(&existing).Error; err != nil {
			if err := s.db.Create(&monk).Error; err != nil {
				return err
			}
			log.Printf("     Created monk: %s", monk.Slug)
		} else {
			s.db.Model(&existing).Updates(monk)
		}
	}
	return nil
}
