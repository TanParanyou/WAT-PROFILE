INSERT INTO settings (id, key, value, type, category, is_public)
VALUES (gen_random_uuid(), 'event_alert_settings', '{"enabled":false,"event_id":0,"delay_seconds":2,"dismiss_hours":24}', 'json', 'event', true)
ON CONFLICT (key) DO NOTHING;
