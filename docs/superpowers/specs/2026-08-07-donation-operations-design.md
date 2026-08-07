# Donation Operations Design

## Goal

รองรับทั้ง `Self-Reported Donation` และ `Staff-Recorded Donation` ตั้งแต่รับข้อมูล ตรวจหลักฐาน ยืนยันยอด ส่งอีเมลตอบรับ ไปจนถึงให้เจ้าหน้าที่ส่งใบเสร็จด้วยตนเอง

## Current state

ระบบมี `Donation` และสถิติ/รายการ Admin แล้ว แต่ public route สำหรับสร้างรายการอยู่ใต้ `/member/donations`; ยังไม่มี public self-report พร้อมไฟล์หลักฐาน, Admin create form, private proof download, หรือ action แยกสำหรับ confirm และ receipt dispatch ระบบมีเลขใบเสร็จและ field `tax_receipt_sent` แต่ไม่มี flow ที่บังคับให้ตรวจยอดก่อนส่ง อีกทั้ง frontend filter ใช้ `verified/rejected` ขัดกับ backend ที่กำหนด `pending/confirmed/cancelled`

## Decisions

- `Self-Reported Donation` ต้องแนบ `Donation Proof` เมื่อช่องทางเป็น bank transfer หรือ PayPal; เงินสดใช้ `Staff-Recorded Donation` และไม่ต้องแนบไฟล์
- ทุก self-report เริ่ม `Pending Donation`
- เจ้าหน้าที่เป็นผู้เปลี่ยนเป็น `Confirmed Donation` หลังตรวจยอดและหลักฐาน
- ระบบส่ง `Donation Acknowledgement` อัตโนมัติหลังรับ self-report สำเร็จ แต่ไม่ถือเป็นใบเสร็จ
- `Receipt Dispatch` เป็น action ที่เจ้าหน้าที่กดเองหลังยืนยันข้อมูลผู้รับและรายการแล้ว
- สถานะ canonical ของ Donation คือ `pending`, `confirmed`, `cancelled`; ห้ามใช้ `verified` หรือ `rejected` ใน UI, API หรือรายงาน
- `Receipt Dispatch` สร้าง PDF ใบเสร็จที่มีเลขใบเสร็จและข้อมูลรายการแบบ immutable แล้วแนบไฟล์นั้นกับอีเมล
- automatic retention ของข้อมูลบริจาคอยู่นอก slice นี้

## Data and storage design

เพิ่ม `source`, `communication_locale`, timestamps/actor fields สำหรับ source, confirmation และ receipt dispatch รวมถึง receipt PDF object key/checksum ใน `Donation` โดยใช้ migration ใหม่และ model ให้ตรงกัน เพิ่ม `DonationProof` แยกจาก `Media` เพื่อไม่ให้สลิปการเงินกลายเป็น public asset: เก็บ donation id, private object key, original filename, MIME, size, checksum, created_at และ deleted_at

เพิ่มความสามารถ private object ใน storage adapter และ endpoint ที่ stream/download proof ผ่าน Admin auth เท่านั้น ห้ามส่ง public URL ของสลิป และลบ object เมื่อ transaction หลัง upload ล้มเหลว

## Backend routes and workflow

เพิ่ม public `POST /public/donations` แบบ multipart, rate limit และ validation ของ locale, email, amount, currency, method และไฟล์หลักฐานตาม MIME/size allowlist ให้สร้าง record + proof แบบ transactional และส่ง acknowledgement หลัง commit

เพิ่ม Admin routes:

- `POST /admin/donations` สำหรับ Staff-Recorded Donation
- `GET /admin/donations/:id/proof` สำหรับดู/ดาวน์โหลดหลักฐาน
- `POST /admin/donations/:id/confirm`
- `POST /admin/donations/:id/send-receipt`

จำกัดการเปลี่ยนสถานะผ่าน service ไม่ให้ `PUT /admin/donations/:id` ข้ามกติกา และแก้ existing frontend filters ให้ใช้ status canonical เดียวกัน Audit ทุก create, confirm, receipt dispatch, delete และ proof access การส่งอีเมลใช้ email sender adapter เดิมพร้อม template `th/en/de`; failure หลัง commit ต้องแสดงสถานะ retry ได้โดยไม่สร้าง receipt PDF หรือ email ซ้ำ

## Frontend design

เพิ่ม public donation form ที่มีช่องทาง, จำนวน, ข้อมูลผู้บริจาค, หมวดหมู่, ขอใบเสร็จ, locale และ proof upload แบบ conditional เพิ่ม Admin create/detail panel, proof preview/download, status timeline และปุ่ม Confirm/Send Receipt ตาม permission

รายการ Admin ต้องแยก `source`, `pending`, `confirmed`, proof state และ receipt state ให้ค้นหาได้ และข้อความทุก key ต้องมีใน `src/messages/admin/{th,en,de}.json` รวมถึง public messages ทั้งสาม locale

## Tests and acceptance

- service tests: source/method validation, pending creation, confirmation transition, duplicate receipt dispatch rejection, proof cleanup on failure
- handler tests: multipart validation, rate limit response, Admin permissions, private proof access
- email/PDF tests: acknowledgement localized, receipt dispatch only after confirmation, PDF contains immutable receipt number/amount/date, retry does not duplicate
- acceptance: visitor submits bank transfer with slip and receives acknowledgement; staff sees pending proof, confirms it, then manually sends a localized PDF receipt; a cash staff record works without proof; unauthorized request cannot fetch proof
