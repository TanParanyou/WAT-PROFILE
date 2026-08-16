package services

import (
	"context"
	"fmt"
	"html"
	"net/url"
	"strings"

	"github.com/watloungporsai/wat-profile-backend/internal/accountauth"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
)

type CommunityEmailService struct {
	db          *gorm.DB
	sender      accountauth.EmailSender
	frontendURL string
}

func NewCommunityEmailService(db *gorm.DB, sender accountauth.EmailSender, frontendURL string) (*CommunityEmailService, error) {
	frontendURL = strings.TrimRight(strings.TrimSpace(frontendURL), "/")
	parsed, err := url.Parse(frontendURL)
	if err != nil || parsed.Scheme == "" || parsed.Host == "" {
		return nil, fmt.Errorf("community email frontend URL is invalid")
	}
	if db == nil || sender == nil {
		return nil, fmt.Errorf("community email dependencies are not configured")
	}
	return &CommunityEmailService{db: db, sender: sender, frontendURL: frontendURL}, nil
}

func (s *CommunityEmailService) Send(ctx context.Context, job models.OperationOutbox) error {
	var notification models.CommunityNotification
	if err := s.db.WithContext(ctx).First(&notification, "id = ?", job.AggregateID).Error; err != nil {
		return err
	}
	var user models.User
	if err := s.db.WithContext(ctx).First(&user, "id = ?", notification.RecipientUserID).Error; err != nil {
		return err
	}
	if !user.IsActive || user.AccountStatus == models.AccountStatusClosed || user.AccountStatus == models.AccountStatusDisabled {
		return nil
	}
	if strings.TrimSpace(user.Email) == "" {
		return fmt.Errorf("notification recipient email is empty")
	}
	locale := "en"
	var profile models.AccountProfile
	if err := s.db.WithContext(ctx).Where("user_id = ?", user.ID).First(&profile).Error; err == nil && profile.PreferredLocale != "" {
		locale = profile.PreferredLocale
	}
	if locale != "th" && locale != "en" && locale != "de" {
		locale = "en"
	}
	if notification.EventType != "community.moderation" {
		var preference models.CommunityNotificationPreference
		if err := s.db.WithContext(ctx).First(&preference, "user_id = ?", user.ID).Error; err == nil {
			key := map[string]string{"community.answer.created": "answer_created", "community.comment.created": "comment_created", "community.accepted": "accepted_answer", "community.helpful": "helpful_vote", "community.official": "official_answer", "community.approval": "first_contribution", "community.revision": "revision_decision"}[notification.EventType]
			if enabled, ok := preference.EmailPreferences[key].(bool); ok && !enabled {
				return nil
			}
		}
	}
	title, body := communityEmailCopy(locale, notification.EventType)
	actionURL := s.frontendURL + "/" + locale + "/community"
	if notification.TargetID != nil && notification.TargetType == "question" {
		actionURL += "/q/" + notification.TargetID.String()
	}
	body = body + "\n\n" + actionURL
	return s.sender.Send(ctx, accountauth.EmailMessage{To: user.Email, Locale: locale, Subject: title, Body: body, HTML: "<p>" + html.EscapeString(body) + "</p>", ActionURL: actionURL})
}

func communityEmailCopy(locale, eventType string) (string, string) {
	copies := map[string]map[string][2]string{
		"th": {"community.answer.created": {"มีคำตอบใหม่ในชุมชน", "มีสมาชิกตอบคำถามของคุณแล้ว"}, "community.comment.created": {"มีความคิดเห็นใหม่ในชุมชน", "มีความคิดเห็นใหม่ในบทสนทนาของคุณ"}, "community.accepted": {"คำตอบของคุณได้รับการยอมรับ", "ผู้ถามยอมรับคำตอบของคุณแล้ว"}, "community.helpful": {"มีคนกดว่าคำตอบเป็นประโยชน์", "สมาชิกเห็นว่าคำตอบของคุณเป็นประโยชน์"}, "community.official": {"คำตอบของคุณได้รับการรับรอง", "ทีมวัดทำเครื่องหมายคำตอบของคุณเป็นคำตอบทางการ"}, "community.approval": {"โพสต์แรกได้รับการตรวจสอบ", "ทีมวัดตรวจสอบโพสต์แรกของคุณแล้ว"}, "community.revision": {"การแก้ไขได้รับการตรวจสอบ", "ทีมวัดตรวจสอบการแก้ไข Community ของคุณแล้ว"}, "community.moderation": {"อัปเดตการตรวจสอบชุมชน", "ทีมวัดอัปเดตสถานะเนื้อหาของคุณ"}},
		"en": {"community.answer.created": {"New Community answer", "Someone answered your question."}, "community.comment.created": {"New Community comment", "Someone added a comment to your conversation."}, "community.accepted": {"Your answer was accepted", "The asker accepted your answer."}, "community.helpful": {"Your answer was marked helpful", "A member marked your answer as helpful."}, "community.official": {"Your answer is official", "The temple team marked your answer as official."}, "community.approval": {"Your first contribution was reviewed", "The temple team reviewed your first contribution."}, "community.revision": {"Your edit was reviewed", "The temple team reviewed your Community edit."}, "community.moderation": {"Community moderation update", "The temple team updated your Community content."}},
		"de": {"community.answer.created": {"Neue Community-Antwort", "Jemand hat Ihre Frage beantwortet."}, "community.comment.created": {"Neuer Community-Kommentar", "Jemand hat einen Kommentar hinzugefügt."}, "community.accepted": {"Ihre Antwort wurde akzeptiert", "Der Fragesteller hat Ihre Antwort akzeptiert."}, "community.helpful": {"Ihre Antwort war hilfreich", "Ein Mitglied hat Ihre Antwort als hilfreich markiert."}, "community.official": {"Ihre Antwort ist offiziell", "Das Tempelteam hat Ihre Antwort als offiziell markiert."}, "community.approval": {"Ihr erster Beitrag wurde geprüft", "Das Tempelteam hat Ihren ersten Beitrag geprüft."}, "community.revision": {"Ihre Änderung wurde geprüft", "Das Tempelteam hat Ihre Community-Änderung geprüft."}, "community.moderation": {"Community-Moderationsupdate", "Das Tempelteam hat Ihre Inhalte aktualisiert."}},
	}
	selected := copies[locale]
	if selected == nil {
		selected = copies["en"]
	}
	copy, ok := selected[eventType]
	if !ok {
		copy = selected["community.moderation"]
	}
	return copy[0], copy[1]
}
