package models

import (
	"database/sql/driver"
	"fmt"
	"strings"
	"time"
)

// TimeOfDay keeps PostgreSQL TIME values in the API's HH:mm representation.
// PostgreSQL drivers may scan TIME as either time.Time or a string containing
// seconds, so the model normalizes both forms at the persistence boundary.
type TimeOfDay string

func (value *TimeOfDay) Scan(input interface{}) error {
	if input == nil {
		*value = ""
		return nil
	}
	switch typed := input.(type) {
	case time.Time:
		*value = TimeOfDay(typed.Format("15:04"))
		return nil
	case string:
		return value.set(typed)
	case []byte:
		return value.set(string(typed))
	default:
		return fmt.Errorf("cannot scan %T as time of day", input)
	}
}

func (value *TimeOfDay) set(input string) error {
	input = strings.TrimSpace(input)
	if input == "" {
		*value = ""
		return nil
	}
	parsed, err := time.Parse("15:04", input)
	if err != nil {
		parsed, err = time.Parse("15:04:05", input)
	}
	if err != nil {
		return fmt.Errorf("invalid time of day %q: %w", input, err)
	}
	*value = TimeOfDay(parsed.Format("15:04"))
	return nil
}

func (value TimeOfDay) Value() (driver.Value, error) {
	if strings.TrimSpace(string(value)) == "" {
		return nil, nil
	}
	var normalized TimeOfDay
	if err := normalized.set(string(value)); err != nil {
		return nil, err
	}
	return string(normalized), nil
}
