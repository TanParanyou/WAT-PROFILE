package seedgen

import (
	"encoding/json"
	"fmt"
	"sort"
	"strings"
	"time"
	"unicode"

	"github.com/google/uuid"
)

var requiredPageKeys = []string{
	"PAGE-HOME", "PAGE-ABOUT", "PAGE-CONTACT", "PAGE-EVENTS", "PAGE-GALLERY", "PAGE-MONKS",
}

func Normalize(bundle FixtureBundle) (SeedSnapshot, error) {
	if err := validateFixtureCounts(bundle); err != nil {
		return SeedSnapshot{}, err
	}
	events, err := normalizeEvents(bundle.Events)
	if err != nil {
		return SeedSnapshot{}, err
	}
	monks, err := normalizeMonks(bundle.Monks)
	if err != nil {
		return SeedSnapshot{}, err
	}
	categories, galleries, err := normalizeGallery(bundle.Categories, bundle.Galleries)
	if err != nil {
		return SeedSnapshot{}, err
	}
	schedules, err := normalizeSchedules(bundle.Schedules)
	if err != nil {
		return SeedSnapshot{}, err
	}
	pages, sections, err := normalizeCMS(bundle.CMSPages, bundle.About, bundle.Contact)
	if err != nil {
		return SeedSnapshot{}, err
	}
	settings, err := normalizeSettings(bundle.SiteSettings, bundle.About)
	if err != nil {
		return SeedSnapshot{}, err
	}
	return SeedSnapshot{Events: events, Monks: monks, Categories: categories, Galleries: galleries, Schedules: schedules, ContentPages: pages, ContentSections: sections, Settings: settings}, nil
}

func normalizeEvents(fixtures []EventFixture) ([]SeedEvent, error) {
	used := make(map[string]struct{}, len(fixtures))
	result := make([]SeedEvent, 0, len(fixtures))
	for index, fixture := range fixtures {
		if err := validateLocalized(fmt.Sprintf("events[%d].title", index), fixture.Title); err != nil {
			return nil, err
		}
		if err := validateLocalized(fmt.Sprintf("events[%d].location", index), fixture.Location); err != nil {
			return nil, err
		}
		if err := validateLocalized(fmt.Sprintf("events[%d].description", index), fixture.Description); err != nil {
			return nil, err
		}
		date, err := parseDate(fixture.Date)
		if err != nil {
			return nil, fmt.Errorf("events[%d].date: %w", index, err)
		}
		start, end, _, err := parseTimeRange(fixture.Time)
		if err != nil {
			return nil, fmt.Errorf("events[%d].time: %w", index, err)
		}
		slug := uniqueEventSlug(slugifyEnglish(fixture.Title.EN), fixture.ID, used)
		if slug == "" {
			return nil, fmt.Errorf("events[%d].title.en produces an empty slug", index)
		}
		schedules := make([]SeedEventSchedule, 0, len(fixture.Schedule))
		for scheduleIndex, schedule := range fixture.Schedule {
			if err := validateLocalized(fmt.Sprintf("events[%d].schedule[%d].activity", index, scheduleIndex), schedule.Activity); err != nil {
				return nil, err
			}
			scheduleStart, scheduleEnd, readable, err := parseTimeRange(schedule.Time)
			if err != nil {
				return nil, fmt.Errorf("events[%d].schedule[%d].time: %w", index, scheduleIndex, err)
			}
			if !readable || scheduleStart == nil || scheduleEnd == nil {
				return nil, fmt.Errorf("events[%d].schedule[%d].time must be HH:mm or HH:mm - HH:mm", index, scheduleIndex)
			}
			schedules = append(schedules, SeedEventSchedule{StartTime: *scheduleStart, EndTime: *scheduleEnd, Activity: schedule.Activity, DisplayOrder: scheduleIndex})
		}
		result = append(result, SeedEvent{Slug: slug, StartDate: date, EndDate: date, ImageURL: fixture.Image, MapURL: fixture.MapURL, EventType: "", Title: fixture.Title, Location: fixture.Location, Description: localizedTextDocument(fixture.Description), StartTime: start, EndTime: end, IsActive: fixture.Active, DisplayOrder: index, Schedules: schedules})
	}
	return result, nil
}

