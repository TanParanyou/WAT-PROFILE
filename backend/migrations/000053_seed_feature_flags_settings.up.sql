INSERT INTO settings (key, value, type, category, is_public)
VALUES
  ('feature_public_account_auth', 'false', 'boolean', 'features', TRUE),
  ('feature_public_community_read', 'false', 'boolean', 'features', TRUE),
  ('feature_public_community_write', 'false', 'boolean', 'features', TRUE),
  ('feature_donations', 'true', 'boolean', 'features', TRUE),
  ('feature_event_registration', 'true', 'boolean', 'features', TRUE)
ON CONFLICT (key) DO NOTHING;

UPDATE settings
SET category = 'features', is_public = TRUE
WHERE key IN (
  'feature_public_account_auth',
  'feature_public_community_read',
  'feature_public_community_write',
  'feature_donations',
  'feature_event_registration'
);
