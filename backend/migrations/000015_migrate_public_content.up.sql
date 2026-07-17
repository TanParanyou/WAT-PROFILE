-- Migrate PAGE-PRIVACY body shape
WITH privacy_data AS (
  SELECT id,
         body->'sections'->0->'content'->>'th' AS th_text,
         body->'sections'->0->'content'->>'en' AS en_text,
         body->'sections'->0->'content'->>'de' AS de_text
  FROM content_pages
  WHERE page_key = 'PAGE-PRIVACY' AND (body->'content' IS NULL OR body->'content'->>'th' IS NULL) AND body->'sections' IS NOT NULL
)
UPDATE content_pages
SET body = body || jsonb_build_object(
  'content', jsonb_build_object(
    'th', CASE WHEN th_text IS NOT NULL AND th_text != '' THEN jsonb_build_object('type', 'doc', 'content', jsonb_build_array(jsonb_build_object('type', 'paragraph', 'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', th_text))))) ELSE 'null'::jsonb END,
    'en', CASE WHEN en_text IS NOT NULL AND en_text != '' THEN jsonb_build_object('type', 'doc', 'content', jsonb_build_array(jsonb_build_object('type', 'paragraph', 'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', en_text))))) ELSE 'null'::jsonb END,
    'de', CASE WHEN de_text IS NOT NULL AND de_text != '' THEN jsonb_build_object('type', 'doc', 'content', jsonb_build_array(jsonb_build_object('type', 'paragraph', 'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', de_text))))) ELSE 'null'::jsonb END
  )
)
FROM privacy_data
WHERE content_pages.id = privacy_data.id;

-- Migrate PAGE-ABOUT body shape
WITH about_data AS (
  SELECT id,
         body->'objective_content' AS obj_ml,
         body->'administration_content' AS adm_ml,
         body->'history_content' AS hist_ml
  FROM content_pages
  WHERE page_key = 'PAGE-ABOUT' AND body->'objective' IS NULL
)
UPDATE content_pages
SET body = jsonb_build_object(
  'intro', jsonb_build_object(
    'heading', jsonb_build_object('th', '', 'en', '', 'de', ''),
    'description', jsonb_build_object('th', '', 'en', '', 'de', ''),
    'founded', jsonb_build_object('th', '', 'en', '', 'de', ''),
    'location', jsonb_build_object('th', '', 'en', '', 'de', '')
  ),
  'objective', jsonb_build_object(
    'heading', jsonb_build_object('th', 'วัตถุประสงค์', 'en', 'Objective', 'de', 'Zielsetzung'),
    'subtitle', jsonb_build_object('th', '', 'en', '', 'de', ''),
    'content', jsonb_build_object(
      'th', CASE WHEN obj_ml->>'th' IS NOT NULL AND obj_ml->>'th' != '' THEN jsonb_build_object('type', 'doc', 'content', jsonb_build_array(jsonb_build_object('type', 'paragraph', 'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', obj_ml->>'th'))))) ELSE 'null'::jsonb END,
      'en', CASE WHEN obj_ml->>'en' IS NOT NULL AND obj_ml->>'en' != '' THEN jsonb_build_object('type', 'doc', 'content', jsonb_build_array(jsonb_build_object('type', 'paragraph', 'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', obj_ml->>'en'))))) ELSE 'null'::jsonb END,
      'de', CASE WHEN obj_ml->>'de' IS NOT NULL AND obj_ml->>'de' != '' THEN jsonb_build_object('type', 'doc', 'content', jsonb_build_array(jsonb_build_object('type', 'paragraph', 'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', obj_ml->>'de'))))) ELSE 'null'::jsonb END
    )
  ),
  'administration', jsonb_build_object(
    'heading', jsonb_build_object('th', 'การบริหารจัดการ', 'en', 'Administration', 'de', 'Verwaltung'),
    'content', jsonb_build_object(
      'th', CASE WHEN adm_ml->>'th' IS NOT NULL AND adm_ml->>'th' != '' THEN jsonb_build_object('type', 'doc', 'content', jsonb_build_array(jsonb_build_object('type', 'paragraph', 'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', adm_ml->>'th'))))) ELSE 'null'::jsonb END,
      'en', CASE WHEN adm_ml->>'en' IS NOT NULL AND adm_ml->>'en' != '' THEN jsonb_build_object('type', 'doc', 'content', jsonb_build_array(jsonb_build_object('type', 'paragraph', 'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', adm_ml->>'en'))))) ELSE 'null'::jsonb END,
      'de', CASE WHEN adm_ml->>'de' IS NOT NULL AND adm_ml->>'de' != '' THEN jsonb_build_object('type', 'doc', 'content', jsonb_build_array(jsonb_build_object('type', 'paragraph', 'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', adm_ml->>'de'))))) ELSE 'null'::jsonb END
    )
  ),
  'history', jsonb_build_object(
    'heading', jsonb_build_object('th', 'ประวัติความเป็นมา', 'en', 'History', 'de', 'Geschichte'),
    'content', jsonb_build_object(
      'th', CASE WHEN hist_ml->>'th' IS NOT NULL AND hist_ml->>'th' != '' THEN jsonb_build_object('type', 'doc', 'content', jsonb_build_array(jsonb_build_object('type', 'paragraph', 'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', hist_ml->>'th'))))) ELSE 'null'::jsonb END,
      'en', CASE WHEN hist_ml->>'en' IS NOT NULL AND hist_ml->>'en' != '' THEN jsonb_build_object('type', 'doc', 'content', jsonb_build_array(jsonb_build_object('type', 'paragraph', 'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', hist_ml->>'en'))))) ELSE 'null'::jsonb END,
      'de', CASE WHEN hist_ml->>'de' IS NOT NULL AND hist_ml->>'de' != '' THEN jsonb_build_object('type', 'doc', 'content', jsonb_build_array(jsonb_build_object('type', 'paragraph', 'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', hist_ml->>'de'))))) ELSE 'null'::jsonb END
    )
  ),
  'buildings', jsonb_build_object(
    'heading', jsonb_build_object('th', 'ศาสนสถาน', 'en', 'Buildings', 'de', 'Gebäude'),
    'items', '[]'::jsonb
  ),
  'sangha', jsonb_build_object(
    'heading', jsonb_build_object('th', 'คณะสงฆ์', 'en', 'Sangha', 'de', 'Sangha'),
    'mission', jsonb_build_object('th', '', 'en', '', 'de', ''),
    'content', jsonb_build_object('th', 'null'::jsonb, 'en', 'null'::jsonb, 'de', 'null'::jsonb)
  )
) || body
FROM about_data
WHERE content_pages.id = about_data.id;