func normalizeMonks(fixtures []MonkFixture) ([]SeedMonk, error) {
	seen := make(map[string]struct{}, len(fixtures))
	result := make([]SeedMonk, 0, len(fixtures))
	for index, fixture := range fixtures {
		if fixture.Slug == "" {
			return nil, fmt.Errorf("monks[%d].slug is required", index)
		}
		if _, exists := seen[fixture.Slug]; exists {
			return nil, fmt.Errorf("duplicate monk slug %q", fixture.Slug)
		}
		seen[fixture.Slug] = struct{}{}
		if err := validateLocalized(fmt.Sprintf("monks[%d].name", index), fixture.Name); err != nil {
			return nil, err
		}
		if err := validateLocalized(fmt.Sprintf("monks[%d].title", index), fixture.Title); err != nil {
			return nil, err
		}
		if err := validateLocalized(fmt.Sprintf("monks[%d].content", index), fixture.Content); err != nil {
			return nil, err
		}
		bio, err := localizedHTMLDocument(fixture.Content)
		if err != nil {
			return nil, fmt.Errorf("monks[%d].content: %w", index, err)
		}
		result = append(result, SeedMonk{Slug: fixture.Slug, ImageURL: fixture.Image, Position: "", Name: fixture.Name, Title: fixture.Title, Bio: bio, DisplayOrder: index, IsActive: true})
	}
	return result, nil
}

func normalizeGallery(categories []CategoryFixture, galleries []GalleryFixture) ([]SeedCategory, []SeedGallery, error) {
	known := make(map[string]struct{}, len(categories))
	seedCategories := make([]SeedCategory, 0, len(categories)-1)
	for index, category := range categories {
		if category.ID == "all" {
			continue
		}
		if category.ID == "" {
			return nil, nil, fmt.Errorf("categories[%d].id is required", index)
		}
		if _, exists := known[category.ID]; exists {
			return nil, nil, fmt.Errorf("duplicate gallery category %q", category.ID)
		}
		if err := validateLocalized(fmt.Sprintf("categories[%d].name", index), category.Name); err != nil {
			return nil, nil, err
		}
		known[category.ID] = struct{}{}
		seedCategories = append(seedCategories, SeedCategory{Slug: category.ID, Name: category.Name, DisplayOrder: len(seedCategories), IsActive: category.Active})
	}
	seedGalleries := make([]SeedGallery, 0, len(galleries))
	for index, gallery := range galleries {
		if gallery.Source == "" {
			return nil, nil, fmt.Errorf("gallery[%d].src is required", index)
		}
		if _, exists := known[gallery.Category]; !exists {
			return nil, nil, fmt.Errorf("gallery[%d] references unknown category %q", index, gallery.Category)
		}
		if err := validateLocalized(fmt.Sprintf("gallery[%d].caption", index), gallery.Caption); err != nil {
			return nil, nil, err
		}
		seedGalleries = append(seedGalleries, SeedGallery{ImageURL: gallery.Source, ThumbnailURL: gallery.Source, CategorySlug: gallery.Category, Caption: gallery.Caption, DisplayOrder: index, IsActive: gallery.Active})
	}
	return seedCategories, seedGalleries, nil
}

