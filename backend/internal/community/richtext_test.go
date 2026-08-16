package community

import (
	"testing"

	"github.com/watloungporsai/wat-profile-backend/internal/models"
)

func TestValidateRichTextAndExtractsPlainText(t *testing.T) {
	raw := models.RichTextDocument(`{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"สวัสดี ","marks":[{"type":"bold"}]},{"type":"text","text":"วัด"}]}]}`)
	plain, err := ValidateRichText(raw, RichTextLimits{MinText: 3, MaxText: 100})
	if err != nil {
		t.Fatal(err)
	}
	if plain != "สวัสดี วัด" {
		t.Fatalf("plain = %q", plain)
	}
}

func TestValidateRichTextRejectsUnsafeOrUnsupportedContent(t *testing.T) {
	tests := []models.RichTextDocument{
		models.RichTextDocument(`{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"x","marks":[{"type":"link","attrs":{"href":"javascript:alert(1)"}}]}]}]}`),
		models.RichTextDocument(`{"type":"doc","content":[{"type":"image","attrs":{"src":"https://example.com/a.png"}}]}`),
		models.RichTextDocument(`{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"x","marks":[{"type":"italic"}]}]}]}`),
	}
	for _, raw := range tests {
		if _, err := ValidateRichText(raw, RichTextLimits{MinText: 1, MaxText: 100}); err == nil {
			t.Fatalf("expected invalid rich text for %s", raw)
		}
	}
}
