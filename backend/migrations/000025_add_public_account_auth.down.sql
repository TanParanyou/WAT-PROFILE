-- 000025_add_public_account_auth.down.sql
-- Reverses 000025. This is DESTRUCTIVE: it drops the auth tables and the
-- nullable password_hash state. It aborts when any user row has a NULL
-- password_hash so rollback can never orphan Google-only accounts or make
-- existing users unreadable. Destructive down migrations are reserved for a
-- confirmed non-production database.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM users WHERE password_hash IS NULL) THEN
    RAISE EXCEPTION 'cannot roll back 000025: users.password_hash contains NULL values; resolve account data before rolling back';
  END IF;
END $$;

DROP TABLE IF EXISTS auth_security_events;
DROP TABLE IF EXISTS auth_action_tokens;
DROP TABLE IF EXISTS auth_sessions;
DROP TABLE IF EXISTS auth_identities;
DROP TABLE IF EXISTS account_profiles;

DROP INDEX IF EXISTS users_email_normalized_uidx;
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_account_status_check,
  DROP COLUMN IF EXISTS account_status,
  ALTER COLUMN password_hash SET NOT NULL;
