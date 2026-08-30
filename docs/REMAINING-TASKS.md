# WAT-PROFILE — สถานะโปรเจค (Project Status & Capabilities)

> เอกสารสรุปสถานะระบบและฟังก์ชันการทำงานทั้งหมดของโปรเจกต์ WAT-PROFILE สำหรับผู้พัฒนาและ AI Agent  
> **อัปเดตล่าสุด:** 2026-08-30 (Production Release Ready)

---

## ✅ ฟีเจอร์ที่พัฒนาเสร็จสมบูรณ์แล้ว 100% (Completed Features)

### 1. ระบบความปลอดภัย สิทธิ์ และการยืนยันตัวตน (Authentication, Security & RBAC)
- **Granular RBAC**: ควบคุมสิทธิ์การเข้าถึงระดับ Resource และ Action อย่างละเอียดผ่าน `PermissionsMap` (JSONB)
- **Admin Session Hardening**: 
  - Token แยกสิทธิ์เด็ดขาด (`aud=admin`) เก็บใน Memory เท่านั้น
  - หมุนเวียน Refresh Session อัตโนมัติ (Single-flight Refresh) ผ่าน HttpOnly Cookie (`wat_admin_refresh`) พร้อมแฮช SHA-256 ฝั่งเซิร์ฟเวอร์
- **Two-Factor Authentication (2FA / TOTP)**: รองรับการตั้งค่า 2FA ด้วย Authenticator App และมีชุดรหัสสำรองฉุกเฉิน (Backup Codes)
- **Public Account Lifecycle**:
  - ระบบสมัครสมาชิกและเข้าสู่ระบบด้วยอีเมล/รหัสผ่าน และ Google OAuth
  - การยืนยันอีเมล (Email Verification), ขอรหัสผ่านใหม่ (Password Reset) และการขอลบข้อมูลส่วนบุคคล (Account Erasure ตาม GDPR/PDPA)
- **Audit Logging**: บันทึกประวัติการกระทำสำคัญในระบบทั้งหมด พร้อมระบบค้นหา กรอง และ Export CSV

### 2. ระบบการจัดการเนื้อหาวัด (Temple Content & Registry)
- **Events & Calendar Platform**:
  - สร้าง/แก้ไขกิจกรรม รองรับ 3 ภาษา (TH/EN/DE) กำหนดหมวดหมู่ และตั้งเวลาเผยแพร่ล่วงหน้า (Scheduled Publishing)
  - กำหนดวันปิดรับสมัคร (Registration Deadline) และจำนวนผู้เข้าร่วมสูงสุด
  - ระบบ Calendar View Transitions และ Calendar Resource Registry (`/admin/calendar/resources`)
- **Monks Directory**: จัดการทำเนียบพระสงฆ์ ประวัติแบบ Rich Text คำนวณพรรษาอัตโนมัติตามวันอุปสมบท และจัดเรียงลำดับ
- **Daily & Weekly Schedules**: ตารางวัตรปฏิบัติประจำวันและกิจกรรมประจำสัปดาห์ พร้อมระบุลิงก์ถ่ายทอดสดออนไลน์
- **Media Library & Recycle Bin**:
  - อัปโหลดรูปภาพสู่ Cloudflare R2 พร้อม Image Crop, Reference Tracking และป้องกันลบรูปที่กำลังถูกใช้งาน
  - ถังขยะกักเก็บรูปภาพ (Media Recycle Bin) เก็บไว้ 30 วันก่อนลบถาวร พร้อมกู้คืนได้ตลอดเวลา
- **Website CMS**: จัดการหน้าเนื้อหา (About, Contact, Privacy, Impressum) ด้วยระบบ Draft / Publish Snapshots

