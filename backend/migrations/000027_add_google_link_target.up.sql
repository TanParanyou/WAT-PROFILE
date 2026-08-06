ALTER TABLE auth_oauth_flows
  ADD COLUMN link_user_id uuid REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX auth_oauth_flows_link_user_id_idx
  ON auth_oauth_flows(link_user_id);
