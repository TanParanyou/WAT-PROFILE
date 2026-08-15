-- 000043_add_event_extended_fields.down.sql

ALTER TABLE events
  DROP COLUMN IF EXISTS gallery_urls,
  DROP COLUMN IF EXISTS online_join_url,
  DROP COLUMN IF EXISTS dress_code,
  DROP COLUMN IF EXISTS what_to_bring,
  DROP COLUMN IF EXISTS donation_enabled,
  DROP COLUMN IF EXISTS contact_phone,
  DROP COLUMN IF EXISTS contact_line,
  DROP COLUMN IF EXISTS contact_email,
  DROP COLUMN IF EXISTS transport_info;
