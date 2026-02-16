package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
)

// MultiLangText represents a multi-language text field stored as JSONB
// Example: {"th": "ข้อความ", "en": "Text", "de": "Text"}
type MultiLangText map[string]string

// Value implements driver.Valuer interface for GORM
func (m MultiLangText) Value() (driver.Value, error) {
	if m == nil {
		return nil, nil
	}
	return json.Marshal(m)
}

// Scan implements sql.Scanner interface for GORM
func (m *MultiLangText) Scan(value interface{}) error {
	if value == nil {
		*m = nil
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}

	result := make(MultiLangText)
	if err := json.Unmarshal(bytes, &result); err != nil {
		return err
	}

	*m = result
	return nil
}

// Get returns text in specified language with fallback logic
// Priority: requested language -> English -> first available
func (m MultiLangText) Get(lang string) string {
	if m == nil {
		return ""
	}

	// Try requested language
	if text, ok := m[lang]; ok && text != "" {
		return text
	}

	// Fallback to English
	if text, ok := m["en"]; ok && text != "" {
		return text
	}

	// Return first available non-empty text
	for _, text := range m {
		if text != "" {
			return text
		}
	}

	return ""
}

// Set sets text for a specific language
func (m MultiLangText) Set(lang, text string) {
	if m == nil {
		m = make(MultiLangText)
	}
	m[lang] = text
}

// Has checks if a language key exists
func (m MultiLangText) Has(lang string) bool {
	if m == nil {
		return false
	}
	_, ok := m[lang]
	return ok
}

// IsEmpty checks if all language values are empty
func (m MultiLangText) IsEmpty() bool {
	if m == nil || len(m) == 0 {
		return true
	}

	for _, text := range m {
		if text != "" {
			return false
		}
	}

	return true
}

// MarshalJSON implements json.Marshaler interface
func (m MultiLangText) MarshalJSON() ([]byte, error) {
	if m == nil {
		return []byte("null"), nil
	}
	return json.Marshal(map[string]string(m))
}

// UnmarshalJSON implements json.Unmarshaler interface
func (m *MultiLangText) UnmarshalJSON(data []byte) error {
	result := make(map[string]string)
	if err := json.Unmarshal(data, &result); err != nil {
		return err
	}
	*m = MultiLangText(result)
	return nil
}
