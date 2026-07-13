ALTER TABLE events DROP COLUMN IF EXISTS end_date;
ALTER TABLE events RENAME COLUMN start_date TO event_date;

DROP INDEX IF EXISTS idx_events_start_date;
DROP INDEX IF EXISTS idx_events_end_date;
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
