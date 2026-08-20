package models

import (
	"encoding/json"
	"testing"
	"time"
)

func TestDateOnly_UnmarshalJSON(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
		wantErr  bool
	}{
		{
			name:     "standard date string YYYY-MM-DD",
			input:    `{"date":"2018-08-01"}`,
			expected: "2018-08-01",
			wantErr:  false,
		},
		{
			name:     "RFC3339 timestamp",
			input:    `{"date":"2018-08-01T00:00:00Z"}`,
			expected: "2018-08-01",
			wantErr:  false,
		},
		{
			name:     "empty string",
			input:    `{"date":""}`,
			expected: "",
			wantErr:  false,
		},
		{
			name:     "null value",
			input:    `{"date":null}`,
			expected: "",
			wantErr:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var wrapper struct {
				Date DateOnly `json:"date"`
			}
			err := json.Unmarshal([]byte(tt.input), &wrapper)
			if (err != nil) != tt.wantErr {
				t.Fatalf("Unmarshal error = %v, wantErr %v", err, tt.wantErr)
			}
			if string(wrapper.Date) != tt.expected {
				t.Errorf("Date = %q, expected %q", wrapper.Date, tt.expected)
			}
		})
	}
}

func TestDateOnly_ScanAndValue(t *testing.T) {
	var d DateOnly
	now := time.Date(2023, 5, 15, 0, 0, 0, 0, time.UTC)
	if err := d.Scan(now); err != nil {
		t.Fatalf("Scan(time.Time) error = %v", err)
	}
	if string(d) != "2023-05-15" {
		t.Errorf("expected 2023-05-15, got %s", d)
	}

	val, err := d.Value()
	if err != nil {
		t.Fatalf("Value() error = %v", err)
	}
	if val == nil {
		t.Fatal("expected non-nil value")
	}
}
