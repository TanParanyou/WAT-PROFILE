DROP INDEX IF EXISTS idx_events_category_id;
ALTER TABLE events DROP COLUMN IF EXISTS category_id;
DROP TABLE IF EXISTS event_categories;
