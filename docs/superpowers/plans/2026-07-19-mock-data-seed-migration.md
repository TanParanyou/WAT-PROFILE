# Mock Data Seed Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate and commit migration `000017` that replaces public-domain database records with normalized data from every frontend fixture while preserving user-generated and operational records.

**Architecture:** A typed Go package loads and validates the committed frontend JSON, normalizes it into one deterministic `SeedSnapshot`, and renders that snapshot into ordinary PostgreSQL up/down migrations. Runtime code and production deployment consume only the generated SQL; neither depends on the frontend filesystem.

**Tech Stack:** Go 1.24 standard library, PostgreSQL JSONB/CTEs, `golang-migrate`, existing GORM models and public-content contracts.

## Global Constraints

- Do not add or run automated tests; verification is formatting, compilation, deterministic generation, SQL inspection, and optional manual execution only after separate database-target approval.
- Do not use Go `any`, `map[string]interface{}`, TypeScript `any`, or unchecked type assertions in new code.
- Do not execute `migrate up`, `migrate down`, `DROP`, `TRUNCATE`, or any generated destructive SQL against a database during implementation.
- Preserve users, roles, members, donations, donation categories, registrations, contact inquiries, media, audit logs, privacy content, legal/impressum content, and non-owned settings.
- Preserve registered Events and their operational registration configuration.
- Emit stable output: the same fixtures must generate byte-for-byte identical SQL.
- Do not introduce new dependencies.

---

## File structure

```text
backend/cmd/generate-mock-seed/main.go
  CLI only: resolve paths, invoke loader/normalizer/renderer, report errors.

backend/internal/seedgen/source_types.go
  Concrete structs matching the nine fixture files.

backend/internal/seedgen/snapshot_types.go
  Concrete normalized structs serialized into the SQL payload.

backend/internal/seedgen/load.go
  Strict JSON loading and source-level validation.

backend/internal/seedgen/richtext.go
  Plain-text and limited fixture-HTML to canonical Tiptap documents.

backend/internal/seedgen/normalize.go
  Cross-file validation, slug/time mapping, About/Contact/CMS/settings assembly.

backend/internal/seedgen/sql.go
  Stable JSON serialization, SQL templates, and atomic file writing.

backend/migrations/000017_replace_public_mock_data.up.sql
  Generated destructive replacement transaction.

backend/migrations/000017_replace_public_mock_data.down.sql
  Generated removal of seed-owned identities with registration protection.
```

Do not modify frontend fixtures, public API handlers, models, or `cmd/seed`; this is a generation and data-migration change only.

### Task 1: Add strict fixture and snapshot contracts

**Files:**
- Create: `backend/internal/seedgen/source_types.go`
- Create: `backend/internal/seedgen/snapshot_types.go`
- Create: `backend/internal/seedgen/load.go`

**Interfaces:**
- Produces: `LoadFixtures(repoRoot string) (FixtureBundle, error)`
- Produces: concrete `FixtureBundle` and `SeedSnapshot` types consumed by Task 2.

- [ ] **Step 1: Define concrete source types**

Use one required localized-text type and concrete fixture types. Keep CMS extensibility constrained to raw JSON at fields that are intentionally schema-free:

```go
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

type SocialFixture struct { Facebook, Messenger, Instagram string }
type OpeningHoursFixture struct { Days LocalizedText; Time string; Remark LocalizedText }
type TransportFixture struct {
	Parking       LocalizedText            `json:"parking"`
	DirectionsURL string                   `json:"directionsUrl"`
	Public        []PublicTransportFixture `json:"public"`
	Car           CarFixture               `json:"car"`
}
type PublicTransportFixture struct { Icon string; Text LocalizedText }
type CarFixture struct { Text LocalizedText `json:"text"` }
type MapFixture struct { EmbedURL string `json:"embedUrl"`; LocationName string `json:"locationName"` }
type BankFixture struct { Name, Account, IBAN, BIC string }

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
	ID          string          `json:"id"`
	PageID      string          `json:"page_id"`
	SectionKey  string          `json:"section_key"`
	SectionType string          `json:"section_type"`
	Title       LocalizedText   `json:"title"`
	Description LocalizedText   `json:"description"`
	Body        json.RawMessage `json:"body"`
	Settings    json.RawMessage `json:"settings"`
	SortOrder   int             `json:"sort_order"`
	Status      string          `json:"status"`
	PublishedTitle       *LocalizedText  `json:"published_title"`
	PublishedDescription *LocalizedText  `json:"published_description"`
	PublishedBody        json.RawMessage `json:"published_body"`
	PublishedSettings    json.RawMessage `json:"published_settings"`
	PublishedAt          string          `json:"published_at"`
	CreatedAt            string          `json:"created_at"`
	UpdatedAt            string          `json:"updated_at"`
}

type AboutFixture struct {
	Intro          AboutIntroFixture          `json:"intro"`
	Objective      AboutObjectiveFixture      `json:"objective"`
	Administration AboutTextSectionFixture    `json:"administration"`
	BuddhaHistory  AboutTextSectionFixture    `json:"buddhaHistory"`
	Buildings      AboutBuildingsFixture      `json:"buildings"`
	Sangha         AboutSanghaFixture         `json:"sangha"`
}

type AboutIntroFixture struct { NavTitle, Title, Description, Founded, Location LocalizedText }
type AboutObjectiveFixture struct { NavTitle, Title, Subtitle, Content LocalizedText }
type AboutTextSectionFixture struct { NavTitle, Title, Content LocalizedText }
type AboutBuildingsFixture struct { Title LocalizedText; Items []AboutBuildingFixture }
type AboutBuildingFixture struct { Name, Description LocalizedText }
type AboutSanghaFixture struct { NavTitle, Title, Mission, CurrentWork LocalizedText }

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
```

Give the compact About fields explicit JSON tags in the implementation. CMS published fields and timestamps are loaded only so strict decoding accepts the complete fixture; normalization intentionally ignores their values and publishes the normalized current fields.

- [ ] **Step 2: Define normalized snapshot types**

Use JSON field names matching the SQL recordsets exactly:

```go
type RichTextNode struct {
	Type    string         `json:"type"`
	Content []RichTextNode `json:"content,omitempty"`
	Text    string         `json:"text,omitempty"`
}

type LocalizedRichText struct {
	TH RichTextNode `json:"th"`
	EN RichTextNode `json:"en"`
	DE RichTextNode `json:"de"`
}

type SeedSnapshot struct {
	Events            []SeedEvent           `json:"events"`
	Monks             []SeedMonk            `json:"monks"`
	Categories        []SeedCategory        `json:"categories"`
	Galleries         []SeedGallery         `json:"galleries"`
	Schedules         []SeedSchedule        `json:"schedules"`
	ContentPages      []SeedContentPage     `json:"content_pages"`
	ContentSections   []SeedContentSection  `json:"content_sections"`
	Settings          []SeedSetting         `json:"settings"`
}

type SeedEvent struct {
	Slug, StartDate, EndDate, ImageURL, MapURL, EventType string
	Title, Location LocalizedText
	Description LocalizedRichText
	StartTime, EndTime *string
	IsActive bool
	DisplayOrder int
	Schedules []SeedEventSchedule
}

type SeedEventSchedule struct {
	StartTime, EndTime string
	Activity LocalizedText
	DisplayOrder int
}

type SeedMonk struct {
	Slug, ImageURL, Position string
	Name, Title LocalizedText
	Bio LocalizedRichText
	DisplayOrder int
	IsActive bool
}

type SeedCategory struct { Slug string; Name LocalizedText; DisplayOrder int; IsActive bool }
type SeedGallery struct { ImageURL, ThumbnailURL, CategorySlug string; Caption LocalizedText; DisplayOrder int; IsActive bool }
type SeedSchedule struct { ScheduleType string; DayOfWeek *int; TimeStart, TimeEnd *string; Activity, Location LocalizedText; OnlineLink string; DisplayOrder int; IsActive bool }
type SeedSetting struct { Key, Value, Type, Category string; IsPublic bool }
```

Give every field an explicit snake_case JSON tag. Define `SeedContentPage` and `SeedContentSection` with fixture UUIDs, keys/slugs, localized metadata, and `json.RawMessage` for normalized SEO/body/settings. Published values are not duplicated in the snapshot; SQL copies each current field into its published counterpart.

- [ ] **Step 3: Implement strict loading**

Implement this generic-free-at-runtime loader (the generic type parameter is compile-time safe and does not weaken JSON types):