### 3. ระบบการเงิน ใบอนุโมทนาบัตร และรายงาน (Donations & Financials)
- **Donation Records**:
  - ตรวจสอบยอดแจ้งโอนเงินออนไลน์ (Self-Reported Donation) พร้อมหน้าต่างพรีวิวสลิป (Donation Proof Preview)
  - บันทึกยอดบริจาคหน้างานโดยเจ้าหน้าที่ (Staff-Recorded Donation)
  - รองรับหลายสกุลเงิน (EUR, THB, USD, CHF, GBP)
- **Donation Certificate & Signature Presets**:
  - สร้างใบอนุโมทนาบัตรดิจิทัล (PDF/Image Canvas) ส่งออกไฟล์และส่งอีเมลอัตโนมัติ
  - ระบบจัดการลายเซ็นดิจิทัลและตราประทับของวัด (Signature Preset Manager)
- **Financial Statements & Reports**: สรุปยอดบริจาคประจำปีแยกตามหมวดหมู่ พร้อมส่งออกรายงาน CSV สำหรับผู้สอบบัญชี

### 4. ระบบการลงทะเบียนกิจกรรมและเช็คชื่อหน้างาน (Registrations & Attendance)
- **Individual & Group Registrations**: รองรับการสมัครคนเดียวและเป็นกลุ่ม (ครอบครัว/คณะ) พร้อมรหัสจัดการสำหรับ Guest
- **QR Pass & Attendance Scanner**:
  - สร้างบัตรประจำตัวผู้เข้าร่วมกิจกรรมพร้อม QR Code
  - ระบบสแกน QR Code เช็คชื่อผ่านกล้องมือถือหน้างาน (Mobile Attendance Scanner)
  - พิมพ์ใบเช็คชื่อ (Attendance Print Sheet) และ Export รายชื่อเป็น CSV

### 5. ข่าวสาร ประกาศด่วน และการสื่อสาร (News, Alerts & Communications)
- **News & Articles**: บทความข่าวสารประชาสัมพันธ์ 3 ภาษา ปักหมุดข่าวเด่น (Featured Articles) และจัดหมวดหมู่
- **Site Alerts & Announcements**: แถบแจ้งเตือนด้านบน (Banner) และหน้าต่างแจ้งเตือนฉุกเฉิน (Popup) พร้อมระบบจำสถานะ Dismissed
- **Contact Inquiries**: แบบฟอร์มติดต่อสอบถาม พร้อมระบบส่งอีเมลแจ้งเตือนผ่าน Operations Outbox Worker (Resend)

### 6. บทสวดมนต์ดิจิทัล ปฏิทินวันพระ และ AI Chatbot
- **Digital Chanting Book**: หนังสือบทสวดมนต์ดิจิทัล 3 ภาษา พร้อมบาลีอักษรไทย และเครื่องเล่นเสียงสวดมนต์ (Audio Player)
- **Holy Days Calendar**: ปฏิทินวันพระและวันสำคัญทางพระพุทธศาสนา
- **AI Chatbot & Knowledge Base**:
  - ระบบ AI ตอบคำถามเกี่ยวกับวัดและหลักธรรมอัตโนมัติ
  - ป้องกัน Prompt Injection และควบคุม Rate Limiting
  - หน้า Admin จัดการคลังความรู้ (Knowledge Base) สำหรับ AI

### 7. ชุมชนสนทนาธรรม (Community Q&A)
- กระดานถาม-ตอบธรรมะ พร้อมระบบจัดหมวดหมู่, ตัวแก้ไข Rich Text, การโหวต และการแสดงความคิดเห็น
- คำตอบอย่างเป็นทางการ (Official Answer) จากคณะสงฆ์
- ระบบรายงานความไม่เหมาะสม และ Admin Moderation Queue สำหรับตรวจสอบและระงับสิทธิ์สมาชิก

### 8. สถิติ การสำรองข้อมูล และ DevOps (Analytics & Operations)
- **Analytics Hub**: สถิติผู้เข้าชมเว็บไซต์แบบ Anonymized พร้อมกราฟแนวโน้ม, อุปกรณ์, เบราว์เซอร์ และเนื้อหายอดนิยม
- **Database Backup & Snapshots**:
  - สคริปต์สำรองข้อมูลอัตโนมัติขึ้น Cloudflare R2 (ฟรี 100%) พร้อมบันทึก Metadata วันเวลาสำรองล่าสุด
  - ระบบส่งออก Application Snapshot JSON ผ่านหน้า Admin Settings