func normalizeSchedules(fixture ScheduleFixture) ([]SeedSchedule, error) {
	result := make([]SeedSchedule, 0, len(fixture.Daily)+len(fixture.Weekly)+1)
	for index, entry := range fixture.Daily {
		if err := validateLocalized(fmt.Sprintf("schedule.daily[%d].activity", index), entry.Activity); err != nil {
			return nil, err
		}
		start, end, readable, err := parseTimeRange(entry.Time)
		if err != nil {
			return nil, fmt.Errorf("schedule.daily[%d].time: %w", index, err)
		}
		if !readable {
			return nil, fmt.Errorf("schedule.daily[%d].time must be machine-readable", index)
		}
		result = append(result, SeedSchedule{ScheduleType: "daily", TimeStart: start, TimeEnd: end, Activity: entry.Activity, Location: emptyLocalized(), DisplayOrder: index, IsActive: true})
	}
	for index, entry := range fixture.Weekly {
		if err := validateLocalized(fmt.Sprintf("schedule.weekly[%d].day", index), entry.Day); err != nil {
			return nil, err
		}
		if err := validateLocalized(fmt.Sprintf("schedule.weekly[%d].activity", index), entry.Activity); err != nil {
			return nil, err
		}
		start, end, readable, err := parseTimeRange(entry.Time)
		if err != nil {
			return nil, fmt.Errorf("schedule.weekly[%d].time: %w", index, err)
		}
		if !readable {
			return nil, fmt.Errorf("schedule.weekly[%d].time must be machine-readable", index)
		}
		day := 0
		result = append(result, SeedSchedule{ScheduleType: "weekly", DayOfWeek: &day, TimeStart: start, TimeEnd: end, Activity: entry.Activity, Location: entry.Day, DisplayOrder: index, IsActive: true})
	}
	if err := validateLocalized("schedule.online.title", fixture.Online.Title); err != nil {
		return nil, err
	}
	if err := validateLocalized("schedule.online.description", fixture.Online.Description); err != nil {
		return nil, err
	}
	result = append(result, SeedSchedule{ScheduleType: "online", Activity: fixture.Online.Title, Location: fixture.Online.Description, OnlineLink: fixture.Online.Link, DisplayOrder: 0, IsActive: true})
	return result, nil
}

func normalizeCMS(fixtures []CMSPageFixture, about AboutFixture, contact ContactFixture) ([]SeedContentPage, []SeedContentSection, error) {
	pageByKey := make(map[string]CMSPageFixture, len(fixtures))
	pageSlugs := make(map[string]struct{}, len(fixtures))
	for _, page := range fixtures {
		if _, exists := pageByKey[page.PageKey]; exists {
			return nil, nil, fmt.Errorf("duplicate CMS page key %q", page.PageKey)
		}
		if _, exists := pageSlugs[page.Slug]; exists {
			return nil, nil, fmt.Errorf("duplicate CMS page slug %q", page.Slug)
		}
		if _, err := uuid.Parse(page.ID); err != nil {
			return nil, nil, fmt.Errorf("CMS page %q has invalid id: %w", page.PageKey, err)
		}
		pageByKey[page.PageKey] = page
		pageSlugs[page.Slug] = struct{}{}
	}
	if len(pageByKey) != len(requiredPageKeys) {
		return nil, nil, fmt.Errorf("CMS fixture must contain exactly %d public pages", len(requiredPageKeys))
	}
	pages := make([]SeedContentPage, 0, len(requiredPageKeys))
	sections := make([]SeedContentSection, 0)
	for _, key := range requiredPageKeys {
		page, exists := pageByKey[key]
		if !exists {
			return nil, nil, fmt.Errorf("required CMS page %q is missing", key)
		}
		if page.Slug == "" {
			return nil, nil, fmt.Errorf("CMS page %q requires a slug", key)
		}
		if err := validateLocalized(key+".title", page.Title); err != nil {
			return nil, nil, err
		}
		if err := validateLocalized(key+".description", page.Description); err != nil {
			return nil, nil, err
		}
		if err := validateJSONObject(key+".seo", page.SEO); err != nil {
			return nil, nil, err
		}
		if err := validateJSONObject(key+".body", page.Body); err != nil {
			return nil, nil, err
		}
		if err := validateJSONObject(key+".settings", page.Settings); err != nil {
			return nil, nil, err
		}
		body := page.Body
		if key == "PAGE-ABOUT" {
			override, err := aboutBody(about)
			if err != nil {
				return nil, nil, err
			}
			body, err = mergeJSONObject(page.Body, override)
			if err != nil {
				return nil, nil, err
			}
		}
		if key == "PAGE-CONTACT" {
			override, err := contactBody(contact)
			if err != nil {
				return nil, nil, err
			}
			body, err = mergeJSONObject(page.Body, override)
			if err != nil {
				return nil, nil, err
			}
		}
		pages = append(pages, SeedContentPage{ID: page.ID, PageKey: page.PageKey, Slug: page.Slug, Title: page.Title, Description: page.Description, SEO: page.SEO, Body: body, Settings: page.Settings})
		for _, section := range page.Sections {
			if _, err := uuid.Parse(section.ID); err != nil {
				return nil, nil, fmt.Errorf("CMS section on %q has invalid id: %w", key, err)
			}
			if _, err := uuid.Parse(section.PageID); err != nil {
				return nil, nil, fmt.Errorf("CMS section on %q has invalid page id: %w", key, err)
			}
			if section.PageID != page.ID || section.SectionKey == "" || section.SectionType == "" {
				return nil, nil, fmt.Errorf("CMS section on %q has invalid identity", key)
			}
			if err := validateLocalized(key+"."+section.SectionKey+".title", section.Title); err != nil {
				return nil, nil, err
			}
			if err := validateLocalized(key+"."+section.SectionKey+".description", section.Description); err != nil {
				return nil, nil, err
			}
			if err := validateJSONObject(key+"."+section.SectionKey+".body", section.Body); err != nil {
				return nil, nil, err
			}
			if err := validateJSONObject(key+"."+section.SectionKey+".settings", section.Settings); err != nil {
				return nil, nil, err
			}
			sections = append(sections, SeedContentSection{ID: section.ID, PageID: section.PageID, SectionKey: section.SectionKey, SectionType: section.SectionType, Title: section.Title, Description: section.Description, Body: section.Body, Settings: section.Settings, SortOrder: section.SortOrder})
		}
	}
	return pages, sections, nil
}

