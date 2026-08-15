package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
)

// StringSlice represents a slice of strings stored as JSONB in PostgreSQL
type StringSlice []string

// Value implements driver.Valuer interface
func (s StringSlice) Value() (driver.Value, error) {
	if s == nil {
		return "[]", nil
	}
	bytes, err := json.Marshal(s)
	if err != nil {
		return nil, err
	}
	return string(bytes), nil
}

// Scan implements sql.Scanner interface
func (s *StringSlice) Scan(value any) error {
	if value == nil {
		*s = []string{}
		return nil
	}

	var bytes []byte
	switch typed := value.(type) {
	case []byte:
		bytes = typed
	case string:
		bytes = []byte(typed)
	default:
		return errors.New("unsupported type for StringSlice")
	}

	if len(bytes) == 0 {
		*s = []string{}
		return nil
	}

	var result []string
	if err := json.Unmarshal(bytes, &result); err != nil {
		return err
	}
	*s = result
	return nil
}

// MarshalJSON implements json.Marshaler interface
func (s StringSlice) MarshalJSON() ([]byte, error) {
	if s == nil {
		return []byte("[]"), nil
	}
	return json.Marshal([]string(s))
}

// UnmarshalJSON implements json.Unmarshaler interface
func (s *StringSlice) UnmarshalJSON(data []byte) error {
	var result []string
	if err := json.Unmarshal(data, &result); err != nil {
		return err
	}
	*s = result
	return nil
}
