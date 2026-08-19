ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE NOT NULL;

-- Mark default admin role as system role
UPDATE roles SET is_system = TRUE WHERE name = 'admin';
