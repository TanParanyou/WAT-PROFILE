-- 000025_add_public_account_auth.up.sql
-- Public Account Auth (production) schema.
--
-- Adds the explicit account-status field to users, normalized-email
-- uniqueness, and the five auth tables that back the public account module:
-- account profiles, identities, rotating refresh sessions, action tokens, and
-- security events.
--
-- NOTE: This migration aborts when case-insensitive duplicate emails exist so
-- the normalized unique index is never created over ambiguous data.

DO $$
BEGIN
  IF EXISTS (
    SELECT lower(btrim(email))
    FROM users
    GROUP BY lower(btrim(email))
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'case-insensitive duplicate users.email values must be resolved before migration 000025';
  END IF;
END $$;

ALTER TABLE users
  ALTER COLUMN password_hash DROP NOT NULL,
  ADD COLUMN account_status varchar(32) NOT NULL DEFAULT 'active',
  ADD CONSTRAINT users_account_status_check
    CHECK (account_status IN ('pending_verification','active','disabled','closed'));

CREATE UNIQUE INDEX users_email_normalized_uidx ON users (lower(btrim(email)));

CREATE TABLE account_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  display_name varchar(80) NOT NULL CHECK (length(btrim(display_name)) BETWEEN 2 AND 80),
  avatar_url varchar(500),
  preferred_locale varchar(2) NOT NULL CHECK (preferred_locale IN ('th','en','de')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE auth_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider varchar(16) NOT NULL CHECK (provider IN ('password','google')),
  provider_subject varchar(255) NOT NULL,
  provider_email varchar(255) NOT NULL,
  credential_hash varchar(255),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_subject),
  UNIQUE (user_id, provider),
  CHECK ((provider = 'password' AND credential_hash IS NOT NULL) OR (provider = 'google' AND credential_hash IS NULL))
);

CREATE TABLE auth_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_id uuid NOT NULL,
  token_hash char(64) NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  last_used_at timestamptz NOT NULL,
  revoked_at timestamptz,
  revoked_reason varchar(64),
  user_agent_summary varchar(255),
  ip_prefix varchar(64),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX auth_sessions_user_id_idx ON auth_sessions(user_id);
CREATE INDEX auth_sessions_family_id_idx ON auth_sessions(family_id);
CREATE INDEX auth_sessions_expires_at_idx ON auth_sessions(expires_at);

CREATE TABLE auth_action_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose varchar(32) NOT NULL CHECK (purpose IN ('verify_email','reset_password','link_identity')),
  token_hash char(64) NOT NULL UNIQUE,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX auth_action_tokens_user_id_idx ON auth_action_tokens(user_id);
CREATE INDEX auth_action_tokens_expires_at_idx ON auth_action_tokens(expires_at);

CREATE TABLE auth_security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  event_type varchar(64) NOT NULL,
  outcome varchar(16) NOT NULL CHECK (outcome IN ('success','failure')),
  provider varchar(16),
  request_trace_id varchar(64),
  ip_prefix varchar(64),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX auth_security_events_user_id_idx ON auth_security_events(user_id);
CREATE INDEX auth_security_events_created_at_idx ON auth_security_events(created_at);
