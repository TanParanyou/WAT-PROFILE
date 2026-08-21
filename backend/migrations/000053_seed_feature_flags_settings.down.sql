DELETE FROM settings
WHERE key IN (
  'feature_public_account_auth',
  'feature_public_community_read',
  'feature_public_community_write',
  'feature_donations',
  'feature_event_registration'
);
