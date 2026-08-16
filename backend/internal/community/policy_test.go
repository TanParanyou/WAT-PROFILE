package community

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
)

func TestDeterminePublicationRequiresReviewForNewMember(t *testing.T) {
	got, err := DeterminePublication(models.CommunityTrustNew, false)
	if err != nil {
		t.Fatal(err)
	}
	if got != models.CommunityPublicationPendingReview {
		t.Fatalf("got %s", got)
	}
}

func TestRecalculateLifecycleKeepsResolvedWhileOfficialExists(t *testing.T) {
	got := RecalculateLifecycle(LifecycleInput{PublishedAnswers: 2, OfficialAnswers: 1})
	if got != models.CommunityLifecycleResolved {
		t.Fatalf("got %s", got)
	}
}

func TestRecalculateLifecycleRestoresAfterMarkerRemoval(t *testing.T) {
	if got := RecalculateLifecycle(LifecycleInput{PublishedAnswers: 1}); got != models.CommunityLifecycleAnswered {
		t.Fatalf("got %s", got)
	}
	if got := RecalculateLifecycle(LifecycleInput{}); got != models.CommunityLifecycleOpen {
		t.Fatalf("got %s", got)
	}
}

func TestRankAnswersUsesDeterministicMarkersAndTieBreakers(t *testing.T) {
	first := uuid.New()
	second := uuid.New()
	items := []AnswerRank{
		{ID: second, HelpfulCount: 4, PublishedAt: 2},
		{ID: first, IsOfficial: true, HelpfulCount: 0, PublishedAt: 9},
	}
	RankAnswers(items)
	if items[0].ID != first {
		t.Fatalf("official answer did not rank first")
	}
}

func TestPolicyRejectsStaleEditAndPublishedQuestionDeletion(t *testing.T) {
	owner := uuid.New()
	if err := CanEdit(owner, owner, models.CommunityLifecycleOpen, models.CommunityPublicationPublished, false, 1, 2); err == nil {
		t.Fatal("expected edit conflict")
	}
	if err := CanDeleteQuestion(owner, owner, models.CommunityLifecycleOpen, 1); err == nil {
		t.Fatal("expected moderator deletion requirement")
	}
}

func TestEncodeDecodeCursor(t *testing.T) {
	want := QuestionCursor{LastActivityAt: time.Date(2026, 8, 16, 8, 0, 0, 0, time.UTC), ID: uuid.New()}
	got, err := DecodeCursor(EncodeCursor(want))
	if err != nil {
		t.Fatal(err)
	}
	if got != want {
		t.Fatalf("got %#v want %#v", got, want)
	}
}
