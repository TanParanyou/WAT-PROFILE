package calendar

import (
	"context"
	"time"
)

type Locale string

// MaxRangeDays is the largest inclusive visible range accepted by the feed.
// It covers month grids with adjacent-week padding while preventing unbounded
// source queries from a public endpoint.
const MaxRangeDays = 93

const (
	LocaleThai    Locale = "th"
	LocaleEnglish Locale = "en"
	LocaleGerman  Locale = "de"
)

func (l Locale) Valid() bool {
	return l == LocaleThai || l == LocaleEnglish || l == LocaleGerman
}

type Request struct {
	From   time.Time
	To     time.Time
	Locale Locale
}

type Entry struct {
	ID          string   `json:"id"`
	Source      string   `json:"source"`
	Title       string   `json:"title"`
	Start       string   `json:"start"`
	End         string   `json:"end"`
	AllDay      bool     `json:"allDay"`
	ResourceID  string   `json:"resourceId,omitempty"`
	ResourceIDs []string `json:"resourceIds,omitempty"`
	Status      string   `json:"status"`
	Display     Display  `json:"display"`
	Detail      Detail   `json:"detail"`
}

type Display struct {
	Tone string `json:"tone"`
}

type Detail struct {
	Href        string `json:"href,omitempty"`
	EditorHref  string `json:"editorHref,omitempty"`
	CanEdit     bool   `json:"canEdit"`
	Description string `json:"description,omitempty"`
	Location    string `json:"location,omitempty"`
}

type Resource struct {
	ID    string `json:"id"`
	Title string `json:"title"`
	Color string `json:"color,omitempty"`
	Group string `json:"group,omitempty"`
}

type Feed struct {
	Scope     string     `json:"scope"`
	Locale    Locale     `json:"locale"`
	Timezone  string     `json:"timezone"`
	Range     Range      `json:"range"`
	Entries   []Entry    `json:"entries"`
	Resources []Resource `json:"resources"`
}

type Range struct {
	StartDate string `json:"startDate"`
	EndDate   string `json:"endDate"`
}

type Source interface {
	Name() string
	List(context.Context, Request, bool) ([]Entry, error)
}

// ResourceSource is an optional extension for sources that expose calendar
// lanes. Keeping it separate preserves compatibility with existing adapters.
type ResourceSource interface {
	Source
	ListResources(context.Context, Locale, bool) ([]Resource, error)
}
