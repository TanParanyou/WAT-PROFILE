package richtext

import (
	"encoding/json"
	"testing"

	"github.com/watloungporsai/wat-profile-backend/internal/models"
)

func TestValidateNode(t *testing.T) {
	tests := []struct {
		name    string
		node    Node
		path    string
		wantErr bool
	}{
		{
			name: "valid root doc with paragraph and text",
			node: Node{
				Type: NodeDoc,
				Content: []Node{
					{
						Type: NodeParagraph,
						Content: []Node{
							{
								Type: NodeText,
								Text: "สวัสดีชาวโลก",
							},
						},
					},
				},
			},
			path:    "th",
			wantErr: false,
		},
		{
			name: "invalid root node (not doc)",
			node: Node{
				Type: NodeParagraph,
				Content: []Node{
					{
						Type: NodeText,
						Text: "hello",
					},
				},
			},
			path:    "en",
			wantErr: true,
		},
		{
			name: "valid heading level 2",
			node: Node{
				Type: NodeDoc,
				Content: []Node{
					{
						Type:  NodeHeading,
						Attrs: map[string]any{"level": float64(2)},
						Content: []Node{
							{
								Type: NodeText,
								Text: "หัวข้อ",
							},
						},
					},
				},
			},
			path:    "th",
			wantErr: false,
		},
		{
			name: "invalid heading level 7",
			node: Node{
				Type: NodeDoc,
				Content: []Node{
					{
						Type:  NodeHeading,
						Attrs: map[string]any{"level": float64(7)},
						Content: []Node{
							{
								Type: NodeText,
								Text: "Invalid Heading",
							},
						},
					},
				},
			},
			path:    "en",
			wantErr: true,
		},
		{
			name: "valid link with https",
			node: Node{
				Type: NodeDoc,
				Content: []Node{
					{
						Type: NodeParagraph,
						Content: []Node{
							{
								Type: NodeText,
								Text: "Wat Loung Por Sai",
								Marks: []Mark{
									{
										Type:  MarkLink,
										Attrs: map[string]any{"href": "https://watloungporsai.de"},
									},
								},
							},
						},
					},
				},
			},
			path:    "de",
			wantErr: false,
		},
		{
			name: "malicious link with javascript scheme",
			node: Node{
				Type: NodeDoc,
				Content: []Node{
					{
						Type: NodeParagraph,
						Content: []Node{
							{
								Type: NodeText,
								Text: "Click here",
								Marks: []Mark{
									{
										Type:  MarkLink,
										Attrs: map[string]any{"href": "javascript:alert(1)"},
									},
								},
							},
						},
					},
				},
			},
			path:    "en",
			wantErr: true,
		},
		{
			name: "unsupported custom malicious node type",
			node: Node{
				Type: NodeDoc,
				Content: []Node{
					{
						Type: "iframe",
						Attrs: map[string]any{"src": "https://evil.com"},
					},
				},
			},
			path:    "th",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateNode(tt.node, tt.path)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateNode() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestValidateLocalized(t *testing.T) {
	validDoc := Node{
		Type: NodeDoc,
		Content: []Node{
			{
				Type: NodeParagraph,
				Content: []Node{
					{Type: NodeText, Text: "Content in Thai"},
				},
			},
		},
	}
	validJSON, _ := json.Marshal(validDoc)

	localized := models.LocalizedRichText{
		"th": json.RawMessage(validJSON),
		"en": json.RawMessage(validJSON),
		"de": json.RawMessage(validJSON),
	}

	if err := ValidateLocalized(localized); err != nil {
		t.Fatalf("ValidateLocalized() unexpected error: %v", err)
	}

	// Test with invalid JSON in one locale
	invalidLocalized := models.LocalizedRichText{
		"th": json.RawMessage(validJSON),
		"en": json.RawMessage(`{ invalid json }`),
	}
	if err := ValidateLocalized(invalidLocalized); err == nil {
		t.Fatalf("ValidateLocalized() expected error for malformed JSON, got nil")
	}
}

func TestValidateURL(t *testing.T) {
	tests := []struct {
		url     string
		wantErr bool
	}{
		{"https://watloungporsai.de", false},
		{"http://localhost:3000/events", false},
		{"/de/events/vesak", false},
		{"mailto:contact@watloungporsai.de", false},
		{"tel:+49123456789", false},
		{"javascript:alert(1)", true},
		{"data:text/html,<script>alert(1)</script>", true},
		{"vbscript:msgbox(1)", true},
		{"", true},
		{"ftp://files.example.com", true},
	}

	for _, tt := range tests {
		t.Run(tt.url, func(t *testing.T) {
			err := validateURL(tt.url, "test.url")
			if (err != nil) != tt.wantErr {
				t.Errorf("validateURL(%q) error = %v, wantErr %v", tt.url, err, tt.wantErr)
			}
		})
	}
}
