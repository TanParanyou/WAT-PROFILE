BEGIN;

UPDATE donations SET status = 'confirmed' WHERE status = 'verified';
UPDATE donations SET status = 'cancelled' WHERE status = 'rejected';

ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS source varchar(30) NOT NULL DEFAULT 'staff_recorded',
  ADD COLUMN IF NOT EXISTS communication_locale varchar(5) NOT NULL DEFAULT 'th',
  ADD COLUMN IF NOT EXISTS confirmed_by_id uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS receipt_object_key varchar(600),
  ADD COLUMN IF NOT EXISTS receipt_checksum varchar(128),
  ADD COLUMN IF NOT EXISTS receipt_dispatched_by_id uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS receipt_dispatched_at timestamptz;

ALTER TABLE donations DROP CONSTRAINT IF EXISTS donations_status_check;
ALTER TABLE donations ADD CONSTRAINT donations_status_check CHECK (status IN ('pending', 'confirmed', 'cancelled'));
ALTER TABLE donations DROP CONSTRAINT IF EXISTS donations_source_check;
ALTER TABLE donations ADD CONSTRAINT donations_source_check CHECK (source IN ('self_reported', 'staff_recorded'));

CREATE INDEX IF NOT EXISTS donations_source_status_idx ON donations (source, status);

CREATE TABLE IF NOT EXISTS donation_proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id integer NOT NULL UNIQUE REFERENCES donations(id) ON DELETE CASCADE,
  storage_key varchar(600) NOT NULL,
  original_filename varchar(255) NOT NULL,
  mime_type varchar(100) NOT NULL,
  size bigint NOT NULL,
  checksum varchar(128) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMIT;
