ALTER TABLE users
  ADD COLUMN closed_at timestamptz,
  ADD COLUMN purge_after timestamptz;

CREATE INDEX users_public_account_purge_due_idx
  ON users (purge_after)
  WHERE account_status = 'closed' AND purge_after IS NOT NULL;

ALTER TABLE account_profiles
  ADD COLUMN avatar_object_key varchar(600) NOT NULL DEFAULT '';

ALTER TABLE auth_action_tokens
  DROP CONSTRAINT IF EXISTS auth_action_tokens_purpose_check;
ALTER TABLE auth_action_tokens
  ADD CONSTRAINT auth_action_tokens_purpose_check
  CHECK (purpose IN ('verify_email','reset_password','link_identity','change_email','reopen_account'));
