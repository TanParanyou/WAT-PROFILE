package services

import (
	"testing"
	"time"
)

func TestAnonymizeIP(t *testing.T) {
	t1 := time.Date(2026, 8, 28, 10, 0, 0, 0, time.UTC)
	t2 := time.Date(2026, 8, 29, 10, 0, 0, 0, time.UTC)

	ip := "192.168.1.100"

	h1 := AnonymizeIP(ip, t1)
	h1Again := AnonymizeIP(ip, t1)
	h2 := AnonymizeIP(ip, t2)
	hOther := AnonymizeIP("192.168.1.101", t1)

	if h1 == "" {
		t.Fatal("expected non-empty hash for valid IP")
	}
	if h1 != h1Again {
		t.Fatalf("expected deterministic hash for same IP on same day, got %s and %s", h1, h1Again)
	}
	if h1 == h2 {
		t.Fatalf("expected different hash across different days for privacy salt, got %s and %s", h1, h2)
	}
	if h1 == hOther {
		t.Fatalf("expected different hash for different IPs, got %s and %s", h1, hOther)
	}
	if AnonymizeIP("", t1) != "" {
		t.Fatalf("expected empty hash for empty IP")
	}
}

func TestParseUserAgent(t *testing.T) {
	cases := []struct {
		name       string
		ua         string
		wantDevice string
		wantBrowser string
		wantOS     string
	}{
		{
			name:       "Googlebot",
			ua:         "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
			wantDevice: "bot",
			wantBrowser: "bot",
			wantOS:     "other",
		},
		{
			name:       "iPhone Safari",
			ua:         "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
			wantDevice: "mobile",
			wantBrowser: "Safari",
			wantOS:     "iOS",
		},
		{
			name:       "Android Chrome",
			ua:         "Mozilla/5.0 (Linux; Android 13; SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36",
			wantDevice: "mobile",
			wantBrowser: "Chrome",
			wantOS:     "Android",
		},
		{
			name:       "macOS Desktop Chrome",
			ua:         "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
			wantDevice: "desktop",
			wantBrowser: "Chrome",
			wantOS:     "macOS",
		},
		{
			name:       "Windows Desktop Edge",
			ua:         "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
			wantDevice: "desktop",
			wantBrowser: "Edge",
			wantOS:     "Windows",
		},
		{
			name:       "iPad Safari",
			ua:         "Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1",
			wantDevice: "tablet",
			wantBrowser: "Safari",
			wantOS:     "iOS",
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			device, browser, os := ParseUserAgent(tc.ua)
			if device != tc.wantDevice {
				t.Errorf("device got %s, want %s", device, tc.wantDevice)
			}
			if browser != tc.wantBrowser {
				t.Errorf("browser got %s, want %s", browser, tc.wantBrowser)
			}
			if os != tc.wantOS {
				t.Errorf("os got %s, want %s", os, tc.wantOS)
			}
		})
	}
}
