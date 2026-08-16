package community

import (
	"encoding/json"
	"fmt"
	"net/url"
	"strings"
	"unicode/utf8"

	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/richtext"
)

type RichTextLimits struct {
	MinText int
	MaxText int
}

func ValidateRichText(raw models.RichTextDocument, limits RichTextLimits) (string, error) {
	if limits.MinText < 0 || limits.MaxText < limits.MinText {
		return "", fmt.Errorf("invalid rich text limits")
	}
	var node richtext.Node
	if err := json.Unmarshal(raw, &node); err != nil {
		return "", fmt.Errorf("invalid rich text JSON: %w", err)
	}
	if err := validateNode(json.RawMessage(raw), node, "body", true); err != nil {
		return "", err
	}
	plain := normalizePlainText(node)
	runeCount := utf8.RuneCountInString(plain)
	if runeCount < limits.MinText || runeCount > limits.MaxText {
		return "", fmt.Errorf("rich text must contain between %d and %d characters", limits.MinText, limits.MaxText)
	}
	return plain, nil
}

func validateNode(raw json.RawMessage, node richtext.Node, path string, root bool) error {
	var object map[string]json.RawMessage
	if err := json.Unmarshal(raw, &object); err != nil || object == nil {
		return fmt.Errorf("%s must be an object", path)
	}
	for key := range object {
		switch key {
		case "type", "content", "text", "attrs", "marks":
		default:
			return fmt.Errorf("%s: unsupported field %q", path, key)
		}
	}
	if root && node.Type != richtext.NodeDoc {
		return fmt.Errorf("%s: root node must be doc", path)
	}

	switch node.Type {
	case richtext.NodeDoc:
		if !root {
			return fmt.Errorf("%s: nested doc is not allowed", path)
		}
	case richtext.NodeParagraph:
		if len(node.Attrs) > 0 {
			return fmt.Errorf("%s.attrs: paragraph attributes are not allowed", path)
		}
	case richtext.NodeBulletList, richtext.NodeOrderedList:
		if len(node.Attrs) > 0 {
			return fmt.Errorf("%s.attrs: list attributes are not allowed", path)
		}
	case richtext.NodeListItem:
		if len(node.Attrs) > 0 {
			return fmt.Errorf("%s.attrs: list item attributes are not allowed", path)
		}
	case richtext.NodeText:
		if node.Text == "" || len(node.Content) > 0 || len(node.Attrs) > 0 {
			return fmt.Errorf("%s: text nodes must contain only text and marks", path)
		}
		for i, mark := range node.Marks {
			markPath := fmt.Sprintf("%s.marks[%d]", path, i)
			if mark.Type != richtext.MarkBold && mark.Type != richtext.MarkLink {
				return fmt.Errorf("%s: unsupported mark %q", markPath, mark.Type)
			}
			if mark.Type == richtext.MarkBold && len(mark.Attrs) > 0 {
				return fmt.Errorf("%s.attrs: bold attributes are not allowed", markPath)
			}
			if mark.Type == richtext.MarkLink {
				if len(mark.Attrs) != 1 {
					return fmt.Errorf("%s.attrs: link requires only href", markPath)
				}
				href, ok := mark.Attrs["href"].(string)
				if !ok || !isSafeHref(href) {
					return fmt.Errorf("%s.attrs.href: only relative paths and HTTPS links are allowed", markPath)
				}
			}
		}
	default:
		return fmt.Errorf("%s: unsupported node %q", path, node.Type)
	}

	for i, child := range node.Content {
		childPath := fmt.Sprintf("%s.content[%d]", path, i)
		rawChild, err := marshalChild(raw, i)
		if err != nil {
			return err
		}
		if node.Type == richtext.NodeParagraph && child.Type != richtext.NodeText {
			return fmt.Errorf("%s: paragraphs may contain only text", childPath)
		}
		if (node.Type == richtext.NodeBulletList || node.Type == richtext.NodeOrderedList) && child.Type != richtext.NodeListItem {
			return fmt.Errorf("%s: lists may contain only list items", childPath)
		}
		if node.Type == richtext.NodeListItem && child.Type != richtext.NodeParagraph {
			return fmt.Errorf("%s: list items may contain one paragraph", childPath)
		}
		if err := validateNode(rawChild, child, childPath, false); err != nil {
			return err
		}
	}
	return nil
}

func marshalChild(raw json.RawMessage, index int) (json.RawMessage, error) {
	var object struct {
		Content []json.RawMessage `json:"content"`
	}
	if err := json.Unmarshal(raw, &object); err != nil {
		return nil, fmt.Errorf("invalid rich text child: %w", err)
	}
	if index < 0 || index >= len(object.Content) {
		return nil, fmt.Errorf("invalid rich text child index")
	}
	return object.Content[index], nil
}

func isSafeHref(raw string) bool {
	href := strings.TrimSpace(raw)
	if href == "" || strings.ContainsAny(href, "\r\n\x00") || strings.HasPrefix(href, "//") {
		return false
	}
	if strings.HasPrefix(href, "/") {
		return true
	}
	u, err := url.Parse(href)
	return err == nil && strings.EqualFold(u.Scheme, "https") && u.Host != ""
}

func normalizePlainText(node richtext.Node) string {
	var builder strings.Builder
	var walk func(richtext.Node)
	walk = func(current richtext.Node) {
		if current.Type == richtext.NodeText {
			builder.WriteString(current.Text)
			return
		}
		for _, child := range current.Content {
			walk(child)
		}
		if current.Type == richtext.NodeParagraph || current.Type == richtext.NodeListItem {
			builder.WriteByte('\n')
		}
	}
	walk(node)
	return strings.Join(strings.Fields(builder.String()), " ")
}
