ALTER TABLE auth_oauth_flows
  ADD COLUMN reauth_user_id uuid REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX auth_oauth_flows_reauth_user_id_idx
  ON auth_oauth_flows(reauth_user_id);
