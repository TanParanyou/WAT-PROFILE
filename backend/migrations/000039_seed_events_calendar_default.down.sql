DELETE FROM settings
WHERE key = 'events_default_view'
  AND NOT EXISTS (
    SELECT 1
    FROM migration_000039_events_default_view_backup
    WHERE key = 'events_default_view'
  );

INSERT INTO settings (id, key, value, type, category, is_public)
SELECT id, key, value, type, category, is_public
FROM migration_000039_events_default_view_backup
WHERE key = 'events_default_view'
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  type = EXCLUDED.type,
  category = EXCLUDED.category,
  is_public = EXCLUDED.is_public;

DROP TABLE IF EXISTS migration_000039_events_default_view_backup;