func normalizeSettings(site SiteSettingsFixture, about AboutFixture) ([]SeedSetting, error) {
	if err := validateLocalized("site-settings.contact.address", site.Contact.Address); err != nil {
		return nil, err
	}
	if err := validateLocalized("about.intro.title", about.Intro.Title); err != nil {
		return nil, err
	}
	if err := validateLocalized("about.intro.description", about.Intro.Description); err != nil {
		return nil, err
	}
	settings := []SeedSetting{
		publicSetting("site_name_th", about.Intro.Title.TH), publicSetting("site_name_en", about.Intro.Title.EN), publicSetting("site_name_de", about.Intro.Title.DE),
		publicSetting("site_description_th", about.Intro.Description.TH), publicSetting("site_description_en", about.Intro.Description.EN), publicSetting("site_description_de", about.Intro.Description.DE),
		publicSetting("contact_address_th", site.Contact.Address.TH), publicSetting("contact_address_en", site.Contact.Address.EN), publicSetting("contact_address_de", site.Contact.Address.DE),
		publicSetting("contact_phone", site.Contact.Phone), publicSetting("contact_email", site.Contact.Email),
		publicSetting("facebook_url", site.Contact.Social.Facebook), publicSetting("instagram_url", site.Contact.Social.Instagram),
		publicSetting("youtube_url", ""), publicSetting("line_url", ""), publicSetting("logo_url", ""), publicSetting("social_sidebar_position", "left"),
	}
	sort.Slice(settings, func(left, right int) bool { return settings[left].Key < settings[right].Key })
	return settings, nil
}

func publicSetting(key, value string) SeedSetting {
	return SeedSetting{Key: key, Value: value, Type: "string", Category: "public-shell", IsPublic: true}
}

func validateFixtureCounts(bundle FixtureBundle) error {
	if len(bundle.Events) != 20 || len(bundle.Monks) != 3 || len(bundle.Galleries) != 34 || len(bundle.Categories) != 7 {
		return fmt.Errorf("fixture collection counts do not match the committed snapshot")
	}
	if len(bundle.Schedules.Daily) != 3 || len(bundle.Schedules.Weekly) != 1 {
		return fmt.Errorf("schedule fixture counts do not match the committed snapshot")
	}
	return nil
}

func validateLocalized(path string, value LocalizedText) error {
	if strings.TrimSpace(value.TH) == "" || strings.TrimSpace(value.EN) == "" || strings.TrimSpace(value.DE) == "" {
		return fmt.Errorf("%s requires th, en, and de", path)
	}
	return nil
}

