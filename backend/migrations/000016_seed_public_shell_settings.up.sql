INSERT INTO settings (key, value, type, category, is_public)
VALUES
  ('site_name_th', '', 'string', 'public-shell', TRUE),
  ('site_name_en', '', 'string', 'public-shell', TRUE),
  ('site_name_de', '', 'string', 'public-shell', TRUE),
  ('site_description_th', '', 'string', 'public-shell', TRUE),
  ('site_description_en', '', 'string', 'public-shell', TRUE),
  ('site_description_de', '', 'string', 'public-shell', TRUE),
  ('contact_address_th', '', 'string', 'public-shell', TRUE),
  ('contact_address_en', '', 'string', 'public-shell', TRUE),
  ('contact_address_de', '', 'string', 'public-shell', TRUE),
  ('contact_phone', COALESCE((SELECT value FROM settings WHERE key = 'contact_phone'), ''), 'string', 'public-shell', TRUE),
  ('contact_email', COALESCE((SELECT value FROM settings WHERE key = 'contact_email'), ''), 'string', 'public-shell', TRUE),
  ('facebook_url', COALESCE((SELECT value FROM settings WHERE key = 'facebook_url'), ''), 'string', 'public-shell', TRUE),
  ('youtube_url', COALESCE((SELECT value FROM settings WHERE key = 'youtube_url'), ''), 'string', 'public-shell', TRUE),
  ('instagram_url', '', 'string', 'public-shell', TRUE),
  ('line_url', COALESCE((SELECT value FROM settings WHERE key = 'line_id'), ''), 'string', 'public-shell', TRUE),
  ('logo_url', '', 'string', 'public-shell', TRUE),
  ('social_sidebar_position', 'left', 'string', 'public-shell', TRUE)
ON CONFLICT (key) DO NOTHING;

UPDATE settings
SET category = 'public-shell', is_public = TRUE
WHERE key IN (
  'site_name_th', 'site_name_en', 'site_name_de',
  'site_description_th', 'site_description_en', 'site_description_de',
  'contact_address_th', 'contact_address_en', 'contact_address_de',
  'contact_phone', 'contact_email', 'facebook_url', 'youtube_url',
  'instagram_url', 'line_url', 'logo_url', 'social_sidebar_position'
);

UPDATE settings SET value = COALESCE((SELECT value FROM settings WHERE key = 'address'), '')
WHERE key = 'contact_address_th' AND value = '';
UPDATE settings SET value = value
WHERE key IN ('contact_address_en', 'contact_address_de') AND value = '';
