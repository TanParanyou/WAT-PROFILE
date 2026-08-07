# Personal Data Requests Design

## Goal

ให้เจ้าหน้าที่รับและดำเนินการ `Personal Data Request` แบบตรวจสอบได้ ครอบคลุม Contact Inquiry, Event Registration, Donation Record และ Member profile/บัญชีผู้ใช้ โดยไม่ลบข้อมูลทันทีและไม่ลบหลักฐานบัญชีโดยไม่มีการตัดสินใจ

## Current state

มี Privacy Policy editor และ Cookie Consent แล้ว แต่ไม่มี request queue, cross-domain search, export package, erasure/anonymization action หรือ case audit สำหรับคำขอของเจ้าของข้อมูล ระบบมีข้อมูลส่วนบุคคลใน Contact, Registration, Donation, Member, User รวมถึง audit/session metadata

## Decisions

- MVP เป็นศูนย์รับคำขอที่เจ้าหน้าที่เปิดและดำเนินการเอง ไม่ทำ automatic retention ใน slice นี้
- ก่อน access/export/erasure ต้องบันทึกการยืนยันตัวตนของผู้ร้องขอ: email verification link หรือการตรวจเอกสาร/ตัวตนต่อหน้าที่บันทึกโดยเจ้าหน้าที่
- ค้นหาด้วย email เป็นจุดเริ่มต้น แต่รองรับ member code และชื่อสำหรับ Member ที่ไม่มี User/email; แสดง candidate พร้อม match basis ให้เจ้าหน้าที่เลือกทีละรายการก่อนดำเนินการ
- รองรับ request types: access/export, correction note และ erasure
- Erasure เป็นการลบหรือ anonymize เฉพาะข้อมูลระบุตัวบุคคลที่อนุญาต โดยเก็บ donation amount, date, receipt number และข้อมูลทางบัญชีที่ policy อนุญาต
- ทุก action ต้องมี reason, actor, timestamp, affected record count และ audit trail
- ขอบเขต retention duration จะเป็น policy configuration ในอนาคต หลังผู้รับผิดชอบบัญชี/กฎหมายยืนยัน ไม่ hard-code ใน MVP

## Data model and service design

เพิ่ม `PersonalDataRequest` สำหรับ subject email, member code, requested type, verification method/status/evidence reference, status (`open`, `verification_pending`, `reviewing`, `completed`, `rejected`), requester note, decision note, created/updated/completed timestamps และ actor IDs เพิ่ม `PersonalDataRequestItem` เพื่อเก็บ domain, record id, match basis, selected action, result และ reason

สร้าง `PersonalDataDiscoveryService` เป็น read-only adapter ต่อ domain services/queries ของ Contact, Registration, Donation, Member และ Account User คืนข้อมูลขั้นต่ำที่ช่วยยืนยันตัวตน ห้ามส่ง password, token, payment proof หรือ secret-bearing audit fields

สร้าง `PersonalDataActionService` ที่รับรายการที่เจ้าหน้าที่เลือกหลัง verification ผ่าน และ operation ที่อนุญาต ใช้ transaction ต่อ database mutation, anonymize ด้วยค่าคงที่ที่ไม่สามารถระบุตัวบุคคล และจัดการ object/บัญชีที่เกี่ยวข้องตาม policy โดยไม่แตะ retention job การลบ object ภายนอก transaction ต้องใช้ outbox/retry record; ห้ามถือว่าการ rollback database กู้ R2 object ได้

## Backend routes and permissions

เพิ่ม Admin routes ใต้ resource `privacy_requests`:

- `GET /admin/privacy-requests`
- `POST /admin/privacy-requests`
- `GET /admin/privacy-requests/:id`
- `POST /admin/privacy-requests/:id/search`
- `POST /admin/privacy-requests/:id/complete`
- `POST /admin/privacy-requests/:id/reject`
- `GET /admin/privacy-requests/:id/export`

ทุก mutation ใช้ PermissionRequired และ audit service; เพิ่ม `privacy_requests` ใน permission catalog, seed roles และ PermissionEditor. export ทำได้เฉพาะ request ที่ verification ผ่าน สร้างไฟล์จาก selected records ผ่าน private, expiring download ไม่รวม credentials, tokens, full IP/user-agent หรือ private donation proof Audit เก็บเพียง request id, action, actor, reason category และ affected count; ห้าม copy PII เข้า `AuditLog.Changes`

## Frontend design

เพิ่มเมนู/route `/admin/privacy-requests` พร้อม list, filters, request form, detail stepper และ result table แยก tabs ตาม domain ให้เจ้าหน้าที่ติ๊ก record ที่ยืนยันแล้ว เลือก export/anonymize และกรอกเหตุผลก่อน confirm ใช้ permission guard, warning สำหรับ donation records และสถานะ success/error ที่อ่านได้ด้วย keyboard/screen reader

## Tests and acceptance

- service tests: discovery across four domains including standalone Member, candidate selection, verified-only export/erasure, donation redaction, rejected request leaves data unchanged, idempotent completion
- handler tests: permission, verification gate, export redaction, invalid selected IDs, repeated completion, audit event without PII
- frontend type-check/lint and state tests for search/select/confirm flows
- acceptance:คำขอที่ยังไม่ verify export/erase ไม่ได้; ค้นหา email เดียวพบ records จากทั้งสี่ domain และค้นหา standalone Member ด้วย member code/name ได้; เจ้าหน้าที่เลือกเฉพาะรายการที่ยืนยัน; export ไม่มี secret/proof; erasure ปิดบัง PII แต่รักษาข้อมูลบัญชีที่ policy อนุญาต; เคสจบแล้วอ่าน audit ได้โดยไม่มี PII ซ้ำใน audit
