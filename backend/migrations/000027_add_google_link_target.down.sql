DROP INDEX IF EXISTS auth_oauth_flows_link_user_id_idx;
ALTER TABLE auth_oauth_flows DROP COLUMN IF EXISTS link_user_id;