- **CI/CD & Container**:
  - Dockerfile Multi-stage build รองรับ Go 1.24+ (`golang:1.25.0-alpine`)
  - GitHub Actions CI Workflows สำหรับทดสอบ Backend, Frontend และ Build Docker
  - Test Suite ตรวจสอบความเท่าเทียมของคำแปลภาษา (i18n Parity Test)

---

## 🛠️ โครงสร้างไฟล์สำคัญ

```
WAT-PROFILE/
├── backend/
│   ├── cmd/
│   │   ├── app/main.go                 # API Entry point
│   │   ├── migrate/main.go             # Versioned DB migrations CLI
│   │   ├── seed/main.go                # Essential & demo seed CLI
│   │   ├── operations-worker/main.go   # Background Outbox worker (Email/Retention)
│   │   └── account-retention/main.go   # GDPR/Account cleanup retention
│   ├── internal/
│   │   ├── handlers/                   # HTTP Handlers ครบทุกโมดูล
│   │   ├── models/                     # GORM Models + JSONB MultiLang
│   │   ├── routes/routes.go            # Route Registry + Granular Permissions
│   │   ├── services/                   # Business Logic & Storage
│   │   └── storage/r2.go               # Cloudflare R2 Integration
│   └── migrations/                     # Versioned SQL Migrations (000001 - 000059)
│
├── frontend/src/
│   ├── app/[locale]/
│   │   ├── (client)/                   # Public Website (Home, About, Events, News, Chanting, Community...)
│   │   └── admin/                      # Admin Panel & CMS Pages ทั้งหมด
│   ├── components/
│   │   ├── admin/                      # Shared Admin Components & Guards
│   │   └── ui/                         # Base Primitives (DataTable, Modal, Buttons)
│   ├── features/public/                # Public Domain APIs & Query Hooks
│   ├── services/                       # HTTP Clients (adminApi, api, publicService)
│   └── messages/                       # i18n Translations (th, en, de)
│
├── docs/                               # คู่มือและเอกสารการปฏิบัติการทั้งหมด
│   ├── ADMIN-USER-MANUAL-TH.md         # คู่มือผู้ใช้งานแอดมินฉบับสมบูรณ์ (ภาษาไทย)
│   ├── PRODUCTION_RUNBOOK.md           # คู่มือการติดตั้งและดูแลรักษาระบบ Production
│   ├── DEPLOYMENT_TH.md                # คู่มือการ Deploy แบบทีละขั้นตอน (Vercel/Render/Supabase)
│   ├── DEPLOYMENT.md                   # สเปกทางเทคนิคการ Build & Deployment
│   ├── DATABASE.md                     # กฎและการจัดการฐานข้อมูล Migrations
│   └── REMAINING-TASKS.md              # สถานะระบบ (ไฟล์นี้)
```

---

## ⚙️ แนวทางการปฏิบัติการต่อเนื่อง (Operational Recommendations)

1. **การสำรองข้อมูล (Backup Routine)**: ตรวจสอบ Cron Job สำรองฐานข้อมูลบนเซิร์ฟเวอร์ให้อยู่ในสถานะทำงานสม่ำเสมอ
2. **การเปิดใช้งาน Feature Flags**: เมื่อพร้อมเปิดฟีเจอร์สมาชิกและชุมชน ให้เปิดการทำงานทีละขั้นตามขั้นตอนใน `docs/DEPLOYMENT.md`
3. **การหมุนเวียน Secret Keys**: กำหนดระยะเวลาตรวจสอบและสุ่มเปลี่ยน JWT Secret และ R2 API Tokens ทุก 6-12 เดือน

