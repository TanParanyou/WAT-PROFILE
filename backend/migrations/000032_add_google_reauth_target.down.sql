DROP INDEX IF EXISTS auth_oauth_flows_reauth_user_id_idx;
ALTER TABLE auth_oauth_flows DROP COLUMN IF EXISTS reauth_user_id;