```go
func loadJSON[T objectFixture](path string) (T, error) {
	var value T
	raw, err := os.ReadFile(path)
	if err != nil {
		return value, fmt.Errorf("read %s: %w", path, err)
	}
	decoder := json.NewDecoder(bytes.NewReader(raw))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&value); err != nil {
		return value, fmt.Errorf("decode %s: %w", path, err)
	}
	return value, nil
}
```

Define `objectFixture` as the exact union of supported pointer-free fixture types and slices. `LoadFixtures(repoRoot)` must load `events.json`, `monks.json`, `gallery.json`, `categories.json`, `schedule.json`, `site-settings.json`, `website-cms.json`, `about.json`, and `contact.json` from `repoRoot/frontend/src/data`, wrapping every error with the fixture name. Reject trailing JSON by requiring the second decode to return `io.EOF`.

```go
type objectFixture interface {
	[]EventFixture | []MonkFixture | []GalleryFixture | []CategoryFixture |
		ScheduleFixture | SiteSettingsFixture | []CMSPageFixture | AboutFixture | ContactFixture
}
```

- [ ] **Step 4: Compile the package and commit**

Run:

```bash
cd backend
gofmt -w internal/seedgen/source_types.go internal/seedgen/snapshot_types.go internal/seedgen/load.go
go build ./internal/seedgen
git add internal/seedgen/source_types.go internal/seedgen/snapshot_types.go internal/seedgen/load.go
git commit -m "feat: add typed mock seed contracts"
```

Expected: formatting succeeds, `go build` exits 0, and the commit contains no fixture or migration changes.

### Task 2: Normalize and validate every fixture domain

**Files:**
- Create: `backend/internal/seedgen/richtext.go`
- Create: `backend/internal/seedgen/normalize.go`

**Interfaces:**
- Consumes: `FixtureBundle`, source types, and snapshot types from Task 1.
- Produces: `Normalize(bundle FixtureBundle) (SeedSnapshot, error)`.

- [ ] **Step 1: Implement canonical rich text conversion**

Create paragraphs from blank-line-separated text. For monk fixture HTML, support only `p` and `br` markup present in the committed fixture; decode entities and fail if any unsupported tag remains:

```go
func textDocument(raw string) RichTextNode {
	normalized := strings.ReplaceAll(strings.TrimSpace(raw), "\r\n", "\n")
	parts := strings.Split(normalized, "\n\n")
	paragraphs := make([]RichTextNode, 0, len(parts))
	for _, part := range parts {
		text := strings.TrimSpace(part)
		paragraph := RichTextNode{Type: "paragraph"}
		if text != "" {
			paragraph.Content = []RichTextNode{{Type: "text", Text: text}}
		}
		paragraphs = append(paragraphs, paragraph)
	}
	if len(paragraphs) == 0 {
		paragraphs = []RichTextNode{{Type: "paragraph"}}
	}
	return RichTextNode{Type: "doc", Content: paragraphs}
}

func fixtureHTMLDocument(raw string) (RichTextNode, error) {
	replacer := strings.NewReplacer("</p><p>", "\n\n", "</p>\n<p>", "\n\n", "<p>", "", "</p>", "", "<br>", "\n", "<br/>", "\n", "<br />", "\n")
	plain := html.UnescapeString(replacer.Replace(strings.TrimSpace(raw)))
	if strings.ContainsAny(plain, "<>") {
		return RichTextNode{}, fmt.Errorf("unsupported fixture HTML %q", raw)
	}
	return textDocument(plain), nil
}
```

Add `localizedTextDocument` and `localizedHTMLDocument` helpers that produce all three locale keys.

- [ ] **Step 2: Implement common validation and parsing helpers**

Add exact helpers:

```go
func validateLocalized(path string, value LocalizedText) error
func slugifyEnglish(value string) string
func uniqueEventSlug(base string, fixtureID int, used map[string]struct{}) string
func parseDate(value string) (string, error)
func parseTimeRange(value string) (start *string, end *string, machineReadable bool, err error)
func requireUnique(values map[string]string, identity string, path string) error
```

`parseDate` uses `time.Parse("2006-01-02", value)` and returns midnight UTC in RFC3339. `parseTimeRange` accepts only `15:04` and `15:04 - 15:04`; non-clock labels return `(nil, nil, false, nil)`. A string containing digits and `:` that fails these accepted layouts returns an error instead of silently degrading.

- [ ] **Step 3: Normalize Events, Monks, Gallery, and schedules**

Implement these fixed rules:

