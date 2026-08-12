CREATE TABLE IF NOT EXISTS migration_000039_events_default_view_backup (
  id UUID PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  type VARCHAR(50),
  category VARCHAR(50),
  is_public BOOLEAN
);

INSERT INTO migration_000039_events_default_view_backup (id, key, value, type, category, is_public)
SELECT id, key, value, type, category, is_public
FROM settings
WHERE key = 'events_default_view'
ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (id, key, value, type, category, is_public)
VALUES (gen_random_uuid(), 'events_default_view', 'calendar', 'string', 'event', TRUE)
ON CONFLICT (key) DO NOTHING;
