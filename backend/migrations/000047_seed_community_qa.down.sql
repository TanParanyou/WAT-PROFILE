BEGIN;

UPDATE roles
SET permissions = COALESCE(permissions, '{}'::jsonb) - 'community'
WHERE name = 'admin' AND admin_access = true;

UPDATE community_categories
SET is_active = false,
    updated_at = now()
WHERE id IN (
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000004'
);

COMMIT;
