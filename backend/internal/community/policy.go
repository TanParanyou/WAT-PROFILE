package community

import (
	"sort"
	"strings"

	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
)

type LifecycleInput struct {
	PublishedAnswers int
	AcceptedExists   bool
	OfficialAnswers  int
	WasLocked        bool
	WasArchived      bool
}

func DeterminePublication(trust models.CommunityTrustStatus, restricted bool) (models.CommunityPublicationStatus, error) {
	if trust == models.CommunityTrustBanned {
		return "", NewDomainError(CodeAccountNotEligible, "Community participation is not available for this account")
	}
	if restricted || trust == models.CommunityTrustRestricted || trust == models.CommunityTrustNew {
		return models.CommunityPublicationPendingReview, nil
	}
	if trust == models.CommunityTrustTrusted {
		return models.CommunityPublicationPublished, nil
	}
	return "", NewDomainError(CodeAccountNotEligible, "Community account state is invalid")
}

func RecalculateLifecycle(input LifecycleInput) models.CommunityLifecycleStatus {
	if input.WasArchived {
		return models.CommunityLifecycleArchived
	}
	if input.WasLocked {
		return models.CommunityLifecycleLocked
	}
	if input.AcceptedExists || input.OfficialAnswers > 0 {
		return models.CommunityLifecycleResolved
	}
	if input.PublishedAnswers > 0 {
		return models.CommunityLifecycleAnswered
	}
	return models.CommunityLifecycleOpen
}

func CanEdit(actorID, ownerID uuid.UUID, lifecycle models.CommunityLifecycleStatus, publication models.CommunityPublicationStatus, significant bool, expectedVersion, currentVersion int) error {
	if actorID == uuid.Nil || ownerID == uuid.Nil || actorID != ownerID {
		return NewDomainError(CodeForbidden, "Only the content owner can edit this contribution")
	}
	if lifecycle == models.CommunityLifecycleLocked || lifecycle == models.CommunityLifecycleArchived {
		return NewDomainError(CodeQuestionLocked, "This contribution is locked")
	}
	if publication == models.CommunityPublicationDeleted || publication == models.CommunityPublicationHidden {
		return NewDomainError(CodeForbidden, "This contribution cannot be edited")
	}
	if expectedVersion <= 0 || expectedVersion != currentVersion {
		return NewDomainError(CodeEditConflict, "This contribution changed; refresh and try again").WithVersion(currentVersion)
	}
	if significant {
		return NewDomainError(CodeReviewRequired, "This edit requires moderation review")
	}
	return nil
}

func CanDeleteQuestion(actorID, ownerID uuid.UUID, lifecycle models.CommunityLifecycleStatus, publishedAnswers int) error {
	if actorID == uuid.Nil || ownerID == uuid.Nil || actorID != ownerID {
		return NewDomainError(CodeForbidden, "Only the question owner can request deletion")
	}
	if lifecycle == models.CommunityLifecycleLocked || lifecycle == models.CommunityLifecycleArchived {
		return NewDomainError(CodeQuestionLocked, "This question is locked")
	}
	if publishedAnswers > 0 {
		return NewDomainError(CodeForbidden, "A question with answers requires moderator review")
	}
	return nil
}

type AnswerRank struct {
	ID           uuid.UUID
	IsOfficial   bool
	IsAccepted   bool
	HelpfulCount int
	PublishedAt  int64
}

func RankAnswers(items []AnswerRank) {
	sort.SliceStable(items, func(i, j int) bool {
		if items[i].IsOfficial != items[j].IsOfficial {
			return items[i].IsOfficial
		}
		if items[i].IsAccepted != items[j].IsAccepted {
			return items[i].IsAccepted
		}
		if items[i].HelpfulCount != items[j].HelpfulCount {
			return items[i].HelpfulCount > items[j].HelpfulCount
		}
		if items[i].PublishedAt != items[j].PublishedAt {
			return items[i].PublishedAt < items[j].PublishedAt
		}
		return strings.Compare(items[i].ID.String(), items[j].ID.String()) < 0
	})
}

func CanVote(actorID, answerOwnerID uuid.UUID, questionLifecycle models.CommunityLifecycleStatus, publication models.CommunityPublicationStatus) error {
	if actorID == uuid.Nil || actorID == answerOwnerID {
		return NewDomainError(CodeSelfVoteForbidden, "You cannot mark your own answer as helpful")
	}
	if questionLifecycle == models.CommunityLifecycleLocked || questionLifecycle == models.CommunityLifecycleArchived {
		return NewDomainError(CodeQuestionLocked, "This question is locked")
	}
	if publication != models.CommunityPublicationPublished {
		return NewDomainError(CodeContentPending, "Only published answers can receive helpful votes")
	}
	return nil
}
