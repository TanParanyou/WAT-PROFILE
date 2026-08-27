-- Revert media.uploaded_by_id foreign key constraint to default (no cascade / restrict)
ALTER TABLE media DROP CONSTRAINT IF EXISTS fk_media_uploaded_by;

ALTER TABLE media
    ADD CONSTRAINT fk_media_uploaded_by
    FOREIGN KEY (uploaded_by_id)
    REFERENCES users(id);
