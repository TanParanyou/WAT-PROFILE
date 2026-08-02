UPDATE roles
SET permissions = COALESCE(permissions, '{}'::jsonb) || '{"profile":"update"}'::jsonb
WHERE name IN ('admin', 'editor', 'accountant');
