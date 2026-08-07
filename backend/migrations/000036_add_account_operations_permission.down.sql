UPDATE roles
SET permissions = COALESCE(permissions, '{}'::jsonb) - 'account_operations'
WHERE name = 'admin' AND admin_access = true;
