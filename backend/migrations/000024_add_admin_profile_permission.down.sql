UPDATE roles
SET permissions = permissions - 'profile'
WHERE name IN ('admin', 'editor', 'accountant');
