package contacts

import (
	"strings"
	"testing"
)

func TestNormalizeAndValidate(t *testing.T) {
	valid := SubmitRequest{
		Name: " วัด ", Email: " Visitor@Example.com ", Subject: " ถาม ", Message: " ข้อความ ", Locale: "th",
	}
	got, validationErr := NormalizeAndValidate(valid)
	if validationErr != nil {
		t.Fatalf("unexpected validation error: %v", validationErr)
	}
	if got.Name != "วัด" || got.Email != "visitor@example.com" || got.Subject != "ถาม" || got.Message != "ข้อความ" || got.Locale != "th" {
		t.Fatalf("unexpected normalization: %+v", got)
	}

	cases := []struct {
		name   string
		mutate func(*SubmitRequest)
		field  string
	}{
		{"name required", func(v *SubmitRequest) { v.Name = " " }, "name"},
		{"name Unicode limit", func(v *SubmitRequest) { v.Name = strings.Repeat("ก", 121) }, "name"},
		{"email invalid", func(v *SubmitRequest) { v.Email = "bad" }, "email"},
		{"subject required", func(v *SubmitRequest) { v.Subject = "" }, "subject"},
		{"subject Unicode limit", func(v *SubmitRequest) { v.Subject = strings.Repeat("ä", 201) }, "subject"},
		{"message Unicode limit", func(v *SubmitRequest) { v.Message = strings.Repeat("🙂", 5001) }, "message"},
		{"locale invalid", func(v *SubmitRequest) { v.Locale = "fr" }, "locale"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			request := valid
			tc.mutate(&request)
			_, err := NormalizeAndValidate(request)
			if err == nil || err.Fields[tc.field] == "" {
				t.Fatalf("expected %s error, got %#v", tc.field, err)
			}
		})
	}
}

func TestNormalizeAndValidateDoesNotPersistHoneypot(t *testing.T) {
	request := SubmitRequest{
		Name: "Visitor", Email: "visitor@example.com", Subject: "Visit", Message: "Hello", Locale: "en", Website: "bot",
	}
	got, err := NormalizeAndValidate(request)
	if err != nil {
		t.Fatal(err)
	}
	if got == (Submission{}) || strings.Contains(got.Message, request.Website) {
		t.Fatalf("unexpected submission: %+v", got)
	}
}
