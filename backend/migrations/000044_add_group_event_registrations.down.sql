BEGIN;

DROP INDEX IF EXISTS idx_event_registrations_active_email;
DROP INDEX IF EXISTS idx_event_registration_participants_attendance;
DROP INDEX IF EXISTS idx_event_registration_participants_registration;
DROP TABLE IF EXISTS event_registration_participants;
DROP INDEX IF EXISTS idx_event_registrations_manage_token_hash;
DROP INDEX IF EXISTS idx_event_registrations_user_id;

ALTER TABLE event_registrations
  DROP CONSTRAINT IF EXISTS chk_event_registration_type,
  DROP CONSTRAINT IF EXISTS chk_event_registration_origin,
  DROP CONSTRAINT IF EXISTS chk_event_registration_locale,
  DROP COLUMN IF EXISTS cancellation_origin,
  DROP COLUMN IF EXISTS manage_token_expires_at,
  DROP COLUMN IF EXISTS manage_token_hash,
  DROP COLUMN IF EXISTS privacy_consent_at,
  DROP COLUMN IF EXISTS privacy_notice_version,
  DROP COLUMN IF EXISTS locale,
  DROP COLUMN IF EXISTS user_id;

COMMIT;
