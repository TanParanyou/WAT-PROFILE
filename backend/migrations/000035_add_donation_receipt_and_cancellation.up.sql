BEGIN;

ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS receipt_requested boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS cancelled_by_id uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

UPDATE donations
SET receipt_requested = tax_receipt_required
WHERE tax_receipt_required = true;

COMMIT;
