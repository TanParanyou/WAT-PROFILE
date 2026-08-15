package services

import (
	"reflect"
	"testing"
)

func TestNormalizeResourceIDsSortsAndDeduplicates(t *testing.T) {
	got, err := NormalizeResourceIDs([]int{9, 2, 9, 4})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if want := []int{2, 4, 9}; !reflect.DeepEqual(got, want) {
		t.Fatalf("expected %#v, got %#v", want, got)
	}
}

func TestNormalizeResourceIDsRejectsNonPositiveIDs(t *testing.T) {
	if _, err := NormalizeResourceIDs([]int{1, 0}); err == nil {
		t.Fatal("expected non-positive resource ID to be rejected")
	}
}
