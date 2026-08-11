INSERT INTO settings (id, key, value, type, category, is_public)
VALUES (gen_random_uuid(), 'events_default_view', 'calendar', 'string', 'event', TRUE)
ON CONFLICT (key) DO NOTHING;
