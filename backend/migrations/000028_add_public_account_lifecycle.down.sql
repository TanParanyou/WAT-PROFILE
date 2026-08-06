ALTER TABLE auth_action_tokens
  DROP CONSTRAINT IF EXISTS auth_action_tokens_purpose_check;
ALTER TABLE auth_action_tokens
  ADD CONSTRAINT auth_action_tokens_purpose_check
  CHECK (purpose IN ('verify_email','reset_password','link_identity'));

ALTER TABLE account_profiles DROP COLUMN IF EXISTS avatar_object_key;
DROP INDEX IF EXISTS users_public_account_purge_due_idx;
ALTER TABLE users DROP COLUMN IF EXISTS purge_after, DROP COLUMN IF EXISTS closed_at;
