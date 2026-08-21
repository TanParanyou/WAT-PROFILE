package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"fmt"
)

// RichTextDocument stores one validated Tiptap document as JSONB. Validation
// of the allowed node and mark set belongs to the Community domain package.
type RichTextDocument json.RawMessage

func (d RichTextDocument) MarshalJSON() ([]byte, error) {
	if len(d) == 0 {
		return []byte(`{"type":"doc","content":[{"type":"paragraph"}]}`), nil
	}
	if !json.Valid(d) {
		return nil, errors.New("invalid rich text JSON")
	}
	return []byte(d), nil
}

func (d *RichTextDocument) UnmarshalJSON(raw []byte) error {
	if !json.Valid(raw) {
		return errors.New("invalid rich text JSON")
	}
	*d = append((*d)[:0], raw...)
	return nil
}

func (d RichTextDocument) Value() (driver.Value, error) {
	if len(d) == 0 {
		return `{"type":"doc","content":[{"type":"paragraph"}]}`, nil
	}
	if !json.Valid(d) {
		return nil, errors.New("invalid rich text JSON")
	}
	return string(d), nil
}

func (d *RichTextDocument) Scan(value any) error {
	if value == nil {
		*d = nil
		return nil
	}

	var raw []byte
	switch typed := value.(type) {
	case []byte:
		raw = typed
	case string:
		raw = []byte(typed)
	default:
		return fmt.Errorf("unsupported rich text value %T", value)
	}
	if !json.Valid(raw) {
		return errors.New("invalid rich text JSON")
	}
	*d = append((*d)[:0], raw...)
	return nil
}