- Event slug is `slugifyEnglish(title.EN)`; only a collision receives `-<fixture ID>`.
- Event `start_date` and `end_date` are the same fixture date.
- New events use empty `event_type`, false registration defaults, and fixture ordering starting at 0.
- Event schedule entries are emitted only when both valid start and end times exist because both DB columns are non-null. A single schedule time uses the same value for start/end.
- Monk biographies pass through `localizedHTMLDocument`; monk position is empty and ordering follows the fixture.
- Skip category `all`, validate remaining unique slugs, and fail for unknown gallery category references.
- Replace the gallery domain in fixture order and use `src` for both image and thumbnail URLs.
- Map the weekly fixture to Sunday (`day_of_week = 0`).
- Map online title to `activity`, online description to `location`, and link to `online_link`.

- [ ] **Step 4: Normalize About, Contact, CMS, and settings**

Build the About body with exact contract keys:

```text
intro.heading       <- about.intro.title
objective.heading   <- about.objective.title
administration.heading <- about.administration.title
history             <- about.buddhaHistory
buildings.heading   <- about.buildings.title
sangha.heading      <- about.sangha.title
sangha.content      <- rich text of about.sangha.currentWork
```

Build the Contact body with `address`, `phone`, `email`, `opening_hours`, `map`, `transport`, `socials`, `bank`, and `contact_form` from `contact.json`. Normalize `site-settings.json.contact` independently for shell settings; do not require byte equality because the committed fixtures intentionally differ in German-character transliteration. Convert scalar opening time and bank names/accounts into all-three-locale values. Emit empty TH/EN/DE success messages, enabled `true`, and `/privacy`.

For exactly `PAGE-HOME`, `PAGE-ABOUT`, `PAGE-CONTACT`, `PAGE-EVENTS`, `PAGE-GALLERY`, and `PAGE-MONKS`, ignore source status and published snapshots, set all normalized pages/sections to published in SQL, merge the normalized About/Contact body with the base CMS body, and retain raw JSON SEO/settings only after validating each raw value is a JSON object.

Generate settings in sorted key order:

```text
site_name_th/en/de             <- about.intro.title
site_description_th/en/de      <- about.intro.description
contact_address_th/en/de       <- site-settings contact.address
contact_phone/contact_email    <- site-settings contact
facebook_url/instagram_url     <- site-settings social
youtube_url/line_url/logo_url  <- empty
social_sidebar_position        <- left
```

All keys use category `public-shell`, type `string`, and `is_public = true`.

- [ ] **Step 5: Add final snapshot validation and commit**

Before returning, require exactly 20 Events, 3 Monks, 34 gallery rows, 6 real categories, 5 schedules (3 daily, 1 weekly, 1 online), and the six required page keys. These counts are fixture-integrity guards for this committed snapshot, not runtime business rules.

Run:

```bash
cd backend
gofmt -w internal/seedgen/richtext.go internal/seedgen/normalize.go
go build ./internal/seedgen
git add internal/seedgen/richtext.go internal/seedgen/normalize.go
git commit -m "feat: normalize public mock seed data"
```

Expected: build exits 0 and no migration file exists yet.

### Task 3: Render foreign-key-safe deterministic SQL

**Files:**
- Create: `backend/internal/seedgen/sql.go`

**Interfaces:**
- Consumes: validated `SeedSnapshot` from Task 2.
- Produces: `RenderMigrations(snapshot SeedSnapshot) (up []byte, down []byte, err error)`.
- Produces: `WriteMigrations(outputDir string, up, down []byte) error`.

- [ ] **Step 1: Serialize one stable JSON payload**

Use `json.MarshalIndent(snapshot, "", "  ")`, reject payloads containing `$mock_seed_000017$`, and embed the bytes once. Implement the boundary with three writes so fixture JSON is never formatted into SQL through `%s`:

```go
builder.WriteString("BEGIN;\nCREATE TEMP TABLE mock_seed_000017 (payload JSONB NOT NULL) ON COMMIT DROP;\n")
builder.WriteString("INSERT INTO mock_seed_000017(payload) VALUES ($mock_seed_000017$\n")
builder.Write(payload)
builder.WriteString("\n$mock_seed_000017$::jsonb);\n")
```

All later statements select from `(SELECT payload FROM mock_seed_000017)` so JSON is not duplicated.

- [ ] **Step 2: Render protected Event replacement SQL**

