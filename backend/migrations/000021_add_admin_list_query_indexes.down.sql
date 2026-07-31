UPDATE contact_inquiries c
SET status = b.old_status
FROM migration_000021_status_backup b
WHERE b.entity_type = 'contact_inquiry' AND b.entity_id = c.id;

UPDATE event_registrations r
SET registration_status = b.old_status
FROM migration_000021_status_backup b
WHERE b.entity_type = 'event_registration' AND b.entity_id = r.id;

DROP TABLE IF EXISTS migration_000021_status_backup;

DROP INDEX IF EXISTS idx_admin_list_users_name_trgm;
DROP INDEX IF EXISTS idx_admin_list_users_email_trgm;
DROP INDEX IF EXISTS idx_admin_list_users_created_id;
DROP INDEX IF EXISTS idx_admin_list_members_code_trgm;
DROP INDEX IF EXISTS idx_admin_list_members_name_th_trgm;
DROP INDEX IF EXISTS idx_admin_list_members_name_en_trgm;
DROP INDEX IF EXISTS idx_admin_list_members_created_id;
DROP INDEX IF EXISTS idx_admin_list_donations_receipt_trgm;
DROP INDEX IF EXISTS idx_admin_list_donations_donor_trgm;
DROP INDEX IF EXISTS idx_admin_list_donations_created_id;
DROP INDEX IF EXISTS idx_admin_list_registrations_name_trgm;
DROP INDEX IF EXISTS idx_admin_list_registrations_email_trgm;
DROP INDEX IF EXISTS idx_admin_list_registrations_created_id;
DROP INDEX IF EXISTS idx_admin_list_contacts_name_trgm;
DROP INDEX IF EXISTS idx_admin_list_contacts_subject_trgm;
DROP INDEX IF EXISTS idx_admin_list_contacts_created_id;
DROP INDEX IF EXISTS idx_admin_list_media_filename_trgm;
DROP INDEX IF EXISTS idx_admin_list_media_created_id;
DROP INDEX IF EXISTS idx_admin_list_audit_created_id;
DROP INDEX IF EXISTS idx_admin_list_users_role_id;
DROP INDEX IF EXISTS idx_admin_list_users_is_active;
DROP INDEX IF EXISTS idx_admin_list_users_email_verified;
DROP INDEX IF EXISTS idx_admin_list_roles_is_active;
DROP INDEX IF EXISTS idx_admin_list_members_type;
DROP INDEX IF EXISTS idx_admin_list_membership_date;
DROP INDEX IF EXISTS idx_admin_list_monks_display_order;
DROP INDEX IF EXISTS idx_admin_list_events_display_order;
DROP INDEX IF EXISTS idx_admin_list_schedules_weekday;
DROP INDEX IF EXISTS idx_admin_list_schedules_display_order;
DROP INDEX IF EXISTS idx_admin_list_gallery_display_order;
DROP INDEX IF EXISTS idx_admin_list_gallery_categories_display_order;
DROP INDEX IF EXISTS idx_admin_list_donations_method;
DROP INDEX IF EXISTS idx_admin_list_donations_currency;
DROP INDEX IF EXISTS idx_admin_list_donation_categories_is_active;
DROP INDEX IF EXISTS idx_admin_list_donation_categories_display_order;
DROP INDEX IF EXISTS idx_admin_list_registrations_created_at;
DROP INDEX IF EXISTS idx_admin_list_contacts_type;
DROP INDEX IF EXISTS idx_admin_list_media_mime_type;
DROP INDEX IF EXISTS idx_admin_list_media_uploaded_by;
DROP INDEX IF EXISTS idx_admin_list_content_pages_status;
DROP INDEX IF EXISTS idx_admin_list_content_pages_updated_at;
