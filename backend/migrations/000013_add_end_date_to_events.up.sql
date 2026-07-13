ALTER TABLE events RENAME COLUMN event_date TO start_date;
ALTER TABLE events ADD COLUMN end_date TIMESTAMPTZ;

-- Migrate existing data
UPDATE events SET end_date = start_date WHERE end_date IS NULL;

ALTER TABLE events ALTER COLUMN end_date SET NOT NULL;

-- Update index
DROP INDEX IF EXISTS idx_events_event_date;
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_end_date ON events(end_date);
