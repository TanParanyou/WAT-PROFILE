CREATE TABLE account_avatar_cleanups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  object_key varchar(600) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT account_avatar_cleanups_key_check CHECK (object_key LIKE 'accounts/%/avatar/%'),
  CONSTRAINT account_avatar_cleanups_user_key_unique UNIQUE (user_id, object_key)
);

CREATE INDEX account_avatar_cleanups_user_id_idx
  ON account_avatar_cleanups(user_id, created_at);
