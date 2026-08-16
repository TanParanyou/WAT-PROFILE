-- 000049_add_admin_security_features.up.sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret TEXT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_verified_at TIMESTAMPTZ NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS security_preferences JSONB NOT NULL DEFAULT '{"email_on_new_device": true, "email_on_failed_login": true, "email_on_security_change": true}'::jsonb;

CREATE TABLE IF NOT EXISTS user_backup_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash VARCHAR(255) NOT NULL,
    used_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_backup_codes_user_id ON user_backup_codes(user_id);

-- Ensure admin roles have read and update permission on profile
UPDATE roles
SET permissions = jsonb_set(
    COALESCE(permissions, '{}'::jsonb),
    '{profile}',
    to_jsonb(
        CASE
            WHEN COALESCE(permissions->>'profile', '') = '' THEN 'read,update'
            WHEN permissions->>'profile' LIKE '%read%' THEN permissions->>'profile'
            ELSE permissions->>'profile' || ',read'
        END
    )
)
WHERE admin_access = true;
