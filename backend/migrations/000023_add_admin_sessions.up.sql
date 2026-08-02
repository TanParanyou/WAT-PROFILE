CREATE TABLE IF NOT EXISTS admin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_secret_hash CHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    revocation_reason VARCHAR(100),
    last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address VARCHAR(45),
    user_agent VARCHAR(512),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_session_refresh_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES admin_sessions(id) ON DELETE CASCADE,
    secret_hash CHAR(64) NOT NULL,
    grace_expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (session_id, secret_hash)
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_cleanup ON admin_sessions(expires_at, revoked_at);
CREATE INDEX IF NOT EXISTS idx_admin_session_history_lookup ON admin_session_refresh_history(session_id, grace_expires_at);

ALTER TABLE roles ADD COLUMN IF NOT EXISTS admin_access BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE roles SET admin_access = TRUE WHERE name IN ('admin', 'editor', 'accountant');

UPDATE roles
SET permissions = COALESCE(permissions, '{}'::jsonb) || '{"dashboard":"read"}'::jsonb
WHERE name IN ('admin', 'editor', 'accountant');
