package eventalert

import "fmt"

type Settings struct {
	Enabled          bool `json:"enabled"`
	EventID          int  `json:"event_id"`
	EventSlug        string `json:"event_slug,omitempty"`
	DelaySeconds     int  `json:"delay_seconds"`
	DismissHours     int  `json:"dismiss_hours"`
}

func (s Settings) Validate() error {
	if s.EventID < 0 { return fmt.Errorf("event_id must be non-negative") }
	if s.DelaySeconds < 0 || s.DelaySeconds > 30 { return fmt.Errorf("delay_seconds must be between 0 and 30") }
	if s.DismissHours < 1 || s.DismissHours > 720 { return fmt.Errorf("dismiss_hours must be between 1 and 720") }
	return nil
}
