CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS migration_000021_status_backup (
  entity_type TEXT NOT NULL,
  entity_id BIGINT NOT NULL,
  old_status TEXT NOT NULL,
  PRIMARY KEY (entity_type, entity_id)
);

INSERT INTO migration_000021_status_backup (entity_type, entity_id, old_status)
SELECT 'contact_inquiry', id, status
FROM contact_inquiries
WHERE status IN ('pending', 'closed')
ON CONFLICT DO NOTHING;

INSERT INTO migration_000021_status_backup (entity_type, entity_id, old_status)
SELECT 'event_registration', id, registration_status
FROM event_registrations
WHERE registration_status IN ('approved', 'rejected')
ON CONFLICT DO NOTHING;

UPDATE contact_inquiries
SET status = CASE status
  WHEN 'pending' THEN 'new'
  WHEN 'closed' THEN 'archived'
  ELSE status
END
WHERE status IN ('pending', 'closed');

UPDATE event_registrations
SET registration_status = CASE registration_status
  WHEN 'approved' THEN 'confirmed'
  WHEN 'rejected' THEN 'cancelled'
  ELSE registration_status
END
WHERE registration_status IN ('approved', 'rejected');

CREATE INDEX IF NOT EXISTS idx_admin_list_users_name_trgm
  ON users USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_admin_list_users_email_trgm
  ON users USING gin (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_admin_list_users_created_id
  ON users (created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_admin_list_members_code_trgm
  ON members USING gin (member_code gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_admin_list_members_name_th_trgm
  ON members USING gin ((first_name_th || ' ' || last_name_th) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_admin_list_members_name_en_trgm
  ON members USING gin ((first_name_en || ' ' || last_name_en) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_admin_list_members_created_id
  ON members (created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_admin_list_donations_receipt_trgm
  ON donations USING gin (receipt_number gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_admin_list_donations_donor_trgm
  ON donations USING gin (donor_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_admin_list_donations_created_id
  ON donations (created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_admin_list_registrations_name_trgm
  ON event_registrations USING gin ((first_name || ' ' || last_name) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_admin_list_registrations_email_trgm
  ON event_registrations USING gin (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_admin_list_registrations_created_id
  ON event_registrations (created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_admin_list_contacts_name_trgm
  ON contact_inquiries USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_admin_list_contacts_subject_trgm
  ON contact_inquiries USING gin (subject gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_admin_list_contacts_created_id
  ON contact_inquiries (created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_admin_list_media_filename_trgm
  ON media USING gin (original_filename gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_admin_list_media_created_id
  ON media (created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_admin_list_audit_created_id
  ON audit_logs (created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_admin_list_users_role_id ON users (role_id);
CREATE INDEX IF NOT EXISTS idx_admin_list_users_is_active ON users (is_active);
CREATE INDEX IF NOT EXISTS idx_admin_list_users_email_verified ON users (email_verified);
CREATE INDEX IF NOT EXISTS idx_admin_list_roles_is_active ON roles (is_active);
CREATE INDEX IF NOT EXISTS idx_admin_list_members_type ON members (membership_type);
CREATE INDEX IF NOT EXISTS idx_admin_list_membership_date ON members (membership_date);
CREATE INDEX IF NOT EXISTS idx_admin_list_monks_display_order ON monks (display_order, id);
CREATE INDEX IF NOT EXISTS idx_admin_list_events_display_order ON events (display_order, id);
CREATE INDEX IF NOT EXISTS idx_admin_list_schedules_weekday ON schedules (day_of_week);
CREATE INDEX IF NOT EXISTS idx_admin_list_schedules_display_order ON schedules (display_order, id);
CREATE INDEX IF NOT EXISTS idx_admin_list_gallery_display_order ON galleries (display_order, id);
CREATE INDEX IF NOT EXISTS idx_admin_list_gallery_categories_display_order ON gallery_categories (display_order, id);
CREATE INDEX IF NOT EXISTS idx_admin_list_donations_method ON donations (donation_method);
CREATE INDEX IF NOT EXISTS idx_admin_list_donations_currency ON donations (currency);
CREATE INDEX IF NOT EXISTS idx_admin_list_donation_categories_is_active ON donation_categories (is_active);
CREATE INDEX IF NOT EXISTS idx_admin_list_donation_categories_display_order ON donation_categories (display_order, id);
CREATE INDEX IF NOT EXISTS idx_admin_list_registrations_created_at ON event_registrations (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_list_contacts_type ON contact_inquiries (inquiry_type);
CREATE INDEX IF NOT EXISTS idx_admin_list_media_mime_type ON media (mime_type);
CREATE INDEX IF NOT EXISTS idx_admin_list_media_uploaded_by ON media (uploaded_by_id);
CREATE INDEX IF NOT EXISTS idx_admin_list_content_pages_status ON content_pages (status);
CREATE INDEX IF NOT EXISTS idx_admin_list_content_pages_updated_at ON content_pages (updated_at DESC, id);
