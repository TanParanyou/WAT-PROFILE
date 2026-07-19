package seedgen

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
)

type fixtureValue interface {
	[]EventFixture | []MonkFixture | []GalleryFixture | []CategoryFixture | []CMSPageFixture |
		ScheduleFixture | SiteSettingsFixture | AboutFixture | ContactFixture
}

func LoadFixtures(repoRoot string) (FixtureBundle, error) {
	dataDirectory := filepath.Join(repoRoot, "frontend", "src", "data")

	events, err := loadJSON[[]EventFixture](filepath.Join(dataDirectory, "events.json"))
	if err != nil {
		return FixtureBundle{}, err
	}
	monks, err := loadJSON[[]MonkFixture](filepath.Join(dataDirectory, "monks.json"))
	if err != nil {
		return FixtureBundle{}, err
	}
	galleries, err := loadJSON[[]GalleryFixture](filepath.Join(dataDirectory, "gallery.json"))
	if err != nil {
		return FixtureBundle{}, err
	}
	categories, err := loadJSON[[]CategoryFixture](filepath.Join(dataDirectory, "categories.json"))
	if err != nil {
		return FixtureBundle{}, err
	}
	schedules, err := loadJSON[ScheduleFixture](filepath.Join(dataDirectory, "schedule.json"))
	if err != nil {
		return FixtureBundle{}, err
	}
	siteSettings, err := loadJSON[SiteSettingsFixture](filepath.Join(dataDirectory, "site-settings.json"))
	if err != nil {
		return FixtureBundle{}, err
	}
	cmsPages, err := loadJSON[[]CMSPageFixture](filepath.Join(dataDirectory, "website-cms.json"))
	if err != nil {
		return FixtureBundle{}, err
	}
	about, err := loadJSON[AboutFixture](filepath.Join(dataDirectory, "about.json"))
	if err != nil {
		return FixtureBundle{}, err
	}
	contact, err := loadJSON[ContactFixture](filepath.Join(dataDirectory, "contact.json"))
	if err != nil {
		return FixtureBundle{}, err
	}

	return FixtureBundle{Events: events, Monks: monks, Galleries: galleries, Categories: categories, Schedules: schedules, SiteSettings: siteSettings, CMSPages: cmsPages, About: about, Contact: contact}, nil
}

func loadJSON[T fixtureValue](path string) (T, error) {
	var value T
	raw, err := os.ReadFile(path)
	if err != nil {
		return value, fmt.Errorf("read fixture %s: %w", filepath.Base(path), err)
	}
	decoder := json.NewDecoder(bytes.NewReader(raw))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&value); err != nil {
		return value, fmt.Errorf("decode fixture %s: %w", filepath.Base(path), err)
	}
	var extra json.RawMessage
	if err := decoder.Decode(&extra); err != io.EOF {
		return value, fmt.Errorf("decode fixture %s: unexpected trailing JSON", filepath.Base(path))
	}
	return value, nil
}
