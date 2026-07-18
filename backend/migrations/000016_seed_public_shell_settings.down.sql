DELETE FROM settings
WHERE category = 'public-shell'
  AND key IN (
    'site_name_th', 'site_name_en', 'site_name_de',
    'site_description_th', 'site_description_en', 'site_description_de',
    'contact_address_th', 'contact_address_en', 'contact_address_de',
    'contact_phone', 'contact_email', 'facebook_url', 'youtube_url',
    'instagram_url', 'line_url', 'logo_url', 'social_sidebar_position'
  );
