CREATE TABLE auth_oauth_flows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state_hash char(64) NOT NULL UNIQUE,
  nonce varchar(255) NOT NULL,
  verifier varchar(255) NOT NULL,
  locale varchar(2) NOT NULL CHECK (locale IN ('th','en','de')),
  return_to varchar(500) NOT NULL DEFAULT '',
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX auth_oauth_flows_expires_at_idx ON auth_oauth_flows(expires_at);
