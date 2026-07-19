package seedgen

import (
	"bytes"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

const migrationBaseName = "000017_replace_public_mock_data"
const payloadDelimiter = "$mock_seed_000017$"

func RenderMigrations(snapshot SeedSnapshot) ([]byte, []byte, error) {
	payload, err := json.MarshalIndent(snapshot, "", "  ")
	if err != nil {
		return nil, nil, fmt.Errorf("marshal seed snapshot: %w", err)
	}
	if bytes.Contains(payload, []byte(payloadDelimiter)) {
		return nil, nil, fmt.Errorf("seed payload contains reserved SQL delimiter")
	}
	return renderUp(payload), renderDown(payload), nil
}

func WriteMigrations(outputDirectory string, up, down []byte) error {
	if info, err := os.Stat(outputDirectory); err != nil {
		return fmt.Errorf("stat migration directory: %w", err)
	} else if !info.IsDir() {
		return fmt.Errorf("migration output path is not a directory: %s", outputDirectory)
	}
	upPath := filepath.Join(outputDirectory, migrationBaseName+".up.sql")
	downPath := filepath.Join(outputDirectory, migrationBaseName+".down.sql")
	upTemporary, err := writeTemporaryFile(outputDirectory, up)
	if err != nil {
		return err
	}
	downTemporary, err := writeTemporaryFile(outputDirectory, down)
	if err != nil {
		_ = os.Remove(upTemporary)
		return err
	}
	if err := os.Rename(upTemporary, upPath); err != nil {
		_ = os.Remove(upTemporary)
		_ = os.Remove(downTemporary)
		return fmt.Errorf("replace up migration: %w", err)
	}
	if err := os.Rename(downTemporary, downPath); err != nil {
		_ = os.Remove(downTemporary)
		return fmt.Errorf("replace down migration: %w", err)
	}
	return nil
}

func writeTemporaryFile(directory string, content []byte) (string, error) {
	file, err := os.CreateTemp(directory, ".mock-seed-*.sql")
	if err != nil {
		return "", fmt.Errorf("create migration temporary file: %w", err)
	}
	path := file.Name()
	if err := file.Chmod(0o644); err != nil {
		_ = file.Close()
		_ = os.Remove(path)
		return "", fmt.Errorf("chmod migration temporary file: %w", err)
	}
	if _, err := file.Write(content); err != nil {
		_ = file.Close()
		_ = os.Remove(path)
		return "", fmt.Errorf("write migration temporary file: %w", err)
	}
	if err := file.Close(); err != nil {
		_ = os.Remove(path)
		return "", fmt.Errorf("close migration temporary file: %w", err)
	}
	return path, nil
}

func renderUp(payload []byte) []byte {
	var builder strings.Builder
	writePayload(&builder, payload)
	builder.WriteString(`
DELETE FROM galleries;
DELETE FROM gallery_categories;

DELETE FROM event_schedules es
USING events e
WHERE es.event_id = e.id
  AND e.slug IN (
    SELECT slug
    FROM jsonb_to_recordset((SELECT payload->'events' FROM mock_seed_000017)) AS seed(slug TEXT)
  );

DELETE FROM events e
WHERE NOT EXISTS (SELECT 1 FROM event_registrations er WHERE er.event_id = e.id)
  AND NOT EXISTS (
    SELECT 1
    FROM jsonb_to_recordset((SELECT payload->'events' FROM mock_seed_000017)) AS seed(slug TEXT)
    WHERE seed.slug = e.slug
  );

WITH seed_events AS (
  SELECT *
  FROM jsonb_to_recordset((SELECT payload->'events' FROM mock_seed_000017)) AS seed(
    slug TEXT, start_date TEXT, end_date TEXT, image_url TEXT, map_url TEXT, event_type TEXT,
    title JSONB, location JSONB, description JSONB, start_time TEXT, end_time TEXT,
    is_active BOOLEAN, display_order INTEGER
  )
)
INSERT INTO events (
  slug, title, description, start_date, end_date, start_time, end_time, location, image_url,
  map_url, event_type, is_recurring, recurring_pattern, max_participants, registration_enabled,
  registration_deadline, is_active, display_order, created_at, updated_at
)
SELECT
  slug, title, description, start_date::TIMESTAMPTZ, end_date::TIMESTAMPTZ,
  start_time::TIME, end_time::TIME, location, image_url, map_url, event_type,
  FALSE, '', NULL, FALSE, NULL, is_active, display_order, NOW(), NOW()
FROM seed_events
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  location = EXCLUDED.location,
  image_url = EXCLUDED.image_url,
  map_url = EXCLUDED.map_url,
  event_type = EXCLUDED.event_type,
  is_recurring = EXCLUDED.is_recurring,
  recurring_pattern = EXCLUDED.recurring_pattern,
  max_participants = CASE WHEN EXISTS (SELECT 1 FROM event_registrations er WHERE er.event_id = events.id) THEN events.max_participants ELSE EXCLUDED.max_participants END,
  registration_enabled = CASE WHEN EXISTS (SELECT 1 FROM event_registrations er WHERE er.event_id = events.id) THEN events.registration_enabled ELSE EXCLUDED.registration_enabled END,
  registration_deadline = CASE WHEN EXISTS (SELECT 1 FROM event_registrations er WHERE er.event_id = events.id) THEN events.registration_deadline ELSE EXCLUDED.registration_deadline END,
  is_active = EXCLUDED.is_active,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

WITH seed_events AS (
  SELECT *
  FROM jsonb_to_recordset((SELECT payload->'events' FROM mock_seed_000017)) AS seed(slug TEXT, schedules JSONB)
), seed_schedules AS (
  SELECT parent.slug, item.start_time, item.end_time, item.activity, item.display_order
  FROM seed_events parent
  CROSS JOIN LATERAL jsonb_to_recordset(parent.schedules) AS item(
    start_time TEXT, end_time TEXT, activity JSONB, display_order INTEGER
  )
)
INSERT INTO event_schedules (event_id, start_time, end_time, activity, display_order, created_at)
SELECT events.id, seed_schedules.start_time::TIME, seed_schedules.end_time::TIME, seed_schedules.activity, seed_schedules.display_order, NOW()
FROM seed_schedules
JOIN events ON events.slug = seed_schedules.slug;

DELETE FROM monks;
WITH seed_monks AS (
  SELECT *
  FROM jsonb_to_recordset((SELECT payload->'monks' FROM mock_seed_000017)) AS seed(
    slug TEXT, image_url TEXT, position TEXT, name JSONB, title JSONB, bio JSONB,
    display_order INTEGER, is_active BOOLEAN
  )
)
INSERT INTO monks (slug, image_url, name, title, bio, position, display_order, is_active, created_at, updated_at)
SELECT slug, image_url, name, title, bio, position, display_order, is_active, NOW(), NOW()
FROM seed_monks;

DELETE FROM schedules;
WITH seed_schedules AS (
  SELECT *
  FROM jsonb_to_recordset((SELECT payload->'schedules' FROM mock_seed_000017)) AS seed(
    schedule_type TEXT, day_of_week INTEGER, time_start TEXT, time_end TEXT,
    activity JSONB, location JSONB, online_link TEXT, display_order INTEGER, is_active BOOLEAN
  )
)
INSERT INTO schedules (schedule_type, day_of_week, time_start, time_end, activity, location, online_link, display_order, is_active, created_at, updated_at)
SELECT schedule_type, day_of_week, time_start::TIME, time_end::TIME, activity, location, online_link, display_order, is_active, NOW(), NOW()
FROM seed_schedules;

WITH seed_categories AS (
  SELECT *
  FROM jsonb_to_recordset((SELECT payload->'categories' FROM mock_seed_000017)) AS seed(
    slug TEXT, name JSONB, display_order INTEGER, is_active BOOLEAN
  )
)
INSERT INTO gallery_categories (slug, name, display_order, is_active, created_at)
SELECT slug, name, display_order, is_active, NOW()
FROM seed_categories;

WITH seed_galleries AS (
  SELECT *
  FROM jsonb_to_recordset((SELECT payload->'galleries' FROM mock_seed_000017)) AS seed(
    image_url TEXT, thumbnail_url TEXT, category_slug TEXT, caption JSONB,
    display_order INTEGER, is_active BOOLEAN
  )
)
INSERT INTO galleries (image_url, thumbnail_url, caption, category_id, event_id, display_order, is_active, created_at, updated_at)
SELECT seed.image_url, seed.thumbnail_url, seed.caption, category.id, NULL, seed.display_order, seed.is_active, NOW(), NOW()
FROM seed_galleries seed
JOIN gallery_categories category ON category.slug = seed.category_slug;

DELETE FROM content_pages page
WHERE page.page_key IN (
  SELECT page_key
  FROM jsonb_to_recordset((SELECT payload->'content_pages' FROM mock_seed_000017)) AS seed(page_key TEXT)
);

WITH seed_pages AS (
  SELECT *
  FROM jsonb_to_recordset((SELECT payload->'content_pages' FROM mock_seed_000017)) AS seed(
    id UUID, page_key TEXT, slug TEXT, title JSONB, description JSONB, seo JSONB, body JSONB, settings JSONB
  )
)
INSERT INTO content_pages (
  id, page_key, slug, title, description, seo, body, settings, status,
  published_title, published_description, published_seo, published_body, published_settings,
  published_at, created_at, updated_at
)
SELECT id, page_key, slug, title, description, seo, body, settings, 'published',
  title, description, seo, body, settings, NOW(), NOW(), NOW()
FROM seed_pages;

WITH seed_sections AS (
  SELECT *
  FROM jsonb_to_recordset((SELECT payload->'content_sections' FROM mock_seed_000017)) AS seed(
    id UUID, page_id UUID, section_key TEXT, section_type TEXT, title JSONB, description JSONB,
    body JSONB, settings JSONB, sort_order INTEGER
  )
)
INSERT INTO content_sections (
  id, page_id, section_key, section_type, title, description, body, settings, sort_order, status,
  published_title, published_description, published_body, published_settings, published_at, created_at, updated_at
)
SELECT id, page_id, section_key, section_type, title, description, body, settings, sort_order, 'published',
  title, description, body, settings, NOW(), NOW(), NOW()
FROM seed_sections;

DELETE FROM settings setting
WHERE setting.key IN (
  SELECT key
  FROM jsonb_to_recordset((SELECT payload->'settings' FROM mock_seed_000017)) AS seed(key TEXT)
);

WITH seed_settings AS (
  SELECT *
  FROM jsonb_to_recordset((SELECT payload->'settings' FROM mock_seed_000017)) AS seed(
    key TEXT, value TEXT, type TEXT, category TEXT, is_public BOOLEAN
  )
)
INSERT INTO settings (key, value, type, category, is_public, created_at, updated_at)
SELECT key, value, type, category, is_public, NOW(), NOW()
FROM seed_settings;
`)
	writeSequenceSynchronization(&builder)
	builder.WriteString("COMMIT;\n")
	return []byte(builder.String())
}

func renderDown(payload []byte) []byte {
	var builder strings.Builder
	writePayload(&builder, payload)
	builder.WriteString(`
DELETE FROM galleries gallery
WHERE gallery.image_url IN (
  SELECT image_url
  FROM jsonb_to_recordset((SELECT payload->'galleries' FROM mock_seed_000017)) AS seed(image_url TEXT)
);

DELETE FROM gallery_categories category
WHERE category.slug IN (
  SELECT slug
  FROM jsonb_to_recordset((SELECT payload->'categories' FROM mock_seed_000017)) AS seed(slug TEXT)
);

DELETE FROM event_schedules schedule
USING events event
WHERE schedule.event_id = event.id
  AND event.slug IN (
    SELECT slug
    FROM jsonb_to_recordset((SELECT payload->'events' FROM mock_seed_000017)) AS seed(slug TEXT)
  )
  AND NOT EXISTS (SELECT 1 FROM event_registrations registration WHERE registration.event_id = event.id);

DELETE FROM events event
WHERE event.slug IN (
  SELECT slug
  FROM jsonb_to_recordset((SELECT payload->'events' FROM mock_seed_000017)) AS seed(slug TEXT)
)
AND NOT EXISTS (SELECT 1 FROM event_registrations registration WHERE registration.event_id = event.id);

DELETE FROM monks monk
WHERE monk.slug IN (
  SELECT slug
  FROM jsonb_to_recordset((SELECT payload->'monks' FROM mock_seed_000017)) AS seed(slug TEXT)
);

WITH seed_schedules AS (
  SELECT *
  FROM jsonb_to_recordset((SELECT payload->'schedules' FROM mock_seed_000017)) AS seed(
    schedule_type TEXT, day_of_week INTEGER, time_start TEXT, time_end TEXT,
    activity JSONB, location JSONB, online_link TEXT, display_order INTEGER, is_active BOOLEAN
  )
)
DELETE FROM schedules schedule
USING seed_schedules seed
WHERE schedule.schedule_type = seed.schedule_type
  AND schedule.day_of_week IS NOT DISTINCT FROM seed.day_of_week
  AND schedule.time_start IS NOT DISTINCT FROM seed.time_start::TIME
  AND schedule.time_end IS NOT DISTINCT FROM seed.time_end::TIME
  AND schedule.activity = seed.activity
  AND schedule.location = seed.location
  AND schedule.online_link IS NOT DISTINCT FROM seed.online_link
  AND schedule.display_order = seed.display_order
  AND schedule.is_active = seed.is_active;

DELETE FROM content_pages page
WHERE page.page_key IN (
  SELECT page_key
  FROM jsonb_to_recordset((SELECT payload->'content_pages' FROM mock_seed_000017)) AS seed(page_key TEXT)
);

DELETE FROM settings setting
WHERE setting.key IN (
  SELECT key
  FROM jsonb_to_recordset((SELECT payload->'settings' FROM mock_seed_000017)) AS seed(key TEXT)
);
`)
	writeSequenceSynchronization(&builder)
	builder.WriteString("COMMIT;\n")
	return []byte(builder.String())
}

func writePayload(builder *strings.Builder, payload []byte) {
	builder.WriteString("BEGIN;\nCREATE TEMP TABLE mock_seed_000017 (payload JSONB NOT NULL) ON COMMIT DROP;\n")
	builder.WriteString("INSERT INTO mock_seed_000017(payload) VALUES ($mock_seed_000017$\n")
	builder.Write(payload)
	builder.WriteString("\n$mock_seed_000017$::JSONB);\n")
}

func writeSequenceSynchronization(builder *strings.Builder) {
	for _, table := range []string{"events", "event_schedules", "monks", "gallery_categories", "galleries", "schedules"} {
		fmt.Fprintf(builder, "SELECT setval(pg_get_serial_sequence('%s', 'id'), COALESCE((SELECT MAX(id) FROM %s), 1), EXISTS (SELECT 1 FROM %s));\n", table, table, table)
	}
}
