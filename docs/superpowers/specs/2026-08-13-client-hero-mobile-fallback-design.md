# Client Hero mobile layout and image fallback

## Scope

ปรับเฉพาะ `HeroSection` ของหน้า client ให้ mobile มีลำดับเนื้อหาและองค์ประกอบใกล้เคียงภาพอ้างอิง โดยไม่เปลี่ยน API contract หรือ CMS data flow

## Design

- Mobile ไม่แสดงภาพ hero จาก API แต่ใช้ line-art ที่มีอยู่เป็น visual anchor ด้านล่างขวา
- ข้อความต้อนรับ, ชื่อวัด, คำอธิบาย และ CTA เรียงตามลำดับการอ่านบนพื้นหลัง public canvas
- Desktop ยังคงแสดงภาพ hero จาก API ในคอลัมน์ด้านขวา
- เมื่อ URL ภาพจาก API ว่างหรือโหลดไม่สำเร็จ ให้ใช้ neutral placeholder SVG ที่สื่อว่าไม่มีภาพ แทน `/images/hero-bg.png` ซึ่งเป็นภาพในโปรเจกต์

## Boundaries

- แก้เฉพาะ `frontend/src/components/home/HeroSection.tsx` และ fallback asset ที่จำเป็น
- ไม่แก้ `PublicHomePageLayout`, backend, API contract หรือข้อมูล CMS
- รักษา locale-aware copy และ accessibility alt text เดิม

## Verification

- รัน frontend lint
- รัน TypeScript type-check
- ตรวจ diff ว่าไม่มีการใช้ภาพโปรเจกต์เป็น fallback ของ HeroSection