func validateJSONObject(path string, raw json.RawMessage) error {
	if !json.Valid(raw) || len(raw) == 0 || raw[0] != '{' {
		return fmt.Errorf("%s must be a JSON object", path)
	}
	return nil
}

func mergeJSONObject(base json.RawMessage, override json.RawMessage) (json.RawMessage, error) {
	var baseObject map[string]json.RawMessage
	if err := json.Unmarshal(base, &baseObject); err != nil {
		return nil, err
	}
	var overrideObject map[string]json.RawMessage
	if err := json.Unmarshal(override, &overrideObject); err != nil {
		return nil, err
	}
	for key, value := range overrideObject {
		baseObject[key] = value
	}
	return json.Marshal(baseObject)
}

func slugifyEnglish(value string) string {
	var builder strings.Builder
	previousDash := false
	for _, character := range strings.ToLower(value) {
		if unicode.IsLetter(character) && character <= unicode.MaxASCII || unicode.IsDigit(character) {
			builder.WriteRune(character)
			previousDash = false
		} else if builder.Len() > 0 && !previousDash {
			builder.WriteByte('-')
			previousDash = true
		}
	}
	return strings.Trim(builder.String(), "-")
}

func uniqueEventSlug(base string, fixtureID int, used map[string]struct{}) string {
	if base == "" {
		return ""
	}
	if _, exists := used[base]; !exists {
		used[base] = struct{}{}
		return base
	}
	candidate := fmt.Sprintf("%s-%d", base, fixtureID)
	if _, exists := used[candidate]; !exists {
		used[candidate] = struct{}{}
		return candidate
	}
	return ""
}

func parseDate(value string) (string, error) {
	date, err := time.Parse("2006-01-02", value)
	if err != nil {
		return "", err
	}
	return date.UTC().Format(time.RFC3339), nil
}

func parseTimeRange(value string) (*string, *string, bool, error) {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return nil, nil, false, nil
	}
	parts := strings.Split(trimmed, " - ")
	if len(parts) > 2 || len(parts) == 0 {
		return nil, nil, false, fmt.Errorf("invalid time range %q", value)
	}
	parse := func(raw string) (string, error) {
		parsed, err := time.Parse("15:04", strings.TrimSpace(raw))
		if err != nil {
			return "", err
		}
		return parsed.Format("15:04:00"), nil
	}
	if len(parts) == 1 {
		start, err := parse(parts[0])
		if err != nil {
			if looksMachineReadableTime(trimmed) {
				return nil, nil, false, err
			}
			return nil, nil, false, nil
		}
		return &start, &start, true, nil
	}
	if !looksMachineReadableTime(parts[0]) && !looksMachineReadableTime(parts[1]) {
		return nil, nil, false, nil
	}
	start, err := parse(parts[0])
	if err != nil {
		return nil, nil, false, err
	}
	end, err := parse(parts[1])
	if err != nil {
		return nil, nil, false, err
	}
	return &start, &end, true, nil
}

func looksMachineReadableTime(value string) bool {
	return strings.ContainsAny(value, "0123456789:")
}

func emptyLocalized() LocalizedText { return LocalizedText{} }

type aboutBodyPayload struct {
	Intro          aboutIntroPayload       `json:"intro"`
	Objective      aboutObjectivePayload   `json:"objective"`
	Administration aboutTextSectionPayload `json:"administration"`
	History        aboutTextSectionPayload `json:"history"`
	Buildings      aboutBuildingsPayload   `json:"buildings"`
	Sangha         aboutSanghaPayload      `json:"sangha"`
}

type aboutIntroPayload struct {
	Heading     LocalizedText `json:"heading"`
	Description LocalizedText `json:"description"`
	Founded     LocalizedText `json:"founded"`
	Location    LocalizedText `json:"location"`
}

type aboutObjectivePayload struct {
	Heading  LocalizedText     `json:"heading"`
	Subtitle LocalizedText     `json:"subtitle"`
	Content  LocalizedRichText `json:"content"`
}

type aboutTextSectionPayload struct {
	Heading LocalizedText     `json:"heading"`
	Content LocalizedRichText `json:"content"`
}

