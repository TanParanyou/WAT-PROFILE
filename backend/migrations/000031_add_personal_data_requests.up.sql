BEGIN;
CREATE TABLE IF NOT EXISTS personal_data_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_email varchar(255) NOT NULL DEFAULT '',
  subject_member_code varchar(50) NOT NULL DEFAULT '',
  request_type varchar(20) NOT NULL CHECK (request_type IN ('access','erasure')),
  verification_method varchar(20) NOT NULL DEFAULT '',
  verification_status varchar(20) NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified','verified','expired')),
  evidence_reference varchar(500) NOT NULL DEFAULT '',
  verification_token_hash varchar(128) NOT NULL DEFAULT '',
  verification_expires_at timestamptz,
  status varchar(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open','verified','processing','completed','rejected')),
  notes text NOT NULL DEFAULT '',
  verified_by_id uuid REFERENCES users(id) ON DELETE SET NULL,
  verified_at timestamptz,
  completed_by_id uuid REFERENCES users(id) ON DELETE SET NULL,
  completed_at timestamptz,
  created_by_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS personal_data_requests_status_idx ON personal_data_requests(status, created_at DESC);
CREATE TABLE IF NOT EXISTS personal_data_request_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES personal_data_requests(id) ON DELETE CASCADE,
  domain varchar(40) NOT NULL,
  record_id varchar(120) NOT NULL,
  match_basis varchar(40) NOT NULL DEFAULT '',
  display_name varchar(255) NOT NULL DEFAULT '',
  masked_email varchar(255) NOT NULL DEFAULT '',
  selected_action varchar(20) NOT NULL DEFAULT '',
  result varchar(20) NOT NULL DEFAULT '',
  reason varchar(100) NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS personal_data_request_items_request_idx ON personal_data_request_items(request_id);
COMMIT;
