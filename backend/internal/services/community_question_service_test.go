package services

import (
	"testing"

	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/community"
)

func validQuestionBody() []byte {
	return []byte(`{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"This is a sufficiently long question body."}]}]}`)
}

func TestValidateQuestionInput(t *testing.T) {
	input := community.CreateQuestionInput{
		CategoryID: uuid.New(), Locale: "th", Title: "คำถามเกี่ยวกับการมาวัด", Body: validQuestionBody(),
	}
	title, plain, err := validateQuestionInput(input)
	if err != nil {
		t.Fatalf("validateQuestionInput: %v", err)
	}
	if title != input.Title || plain == "" {
		t.Fatalf("unexpected title/plain text: %q/%q", title, plain)
	}
}

func TestValidateQuestionInputRejectsInvalidFields(t *testing.T) {
	tests := []struct {
		name  string
		input community.CreateQuestionInput
	}{
		{name: "short title", input: community.CreateQuestionInput{CategoryID: uuid.New(), Locale: "th", Title: "short", Body: validQuestionBody()}},
		{name: "unsupported locale", input: community.CreateQuestionInput{CategoryID: uuid.New(), Locale: "fr", Title: "A valid question title", Body: validQuestionBody()}},
		{name: "missing category", input: community.CreateQuestionInput{Locale: "th", Title: "A valid question title", Body: validQuestionBody()}},
		{name: "invalid rich text", input: community.CreateQuestionInput{CategoryID: uuid.New(), Locale: "th", Title: "A valid question title", Body: []byte(`{"type":"doc","content":[{"type":"image"}]}`)}},
	}
	for _, testCase := range tests {
		t.Run(testCase.name, func(t *testing.T) {
			if _, _, err := validateQuestionInput(testCase.input); err == nil {
				t.Fatal("expected validation error")
			}
		})
	}
}

func TestQuestionSlugIncludesStableIDSuffix(t *testing.T) {
	id := uuid.MustParse("20000000-0000-4000-8000-000000000001")
	if got := questionSlug("How do I visit the temple?", id); got != "how-do-i-visit-the-temple-20000000" {
		t.Fatalf("slug = %q", got)
	}
	if got := questionSlug("คำถามภาษาไทย", id); got != "คำถามภาษาไทย-20000000" {
		t.Fatalf("unicode-only slug = %q", got)
	}
}
