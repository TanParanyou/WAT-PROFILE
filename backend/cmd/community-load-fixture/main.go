package main

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"github.com/watloungporsai/wat-profile-backend/internal/config"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm/clause"
)

const fixtureNamespace = "https://wat-loung-por-sai.example/community-fixture"

func main() {
	_ = godotenv.Load()
	if os.Getenv("ENV") == "production" {
		log.Fatal("community-load-fixture refuses ENV=production")
	}
	if os.Getenv("COMMUNITY_FIXTURE_CONFIRM") != "generate" {
		log.Fatal("set COMMUNITY_FIXTURE_CONFIRM=generate to run the fixture")
	}
	questions := envInt("COMMUNITY_FIXTURE_QUESTIONS", 100000)
	answersPerQuestion := envInt("COMMUNITY_FIXTURE_ANSWERS_PER_QUESTION", 5)
	if questions < 1 || answersPerQuestion < 1 {
		log.Fatal("fixture counts must be positive")
	}
	if err := config.InitDatabase(); err != nil {
		log.Fatal(err)
	}
	defer config.CloseDatabase()

	users := fixtureUsers()
	if err := config.DB.Clauses(clause.OnConflict{DoNothing: true}).CreateInBatches(&users, 100).Error; err != nil {
		log.Fatal(err)
	}
	profiles := fixtureProfiles(users)
	if err := config.DB.Clauses(clause.OnConflict{DoNothing: true}).CreateInBatches(&profiles, 100).Error; err != nil {
		log.Fatal(err)
	}
	categories := []uuid.UUID{
		uuid.MustParse("10000000-0000-4000-8000-000000000001"),
		uuid.MustParse("10000000-0000-4000-8000-000000000002"),
		uuid.MustParse("10000000-0000-4000-8000-000000000003"),
		uuid.MustParse("10000000-0000-4000-8000-000000000004"),
	}
	now := time.Now().UTC()
	for offset := 0; offset < questions; offset += 1000 {
		end := offset + 1000
		if end > questions {
			end = questions
		}
		batch := make([]models.CommunityQuestion, 0, end-offset)
		answers := make([]models.CommunityAnswer, 0, (end-offset)*answersPerQuestion)
		for index := offset; index < end; index++ {
			questionID := fixtureID("question", index)
			author := users[index%len(users)].ID
			category := categories[index%len(categories)]
			body := models.RichTextDocument(fmt.Sprintf(`{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Fixture question %d for Community performance testing."}]}]}`, index))
			batch = append(batch, models.CommunityQuestion{ID: questionID, AuthorUserID: &author, CategoryID: category, Locale: []string{"th", "en", "de"}[index%3], Title: fmt.Sprintf("Community fixture question %06d", index), Slug: fmt.Sprintf("community-fixture-%06d", index), Body: body, BodyText: fmt.Sprintf("Fixture question %d for Community performance testing.", index), PublicationStatus: models.CommunityPublicationPublished, LifecycleStatus: models.CommunityLifecycleAnswered, PublishedAnswerCount: answersPerQuestion, Version: 1, ClientRequestID: fixtureID("request-question", index), LastActivityAt: now, PublishedAt: &now, CreatedAt: now, UpdatedAt: now})
			for answerIndex := 0; answerIndex < answersPerQuestion; answerIndex++ {
				answerID := fixtureID(fmt.Sprintf("answer-%d", answerIndex), index)
				answerAuthor := users[(index+answerIndex+1)%len(users)].ID
				answerBody := models.RichTextDocument(fmt.Sprintf(`{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Fixture answer %d-%d for Community performance testing."}]}]}`, index, answerIndex))
				answers = append(answers, models.CommunityAnswer{ID: answerID, QuestionID: questionID, AuthorUserID: &answerAuthor, Body: answerBody, BodyText: fmt.Sprintf("Fixture answer %d-%d for Community performance testing.", index, answerIndex), PublicationStatus: models.CommunityPublicationPublished, HelpfulCount: 0, Version: 1, ClientRequestID: fixtureID(fmt.Sprintf("request-answer-%d", answerIndex), index), PublishedAt: &now, CreatedAt: now, UpdatedAt: now})
			}
		}
		if err := config.DB.Clauses(clause.OnConflict{DoNothing: true}).CreateInBatches(&batch, 1000).Error; err != nil {
			log.Fatal(err)
		}
		if err := config.DB.Clauses(clause.OnConflict{DoNothing: true}).CreateInBatches(&answers, 1000).Error; err != nil {
			log.Fatal(err)
		}
	}
	log.Printf("created Community fixture target: %d questions, %d answers", questions, questions*answersPerQuestion)
}

func envInt(key string, fallback int) int {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(value)
	if err != nil {
		log.Fatalf("%s must be an integer", key)
	}
	return parsed
}

func fixtureID(kind string, index int) uuid.UUID {
	return uuid.NewSHA1(uuid.NameSpaceURL, []byte(fmt.Sprintf("%s/%s/%d", fixtureNamespace, kind, index)))
}

func fixtureUsers() []models.User {
	users := make([]models.User, 10)
	for index := range users {
		users[index] = models.User{ID: fixtureID("user", index), Email: fmt.Sprintf("community-fixture-%02d@example.invalid", index), Name: fmt.Sprintf("Community Fixture %02d", index), EmailVerified: true, IsActive: true, AccountStatus: models.AccountStatusActive}
	}
	return users
}

func fixtureProfiles(users []models.User) []models.AccountProfile {
	profiles := make([]models.AccountProfile, 0, len(users))
	for index, user := range users {
		profiles = append(profiles, models.AccountProfile{ID: fixtureID("profile", index), UserID: user.ID, DisplayName: user.Name, PreferredLocale: "en"})
	}
	return profiles
}
