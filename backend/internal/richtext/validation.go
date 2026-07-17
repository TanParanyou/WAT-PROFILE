package richtext

import (
	"encoding/json"
	"fmt"
	"net/url"
	"strings"
	"unicode/utf8"

	"github.com/watloungporsai/wat-profile-backend/internal/models"
)

// Allowed Node Types
const (
	NodeDoc             = "doc"
	NodeParagraph       = "paragraph"
	NodeHeading         = "heading"
	NodeBulletList      = "bulletList"
	NodeOrderedList     = "orderedList"
	NodeListItem        = "listItem"
	NodeBlockquote      = "blockquote"
	NodeHorizontalRule  = "horizontalRule"
	NodeImage           = "image"
	NodeText            = "text"
)

// Allowed Mark Types
const (
	MarkBold   = "bold"
	MarkItalic = "italic"
	MarkStrike = "strike"
	MarkLink   = "link"
)

type Node struct {
	Type    string           `json:"type"`
	Content []Node           `json:"content,omitempty"`
	Text    string           `json:"text,omitempty"`
	Attrs   map[string]any   `json:"attrs,omitempty"`
	Marks   []Mark           `json:"marks,omitempty"`
}

type Mark struct {
	Type  string         `json:"type"`
	Attrs map[string]any `json:"attrs,omitempty"`
}

// ValidateLocalized validates all locales in LocalizedRichText
func ValidateLocalized(rt models.LocalizedRichText) error {
	for locale, raw := range rt {
		// If raw is empty or empty object/array, skip or allow
		if len(raw) == 0 || string(raw) == "null" {
			continue
		}
		
		// Attempt to parse raw JSON into a Tiptap JSONContent node
		var node Node
		if err := json.Unmarshal(raw, &node); err != nil {
			// If it's a legacy string or malformed JSON, wait, the validator only accepts rich text JSON
			// for new/updated writes. Let's see if it's a valid JSON first.
			return fmt.Errorf("%s: invalid rich text JSON structure: %w", locale, err)
		}

		if err := ValidateNode(node, fmt.Sprintf("%s", locale)); err != nil {
			return err
		}
	}
	return nil
}

// ValidateNode recursively validates a node and its attributes/marks
func ValidateNode(n Node, path string) error {
	// Base validation for root
	if path == "th" || path == "en" || path == "de" || !strings.Contains(path, ".") {
		if n.Type != NodeDoc {
			return fmt.Errorf("%s: root node must be 'doc'", path)
		}
	}

	switch n.Type {
	case NodeDoc, NodeParagraph, NodeBulletList, NodeOrderedList, NodeListItem, NodeBlockquote, NodeHorizontalRule, NodeText:
		// Basic node types allowed, check contents later
	case NodeHeading:
		// heading levels 2 and 3 only
		level, ok := n.Attrs["level"].(float64)
		if !ok || (level != 2 && level != 3) {
			return fmt.Errorf("%s.attrs.level: heading level must be 2 or 3", path)
		}
	case NodeImage:
		// image must have src with http, https, or internal /
		src, ok := n.Attrs["src"].(string)
		if !ok || src == "" {
			return fmt.Errorf("%s.attrs.src: image src must be a non-empty string", path)
		}
		if err := validateURL(src, fmt.Sprintf("%s.attrs.src", path)); err != nil {
			return err
		}
	default:
		return fmt.Errorf("%s: unsupported node %q", path, n.Type)
	}

	// Validate Marks
	for i, m := range n.Marks {
		markPath := fmt.Sprintf("%s.marks[%d]", path, i)
		switch m.Type {
		case MarkBold, MarkItalic, MarkStrike:
			// basic marks allowed
		case MarkLink:
			href, ok := m.Attrs["href"].(string)
			if !ok || href == "" {
				return fmt.Errorf("%s.attrs.href: link href must be a non-empty string", markPath)
			}
			if err := validateURL(href, fmt.Sprintf("%s.attrs.href", markPath)); err != nil {
				return err
			}
		default:
			return fmt.Errorf("%s: unsupported mark %q", markPath, m.Type)
		}
	}

	// Recurse content
	for i, child := range n.Content {
		childPath := fmt.Sprintf("%s.content[%d]", path, i)
		if err := ValidateNode(child, childPath); err != nil {
			return err
		}
	}

	return nil
}

func validateURL(rawURL string, path string) error {
	if strings.HasPrefix(rawURL, "/") {
		// Absolute internal path, allowed
		return nil
	}
	if strings.HasPrefix(rawURL, "mailto:") {
		// Mailto link, allowed
		return nil
	}
	u, err := url.Parse(rawURL)
	if err != nil {
		return fmt.Errorf("%s: invalid URL %q", path, rawURL)
	}
	if u.Scheme != "http" && u.Scheme != "https" {
		return fmt.Errorf("%s: URL scheme must be http or https, got %q", path, u.Scheme)
	}
	// Check host is not empty
	if u.Host == "" && !strings.HasPrefix(rawURL, "/") {
		return fmt.Errorf("%s: URL host cannot be empty for absolute URLs", path)
	}
	// UTF-8 check
	if !utf8.ValidString(rawURL) {
		return fmt.Errorf("%s: URL must be valid UTF-8", path)
	}
	return nil
}

func ValidateContentPageBody(pageKey string, body models.JSONMap) error {
	switch pageKey {
	case "PAGE-PRIVACY":
		sections, ok := body["sections"].([]interface{})
		if !ok {
			return nil
		}

		for index, sectionValue := range sections {
			section, ok := sectionValue.(map[string]interface{})
			if !ok {
				continue
			}

			if err := validateLocalizedUnknown(section["content"], fmt.Sprintf("body.sections[%d].content", index)); err != nil {
				return err
			}
		}
	}

	return nil
}

func ValidateContentSectionBody(sectionType string, body models.JSONMap) error {
	if sectionType != "rich_text" {
		return nil
	}

	return validateLocalizedUnknown(body["richText"], "body.richText")
}

func validateLocalizedUnknown(value interface{}, path string) error {
	if value == nil {
		return nil
	}

	raw, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("%s: invalid rich text payload: %w", path, err)
	}

	var localized models.LocalizedRichText
	if err := json.Unmarshal(raw, &localized); err != nil {
		return fmt.Errorf("%s: invalid rich text payload: %w", path, err)
	}

	if err := ValidateLocalized(localized); err != nil {
		return fmt.Errorf("%s: %w", path, err)
	}

	return nil
}
