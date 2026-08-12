INSERT INTO settings (key, value, type, category, is_public)
VALUES ('hero_bg_url', '', 'string', 'public-shell', TRUE)
ON CONFLICT (key) DO NOTHING;

UPDATE settings
SET category = 'public-shell', is_public = TRUE
WHERE key = 'hero_bg_url';
