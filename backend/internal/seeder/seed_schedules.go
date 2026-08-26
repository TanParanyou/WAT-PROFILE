package seeder

import (
	"log"
	"time"

	"github.com/watloungporsai/wat-profile-backend/internal/models"
)

func parseTime(hhmm string) *time.Time {
	t, err := time.Parse("15:04", hhmm)
	if err != nil {
		return nil
	}
	return &t
}

func (s *Seeder) SeedSchedules() error {
	log.Println("  -> Seeding daily and weekly schedules...")

	sunday := 0

	schedules := []models.Schedule{
		{
			ScheduleType: "daily",
			TimeStart:    parseTime("05:30"),
			TimeEnd:      parseTime("06:30"),
			Activity: models.MultiLangText{
				"th": "ทำวัตรเช้าและเจริญจิตตภาวนา",
				"en": "Morning Chanting & Meditation",
				"de": "Morgendliches Chanten & Meditation",
			},
			Location: models.MultiLangText{
				"th": "ศาลาใหญ่",
				"en": "Main Sala",
				"de": "Hauptsala",
			},
			DisplayOrder: 1,
			IsActive:     true,
		},
		{
			ScheduleType: "daily",
			TimeStart:    parseTime("07:00"),
			TimeEnd:      parseTime("08:30"),
			Activity: models.MultiLangText{
				"th": "พระสงฆ์ออกรับบิณฑบาตและฉันภัตตาหารเช้า",
				"en": "Morning Alms Round & Monastic Breakfast",
				"de": "Morgendliche Almosengabe & Frühstück",
			},
			Location: models.MultiLangText{
				"th": "ลานวัดและศาลาฉัน",
				"en": "Temple Yard & Dining Hall",
				"de": "Tempelhof & Speisesaal",
			},
			DisplayOrder: 2,
			IsActive:     true,
		},
		{
			ScheduleType: "daily",
			TimeStart:    parseTime("11:00"),
			TimeEnd:      parseTime("12:30"),
			Activity: models.MultiLangText{
				"th": "ถวายภัตตาหารเพลและรับประทานอาหารร่วมกัน",
				"en": "Midday Meal Offering & Community Lunch",
				"de": "Mittagsmahl-Opfergabe & Gemeinschaftsessen",
			},
			Location: models.MultiLangText{
				"th": "ศาลาฉัน",
				"en": "Dining Hall",
				"de": "Speisesaal",
			},
			DisplayOrder: 3,
			IsActive:     true,
		},
		{
			ScheduleType: "daily",
			TimeStart:    parseTime("18:00"),
			TimeEnd:      parseTime("19:30"),
			Activity: models.MultiLangText{
				"th": "ทำวัตรเย็นและสนทนาธรรม",
				"en": "Evening Chanting & Dhamma Discussion",
				"de": "Abendliches Chanten & Dhamma-Gespräch",
			},
			Location: models.MultiLangText{
				"th": "ศาลาใหญ่",
				"en": "Main Sala",
				"de": "Hauptsala",
			},
			DisplayOrder: 4,
			IsActive:     true,
		},
		{
			ScheduleType: "weekly",
			DayOfWeek:    &sunday,
			TimeStart:    parseTime("14:00"),
			TimeEnd:      parseTime("16:00"),
			Activity: models.MultiLangText{
				"th": "ชั้นเรียนธรรมะและภาษาไทยสำหรับเยาวชนและผู้สนใจ",
				"en": "Sunday Dhamma & Cultural Study Class",
				"de": "Sonntäglicher Dhamma- und Sprachkurs",
			},
			Location: models.MultiLangText{
				"th": "ห้องเรียนธรรมะ",
				"en": "Classroom",
				"de": "Klassenzimmer",
			},
			DisplayOrder: 5,
			IsActive:     true,
		},
	}

	for _, sched := range schedules {
		var existing models.Schedule
		thAct := sched.Activity["th"]
		if err := s.db.Where("activity->>'th' = ?", thAct).First(&existing).Error; err != nil {
			s.db.Create(&sched)
			log.Printf("     Created schedule: %s", thAct)
		}
	}
	return nil
}
