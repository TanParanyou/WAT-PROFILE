CREATE TABLE IF NOT EXISTS chantings (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(120) UNIQUE NOT NULL,
    title JSONB NOT NULL,
    subtitle JSONB,
    category VARCHAR(50) NOT NULL DEFAULT 'general',
    pali_thai TEXT NOT NULL,
    pali_roman TEXT NOT NULL,
    translation JSONB NOT NULL,
    audio_url VARCHAR(255),
    duration_seconds INT NOT NULL DEFAULT 0,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_chantings_slug ON chantings(slug);
CREATE INDEX IF NOT EXISTS idx_chantings_category ON chantings(category);
CREATE INDEX IF NOT EXISTS idx_chantings_is_active ON chantings(is_active);
CREATE INDEX IF NOT EXISTS idx_chantings_display_order ON chantings(display_order);

-- Seed Essential Buddhist Chants
INSERT INTO chantings (id, slug, title, subtitle, category, pali_thai, pali_roman, translation, audio_url, duration_seconds, display_order, is_active, created_at, updated_at)
VALUES
(
  1,
  'namo-tassa',
  '{"th": "บทนมัสการพระรัตนตรัย (นะโม ตัสสะ)", "en": "Homage to the Triple Gem (Namo Tassa)", "de": "Verehrung des Erhabenen (Namo Tassa)"}'::jsonb,
  '{"th": "บทสวดเริ่มต้นก่อนทำพิธีทางศาสนาทุกประเภท", "en": "Initial homage chanted before any Buddhist recitation", "de": "Einführende Rezitation zur Würdigung des Buddha"}'::jsonb,
  'general',
  'นะโม ตัสสะ ภะคะวะโต อะระหะโต สัมมาสัมพุทธัสสะ (๓ จบ)',
  'Namo tassa bhagavato arahato sammāsambuddhassa. (3 times)',
  '{"th": "ขอนอบน้อมแด่พระผู้มีพระภาคเจ้า พระองค์นั้น ผู้เป็นพระอรหันต์ ดับเพลิงกิเลสเพลิงทุกข์สิ้นเชิง ตรัสรู้ชอบได้โดยพระองค์เอง", "en": "Homage to the Blessed One, the Worthy One, the Fully Self-Enlightened One.", "de": "Ehre sei dem Erhabenen, dem Vollendeten, dem vollkommen Erleuchteten."}'::jsonb,
  '',
  45,
  1,
  true,
  NOW(),
  NOW()
),
(
  2,
  'buddhabhithuti',
  '{"th": "บทพุทธาภิถุติ (สรรเสริญพระพุทธคุณ)", "en": "Praise of the Buddha (Buddhabhithuti)", "de": "Lobpreisung des Buddha (Buddhabhithuti)"}'::jsonb,
  '{"th": "บทสวดทำวัตรเช้า สรรเสริญพระปัญญาคุณ พระบริสุทธิคุณ พระมหากรุณาคุณ", "en": "Morning Chanting - Praising the virtues of the Buddha", "de": "Morgenandacht - Lobpreis der Tugenden des Erhabenen"}'::jsonb,
  'morning_chant',
  'โย โส ตะถาคะโต อะระหัง สัมมาสัมพุทโธ, วิชชาจะระณะสัมปันโน สุคะโต โลกะวิทู, อะนุตตะโร ปุริสะทัมมะสาระถิ สัตถา เทวะมะนุสสานัง พุทโธ ภะคะวา;',
  'Yo so tathāgato arahaṁ sammāsambuddho, Vijjācaraṇasampanno sugato lokavidū, Anuttaro purisadammasārathi satthā devamanussānaṁ buddho bhagavā;',
  '{"th": "พระตถาคตเจ้านั้น พระองค์ใด เป็นผู้ไกลจากกิเลส ตรัสรู้ชอบได้โดยพระองค์เอง ถึงพร้อมด้วยวิชชาและจรณะ เป็นผู้ไปแล้วด้วยดี เป็นผู้รู้แจ้งโลก เป็นสารถีฝึกบุรุษที่สมควรฝึกได้อย่างไม่มีใครยิ่งกว่า เป็นครูผู้สอนของเทวดาและมนุษย์ทั้งหลาย เป็นผู้รู้ ผู้ตื่น ผู้เบิกบานด้วยธรรม เป็นผู้มีความจำเริญจำแนกธรรมสั่งสอนสัตว์;", "en": "He who is the Tathāgata, the Worthy One, the Fully Enlightened One, Endowed with clear vision and virtuous conduct, Well-gone, Knower of the cosmos, Incomparable guide of people to be tamed, Teacher of devas and human beings, The Awakened One, the Blessed One;", "de": "Jener Tathāgata, der Heilige, der vollkommen Erleuchtete, vollendet in Wissen und Wandel, der Glückhafte, der Weltenkenner, der unvergleichliche Lenker der zu zähmenden Menschen, der Lehrer der Götter und Menschen, der Erwachte, der Erhabene;"}'::jsonb,
  '',
  120,
  2,
  true,
  NOW(),
  NOW()
),
(
  3,
  'karaniya-metta-sutta',
  '{"th": "กรณียเมตตสูตร (บทแผ่เมตตาใหญ่)", "en": "Karaniya Metta Sutta (Discourse on Loving-Kindness)", "de": "Karaniya-Metta-Sutta (Lehrrede von der Liebenden Güte)"}'::jsonb,
  '{"th": "บทสวดเจริญเมตตาภาวนา ปรารถนาให้สรรพสัตว์ทั้งปวงเป็นสุข พ้นจากภัยทั้งปวง", "en": "Cultivating boundless loving-kindness towards all living beings", "de": "Entfaltung grenzenloser liebender Güte gegenüber allen Lebewesen"}'::jsonb,
  'paritta',
  'กะระณียะมัตถะกุสะเลนะ ยันตัง สันตัง ปะทัง อะภิสะเมจจะ: สักโก อุชู จะ สุหุชู จะ สูวะโจ จัสสะ มุทุ อะนะติมานี, สันตุสสะโก จะ สุภะโร จะ อัปปะกิจโจ จะ สัลละหุกะวุตติ, สันตินทริโย จะ นิปะโก จะ อัปปะคัพโภ กุเลสุ อะนะนุคิทโธ;',
  'Karaṇīyamatthakusalena yantaṁ santaṁ padaṁ abhisamecca: Sakko ujū ca suhujū ca sūvaco c''assa mudu anatīmānī, Santussako ca subharo ca appakicco ca sallahukavutti, Santindriyo ca nipako ca appagabbho kulesu ananugiddho;',
  '{"th": "กิจอันใดที่พระอริยเจ้าผู้บรรลุบทอันสงบกระทำแล้ว กุลบุตรผู้ฉลาดในประโยชน์พึงกระทำกิจนั้น: พึงเป็นผู้องอาจ ซื่อตรง ซื่อตรงดี ว่านอนสอนง่าย อ่อนโยน ไม่เย่อหยิ่ง, เป็นผู้สันโดษ เลี้ยงง่าย มีกิจธุระน้อย ประพฤติเบากายเบาจิต, มีอินทรีย์สงบระงับ มีปัญญารักษาตน ไม่คะนอง ไม่ติดพันในตระกูลทั้งหลาย;", "en": "This is what should be done by one who is skilled in goodness and who knows the path of peace: Let them be able and upright, straightforward and gentle in speech, humble and not conceited, contented and easily satisfied, unburdened with duties and frugal in their ways, peaceful and calm, wise and skillful, not proud or demanding in nature.", "de": "Dies sollte von jenem getan werden, der im Guten geübt ist und den Pfad des Friedens kennt: Er sei fähig, aufrichtig, geradlinig, sanft in der Rede, demütig und frei von Hochmut, zufrieden und leicht zu versorgen, unbelastet von Pflichten und bescheiden in seiner Lebensweise, friedvoll und ruhig, weise und geschickt."}'::jsonb,
  '',
  180,
  3,
  true,
  NOW(),
  NOW()
),
(
  4,
  'sabbe-satta',
  '{"th": "บทแผ่เมตตาให้สรรพสัตว์ (สัพเพ สัตตา)", "en": "Universal Loving-Kindness (Sabbe Satta)", "de": "Universelle Liebende Güte (Sabbe Satta)"}'::jsonb,
  '{"th": "บทแผ่เมตตาอุทิศส่วนกุศลหลังการสวดมนต์และทำสมาธิภาวนา", "en": "Dedication of merit and wishing peace for all sentient beings", "de": "Widmung der Verdienste und Friedenswunsch für alle fühlenden Wesen"}'::jsonb,
  'blessing',
  'สัพเพ สัตตา อะเวรา โหนตุ, อัพยาปัชฌา โหนตุ, อะนีฆา โหนตุ, สุขี อัตตานัง ปะริหะรันตุฯ',
  'Sabbe sattā averā hontu, abyāpajjhā hontu, anīghā hontu, sukhī attānaṁ pariharantu.',
  '{"th": "สัตว์ทั้งหลายที่เป็นเพื่อนทุกข์ เกิดแก่เจ็บตาย ด้วยกันหมดทั้งสิ้น, จงเป็นสุขเป็นสุขเถิด อย่าได้มีเวรแก่กันและกันเลย, จงเป็นสุขเป็นสุขเถิด อย่าได้เบียดเบียนซึ่งกันและกันเลย, จงเป็นสุขเป็นสุขเถิด อย่าได้มีความทุกข์กายทุกข์ใจเลย, จงมีความสุขกายสุขใจ รักษาตนให้พ้นจากทุกข์ภัยทั้งสิ้นเถิดฯ", "en": "May all living beings be free from animosity, free from oppression, free from trouble, and may they look after themselves with ease and happiness.", "de": "Mögen alle Wesen frei von Feindseligkeit sein, frei von Unterdrückung, frei von Leid, und mögen sie ihr Leben mit Leichtigkeit und Freude führen."}'::jsonb,
  '',
  60,
  4,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('chantings', 'id'), COALESCE((SELECT MAX(id) FROM chantings), 1));
