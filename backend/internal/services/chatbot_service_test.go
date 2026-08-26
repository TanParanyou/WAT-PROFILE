package services

import (
	"context"
	"testing"
)

func TestChatbotServiceValidation(t *testing.T) {
	service := NewChatbotService(nil)
	ctx := context.Background()

	// Empty prompt should fail
	_, err := service.ProcessMessage(ctx, ChatMessageRequest{
		Message: "",
		Locale:  "th",
	})
	if err != ErrChatbotEmptyPrompt {
		t.Fatalf("expected ErrChatbotEmptyPrompt, got %v", err)
	}

	_, err = service.ProcessMessage(ctx, ChatMessageRequest{
		Message: "   ",
		Locale:  "th",
	})
	if err != ErrChatbotEmptyPrompt {
		t.Fatalf("expected ErrChatbotEmptyPrompt for whitespace, got %v", err)
	}
}

func TestChatbotFallbackResponses(t *testing.T) {
	service := NewChatbotService(nil)
	ctx := context.Background()

	locales := []string{"th", "en", "de"}
	for _, loc := range locales {
		resp := service.generateFallbackResponse(ctx, "สอบถามเวลาเปิด", loc)
		if resp == nil {
			t.Fatalf("expected fallback response for locale %s, got nil", loc)
		}
		if resp.Reply == "" {
			t.Fatalf("expected non-empty reply for locale %s", loc)
		}
	}
}
