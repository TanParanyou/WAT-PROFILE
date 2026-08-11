BEGIN;

ALTER TABLE donations
  ALTER COLUMN donation_time TYPE TIME WITHOUT TIME ZONE
  USING donation_time::time;

COMMIT;
