CREATE TABLE IF NOT EXISTS event_categories (
    id SERIAL PRIMARY KEY,
    name JSONB NOT NULL,
    description JSONB,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_event_categories_is_active ON event_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_event_categories_display_order ON event_categories(display_order);

ALTER TABLE events ADD COLUMN IF NOT EXISTS category_id INT REFERENCES event_categories(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_events_category_id ON events(category_id);

-- Seed initial categories corresponding to legacy event_type
INSERT INTO event_categories (id, name, description, is_active, display_order, created_at, updated_at)
VALUES
  (1, '{"th": "พิธีกรรม", "en": "Ceremony", "de": "Zeremonie"}'::jsonb, '{"th": "งานพิธีทางศาสนาและพิธีกรรมสำคัญ", "en": "Religious ceremonies and essential rites", "de": "Religiöse Zeremonien und wichtige Riten"}'::jsonb, true, 1, NOW(), NOW()),
  (2, '{"th": "คอร์สปฏิบัติธรรม", "en": "Meditation Course", "de": "Meditationskurs"}'::jsonb, '{"th": "หลักสูตรฝึกสมาธิและปฏิบัติวิปัสสนากรรมฐาน", "en": "Meditation courses and Vipassana practice", "de": "Meditationskurse und Vipassana-Praxis"}'::jsonb, true, 2, NOW(), NOW()),
  (3, '{"th": "งานเทศกาล", "en": "Festival", "de": "Fest / Festival"}'::jsonb, '{"th": "งานเทศกาลและงานประเพณีประจำปีของวัด", "en": "Annual festivals and traditional temple events", "de": "Jährliche Feste und traditionelle Tempelveranstaltungen"}'::jsonb, true, 3, NOW(), NOW()),
  (4, '{"th": "อื่นๆ", "en": "Other", "de": "Sonstiges"}'::jsonb, '{"th": "กิจกรรมทั่วไปและกิจกรรมอื่นๆ", "en": "General activities and other events", "de": "Allgemeine Aktivitäten und sonstige Veranstaltungen"}'::jsonb, true, 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('event_categories', 'id'), COALESCE((SELECT MAX(id) FROM event_categories), 1));

-- Map existing events to categories based on legacy event_type
UPDATE events SET category_id = 1 WHERE event_type = 'ceremony' AND category_id IS NULL;
UPDATE events SET category_id = 2 WHERE event_type = 'meditation_course' AND category_id IS NULL;
UPDATE events SET category_id = 3 WHERE event_type = 'festival' AND category_id IS NULL;
UPDATE events SET category_id = 4 WHERE (event_type = 'other' OR event_type NOT IN ('ceremony', 'meditation_course', 'festival')) AND event_type IS NOT NULL AND event_type != '' AND category_id IS NULL;
