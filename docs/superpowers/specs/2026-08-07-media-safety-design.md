# Media Safety Design

## Goal

ให้เจ้าหน้าที่ลบ Media ได้หลังเห็นผลกระทบอย่างชัดเจน และกู้คืนไฟล์ที่ลบผิดได้ภายใน 30 วัน โดยไม่ทำให้หน้าเว็บที่อ้างอิงไฟล์นั้นเสีย

## Current state

Admin Media Library อัปโหลด ค้นหา แก้ metadata และลบ `Media` ได้ แต่ `DELETE /admin/media/:id` ลบ record ทันที และยังไม่มี endpoint สำหรับค้นหา reference, restore หรือ trash การใช้งาน public content หลายจุดเก็บ URL เป็น string เช่น Event, Gallery, Monk, Member และ Website CMS sections

## Decisions

- การกดลบจาก Media Library คือ soft delete: ซ่อนจากรายการปกติแต่ยังเก็บ object ใน R2 ไว้เพื่อกู้คืน
- หน้าคำเตือนต้องแสดง reference ที่ระบบหาได้ พร้อมชนิดและรายการที่เกี่ยวข้อง
- เจ้าหน้าที่กดยืนยันได้แม้ไฟล์ยังถูกใช้งาน แต่ต้องยืนยันซ้ำใน dialog เดียวกัน
- ไฟล์ที่ลบอยู่ใน `Media Recycle Bin` 30 วัน และ restore ได้ในช่วงนั้น
- หลังครบกำหนดให้ retention job purge ได้เฉพาะ Media ที่ไม่มี active reference; รายการที่ยังถูกอ้างอิงต้องขึ้นสถานะ `purge blocked` จนกว่าเจ้าหน้าที่จะแทนที่ reference หรือลบถาวรด้วยตนเอง
- รายการ Media ปกติไม่รวมไฟล์ที่ถูกลบ ส่วน trash ใช้สิทธิ์ resource `gallery` action `read/update/delete` ตามการกระทำ

## Backend design

เพิ่ม field ใน `models.Media` และ migration ใหม่:

- `deleted_at *time.Time`
- `deleted_by_id *uuid.UUID`
- `purge_at *time.Time`
- `alt_texts models.MultiLangText`

ย้าย `alt_text` เดิมไปที่ `alt_texts.th` ใน migration และให้ `en`/`de` ว่างเพื่อให้รายการ quality check ระบุสิ่งที่ต้องแปลชัดเจน หลัง migration ใช้ `alt_texts` เป็น source of truth เดียว

แยก service สำหรับ reference lookup ที่รับ `media.URL` และคืน `{kind, id, label, href}` จาก known references: Event, Gallery, Monk, Member avatar และ Website CMS page/section JSONB. ให้ query นี้เป็น read-only และอย่าให้ handler เปิด GORM โดยตรง

เพิ่ม route ใน `internal/routes/routes.go`:

- `GET /admin/media/:id/references`
- `GET /admin/media/trash`
- `POST /admin/media/:id/restore`
- เปลี่ยน `DELETE /admin/media/:id` เป็น soft delete
- `POST /admin/media/:id/purge` สำหรับการลบถาวรที่ต้องยืนยันอีกชั้น

เพิ่ม service/command สำหรับ purge รายการที่ `purge_at <= now` และไม่มี active reference โดยลบ R2 ผ่าน `internal/storage.R2Service.DeleteFile` แล้วลบ database record เฉพาะเมื่อ object cleanup สำเร็จหรือ object ไม่พบ งานต้อง batch ได้และ retry ได้ รายการที่มี reference ต้องไม่ถูก purge อัตโนมัติ; permanent delete จาก Admin ต้องแสดง reference เดิมและยืนยันว่าลิงก์ public ที่ใช้ URL นั้นจะเสีย

## Frontend design

ขยาย `mediaService` และ `MediaDetailsSidebar` ให้โหลด references เมื่อเลือกไฟล์ แสดงสถานะใช้งาน และเปิด confirmation ที่บอกว่าการย้ายเข้าถังขยะจะซ่อนไฟล์จาก Library แต่ reference เดิมยังทำงานได้ระหว่างช่วงกู้คืน เพิ่มแท็บ/ตัวกรอง Trash, Restore, Permanent Delete และ `purge blocked` ใน `admin/media/page.tsx` โดยใช้ query invalidation แทน refetch กระจาย

เพิ่ม Media quality filter สำหรับ `alt_texts` ที่ขาดภาษา th/en/de ต้องเพิ่มข้อความใน admin messages ทั้ง `th`, `en`, `de` และคง target 44px, keyboard focus, loading/error/empty states

## Tests and acceptance

- service tests: normal list excludes deleted, reference lookup returns every known source, soft delete sets purge date, restore clears deletion fields, purge is idempotent and skips referenced media, migration preserves legacy Thai alt text
- handler tests: permission, invalid UUID, missing media, and response envelope for all new routes
- frontend type-check/lint and component tests where runnerรองรับ
- acceptance: ลบรูปที่ใช้ใน Event และ CMS แล้วเห็นสอง references, กู้คืนแล้วรูปกลับมา, trash ไม่ปนรายการปกติ, purge ไม่ลบ record ที่ยังไม่ครบ 30 วันหรือยังมี reference, permanent delete ต้องยืนยันผลกระทบ และ quality filter ระบุ alt text ที่ขาดภาษาได้
