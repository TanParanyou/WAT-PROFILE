DROP INDEX IF EXISTS idx_media_purge_at;
ALTER TABLE media
    DROP COLUMN IF EXISTS alt_texts,
    DROP COLUMN IF EXISTS purge_at,
    DROP COLUMN IF EXISTS deleted_by_id,
    DROP COLUMN IF EXISTS deleted_at;
