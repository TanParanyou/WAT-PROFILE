-- Alter media.uploaded_by_id foreign key constraint to ON DELETE SET NULL
ALTER TABLE media DROP CONSTRAINT IF EXISTS fk_media_uploaded_by;
ALTER TABLE media DROP CONSTRAINT IF EXISTS media_uploaded_by_id_fkey;

ALTER TABLE media
    ADD CONSTRAINT fk_media_uploaded_by
    FOREIGN KEY (uploaded_by_id)
    REFERENCES users(id)
    ON DELETE SET NULL;