Render SQL in this order:

```sql
DELETE FROM event_schedules es
USING events e
WHERE es.event_id = e.id
  AND e.slug IN (
    SELECT slug FROM jsonb_to_recordset((SELECT payload->'events' FROM mock_seed_000017)) AS x(slug TEXT)
  );

DELETE FROM events e
WHERE NOT EXISTS (SELECT 1 FROM event_registrations er WHERE er.event_id = e.id)
  AND NOT EXISTS (
    SELECT 1 FROM jsonb_to_recordset((SELECT payload->'events' FROM mock_seed_000017)) AS x(slug TEXT)
    WHERE x.slug = e.slug
  );
```

Upsert fixture Events by slug. Update public display fields every time. For `registration_enabled`, `max_participants`, and `registration_deadline`, retain the existing value when `EXISTS (SELECT 1 FROM event_registrations WHERE event_id = events.id)`; otherwise use disabled/null fixture defaults. Insert schedules by joining their parent JSON event slug back to `events.id`.

- [ ] **Step 3: Render full replacement domains**

Render explicit statements, never `TRUNCATE`:

```sql
DELETE FROM galleries;
DELETE FROM gallery_categories;
DELETE FROM monks;
DELETE FROM schedules;
```

Insert normalized monks and schedules through `jsonb_to_recordset`. Insert categories first, then gallery rows by joining `category_slug` to `gallery_categories.slug`. Do not reference Donations or donation categories.

- [ ] **Step 4: Render scoped Content and Settings replacement**

Delete Content only through generated page keys:

```sql
DELETE FROM content_pages p
WHERE p.page_key IN (
  SELECT page_key
  FROM jsonb_to_recordset((SELECT payload->'content_pages' FROM mock_seed_000017)) AS x(page_key TEXT)
);
```

The existing cascade removes only those pages' sections. Insert pages with fixture UUIDs and copy title/description/SEO/body/settings to both draft and published fields. Set `status = 'published'`, `published_at = NOW()`, and timestamps to `NOW()`. Insert sections after pages with the same published-copy rule.

Delete Settings only where the key exists in `payload.settings`, then insert generated key/value/type/category/public values. Do not query or delete Settings by category alone.

- [ ] **Step 5: Render sequences, down migration, and atomic writes**

Synchronize `events`, `event_schedules`, `monks`, `gallery_categories`, `galleries`, and `schedules` sequences with:

```sql
SELECT setval(
  pg_get_serial_sequence('events', 'id'),
  COALESCE((SELECT MAX(id) FROM events), 1),
  EXISTS (SELECT 1 FROM events)
);
```

Repeat with exact table names. Finish the up file with `COMMIT;`.

The down payload contains only generated identity lists. Delete gallery rows by image URL, categories/monks/events by slug, content by page key, and settings by key. Delete general schedules only when all normalized fields match. Protect Event deletion with `NOT EXISTS` registrations. A registered seeded Event survives down. Wrap down in an explicit transaction.

`WriteMigrations` writes temporary sibling files with mode `0644`, closes them, then renames them to the final `000017_replace_public_mock_data.{up,down}.sql` paths. Remove temporary files on error. This is the only mechanical file-writing exception; do not write outside the requested output directory.

- [ ] **Step 6: Compile and commit**

```bash
cd backend
gofmt -w internal/seedgen/sql.go
go build ./internal/seedgen
git add internal/seedgen/sql.go
git commit -m "feat: render mock seed migrations"
```

Expected: package builds and still does not connect to a database.

### Task 4: Add the generator command and produce migration 000017

**Files:**
- Create: `backend/cmd/generate-mock-seed/main.go`
- Create: `backend/migrations/000017_replace_public_mock_data.up.sql` (generated)
- Create: `backend/migrations/000017_replace_public_mock_data.down.sql` (generated)

**Interfaces:**
- Consumes: `seedgen.LoadFixtures`, `seedgen.Normalize`, `seedgen.RenderMigrations`, and `seedgen.WriteMigrations`.
- Produces: a reproducible CLI invoked from `backend`.

- [ ] **Step 1: Implement a path-explicit CLI**

