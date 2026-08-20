package models

import (
	"database/sql/driver"
	"fmt"
	"strings"
	"time"
)

// DateOnly keeps date-only values (YYYY-MM-DD) for JSON APIs and PostgreSQL DATE columns.
// It handles JSON unmarshaling from "YYYY-MM-DD", RFC3339 ("2006-01-02T15:04:05Z"),
// empty strings (""), and null.
type DateOnly string

func (d *DateOnly) Scan(input interface{}) error {
	if input == nil {
		*d = ""
		return nil
	}
	switch typed := input.(type) {
	case time.Time:
		*d = DateOnly(typed.Format("2006-01-02"))
		return nil
	case string:
		return d.set(typed)
	case []byte:
		return d.set(string(typed))
	default:
		return fmt.Errorf("cannot scan %T as DateOnly", input)
	}
}

func (d *DateOnly) set(input string) error {
	input = strings.TrimSpace(input)
	if input == "" || input == "null" {
		*d = ""
		return nil
	}
	// Try standard date format first (YYYY-MM-DD)
	parsed, err := time.Parse("2006-01-02", input)
	if err != nil {
		// Try RFC3339 or ISO8601 timestamps
		parsed, err = time.Parse(time.RFC3339, input)
		if err != nil {
			parsed, err = time.Parse("2006-01-02T15:04:05", input)
		}
	}
	if err != nil {
		return fmt.Errorf("invalid date format %q: %w", input, err)
	}
	*d = DateOnly(parsed.Format("2006-01-02"))
	return nil
}

func (d DateOnly) Value() (driver.Value, error) {
	str := strings.TrimSpace(string(d))
	if str == "" {
		return nil, nil
	}
	parsed, err := time.Parse("2006-01-02", str)
	if err != nil {
		return nil, err
	}
	return parsed, nil
}

func (d *DateOnly) UnmarshalJSON(b []byte) error {
	s := strings.Trim(string(b), "\"")
	return d.set(s)
}

func (d DateOnly) MarshalJSON() ([]byte, error) {
	str := strings.TrimSpace(string(d))
	if str == "" {
		return []byte("null"), nil
	}
	return []byte(fmt.Sprintf("%q", str)), nil
}

func (d DateOnly) String() string {
	return string(d)
}
