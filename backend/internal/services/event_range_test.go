package services

import (
	"testing"
	"time"
)

func TestEventDateRangeOverlaps(t *testing.T) {
	start := date("2026-08-10")
	end := date("2026-08-12")
	cases := []struct {
		name string
		from time.Time
		to   time.Time
		want bool
	}{
		{name: "starts on range end", from: date("2026-08-01"), to: date("2026-08-10"), want: true},
		{name: "ends on range start", from: date("2026-08-12"), to: date("2026-08-31"), want: true},
		{name: "after range", from: date("2026-08-13"), to: date("2026-08-31"), want: false},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := EventDateRangeOverlaps(start, end, tc.from, tc.to); got != tc.want {
				t.Fatalf("overlap(%s, %s) = %t, want %t", tc.from.Format("2006-01-02"), tc.to.Format("2006-01-02"), got, tc.want)
			}
		})
	}
}

func date(value string) time.Time {
	parsed, err := time.Parse("2006-01-02", value)
	if err != nil {
		panic(err)
	}
	return parsed
}
