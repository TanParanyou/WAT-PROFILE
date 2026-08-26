package seeder

import (
	"log"

	"github.com/watloungporsai/wat-profile-backend/internal/models"
)

func (s *Seeder) SeedGallery() error {
	log.Println("  -> Seeding photo gallery categories and images...")

	categories := []models.GalleryCategory{
		{
			Slug: "temple-grounds",
			Name: models.MultiLangText{
				"th": "บรรยากาศวัดและเสนาสนะ",
				"en": "Temple Grounds & Architecture",
				"de": "Tempelgelände & Architektur",
			},
			DisplayOrder: 1,
			IsActive:     true,
		},
		{
			Slug: "ceremonies",
			Name: models.MultiLangText{
				"th": "งานบุญประเพณีและพิธีกรรม",
				"en": "Ceremonies & Buddhist Festivals",
				"de": "Zeremonien & Buddhistische Feste",
			},
			DisplayOrder: 2,
			IsActive:     true,
		},
		{
			Slug: "meditation",
			Name: models.MultiLangText{
				"th": "การปฏิบัติธรรมและเจริญสติ",
				"en": "Meditation & Mindfulness Practice",
				"de": "Meditation & Achtsamkeitspraxis",
			},
			DisplayOrder: 3,
			IsActive:     true,
		},
		{
			Slug: "sacred-objects",
			Name: models.MultiLangText{
				"th": "พระประธานและปูชนียวัตถุ",
				"en": "Buddha Statues & Sacred Objects",
				"de": "Buddha-Statuen & Heilige Objekte",
			},
			DisplayOrder: 4,
			IsActive:     true,
		},
	}

	for _, cat := range categories {
		var existing models.GalleryCategory
		if err := s.db.Where("slug = ?", cat.Slug).First(&existing).Error; err != nil {
			s.db.Create(&cat)
			log.Printf("     Created gallery category: %s", cat.Slug)
		}
	}

	var groundsCat, ceremonyCat, medCat, sacredCat models.GalleryCategory
	s.db.Where("slug = ?", "temple-grounds").First(&groundsCat)
	s.db.Where("slug = ?", "ceremonies").First(&ceremonyCat)
	s.db.Where("slug = ?", "meditation").First(&medCat)
	s.db.Where("slug = ?", "sacred-objects").First(&sacredCat)

	images := []models.Gallery{
		{
			ImageURL:     "https://r2.watloungporsai.de/gallery/temple-front.jpg",
			ThumbnailURL: "https://r2.watloungporsai.de/gallery/thumb-temple-front.jpg",
			Caption: models.MultiLangText{
				"th": "ทัศนียภาพด้านหน้าศาลาใหญ่ วัดหลวงพ่อใส",
				"en": "Front facade of the Main Sala at Wat Loung Por Sai",
				"de": "Vorderansicht der Hauptsala des Wat Loung Por Sai",
			},
			CategoryID:   &groundsCat.ID,
			DisplayOrder: 1,
			IsActive:     true,
		},
		{
			ImageURL:     "https://r2.watloungporsai.de/gallery/buddha-statue.jpg",
			ThumbnailURL: "https://r2.watloungporsai.de/gallery/thumb-buddha-statue.jpg",
			Caption: models.MultiLangText{
				"th": "พระประธานประจำอุโบสถ พระพุทธรูปจำลองหลวงพ่อพระใส",
				"en": "Principal Buddha Image in the Main Hall",
				"de": "Haupt-Buddhabildnis in der Haupthalle",
			},
			CategoryID:   &sacredCat.ID,
			DisplayOrder: 2,
			IsActive:     true,
		},
		{
			ImageURL:     "https://r2.watloungporsai.de/gallery/meditation-session.jpg",
			ThumbnailURL: "https://r2.watloungporsai.de/gallery/thumb-meditation-session.jpg",
			Caption: models.MultiLangText{
				"th": "การนั่งสมาธิภาวนาช่วงค่ำในศาลาปฏิบัติธรรม",
				"en": "Evening meditation session in the quiet hall",
				"de": "Abendliche Meditationssitzung in der stillen Halle",
			},
			CategoryID:   &medCat.ID,
			DisplayOrder: 3,
			IsActive:     true,
		},
		{
			ImageURL:     "https://r2.watloungporsai.de/gallery/almsgiving-ceremony.jpg",
			ThumbnailURL: "https://r2.watloungporsai.de/gallery/thumb-almsgiving-ceremony.jpg",
			Caption: models.MultiLangText{
				"th": "ญาติโยมร่วมตักบาตรพระสงฆ์ในวันวิสาขบูชา",
				"en": "Morning almsgiving ceremony during Vesak Day",
				"de": "Morgendliche Almosengabe während des Vesakh-Festes",
			},
			CategoryID:   &ceremonyCat.ID,
			DisplayOrder: 4,
			IsActive:     true,
		},
	}

	for _, img := range images {
		var existing models.Gallery
		if err := s.db.Where("image_url = ?", img.ImageURL).First(&existing).Error; err != nil {
			s.db.Create(&img)
			log.Printf("     Created gallery item: %s", img.ImageURL)
		}
	}
	return nil
}
