package accountauth

import (
	"net"
	"strings"
)

// maxUserAgentLength bounds the stored user-agent summary.
const maxUserAgentLength = 255

// CoarseIPPrefix returns a coarse, location-neutral network prefix for the
// given IP address. IPv4 addresses are masked to /24 and IPv6 to /48 so the
// database never holds a full, long-lived IP history. Invalid or empty inputs
// return an empty string.
func CoarseIPPrefix(ip string) string {
	if ip == "" {
		return ""
	}
	parsed := net.ParseIP(ip)
	if parsed == nil {
		return ""
	}
	if v4 := parsed.To4(); v4 != nil {
		v4 = v4.Mask(net.CIDRMask(24, 32))
		return v4.String() + "/24"
	}
	parsed = parsed.Mask(net.CIDRMask(48, 128))
	return parsed.String() + "/48"
}

// SanitizeUserAgent strips control characters from a user-agent string and
// bounds its length so stored session metadata stays clean.
func SanitizeUserAgent(userAgent string) string {
	var b strings.Builder
	for _, r := range userAgent {
		if r < 0x20 || r == 0x7f {
			continue
		}
		b.WriteRune(r)
		if b.Len() >= maxUserAgentLength {
			break
		}
	}
	return b.String()
}
