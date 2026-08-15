-- 000043_add_event_extended_fields.up.sql

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS gallery_urls JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS online_join_url VARCHAR(255),
  ADD COLUMN IF NOT EXISTS dress_code JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS what_to_bring JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS donation_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS contact_line VARCHAR(50),
  ADD COLUMN IF NOT EXISTS contact_email VARCHAR(100),
  ADD COLUMN IF NOT EXISTS transport_info JSONB DEFAULT '{}'::jsonb;
