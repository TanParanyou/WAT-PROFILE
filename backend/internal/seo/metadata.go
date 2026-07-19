package seo

import (
	"fmt"
	"strings"

	"github.com/watloungporsai/wat-profile-backend/internal/models"
)

// Metadata is the stable SEO contract shared by public page responses and the admin editor.
type Metadata struct {
	Title        models.MultiLangText `json:"title"`
	Description  models.MultiLangText `json:"description"`
	Keywords     models.MultiLangText `json:"keywords"`
	OGImage      string               `json:"og_image,omitempty"`
	CanonicalURL string               `json:"canonical_url,omitempty"`
	NoIndex      bool                 `json:"noindex,omitempty"`
}

// ValidateMap rejects malformed SEO JSON instead of silently accepting values with the wrong type.
func ValidateMap(raw models.JSONMap) error {
	if raw == nil {
		return nil
	}
	for _, key := range []string{"title", "description", "keywords"} {
		if value, ok := raw[key]; ok {
			if _, valid := value.(map[string]interface{}); !valid {
				return fmt.Errorf("seo.%s must be an object", key)
			}
		}
	}
	for _, key := range []string{"og_image", "canonical_url"} {
		if value, ok := raw[key]; ok {
			if text, valid := value.(string); !valid || strings.TrimSpace(text) == "" {
				return fmt.Errorf("seo.%s must be a non-empty string", key)
			}
		}
	}
	if value, ok := raw["noindex"]; ok {
		if _, valid := value.(bool); !valid {
			return fmt.Errorf("seo.noindex must be a boolean")
		}
	}
	return nil
}
