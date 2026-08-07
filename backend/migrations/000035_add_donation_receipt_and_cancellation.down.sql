BEGIN;

ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS tax_receipt_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tax_receipt_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tax_receipt_sent_at timestamptz;

UPDATE donations
SET tax_receipt_required = receipt_requested;

ALTER TABLE donations
  DROP COLUMN IF EXISTS receipt_requested,
  DROP COLUMN IF EXISTS cancellation_reason,
  DROP COLUMN IF EXISTS cancelled_by_id,
  DROP COLUMN IF EXISTS cancelled_at;

COMMIT;
