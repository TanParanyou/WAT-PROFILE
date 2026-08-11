BEGIN;

ALTER TABLE donations
  ALTER COLUMN donation_time TYPE TIMESTAMP WITH TIME ZONE
  USING ((donation_date + donation_time)::timestamptz);

COMMIT;
