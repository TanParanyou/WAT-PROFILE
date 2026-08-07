BEGIN;

CREATE TABLE IF NOT EXISTS operation_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_key varchar(255) NOT NULL UNIQUE,
  kind varchar(80) NOT NULL,
  aggregate_type varchar(80) NOT NULL,
  aggregate_id varchar(120) NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status varchar(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'succeeded', 'failed')),
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 8,
  available_at timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  locked_by varchar(120),
  last_error text NOT NULL DEFAULT '',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS operation_outbox_due_idx
  ON operation_outbox(status, available_at, created_at);

COMMIT;
