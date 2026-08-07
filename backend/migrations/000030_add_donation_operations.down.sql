BEGIN;
DROP TABLE IF EXISTS donation_proofs;
ALTER TABLE donations DROP CONSTRAINT IF EXISTS donations_status_check;
ALTER TABLE donations DROP CONSTRAINT IF EXISTS donations_source_check;
DROP INDEX IF EXISTS donations_source_status_idx;
ALTER TABLE donations
  DROP COLUMN IF EXISTS source,
  DROP COLUMN IF EXISTS communication_locale,
  DROP COLUMN IF EXISTS confirmed_by_id,
  DROP COLUMN IF EXISTS confirmed_at,
  DROP COLUMN IF EXISTS receipt_object_key,
  DROP COLUMN IF EXISTS receipt_checksum,
  DROP COLUMN IF EXISTS receipt_dispatched_by_id,
  DROP COLUMN IF EXISTS receipt_dispatched_at;
COMMIT;
