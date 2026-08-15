BEGIN;

CREATE TABLE calendar_resources (
  id BIGSERIAL PRIMARY KEY,
  slug VARCHAR(100) NOT NULL UNIQUE,
  resource_type VARCHAR(50) NOT NULL,
  title JSONB NOT NULL,
  color VARCHAR(16),
  capacity INTEGER CHECK (capacity IS NULL OR capacity > 0),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE event_resource_assignments (
  event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  resource_id BIGINT NOT NULL REFERENCES calendar_resources(id) ON DELETE RESTRICT,
  PRIMARY KEY (event_id, resource_id)
);

CREATE INDEX event_resource_assignments_resource_event_idx
  ON event_resource_assignments (resource_id, event_id);
CREATE INDEX calendar_resources_visibility_order_idx
  ON calendar_resources (is_active, is_public, display_order, id);

UPDATE roles
SET permissions = jsonb_set(
  COALESCE(permissions, '{}'::jsonb),
  '{calendar_resources}',
  '"all"'::jsonb,
  true
)
WHERE name IN ('admin', 'editor') AND admin_access = true;

COMMIT;
