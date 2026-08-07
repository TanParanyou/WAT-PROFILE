UPDATE roles
SET permissions = jsonb_set(
  COALESCE(permissions, '{}'::jsonb),
  '{account_operations}',
  '"all"'::jsonb,
  true
)
WHERE name = 'admin' AND admin_access = true;
