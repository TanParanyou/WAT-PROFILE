package services

import "testing"

func TestHashRateLimitSubjectIsStableAndDoesNotExposeRawValue(t *testing.T) {
	first := hashRateLimitSubject("ip", "203.0.113.10")
	second := hashRateLimitSubject("ip", " 203.0.113.10 ")
	if first != second {
		t.Fatal("normalized subjects should hash identically")
	}
	if first == "203.0.113.10" || len(first) != 64 {
		t.Fatalf("unexpected subject hash %q", first)
	}
}
