package security

import (
	"fmt"
	"net/url"
	"strings"
)

// ParseOrigins validates a comma-separated credentialed-request origin list.
// Origins are explicit scheme+host values: paths, queries, fragments, and
// wildcards are rejected so the same policy can safely drive CORS and CSRF
// origin guards.
func ParseOrigins(value string, requireHTTPS bool) ([]string, error) {
	if strings.TrimSpace(value) == "" {
		return nil, fmt.Errorf("value is required")
	}
	seen := make(map[string]struct{})
	origins := make([]string, 0)
	for _, part := range strings.Split(value, ",") {
		part = strings.TrimSpace(part)
		if part == "" || strings.Contains(part, "*") {
			return nil, fmt.Errorf("origins must be explicit and cannot contain wildcards")
		}
		u, err := url.Parse(part)
		if err != nil || u.Host == "" || u.Path != "" || u.RawQuery != "" || u.Fragment != "" || (u.Scheme != "http" && u.Scheme != "https") {
			return nil, fmt.Errorf("%q is not an origin", part)
		}
		if requireHTTPS && u.Scheme != "https" {
			return nil, fmt.Errorf("%q must use https", part)
		}
		if _, ok := seen[part]; ok {
			continue
		}
		seen[part] = struct{}{}
		origins = append(origins, part)
	}
	return origins, nil
}
