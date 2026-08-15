BEGIN;

ALTER TABLE contact_inquiries
  ADD COLUMN IF NOT EXISTS communication_locale varchar(5) NOT NULL DEFAULT 'th';

ALTER TABLE contact_inquiries
  DROP CONSTRAINT IF EXISTS contact_inquiries_communication_locale_check;

ALTER TABLE contact_inquiries
  ADD CONSTRAINT contact_inquiries_communication_locale_check
  CHECK (communication_locale IN ('th', 'en', 'de'));

COMMIT;