-- Migrate PAGE-CONTACT body shape
WITH settings_data AS (
  SELECT
    COALESCE((SELECT value FROM settings WHERE key = 'address'), '') AS addr_val,
    COALESCE((SELECT value FROM settings WHERE key = 'contact_phone'), '') AS phone_val,
    COALESCE((SELECT value FROM settings WHERE key = 'contact_email'), '') AS email_val,
    COALESCE((SELECT value FROM settings WHERE key = 'facebook_url'), '') AS fb_val,
    COALESCE((SELECT value FROM settings WHERE key = 'youtube_url'), '') AS yt_val,
    COALESCE((SELECT value FROM settings WHERE key = 'line_id'), '') AS line_val,
    (SELECT value FROM settings WHERE key = 'bank_account_info') AS bank_val
)
UPDATE content_pages
SET body = jsonb_build_object(
  'address', jsonb_build_object('th', addr_val, 'en', addr_val, 'de', addr_val),
  'phone', phone_val,
  'email', email_val,
  'opening_hours', jsonb_build_object(
    'days', jsonb_build_object('th', 'วันอังคาร - วันอาทิตย์', 'en', 'Tuesday - Sunday', 'de', 'Dienstag - Sonntag'),
    'time', jsonb_build_object('th', '09:00 - 18:00 น.', 'en', '09:00 AM - 06:00 PM', 'de', '09:00 - 18:00 Uhr'),
    'notice', jsonb_build_object('th', 'ปิดทุกวันจันทร์', 'en', 'Closed on Mondays', 'de', 'Montags geschlossen')
  ),
  'map', jsonb_build_object(
    'name', jsonb_build_object('th', 'วัดหลวงพ่อใส', 'en', 'Wat Loung Por Sai', 'de', 'Wat Loung Por Sai'),
    'embed_url', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2524.3168212154483!2d9.2970717!3d50.1925345!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47b407bc4fbe61d7%3A0xe2128cebf9331899!2sWat%20Loung%20Por%20Sai!5e0!3m2!1sth!2sde!4v1700000000000',
    'directions_url', 'https://maps.app.goo.gl/watloungporsai'
  ),
  'transport', jsonb_build_object(
    'parking', jsonb_build_object('th', 'มีที่จอดรถบริเวณหน้าวัด', 'en', 'Parking space available in front of the temple', 'de', 'Parkplatz vor dem Tempel vorhanden'),
    'public_transport', jsonb_build_array(
      jsonb_build_object('th', 'รถไฟลงสถานี Gelnhausen ต่อรถบัสสาย 82', 'en', 'Train to Gelnhausen Station, then Bus 82', 'de', 'Zug zum Bahnhof Gelnhausen, dann Bus 82')
    ),
    'driving', jsonb_build_object('th', 'ทางหลวง A66 ออกทาง Biebergemünd', 'en', 'Highway A66, exit Biebergemünd', 'de', 'Autobahn A66, Ausfahrt Biebergemünd')
  ),
  'socials', jsonb_build_object(
    'facebook', fb_val,
    'instagram', '',
    'messenger', '',
    'line', line_val,
    'youtube', yt_val
  ),
  'bank', CASE
    WHEN bank_val IS NOT NULL AND bank_val != '' AND bank_val != 'null' THEN
      bank_val::jsonb
    ELSE
      jsonb_build_object(
        'bank_name', jsonb_build_object('th', '', 'en', '', 'de', ''),
        'account_name', jsonb_build_object('th', '', 'en', '', 'de', ''),
        'account_number', '',
        'iban', '',
        'bic', ''
      )
  END,
  'contact_form', jsonb_build_object(
    'enabled', true,
    'success_message', jsonb_build_object(
      'th', 'ส่งข้อความสำเร็จ ขอบคุณที่ติดต่อเรา',
      'en', 'Message sent successfully. Thank you for contacting us.',
      'de', 'Nachricht erfolgreich gesendet. Vielen Dank für Ihre Kontaktaufnahme.'
    ),
    'privacy_page_link', '/privacy'
  )
) || body
FROM settings_data
WHERE page_key = 'PAGE-CONTACT' AND (body->>'address' IS NULL OR body->>'address' = '');

