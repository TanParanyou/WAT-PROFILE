BEGIN;

UPDATE roles
SET permissions = COALESCE(permissions, '{}'::jsonb) - 'calendar_resources'
WHERE name IN ('admin', 'editor') AND admin_access = true;

DROP INDEX IF EXISTS calendar_resources_visibility_order_idx;
DROP INDEX IF EXISTS event_resource_assignments_resource_event_idx;
DROP TABLE IF EXISTS event_resource_assignments;
DROP TABLE IF EXISTS calendar_resources;

COMMIT;
