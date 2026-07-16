# Admin Data Integration Implementation Plan (Admin Only)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** สร้างระบบจัดการหน้า /privacy และ /impressum ใน Admin CMS โดยเพิ่มข้อมูลเริ่มต้นในฐานข้อมูลหลังบ้านและสร้างหน้า UI ให้ Admin จัดการข้อมูลได้

**Architecture:** 
1. เพิ่มระบบจัดเก็บข้อมูลของหน้า Privacy และ Impressum เข้ากับโมเดล `ContentPage` (Website CMS) ของระบบ backend โดยการเพิ่ม seed ข้อมูลเริ่มต้น 
2. สร้างหน้า UI ในส่วน `admin/website/privacy` และ `admin/website/impressum` เพื่อให้ Admin จัดการข้อมูลแบบ MultiLang (ภาษา TH, EN, DE)

**Tech Stack:** Go (Fiber, GORM, PostgreSQL), Next.js 14 (App Router, TypeScript), TanStack Query, React Hook Form, Zod

## Global Constraints

- ตอบกลับ owner เป็นภาษาไทยเสมอ
- ทุกการแก้ไข UI ฟอร์มในฝั่ง Admin ต้องเป็นไปตามแนวทาง `AGENTS.md` (ใช้ `AdminPageHeader`, `MultiLangInput` ตามคุณสมบัติที่มี ไม่ใช้ props ที่ไม่มี)
- การบันทึกหรือเปลี่ยนค่าต้องใช้ client hook หรือ state patterns ตามโปรเจค เช่น `useDataTable` หรือ `adminService` เท่านั้น
- ทุกๆ task ต้องรันการตรวจสอบผ่านการทดสอบและการ build (Next.js: `npm run build`, Go: `go build ./...`) เสมอ

---

### Task 1: Backend Database Seed for Privacy & Impressum

**Files:**
- Modify: `backend/cmd/seed/main.go`

**Interfaces:**
- Produces: `ContentPage` data entries สำหรับ `page_key` ที่ชื่อ `"privacy"` และ `"impressum"` ในฐานข้อมูล

- [ ] **Step 1: ค้นหาไฟล์สำหรับทำการ Seed ข้อมูลเริ่มต้น**
  ระบุตำแหน่งไฟล์ระบบ Seeder ของ backend ในโครงการ
- [ ] **Step 2: เขียนโค้ดเพิ่ม seed สำหรับ Privacy และ Impressum**
  เพิ่มข้อมูล `ContentPage` ในฐานข้อมูล:
  ```go
  // สำหรับ privacy
  models.ContentPage{
      PageKey: "privacy",
      Slug: "privacy",
      Title: models.MultiLangText{TH: "นโยบายความเป็นส่วนตัว", EN: "Privacy Policy", DE: "Datenschutzerklärung"},
      Status: models.ContentStatusPublished,
      Body: datatypes.JSON([]byte(`{"last_updated": "2026-07-16", "sections": []}`)),
  }
  // สำหรับ impressum
  models.ContentPage{
      PageKey: "impressum",
      Slug: "impressum",
      Title: models.MultiLangText{TH: "ข้อมูลทางกฎหมาย", EN: "Impressum", DE: "Impressum"},
      Status: models.ContentStatusPublished,
      Body: datatypes.JSON([]byte(`{"organization_name": {"th": "วัดหลวงพ่อใส", "en": "Wat Loung Por Sai", "de": "Wat Loung Por Sai"}, "address": {"th": "เยอรมนี", "en": "Germany", "de": "Deutschland"}}`)),
  }
  ```
- [ ] **Step 3: รันคำสั่ง Seed ข้อมูล**
  ตรวจสอบการทำงานโดยรันคำสั่ง Seed เพื่อให้แน่ใจว่าไม่มี DB Constraints error
- [ ] **Step 4: Commit**
  ```bash
  git add backend/cmd/seed/main.go
  git commit -m "chore(cms): seed privacy and impressum content pages"
  ```

---

### Task 2: Create Admin Privacy Page Editor

**Files:**
- Create: `frontend/src/app/[locale]/admin/website/privacy/page.tsx`
- Create: `frontend/src/components/admin/website/privacy/PrivacyPageEditor.tsx`

**Interfaces:**
- Consumes: `websiteCmsAdminService` สำหรับดึงและอัปเดตข้อมูล ContentPage `"privacy"`

- [ ] **Step 1: สร้างหน้า Route `admin/website/privacy/page.tsx`**
  ```tsx
  import { PrivacyPageEditor } from "@/components/admin/website/privacy/PrivacyPageEditor";
  export default function PrivacyPageRoute() {
    return <PrivacyPageEditor />;
  }
  ```
- [ ] **Step 2: พัฒนาตัวคอมโพเนนต์ `PrivacyPageEditor`**
  ออกแบบฟอร์มที่ให้แอดมินแก้ไขข้อมูล sections ของนโยบายความเป็นส่วนตัวแบบ MultiLang โดยอิงแนวทาง React Hook Form + Zod และมี sticky action bar
- [ ] **Step 3: ตรวจสอบการทำงานของฟอร์มและการส่งข้อมูลไปยัง backend API**
- [ ] **Step 4: Commit**
  ```bash
  git add frontend/src/app/\[locale\]/admin/website/privacy/page.tsx frontend/src/components/admin/website/privacy/PrivacyPageEditor.tsx
  git commit -m "feat(admin): add privacy policy CMS editor"
  ```

---

### Task 3: Create Admin Impressum Page Editor

**Files:**
- Create: `frontend/src/app/[locale]/admin/website/impressum/page.tsx`
- Create: `frontend/src/components/admin/website/impressum/ImpressumPageEditor.tsx`

**Interfaces:**
- Consumes: `websiteCmsAdminService` สำหรับดึงและอัปเดตข้อมูล ContentPage `"impressum"`

- [ ] **Step 1: สร้างหน้า Route `admin/website/impressum/page.tsx`**
  ```tsx
  import { ImpressumPageEditor } from "@/components/admin/website/impressum/ImpressumPageEditor";
  export default function ImpressumPageRoute() {
    return <ImpressumPageEditor />;
  }
  ```
- [ ] **Step 2: พัฒนาตัวคอมโพเนนต์ `ImpressumPageEditor`**
  สร้างฟอร์มสำหรับเก็บค่าที่เป็นโครงสร้างเฉพาะของ Impressum (e.g. organization_name, address, email, phone)
- [ ] **Step 3: ทดสอบการเรียกอ่านข้อมูลและการจัดเก็บลงฐานข้อมูลผ่าน API**
- [ ] **Step 4: Commit**
  ```bash
  git add frontend/src/app/\[locale\]/admin/website/impressum/page.tsx frontend/src/components/admin/website/impressum/ImpressumPageEditor.tsx
  git commit -m "feat(admin): add impressum CMS editor"
  ```