```go
package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"

	"github.com/watloungporsai/wat-profile-backend/internal/seedgen"
)

func main() {
	repoRoot := flag.String("repo-root", "..", "repository root containing frontend and backend")
	outputDir := flag.String("output-dir", "migrations", "migration output directory")
	flag.Parse()

	bundle, err := seedgen.LoadFixtures(*repoRoot)
	if err != nil { fail(err) }
	snapshot, err := seedgen.Normalize(bundle)
	if err != nil { fail(err) }
	up, down, err := seedgen.RenderMigrations(snapshot)
	if err != nil { fail(err) }
	if err := seedgen.WriteMigrations(*outputDir, up, down); err != nil { fail(err) }
	fmt.Printf("generated %s and %s\n",
		filepath.Join(*outputDir, "000017_replace_public_mock_data.up.sql"),
		filepath.Join(*outputDir, "000017_replace_public_mock_data.down.sql"),
	)
}

func fail(err error) {
	fmt.Fprintln(os.Stderr, err)
	os.Exit(1)
}
```

- [ ] **Step 2: Build and generate**

```bash
cd backend
gofmt -w cmd/generate-mock-seed/main.go
go build ./cmd/generate-mock-seed
go run ./cmd/generate-mock-seed -repo-root .. -output-dir migrations
```

Expected: command prints the two `000017` paths; it does not require `DATABASE_URL` and performs no network or database operation.

- [ ] **Step 3: Confirm deterministic output**

```bash
cd backend
shasum -a 256 migrations/000017_replace_public_mock_data.up.sql migrations/000017_replace_public_mock_data.down.sql
go run ./cmd/generate-mock-seed -repo-root .. -output-dir migrations
shasum -a 256 migrations/000017_replace_public_mock_data.up.sql migrations/000017_replace_public_mock_data.down.sql
```

Expected: both pairs of hashes are identical.

- [ ] **Step 4: Inspect destructive scope**

```bash
cd backend
rg -n "DELETE FROM|TRUNCATE|DROP TABLE|users|roles|members|donations|donation_categories|contact_inquiries|media|audit_logs|PAGE-PRIVACY|PAGE-IMPRESSUM" migrations/000017_replace_public_mock_data.*.sql
```

Expected:

- no `TRUNCATE` or `DROP TABLE`;
- protected table names appear only in Event registration guards where applicable;
- no delete targets for Users, Roles, Members, Donations, donation categories, inquiries, Media, or audit logs;
- Privacy and Impressum are absent from deletion identities.

- [ ] **Step 5: Commit the command and generated migrations**

```bash
cd backend
git add cmd/generate-mock-seed/main.go migrations/000017_replace_public_mock_data.up.sql migrations/000017_replace_public_mock_data.down.sql
git commit -m "feat: add public mock data migration"
```

### Task 5: Final non-database verification and handoff

**Files:**
- Verify only; modify a generator file only if one of these checks reveals a defect, then regenerate both migrations.

**Interfaces:**
- Confirms the migration is buildable, deterministic, ordered, and ready for a separately authorized disposable-database run.

- [ ] **Step 1: Format and compile all backend packages**

```bash
cd backend
gofmt -w cmd/generate-mock-seed/main.go internal/seedgen/*.go
go build ./...
```

Expected: exit 0. Do not run `go test`.

- [ ] **Step 2: Check migration pairing and version order**

```bash
cd backend
find migrations -maxdepth 1 -type f -name '*.sql' -print | sort
```

Expected: every version has one up and one down file, and `000017_replace_public_mock_data` is the latest pair.

- [ ] **Step 3: Verify committed generated output is clean**

```bash
cd backend
go run ./cmd/generate-mock-seed -repo-root .. -output-dir migrations
git diff --exit-code -- migrations/000017_replace_public_mock_data.up.sql migrations/000017_replace_public_mock_data.down.sql
```

Expected: generator exits 0 and `git diff --exit-code` exits 0.

- [ ] **Step 4: Review repository changes and record the safety handoff**

```bash
git status --short
git log --oneline -5
```

Expected: only pre-existing unrelated untracked files remain. Report clearly that migration 000017 has not been applied, that it deletes active domain data, and that applying it requires confirming the target database and taking a backup first.

Do not run a final commit when the tree is already clean. If final verification required a fix, commit only the affected generator and regenerated SQL with:

```bash
git add backend/internal/seedgen backend/cmd/generate-mock-seed backend/migrations/000017_replace_public_mock_data.up.sql backend/migrations/000017_replace_public_mock_data.down.sql
git commit -m "fix: harden public mock seed migration"
```
