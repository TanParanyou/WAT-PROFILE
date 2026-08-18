-- 000050_add_scheduled_publishing_to_events.down.sql

DROP INDEX IF EXISTS idx_events_scheduled_at;
DROP INDEX IF EXISTS idx_events_published_at;
DROP INDEX IF EXISTS idx_events_publish_status;

ALTER TABLE events DROP COLUMN IF EXISTS scheduled_at;
ALTER TABLE events DROP COLUMN IF EXISTS published_at;
ALTER TABLE events DROP COLUMN IF EXISTS publish_status;
