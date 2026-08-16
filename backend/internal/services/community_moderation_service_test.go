package services

import (
	"testing"

	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/community"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
)

func TestReportTargetRequiresExactlyOnePublishedContentTarget(t *testing.T) {
	id := uuid.New()
	tests := []struct {
		name     string
		input    community.CreateReportInput
		wantErr  bool
		wantType string
	}{
		{name: "question", input: community.CreateReportInput{QuestionID: &id}, wantType: "question"},
		{name: "multiple targets", input: community.CreateReportInput{QuestionID: &id, AnswerID: &id}, wantErr: true},
		{name: "nil target", input: community.CreateReportInput{QuestionID: func() *uuid.UUID { value := uuid.Nil; return &value }()}, wantErr: true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotType, gotID, err := reportTarget(tt.input)
			if tt.wantErr {
				if err == nil {
					t.Fatal("expected validation error")
				}
				return
			}
			if err != nil {
				t.Fatalf("reportTarget returned error: %v", err)
			}
			if gotType != tt.wantType || gotID != id {
				t.Fatalf("reportTarget = %q, %s; want %q, %s", gotType, gotID, tt.wantType, id)
			}
		})
	}
}

func TestAllowedModerationActionUsesTargetSpecificAllowList(t *testing.T) {
	if !allowedModerationAction("question", "lock") {
		t.Fatal("question lock should be allowed")
	}
	if allowedModerationAction("comment", "lock") {
		t.Fatal("comment lock should not be allowed")
	}
	if allowedModerationAction("unknown", "hide") {
		t.Fatal("unknown targets should not be allowed")
	}
}

func TestCommunityCategorySlugPatternRejectsUnsafeValues(t *testing.T) {
	for _, value := range []string{"Dharma Practice", "../admin", "x_1"} {
		if communityCategorySlugPattern.MatchString(value) {
			t.Fatalf("slug %q should be rejected", value)
		}
	}
	for _, value := range []string{"dharma-practice", "general2"} {
		if !communityCategorySlugPattern.MatchString(value) {
			t.Fatalf("slug %q should be accepted", value)
		}
	}
}

func TestRecalculatedLifecycleDoesNotKeepManualStates(t *testing.T) {
	question := models.CommunityQuestion{LifecycleStatus: models.CommunityLifecycleLocked, PublishedAnswerCount: 2}
	if got := recalculatedLifecycle(question); got != models.CommunityLifecycleAnswered {
		t.Fatalf("lifecycle = %q, want answered after unlock", got)
	}
}
