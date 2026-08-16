package services

import (
	"testing"

	"github.com/watloungporsai/wat-profile-backend/internal/models"
)

func TestValidateInteractionBody(t *testing.T) {
	body := models.RichTextDocument(`{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"A useful answer with enough detail."}]}]}`)
	plain, err := validateInteractionBody(body, 5, 20000)
	if err != nil {
		t.Fatalf("validateInteractionBody: %v", err)
	}
	if plain == "" {
		t.Fatal("expected extracted plain text")
	}
}

func TestValidateInteractionBodyRejectsUnsafeNode(t *testing.T) {
	body := models.RichTextDocument(`{"type":"doc","content":[{"type":"image","attrs":{"src":"https://example.com/a.png"}}]}`)
	if _, err := validateInteractionBody(body, 2, 2000); err == nil {
		t.Fatal("expected unsafe node error")
	}
}

func TestCommunityUpdateLifecycleKeepsLockedAndArchivedStates(t *testing.T) {
	question := models.CommunityQuestion{LifecycleStatus: models.CommunityLifecycleLocked, PublishedAnswerCount: 5}
	communityUpdateLifecycle(&question)
	if question.LifecycleStatus != models.CommunityLifecycleLocked {
		t.Fatalf("lifecycle = %q", question.LifecycleStatus)
	}
	question.LifecycleStatus = models.CommunityLifecycleOpen
	question.PublishedAnswerCount = 1
	communityUpdateLifecycle(&question)
	if question.LifecycleStatus != models.CommunityLifecycleAnswered {
		t.Fatalf("lifecycle = %q", question.LifecycleStatus)
	}
}
