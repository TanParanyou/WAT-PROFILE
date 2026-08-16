BEGIN;

INSERT INTO community_categories (id, slug, name, description, sort_order, is_active)
VALUES
  (
    '10000000-0000-4000-8000-000000000001',
    'dharma-practice',
    '{"th":"ธรรมะและการปฏิบัติ","en":"Dharma and Practice","de":"Dharma und Praxis"}'::jsonb,
    '{"th":"คำถามเกี่ยวกับธรรมะและแนวทางการปฏิบัติ","en":"Questions about Dharma and practice","de":"Fragen zu Dharma und Praxis"}'::jsonb,
    10,
    true
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'temple-visits',
    '{"th":"การมาวัด","en":"Visiting the Temple","de":"Besuch im Tempel"}'::jsonb,
    '{"th":"ข้อมูลและคำแนะนำสำหรับการมาวัด","en":"Information and advice for visiting the temple","de":"Informationen und Hinweise für den Tempelbesuch"}'::jsonb,
    20,
    true
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    'activities',
    '{"th":"กิจกรรม","en":"Activities","de":"Aktivitäten"}'::jsonb,
    '{"th":"คำถามเกี่ยวกับกิจกรรมและงานบุญ","en":"Questions about activities and merit-making events","de":"Fragen zu Aktivitäten und Veranstaltungen"}'::jsonb,
    30,
    true
  ),
  (
    '10000000-0000-4000-8000-000000000004',
    'general-questions',
    '{"th":"คำถามทั่วไป","en":"General Questions","de":"Allgemeine Fragen"}'::jsonb,
    '{"th":"คำถามทั่วไปเกี่ยวกับชุมชนและวัด","en":"General questions about the community and temple","de":"Allgemeine Fragen zur Gemeinschaft und zum Tempel"}'::jsonb,
    40,
    true
  )
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order,
    is_active = true,
    updated_at = now();

UPDATE roles
SET permissions = jsonb_set(
  COALESCE(permissions, '{}'::jsonb),
  '{community}',
  '"all"'::jsonb,
  true
)
WHERE name = 'admin' AND admin_access = true;

COMMIT;
