BEGIN;

ALTER TABLE event_registrations
  ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN locale VARCHAR(5) NOT NULL DEFAULT 'th',
  ADD COLUMN privacy_notice_version VARCHAR(50),
  ADD COLUMN privacy_consent_at TIMESTAMPTZ,
  ADD COLUMN manage_token_hash VARCHAR(64),
  ADD COLUMN manage_token_expires_at TIMESTAMPTZ,
  ADD COLUMN cancellation_origin VARCHAR(20);

ALTER TABLE event_registrations
  ADD CONSTRAINT chk_event_registration_locale CHECK (locale IN ('th', 'en', 'de')),
  ADD CONSTRAINT chk_event_registration_origin CHECK (cancellation_origin IS NULL OR cancellation_origin IN ('registrant', 'admin')),
  ADD CONSTRAINT chk_event_registration_type CHECK (registration_type IN ('guest', 'account', 'member'));

CREATE INDEX idx_event_registrations_user_id ON event_registrations(user_id);
CREATE UNIQUE INDEX idx_event_registrations_manage_token_hash
  ON event_registrations(manage_token_hash)
  WHERE manage_token_hash IS NOT NULL;

UPDATE event_registrations er
SET user_id = m.user_id
FROM members m
WHERE er.member_id = m.id AND m.user_id IS NOT NULL;

CREATE TABLE event_registration_participants (
  id BIGSERIAL PRIMARY KEY,
  registration_id INTEGER NOT NULL REFERENCES event_registrations(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  dietary_restrictions TEXT NOT NULL DEFAULT '',
  special_needs TEXT NOT NULL DEFAULT '',
  additional_notes TEXT NOT NULL DEFAULT '',
  attendance_status VARCHAR(20) NOT NULL DEFAULT 'registered',
  attended_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_event_participant_attendance CHECK (attendance_status IN ('registered', 'attended', 'cancelled'))
);

INSERT INTO event_registration_participants (
  registration_id, first_name, last_name, dietary_restrictions,
  special_needs, additional_notes, attendance_status, attended_at, cancelled_at
)
SELECT id, first_name, last_name, COALESCE(dietary_restrictions, ''),
  COALESCE(special_needs, ''), COALESCE(additional_notes, ''),
  CASE
    WHEN registration_status = 'cancelled' THEN 'cancelled'
    WHEN registration_status = 'attended' OR attended = TRUE THEN 'attended'
    ELSE 'registered'
  END,
  attended_at,
  cancelled_at
FROM event_registrations;

CREATE INDEX idx_event_registration_participants_registration
  ON event_registration_participants(registration_id);
CREATE INDEX idx_event_registration_participants_attendance
  ON event_registration_participants(attendance_status, registration_id);
CREATE UNIQUE INDEX idx_event_registrations_active_email
  ON event_registrations(event_id, LOWER(email))
  WHERE registration_status IN ('pending', 'confirmed', 'attended');

COMMIT;
