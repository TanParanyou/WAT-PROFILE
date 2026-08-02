UPDATE roles
SET permissions = permissions - 'dashboard'
WHERE name IN ('admin', 'editor', 'accountant');

DROP INDEX IF EXISTS idx_admin_session_history_lookup;
DROP INDEX IF EXISTS idx_admin_sessions_cleanup;
DROP INDEX IF EXISTS idx_admin_sessions_user_id;

DROP TABLE IF EXISTS admin_session_refresh_history;
DROP TABLE IF EXISTS admin_sessions;

ALTER TABLE roles DROP COLUMN IF EXISTS admin_access;
