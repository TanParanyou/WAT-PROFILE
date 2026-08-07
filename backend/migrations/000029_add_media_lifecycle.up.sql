ALTER TABLE media
    ADD COLUMN deleted_at TIMESTAMPTZ,
    ADD COLUMN deleted_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN purge_at TIMESTAMPTZ,
    ADD COLUMN alt_texts JSONB NOT NULL DEFAULT '{"th":"","en":"","de":""}'::jsonb;

UPDATE media
SET alt_texts = jsonb_build_object('th', COALESCE(alt_text, ''), 'en', '', 'de', '')
WHERE alt_texts = '{"th":"","en":"","de":""}'::jsonb
  AND COALESCE(alt_text, '') <> '';

CREATE INDEX idx_media_purge_at ON media (purge_at) WHERE deleted_at IS NOT NULL;
