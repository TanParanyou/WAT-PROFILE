package models

import (
	"testing"
)

func TestCommunityQuestionTableAndDefaults(t *testing.T) {
	q := CommunityQuestion{}
	if q.TableName() != "community_questions" {
		t.Fatalf("table = %q", q.TableName())
	}
	if CommunityPublicationPublished != "published" {
		t.Fatalf("published constant changed")
	}
}

func TestRichTextDocumentRoundTrip(t *testing.T) {
	want := RichTextDocument(`{"type":"doc","content":[{"type":"paragraph"}]}`)
	value, err := want.Value()
	if err != nil {
		t.Fatal(err)
	}
	var got RichTextDocument
	if err := got.Scan(value); err != nil {
		t.Fatal(err)
	}
	if string(got) != string(want) {
		t.Fatalf("got %s", got)
	}
}
