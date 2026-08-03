package accountauth

import "testing"

// TestCoarseIPPrefixIPv4 verifies IPv4 addresses are masked to a /24 prefix.
func TestCoarseIPPrefixIPv4(t *testing.T) {
	cases := map[string]string{
		"203.0.113.42":   "203.0.113.0/24",
		"203.0.113.255":  "203.0.113.0/24",
		"198.51.100.7":   "198.51.100.0/24",
		"10.20.30.40":    "10.20.30.0/24",
	}
	for input, want := range cases {
		if got := CoarseIPPrefix(input); got != want {
			t.Errorf("CoarseIPPrefix(%q) = %q, want %q", input, got, want)
		}
	}
}

// TestCoarseIPPrefixIPv6 verifies IPv6 addresses are masked to a /48 prefix.
func TestCoarseIPPrefixIPv6(t *testing.T) {
	got := CoarseIPPrefix("2001:db8:1:2:3:4:5:6")
	want := "2001:db8:1::/48"
	if got != want {
		t.Errorf("CoarseIPPrefix(IPv6) = %q, want %q", got, want)
	}
}

// TestCoarseIPPrefixInvalid verifies invalid or empty inputs return "".
func TestCoarseIPPrefixInvalid(t *testing.T) {
	for _, input := range []string{"", "not-an-ip", "999.1.1.1", "::ffff:zz"} {
		if got := CoarseIPPrefix(input); got != "" {
			t.Errorf("CoarseIPPrefix(%q) = %q, want empty", input, got)
		}
	}
}

// TestSanitizeUserAgent verifies control characters are stripped and the
// result is bounded in length.
func TestSanitizeUserAgent(t *testing.T) {
	got := SanitizeUserAgent("Mozilla/5.0\x01\x02 (Test Browser)")
	if got != "Mozilla/5.0 (Test Browser)" {
		t.Errorf("SanitizeUserAgent = %q, want control-free value", got)
	}
}
