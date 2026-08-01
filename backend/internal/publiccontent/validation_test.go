package publiccontent

import (
	"encoding/json"
	"fmt"
	"testing"
)

func TestPrivacyContentValidation2(t *testing.T) {
	jsonPayload := []byte(`{
    "title": {
        "th": "นโยบายความเป็นส่วนตัว",
        "en": "Privacy Policy",
        "de": "Datenschutzerklärung"
    },
    "seo": {
        "title": {
            "th": "พ",
            "en": "",
            "de": ""
        },
        "description": {
            "th": "พ",
            "en": "",
            "de": ""
        },
        "keywords": {
            "th": "",
            "en": "",
            "de": ""
        },
        "og_image": "",
        "canonical_url": "/th/privacy"
    },
    "body": {
        "content": {
            "de": null,
            "en": null,
            "th": {
                "type": "doc",
                "content": [
                    {
                        "type": "paragraph",
                        "attrs": {
                            "textAlign": null
                        },
                        "content": [
                            {
                                "type": "text",
                                "marks": [
                                    {
                                        "type": "bold"
                                    }
                                ],
                                "text": "นโยบายความเป็นส่วนตัว (Privacy Policy)"
                            }
                        ]
                    }
                ]
            }
        },
        "last_updated": "2026-08-01T21:22:50.318245+07:00"
    },
    "updated_at": "2026-08-01T21:22:50.31837+07:00"
}`)

	var req PrivacyContent
	if err := json.Unmarshal(jsonPayload, &req); err != nil {
		t.Fatalf("Unmarshal failed: %v", err)
	}

	if err := ValidatePrivacyContent(&req); err != nil {
		t.Fatalf("ValidatePrivacyContent failed: %v", err)
	}
	fmt.Println("All validations passed")
}
