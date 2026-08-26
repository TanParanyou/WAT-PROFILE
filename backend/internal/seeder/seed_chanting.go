package seeder

import (
	"log"

	"github.com/watloungporsai/wat-profile-backend/internal/models"
)

func (s *Seeder) SeedChanting() error {
	log.Println("  -> Seeding Buddhist chanting texts...")

	chants := []models.Chanting{
		{
			Slug: "morning-chanting",
			Title: models.MultiLangText{
				"th": "บททำวัตรเช้า",
				"en": "Morning Chanting",
				"de": "Morgendliches Chanten",
			},
			Subtitle: models.MultiLangText{
				"th": "สรรเสริญพระรัตนตรัย (นมการสิทธิคาถา)",
				"en": "Homage to the Triple Gem",
				"de": "Huldigung an die Drei Juwelen",
			},
			Category:  "daily",
			PaliThai:  "โย โส ภะคะวา อะระหัง สัมมาสัมพุทโธ, สวากขาโต เยนะ ภะคะวะตา ธัมโม, สุปะฏิปันโน ยัสสะ ภะคะวะโต สาวะกะสังโฆ...",
			PaliRoman: "Yo so bhagavā arahaṃ sammāsambuddho, svākkhāto yena bhagavatā dhammo, supaṭipanno yassa bhagavato sāvakasaṅgho...",
			Translation: models.MultiLangText{
				"th": "พระผู้มีพระภาคเจ้านั้น พระองค์ใด ทรงเป็นพระอรหันต์ ตรัสรู้ชอบได้โดยพระองค์เอง...",
				"en": "The Blessed One is the Worthy One, fully enlightened by himself...",
				"de": "Der Erhabene ist der Würdige, der vollkommen Erleuchtete aus eigener Kraft...",
			},
			AudioURL:        "https://r2.watloungporsai.de/audio/morning-chant.mp3",
			DurationSeconds: 900,
			DisplayOrder:    1,
			IsActive:        true,
		},
		{
			Slug: "evening-chanting",
			Title: models.MultiLangText{
				"th": "บททำวัตรเย็น",
				"en": "Evening Chanting",
				"de": "Abendliches Chanten",
			},
			Subtitle: models.MultiLangText{
				"th": "พุทธานุสสติ ธัมมานุสสติ สังฆานุสสติ",
				"en": "Recollection of the Buddha, Dhamma, and Sangha",
				"de": "Besinnung auf Buddha, Dhamma und Sangha",
			},
			Category:  "daily",
			PaliThai:  "พุทโธ สุสุทโธ กะรุณามะหัณณะโว, โยจจันตะสุทธัพพะละญาณะโลจะโน...",
			PaliRoman: "Buddho susuddho karuṇāmahaṇṇavo, yoccantasuddhabbhalañāṇalocano...",
			Translation: models.MultiLangText{
				"th": "พระพุทธเจ้าผู้บริสุทธิ์ มีพระกรุณาดุจห้วงมหรรณพ...",
				"en": "The Buddha, utterly pure, possessing an ocean of great compassion...",
				"de": "Der Buddha, vollkommen rein, voll von einem Ozean großen Mitgefühls...",
			},
			AudioURL:        "https://r2.watloungporsai.de/audio/evening-chant.mp3",
			DurationSeconds: 1200,
			DisplayOrder:    2,
			IsActive:        true,
		},
		{
			Slug: "metta-sutta",
			Title: models.MultiLangText{
				"th": "บทแผ่เมตตา",
				"en": "Universal Loving-Kindness (Metta Sutta)",
				"de": "Universelle Liebende Güte (Metta Sutta)",
			},
			Subtitle: models.MultiLangText{
				"th": "แผ่เมตตาแก่สรรพสัตว์ทั้งหลาย",
				"en": "Spreading goodwill to all living beings",
				"de": "Verbreitung von Wohlwollen an alle Lebewesen",
			},
			Category:  "protection",
			PaliThai:  "สัพเพ สัตตา อะเวรา โหนตุ, อัพยาปัชฌา โหนตุ, อะนีฆา โหนตุ, สุขี อัตตานัง ปะริหะรันตุ...",
			PaliRoman: "Sabbe sattā averā hontu, abyāpajjhā hontu, anīghā hontu, sukhī attānaṃ pariharantu...",
			Translation: models.MultiLangText{
				"th": "ขอสัตว์ทั้งหลายทั้งปวง จงเป็นผู้ไม่มีเวรต่อกัน จงเป็นผู้ไม่มีความเบียดเบียนกัน...",
				"en": "May all living beings live free from hostility, free from harm, and live happily...",
				"de": "Mögen alle Lebewesen frei von Feindschaft und Leid leben und ihr Wohl bewahren...",
			},
			AudioURL:        "https://r2.watloungporsai.de/audio/metta.mp3",
			DurationSeconds: 300,
			DisplayOrder:    3,
			IsActive:        true,
		},
	}

	for _, chant := range chants {
		var existing models.Chanting
		if err := s.db.Where("slug = ?", chant.Slug).First(&existing).Error; err != nil {
			s.db.Create(&chant)
			log.Printf("     Created chanting text: %s", chant.Slug)
		}
	}
	return nil
}
