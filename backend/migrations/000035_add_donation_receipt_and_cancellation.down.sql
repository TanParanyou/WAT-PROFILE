BEGIN;

ALTER TABLE donations
  DROP COLUMN IF EXISTS receipt_requested,
  DROP COLUMN IF EXISTS cancellation_reason,
  DROP COLUMN IF EXISTS cancelled_by_id,
  DROP COLUMN IF EXISTS cancelled_at;

COMMIT;
