package services

import (
	"strings"
	"testing"
	"time"
)

func TestOutboxRetryDelayUsesBoundedExponentialBackoff(t *testing.T) {
	cases := []struct {
		attempt int
		want    time.Duration
	}{
		{attempt: 1, want: time.Minute},
		{attempt: 2, want: 2 * time.Minute},
		{attempt: 3, want: 4 * time.Minute},
		{attempt: 20, want: time.Hour},
	}
	for _, tc := range cases {
		if got := outboxRetryDelay(tc.attempt); got != tc.want {
			t.Errorf("attempt %d: delay = %s, want %s", tc.attempt, got, tc.want)
		}
	}
}

func TestOutboxErrorIsTrimmedAndBounded(t *testing.T) {
	if got := truncateOutboxError("  temporary failure  "); got != "temporary failure" {
		t.Fatalf("trimmed error = %q", got)
	}
	long := strings.Repeat("x", 3000)
	if got := truncateOutboxError(long); len(got) != 2000 {
		t.Fatalf("bounded error length = %d, want 2000", len(got))
	}
}
