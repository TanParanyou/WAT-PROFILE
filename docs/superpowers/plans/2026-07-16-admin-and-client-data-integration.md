# Admin and Client Data Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** สร้างระบบจัดการหน้า /privacy และ /impressum ใน Admin CMS พร้อมเชื่อมโยงหน้า client (events, monks, gallery, schedules, privacy, impressum) ให้ดึงข้อมูลผ่าน backend API แทน static JSON

**Architecture:** 
1. เพิ่มระบบจัดเก็บข้อมูลของหน้า Privacy และ Impressum เข้ากับโมเดล `ContentPage` (Website CMS) ของระบบ backend โดยการเพิ่ม seed ข้อมูลเริ่มต้น 
2. สร้างหน้า UI ในส่วน `admin/website/privacy` และ `admin/website/impressum` เพื่อให้ Admin จัดการข้อมูลแบบ MultiLang (ภาษา TH, EN, DE)
3. ปรับเปลี่ยนโค้ดฝั่ง Client (Next.js) ให้ดึงข้อมูลจาก dynamic APIs จาก backend แทนการอ่าน static JSON files โดยตรง

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

---

### Task 4: Connect Client Privacy and Impressum to CMS API

**Files:**
- Modify: `frontend/src/app/[locale]/(client)/privacy/page.tsx`
- Modify: `frontend/src/app/[locale]/(client)/impressum/page.tsx`

**Interfaces:**
- Consumes: `websiteCmsPublicService.getPage("privacy")` และ `websiteCmsPublicService.getPage("impressum")`

- [ ] **Step 1: ปรับแต่งหน้า `/privacy/page.tsx` ฝั่ง Client**
  เปลี่ยนจากการอ่านข้อมูลผ่าน i18n JSON hardcoded ไปดึงผ่าน public CMS API
- [ ] **Step 2: ปรับแต่งหน้า `/impressum/page.tsx` ฝั่ง Client**
  ดึงข้อมูล Impressum จาก dynamic API แทนการอ่านจาก static `siteConfig.ts`
- [ ] **Step 3: ตรวจสอบการแสดงผลและการแปลภาษา (TH, EN, DE)**
- [ ] **Step 4: Commit**
  ```bash
  git add frontend/src/app/\[locale\]/\(client\)/privacy/page.tsx frontend/src/app/\[locale\]/\(client\)/impressum/page.tsx
  git commit -m "feat(client): fetch privacy and impressum data from backend CMS"
  ```

---

### Task 5: Link Client Events & Schedules pages with APIs

**Files:**
- Modify: `frontend/src/app/[locale]/(client)/events/EventsContent.tsx`
- Modify: `frontend/src/app/[locale]/(client)/events/[id]/page.tsx`

**Interfaces:**
- Consumes: `eventPublicService` และ `schedulePublicService`

- [ ] **Step 1: ปรับปรุง `EventsContent.tsx` ให้ใช้ fetcher/service**
  เรียกอ่าน list ของ events และ daily/weekly schedules จาก Backend แทนการ import `@/data/events.json` และ `@/data/schedule.json`
- [ ] **Step 2: ปรับปรุง dynamic page `events/[id]/page.tsx`**
  เปลี่ยนให้ไปอ่านข้อมูล Event รายชิ้นด้วย `id` ผ่าน API
- [ ] **Step 3: ตรวจสอบความถูกต้องของ type และการแสดงผลหน้าเพจ**
- [ ] **Step 4: Commit**
  ```bash
  git add frontend/src/app/\[locale\]/\(client\)/events/EventsContent.tsx frontend/src/app/\[locale\]/\(client\)/events/\[id\]/page.tsx
  git commit -m "feat(client): connect events and schedules page to live APIs"
  ```

---

### Task 6: Link Client Monks & Gallery pages with APIs

**Files:**
- Modify: `frontend/src/app/[locale]/(client)/monks/MonksContent.tsx`
- Modify: `frontend/src/app/[locale]/(client)/monks/[id]/page.tsx`
- Modify: `frontend/src/app/[locale]/(client)/gallery/GalleryContent.tsx`

**Interfaces:**
- Consumes: `monkPublicService`, `galleryPublicService`

- [ ] **Step 1: ปรับปรุง `MonksContent.tsx` และ Monk details page**
  เปลี่ยนการนำเข้า `monks.json` ไปเป็นการ fetch ผ่าน backend API ของ monks
- [ ] **Step 2: ปรับปรุง `GalleryContent.tsx` ให้ fetch ข้อมูลรูปภาพและ category**
  แทนที่ `gallery.json` และ `categories.json` ด้วยผลลัพธ์จาก live API
- [ ] **Step 3: ทำการรัน `npm run build` และทดสอบการทำงานของ client page ทั้งหมด**
- [ ] **Step 4: Commit**
  ```bash
  git add frontend/src/app/\[locale\]/\(client\)/monks/MonksContent.tsx frontend/src/app/\[locale\]/\(client\)/gallery/GalleryContent.tsx
  git commit -m "feat(client): connect monks and gallery page to live APIs"
  ```
