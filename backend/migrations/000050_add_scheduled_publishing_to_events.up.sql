-- 000050_add_scheduled_publishing_to_events.up.sql

ALTER TABLE events ADD COLUMN IF NOT EXISTS publish_status VARCHAR(20) NOT NULL DEFAULT 'published';
ALTER TABLE events ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_events_publish_status ON events(publish_status);
CREATE INDEX IF NOT EXISTS idx_events_published_at ON events(published_at);
CREATE INDEX IF NOT EXISTS idx_events_scheduled_at ON events(scheduled_at);

-- Initialize published_at for existing records
UPDATE events SET published_at = created_at WHERE published_at IS NULL;