-- Migrate PAGE-IMPRESSUM body shape
WITH impressum_data AS (
  SELECT id,
         body->'organization_name' AS org_name,
         body->'address' AS addr,
         body->>'phone' AS ph,
         body->>'email' AS em
  FROM content_pages
  WHERE page_key = 'PAGE-IMPRESSUM' AND body->'legal_form' IS NULL
)
UPDATE content_pages
SET body = jsonb_build_object(
  'organization_name', COALESCE(org_name, jsonb_build_object('th', '', 'en', '', 'de', '')),
  'legal_form', jsonb_build_object('th', '', 'en', '', 'de', ''),
  'address', COALESCE(addr, jsonb_build_object('th', '', 'en', '', 'de', '')),
  'phone', COALESCE(ph, ''),
  'email', COALESCE(em, ''),
  'representative', jsonb_build_object('th', '', 'en', '', 'de', ''),
  'registry_court', jsonb_build_object('th', '', 'en', '', 'de', ''),
  'registry_number', '',
  'vat_id', '',
  'content_responsibility', jsonb_build_object('th', '', 'en', '', 'de', '')
) || body
FROM impressum_data
WHERE content_pages.id = impressum_data.id;

-- Ensure all four public pages are published and their published fields match their normal fields
UPDATE content_pages
SET status = 'published',
    published_title = title,
    published_description = description,
    published_seo = seo,
    published_body = body,
    published_settings = settings,
    published_at = COALESCE(published_at, NOW())
WHERE page_key IN ('PAGE-ABOUT', 'PAGE-CONTACT', 'PAGE-PRIVACY', 'PAGE-IMPRESSUM');