type aboutBuildingsPayload struct {
	Heading LocalizedText          `json:"heading"`
	Items   []aboutBuildingPayload `json:"items"`
}

type aboutBuildingPayload struct {
	Name        LocalizedText `json:"name"`
	Description LocalizedText `json:"description"`
}

type aboutSanghaPayload struct {
	Heading LocalizedText     `json:"heading"`
	Mission LocalizedText     `json:"mission"`
	Content LocalizedRichText `json:"content"`
}

func aboutBody(fixture AboutFixture) (json.RawMessage, error) {
	if err := validateLocalized("about.intro.title", fixture.Intro.Title); err != nil {
		return nil, err
	}
	if err := validateLocalized("about.intro.description", fixture.Intro.Description); err != nil {
		return nil, err
	}
	if err := validateLocalized("about.intro.founded", fixture.Intro.Founded); err != nil {
		return nil, err
	}
	if err := validateLocalized("about.intro.location", fixture.Intro.Location); err != nil {
		return nil, err
	}
	if err := validateLocalized("about.objective.title", fixture.Objective.Title); err != nil {
		return nil, err
	}
	if err := validateLocalized("about.objective.subtitle", fixture.Objective.Subtitle); err != nil {
		return nil, err
	}
	if err := validateLocalized("about.objective.content", fixture.Objective.Content); err != nil {
		return nil, err
	}
	if err := validateLocalized("about.administration.title", fixture.Administration.Title); err != nil {
		return nil, err
	}
	if err := validateLocalized("about.administration.content", fixture.Administration.Content); err != nil {
		return nil, err
	}
	if err := validateLocalized("about.buddhaHistory.title", fixture.BuddhaHistory.Title); err != nil {
		return nil, err
	}
	if err := validateLocalized("about.buddhaHistory.content", fixture.BuddhaHistory.Content); err != nil {
		return nil, err
	}
	if err := validateLocalized("about.buildings.title", fixture.Buildings.Title); err != nil {
		return nil, err
	}
	if err := validateLocalized("about.sangha.title", fixture.Sangha.Title); err != nil {
		return nil, err
	}
	if err := validateLocalized("about.sangha.mission", fixture.Sangha.Mission); err != nil {
		return nil, err
	}
	if err := validateLocalized("about.sangha.currentWork", fixture.Sangha.CurrentWork); err != nil {
		return nil, err
	}
	buildings := make([]aboutBuildingPayload, 0, len(fixture.Buildings.Items))
	for index, building := range fixture.Buildings.Items {
		if err := validateLocalized(fmt.Sprintf("about.buildings.items[%d].name", index), building.Name); err != nil {
			return nil, err
		}
		if err := validateLocalized(fmt.Sprintf("about.buildings.items[%d].description", index), building.Description); err != nil {
			return nil, err
		}
		buildings = append(buildings, aboutBuildingPayload{Name: building.Name, Description: building.Description})
	}
	payload := aboutBodyPayload{
		Intro:          aboutIntroPayload{Heading: fixture.Intro.Title, Description: fixture.Intro.Description, Founded: fixture.Intro.Founded, Location: fixture.Intro.Location},
		Objective:      aboutObjectivePayload{Heading: fixture.Objective.Title, Subtitle: fixture.Objective.Subtitle, Content: localizedTextDocument(fixture.Objective.Content)},
		Administration: aboutTextSectionPayload{Heading: fixture.Administration.Title, Content: localizedTextDocument(fixture.Administration.Content)},
		History:        aboutTextSectionPayload{Heading: fixture.BuddhaHistory.Title, Content: localizedTextDocument(fixture.BuddhaHistory.Content)},
		Buildings:      aboutBuildingsPayload{Heading: fixture.Buildings.Title, Items: buildings},
		Sangha:         aboutSanghaPayload{Heading: fixture.Sangha.Title, Mission: fixture.Sangha.Mission, Content: localizedTextDocument(fixture.Sangha.CurrentWork)},
	}
	return json.Marshal(payload)
}

