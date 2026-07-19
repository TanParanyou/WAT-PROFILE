package seedgen

import (
	"fmt"
	"html"
	"strings"
)

func localizedTextDocument(value LocalizedText) LocalizedRichText {
	return LocalizedRichText{TH: textDocument(value.TH), EN: textDocument(value.EN), DE: textDocument(value.DE)}
}

func localizedHTMLDocument(value LocalizedText) (LocalizedRichText, error) {
	th, err := fixtureHTMLDocument(value.TH)
	if err != nil {
		return LocalizedRichText{}, err
	}
	en, err := fixtureHTMLDocument(value.EN)
	if err != nil {
		return LocalizedRichText{}, err
	}
	de, err := fixtureHTMLDocument(value.DE)
	if err != nil {
		return LocalizedRichText{}, err
	}
	return LocalizedRichText{TH: th, EN: en, DE: de}, nil
}

func textDocument(raw string) RichTextNode {
	normalized := strings.ReplaceAll(strings.TrimSpace(raw), "\r\n", "\n")
	parts := strings.Split(normalized, "\n\n")
	paragraphs := make([]RichTextNode, 0, len(parts))
	for _, part := range parts {
		text := strings.TrimSpace(part)
		paragraph := RichTextNode{Type: "paragraph"}
		if text != "" {
			paragraph.Content = []RichTextNode{{Type: "text", Text: text}}
		}
		paragraphs = append(paragraphs, paragraph)
	}
	if len(paragraphs) == 0 {
		paragraphs = []RichTextNode{{Type: "paragraph"}}
	}
	return RichTextNode{Type: "doc", Content: paragraphs}
}

func fixtureHTMLDocument(raw string) (RichTextNode, error) {
	replacer := strings.NewReplacer(
		"</p><p>", "\n\n",
		"</p>\n<p>", "\n\n",
		"<p>", "",
		"</p>", "",
		"<br>", "\n",
		"<br/>", "\n",
		"<br />", "\n",
	)
	plain := html.UnescapeString(replacer.Replace(strings.TrimSpace(raw)))
	if strings.ContainsAny(plain, "<>") {
		return RichTextNode{}, fmt.Errorf("unsupported fixture HTML %q", raw)
	}
	return textDocument(plain), nil
}
