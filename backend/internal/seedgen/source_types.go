package seedgen

import "encoding/json"

type LocalizedText struct {
	TH string `json:"th"`
	EN string `json:"en"`
	DE string `json:"de"`
}

type EventFixture struct {
	ID          int             `json:"id"`
	Active      bool            `json:"active"`
	Title       LocalizedText   `json:"title"`
	Date        string          `json:"date"`
	Time        string          `json:"time"`
	Location    LocalizedText   `json:"location"`
	Image       string          `json:"image"`
	Description LocalizedText   `json:"description"`
	Schedule    []ScheduleEntry `json:"schedule"`
	MapURL      string          `json:"mapUrl"`
}

type ScheduleEntry struct {
	Time     string        `json:"time"`
	Activity LocalizedText `json:"activity"`
}

type MonkFixture struct {
	ID      string        `json:"id"`
	Slug    string        `json:"slug"`
	Image   string        `json:"image"`
	Name    LocalizedText `json:"name"`
	Title   LocalizedText `json:"title"`
	Content LocalizedText `json:"content"`
}

type GalleryFixture struct {
	ID       int           `json:"id"`
	Source   string        `json:"src"`
	Caption  LocalizedText `json:"caption"`
	Category string        `json:"category"`
	Active   bool          `json:"active"`
}

type CategoryFixture struct {
	ID     string        `json:"id"`
	Active bool          `json:"active"`
	Name   LocalizedText `json:"name"`
}

type ScheduleFixture struct {
	Daily  []ScheduleEntry       `json:"daily"`
	Weekly []WeeklyScheduleEntry `json:"weekly"`
	Online OnlineScheduleEntry   `json:"online"`
}

type WeeklyScheduleEntry struct {
	Day      LocalizedText `json:"day"`
	Time     string        `json:"time"`
	Activity LocalizedText `json:"activity"`
}

type OnlineScheduleEntry struct {
	Title       LocalizedText `json:"title"`
	Description LocalizedText `json:"description"`
	Link        string        `json:"link"`
}

type SiteSettingsFixture struct {
	Contact ContactFixture `json:"contact"`
}

type ContactFixture struct {
	Address      LocalizedText       `json:"address"`
	Phone        string              `json:"phone"`
	Email        string              `json:"email"`
	Social       SocialFixture       `json:"social"`
	OpeningHours OpeningHoursFixture `json:"openingHours"`
	Transport    TransportFixture    `json:"transport"`
	Map          MapFixture          `json:"map"`
	Bank         BankFixture         `json:"bank"`
}

type SocialFixture struct {
	Facebook  string `json:"facebook"`
	Messenger string `json:"messenger"`
	Instagram string `json:"instagram"`
}

type OpeningHoursFixture struct {
	Days   LocalizedText `json:"days"`
	Time   string        `json:"time"`
	Remark LocalizedText `json:"remark"`
}

type TransportFixture struct {
	Parking       LocalizedText            `json:"parking"`
	DirectionsURL string                   `json:"directionsUrl"`
	Public        []PublicTransportFixture `json:"public"`
	Car           CarFixture               `json:"car"`
}

type PublicTransportFixture struct {
	Icon string        `json:"icon"`
	Text LocalizedText `json:"text"`
}

type CarFixture struct {
	Text LocalizedText `json:"text"`
}

type MapFixture struct {
	EmbedURL     string `json:"embedUrl"`
	LocationName string `json:"locationName"`
}

type BankFixture struct {
	Name    string `json:"name"`
	Account string `json:"account"`
	IBAN    string `json:"iban"`
	BIC     string `json:"bic"`
}

type CMSPageFixture struct {
	ID                   string              `json:"id"`
	PageKey              string              `json:"page_key"`
	Slug                 string              `json:"slug"`
	Title                LocalizedText       `json:"title"`
	Description          LocalizedText       `json:"description"`
	SEO                  json.RawMessage     `json:"seo"`
	Body                 json.RawMessage     `json:"body"`
	Settings             json.RawMessage     `json:"settings"`
	Status               string              `json:"status"`
	PublishedTitle       *LocalizedText      `json:"published_title"`
	PublishedDescription *LocalizedText      `json:"published_description"`
	PublishedSEO         json.RawMessage     `json:"published_seo"`
	PublishedBody        json.RawMessage     `json:"published_body"`
	PublishedSettings    json.RawMessage     `json:"published_settings"`
	PublishedAt          string              `json:"published_at"`
	CreatedAt            string              `json:"created_at"`
	UpdatedAt            string              `json:"updated_at"`
	Sections             []CMSSectionFixture `json:"sections"`
}

type CMSSectionFixture struct {
	ID                   string          `json:"id"`
	PageID               string          `json:"page_id"`
	SectionKey           string          `json:"section_key"`
	SectionType          string          `json:"section_type"`
	Title                LocalizedText   `json:"title"`
	Description          LocalizedText   `json:"description"`
	Body                 json.RawMessage `json:"body"`
	Settings             json.RawMessage `json:"settings"`
	SortOrder            int             `json:"sort_order"`
	Status               string          `json:"status"`
	PublishedTitle       *LocalizedText  `json:"published_title"`
	PublishedDescription *LocalizedText  `json:"published_description"`
	PublishedBody        json.RawMessage `json:"published_body"`
	PublishedSettings    json.RawMessage `json:"published_settings"`
	PublishedAt          string          `json:"published_at"`
	CreatedAt            string          `json:"created_at"`
	UpdatedAt            string          `json:"updated_at"`
}

type AboutFixture struct {
	Intro          AboutIntroFixture       `json:"intro"`
	Objective      AboutObjectiveFixture   `json:"objective"`
	Administration AboutTextSectionFixture `json:"administration"`
	BuddhaHistory  AboutTextSectionFixture `json:"buddhaHistory"`
	Buildings      AboutBuildingsFixture   `json:"buildings"`
	Sangha         AboutSanghaFixture      `json:"sangha"`
}

type AboutIntroFixture struct {
	NavTitle    LocalizedText `json:"navTitle"`
	Title       LocalizedText `json:"title"`
	Description LocalizedText `json:"description"`
	Founded     LocalizedText `json:"founded"`
	Location    LocalizedText `json:"location"`
}

type AboutObjectiveFixture struct {
	NavTitle LocalizedText `json:"navTitle"`
	Title    LocalizedText `json:"title"`
	Subtitle LocalizedText `json:"subtitle"`
	Content  LocalizedText `json:"content"`
}

type AboutTextSectionFixture struct {
	NavTitle LocalizedText `json:"navTitle"`
	Title    LocalizedText `json:"title"`
	Content  LocalizedText `json:"content"`
}

type AboutBuildingsFixture struct {
	Title LocalizedText          `json:"title"`
	Items []AboutBuildingFixture `json:"items"`
}

type AboutBuildingFixture struct {
	Name        LocalizedText `json:"name"`
	Description LocalizedText `json:"description"`
}

type AboutSanghaFixture struct {
	NavTitle    LocalizedText `json:"navTitle"`
	Title       LocalizedText `json:"title"`
	Mission     LocalizedText `json:"mission"`
	CurrentWork LocalizedText `json:"currentWork"`
}

type FixtureBundle struct {
	Events       []EventFixture
	Monks        []MonkFixture
	Galleries    []GalleryFixture
	Categories   []CategoryFixture
	Schedules    ScheduleFixture
	SiteSettings SiteSettingsFixture
	CMSPages     []CMSPageFixture
	About        AboutFixture
	Contact      ContactFixture
}
