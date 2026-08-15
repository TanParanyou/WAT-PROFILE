BEGIN;

ALTER TABLE contact_inquiries
  DROP CONSTRAINT IF EXISTS contact_inquiries_communication_locale_check;

ALTER TABLE contact_inquiries
  DROP COLUMN IF EXISTS communication_locale;

COMMIT;