type contactBodyPayload struct {
	Address      LocalizedText       `json:"address"`
	Phone        string              `json:"phone"`
	Email        string              `json:"email"`
	OpeningHours contactOpeningHours `json:"opening_hours"`
	Map          contactMap          `json:"map"`
	Transport    contactTransport    `json:"transport"`
	Socials      contactSocials      `json:"socials"`
	Bank         contactBank         `json:"bank"`
	ContactForm  contactFormSettings `json:"contact_form"`
}

type contactOpeningHours struct {
	Days   LocalizedText `json:"days"`
	Time   LocalizedText `json:"time"`
	Notice LocalizedText `json:"notice"`
}

type contactMap struct {
	Name          LocalizedText `json:"name"`
	EmbedURL      string        `json:"embed_url"`
	DirectionsURL string        `json:"directions_url"`
}

type contactTransport struct {
	Parking         LocalizedText   `json:"parking"`
	PublicTransport []LocalizedText `json:"public_transport"`
	Driving         LocalizedText   `json:"driving"`
}

type contactSocials struct {
	Facebook  string `json:"facebook"`
	Instagram string `json:"instagram"`
	Messenger string `json:"messenger"`
	Line      string `json:"line"`
	Youtube   string `json:"youtube"`
}

type contactBank struct {
	BankName      LocalizedText `json:"bank_name"`
	AccountName   LocalizedText `json:"account_name"`
	AccountNumber string        `json:"account_number"`
	IBAN          string        `json:"iban"`
	BIC           string        `json:"bic"`
	QRImageURL    string        `json:"qr_image_url"`
}

type contactFormSettings struct {
	Enabled         bool          `json:"enabled"`
	SuccessMessage  LocalizedText `json:"success_message"`
	PrivacyPageLink string        `json:"privacy_page_link"`
}

func contactBody(fixture ContactFixture) (json.RawMessage, error) {
	if err := validateLocalized("contact.address", fixture.Address); err != nil {
		return nil, err
	}
	if err := validateLocalized("contact.openingHours.days", fixture.OpeningHours.Days); err != nil {
		return nil, err
	}
	if err := validateLocalized("contact.openingHours.remark", fixture.OpeningHours.Remark); err != nil {
		return nil, err
	}
	if err := validateLocalized("contact.transport.parking", fixture.Transport.Parking); err != nil {
		return nil, err
	}
	if err := validateLocalized("contact.transport.car.text", fixture.Transport.Car.Text); err != nil {
		return nil, err
	}
	publicTransport := make([]LocalizedText, 0, len(fixture.Transport.Public))
	for index, transport := range fixture.Transport.Public {
		if err := validateLocalized(fmt.Sprintf("contact.transport.public[%d].text", index), transport.Text); err != nil {
			return nil, err
		}
		publicTransport = append(publicTransport, transport.Text)
	}
	payload := contactBodyPayload{
		Address:      fixture.Address,
		Phone:        fixture.Phone,
		Email:        fixture.Email,
		OpeningHours: contactOpeningHours{Days: fixture.OpeningHours.Days, Time: localizedString(fixture.OpeningHours.Time), Notice: fixture.OpeningHours.Remark},
		Map:          contactMap{Name: localizedString(fixture.Map.LocationName), EmbedURL: fixture.Map.EmbedURL, DirectionsURL: fixture.Transport.DirectionsURL},
		Transport:    contactTransport{Parking: fixture.Transport.Parking, PublicTransport: publicTransport, Driving: fixture.Transport.Car.Text},
		Socials:      contactSocials{Facebook: fixture.Social.Facebook, Instagram: fixture.Social.Instagram, Messenger: fixture.Social.Messenger},
		Bank:         contactBank{BankName: localizedString(fixture.Bank.Name), AccountName: localizedString(fixture.Bank.Account), IBAN: fixture.Bank.IBAN, BIC: fixture.Bank.BIC},
		ContactForm:  contactFormSettings{Enabled: true, SuccessMessage: emptyLocalized(), PrivacyPageLink: "/privacy"},
	}
	return json.Marshal(payload)
}

func localizedString(value string) LocalizedText {
	return LocalizedText{TH: value, EN: value, DE: value}
}
