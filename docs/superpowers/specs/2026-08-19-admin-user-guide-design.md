# Design Spec: Admin User Guide & Help System (ระบบคู่มือการใช้งานและการช่วยเหลือแอดมิน)

- **Date:** 2026-08-19
- **Status:** Draft / Ready for Review
- **Target Surface:** Protected Admin Panel (`/admin/*`)
- **Primary Audience:** Temple Administrators, Monks, Staff, Finance Officers, and Editors

---

## 1. Executive Summary & Goals

The **Admin User Guide & Help System** provides a comprehensive, interactive, and exportable documentation hub built directly into the WAT-PROFILE Admin Panel. It empowers temple staff and administrators of varying technical backgrounds to confidently perform daily operations, manage website content, verify donations, configure RBAC roles, and operate temple events.

### Key Objectives:
1. **Full Module Coverage:** Provide clear, step-by-step operational workflows for all 21 administrative sections across the 5 core groups (Overview, Website CMS, Operations, Finance & Members, and System & Security).
2. **Dual-Access Workflow:**
   - **Centralized Docs Hub (`/admin/guide` & `/admin/guide/[slug]`):** Full documentation reading view with real-time keyword search, category filtering, table of contents (TOC), and action toolbar.
   - **Contextual Help Drawer (`AdminHelpDrawer`):** Slide-out drawer accessible from any page via the `(?)` help trigger in the header, automatically detecting the active route and displaying instant checklist steps and status legends.
3. **Print & PDF Export Capability:** CSS `@media print` layout and print action allowing administrators to save clean, temple-branded A4 PDF manuals (individual chapters or complete handbook) with crisp vector typography.
4. **Strict Architectural Integrity:**
   - Zero `any` types; all DTOs and guide schemas strictly typed.
   - Zero hardcoded UI strings; 100% localized in Thai (`th`), English (`en`), and German (`de`) across `src/messages/admin/{th,en,de}.json`.
   - Adherence to `ADMIN_DESIGN.md` tokens (`rounded-none`, `bg-admin-surface`, `border-admin-border`, `admin-action`, minimum 44px touch targets).

---

## 2. Architecture & Data Model

### 2.1 File & Directory Structure

```
frontend/
├── src/
│   ├── types/
│   │   └── adminGuide.ts                     # Strict TypeScript interfaces for guide registry
│   ├── data/
│   │   └── admin-guide/
│   │       ├── index.ts                      # Centralized guide registry & route-mapping helpers
│   │       ├── getting-started.ts            # Dashboard, account basics, theme, and language
│   │       ├── website-cms.ts                # About, Contact, Impressum, Privacy, Media
│   │       ├── operations.ts                 # Community, Events, Calendar, Registrations, Schedules, Gallery, Monks
│   │       ├── finance.ts                    # Members, Donations, Contacts, Privacy Requests
│   │       └── system.ts                     # Users, Account Operations, Roles/RBAC, Audit Logs, Settings
│   ├── components/
│   │   └── admin/
│   │       └── guide/
│   │           ├── AdminHelpDrawer.tsx       # Slide-out contextual help drawer
│   │           ├── GuideSearchModal.tsx      # Fast search modal with keyboard shortcut (Ctrl/Cmd + K)
│   │           ├── GuideArticleViewer.tsx    # Step-by-step article reader with TOC & Tips
│   │           ├── GuideCategoryNav.tsx      # Sidebar category navigation
│   │           ├── GuidePrintHeader.tsx      # Temple-branded print header & metadata
│   │           └── GuideQuickLinks.tsx       # Related guides & deep-link cards
│   ├── app/
│   │   └── [locale]/
│   │       └── admin/
│   │           └── guide/
│   │               ├── layout.tsx            # Guide layout with responsive category drawer
│   │               ├── page.tsx              # Docs hub landing page with search & quick start cards
│   │               └── [slug]/
│   │                   └── page.tsx          # Dynamic category/article reader page
│   └── messages/
│       └── admin/
│           ├── th.json                       # Thai UI translation keys
│           ├── en.json                       # English UI translation keys
│           └── de.json                       # German UI translation keys
```

---

### 2.2 TypeScript Type Definitions (`src/types/adminGuide.ts`)

```typescript
import type { PermissionResource } from "@/types/auth";
import type { LucideIcon } from "lucide-react";

export interface MultiLangContent {
  th: string;
  en: string;
  de: string;
}

export type GuideCategory =
  | "getting-started"
  | "website"
  | "operations"
  | "finance"
  | "system";

export interface GuideStep {
  stepNumber: number;
  title: MultiLangContent;
  description: MultiLangContent;
  tip?: MultiLangContent;
  warning?: MultiLangContent;
  codeOrPath?: string;
}

export interface GuideFaqItem {
  question: MultiLangContent;
  answer: MultiLangContent;
}

export interface GuideStatusLegend {
  badgeVariant: "success" | "warning" | "danger" | "info" | "default";
  label: MultiLangContent;
  meaning: MultiLangContent;
}

export interface GuideArticle {
  id: string;
  slug: string;
  category: GuideCategory;
  title: MultiLangContent;
  summary: MultiLangContent;
  iconName: string; // Dynamic or mapped Lucide icon
  resource?: PermissionResource;
  routePath?: string; // e.g. "/admin/donations" for contextual matching
  quickSteps: MultiLangContent[]; // 3-4 bullet points for Help Drawer
  statusLegends?: GuideStatusLegend[];
  steps: GuideStep[];
  faqs?: GuideFaqItem[];
  relatedSlugs?: string[];
  updatedAt: string;
}

export interface GuideCategoryMeta {
  id: GuideCategory;
  title: MultiLangContent;
  description: MultiLangContent;
  iconName: string;
}
```

---

## 3. Detailed Guide Content Scope (All 21 Admin Sections)

The guide registry contains curated operational documentation for every module:

### Group 1: Getting Started (`getting-started`)
1. **Overview & Dashboard (`dashboard`):** Daily metrics interpretation, pending approvals, quick navigation, dark/light theme toggle, and multilingual admin interface.
2. **Account Profile & Security (`profile`):** Changing passwords, updating profile name/avatar, reviewing active session devices.

### Group 2: Website CMS & Content (`website`)
3. **About Temple (`about`):** Editing history, vision, organization chart, and multi-language rich-text narratives.
4. **Contact Information (`contact`):** Managing temple address, opening hours, phone numbers, email, and Google Maps coordinates.
5. **Impressum (`impressum`):** Legal disclosures, authorized representatives, and regulatory compliant notices.
6. **Privacy Policy (`privacy`):** Privacy notice management, cookie consent rules, and data controller disclosures.
7. **Media Library (`media`):** Uploading images/documents, deferred uploads, image cropping, copying public URLs, and restoring items from Recycle Bin.

### Group 3: Temple Operations & Events (`operations`)
8. **Community Forum (`community`):** Moderating public Dharma questions, answering inquiries, pin/hide/delete inappropriate posts.
9. **Events Management (`events`):** Creating events, scheduling dates/times, setting capacity limits, uploading banner images, and publishing status.
10. **Calendar Management (`calendar`):** Monthly and weekly ceremony schedule visualization, conflicting event resolution.
11. **Event Registrations (`registrations`):** Reviewing attendee lists, seat count tracking, checking in attendees, and exporting CSV/Excel.
12. **Daily Schedules (`schedules`):** Managing daily monk routines (morning/evening chanting, alms rounds, meditation, meal times).
13. **Photo Gallery (`gallery`):** Creating albums for merit-making ceremonies, multi-photo batch upload, cover image selection, and reordering.
14. **Monks Directory (`monks`):** Recording monk biographies, ecclesiastical titles (สมณศักดิ์), temple roles, and ordination seniority (พรรษา).

### Group 4: Finance & Members (`finance`)
15. **Members Directory (`members`):** Reviewing member accounts, identity verification status, and account suspension/reactivation.
16. **Donations & Proofs (`donations`):** Verifying bank transfer slips (Donation Proof), changing statuses (Pending / Verified / Rejected), recording donor tax ID, and issuing official e-receipts / donation certificates.
17. **Contact Inquiries (`contacts`):** Managing incoming general inquiries from the public site, updating resolution status (New / In Progress / Resolved).
18. **Privacy & PDPA Requests (`privacy-requests`):** Processing GDPR/PDPA data export and erasure requests within statutory time limits.

### Group 5: System & Security (`system`)
19. **Administrator Users (`users`):** Inviting new staff members, assigning roles, and resetting credentials.
20. **Account Operations (`accounts`):** Monitoring user security logs, force logout on compromised sessions, and password policy enforcement.
21. **Roles & Permissions (`roles`):** Granular RBAC configuration (Create, Read, Update, Delete across resources).
22. **Audit Logs (`audit-logs`):** Inspecting immutable audit trails (who performed what mutation, timestamp, IP address, and payload diff).
23. **System Settings (`settings`):** General system parameters, email SMTP settings, and maintenance mode controls.

---

## 4. UI/UX Specifications & Components

### 4.1 Admin Docs Hub (`/admin/guide` & `/admin/guide/[slug]`)
- **Header & Navigation:**
  - Standard `AdminPageHeader` with breadcrumbs: `[Admin, คู่มือการใช้งาน (User Guide), หมวดหมู่ (Category)]`.
  - Search trigger with shortcut badge `Ctrl + K` / `⌘ + K`.
  - Quick action button: `"🖨️ พิมพ์ / บันทึก PDF"` (triggers clean print styling).
- **Responsive 3-Column Layout:**
  - **Left Rail (Category Navigation):** Grouped by category with active indicators and article counters. Collapsible into a slide-over sheet on mobile.
  - **Center Reading Area (Article Viewer):**
    - Article title, category badge, and last updated date.
    - Summary banner in `bg-admin-surface-muted`.
    - Ordered Step-by-Step cards with numbered pill badges, actionable descriptions, and visual highlight tip boxes (`bg-admin-success-surface` or `bg-admin-warning-surface`).
    - Status Legend Tables (where applicable, e.g. Donations, Inquiries, Registrations).
    - FAQ accordion section.
  - **Right Rail (Table of Contents - TOC):**
    - Sticky on desktop viewport (`position: sticky; top: 5rem;`).
    - Smooth scroll to anchor headings.

### 4.2 Contextual Help Drawer (`AdminHelpDrawer`)
- Mounted globally in `AdminLayout` / `AdminHeader`.
- Triggered by clicking the `(?)` button in `AdminHeader` or `AdminPageHeader`.
- Automatically maps the current browser pathname:
  - `/admin/donations` $\rightarrow$ shows **Donations & Slip Verification** quick guide.
  - `/admin/events` $\rightarrow$ shows **Event Creation & Publishing** quick guide.
  - `/admin/roles` $\rightarrow$ shows **RBAC & Permission Setup** quick guide.
  - Unmapped routes $\rightarrow$ shows **Getting Started** guide.
- **Drawer Contents:**
  - Header: Module title & close button `(✕)`.
  - Quick Action Checklist (3-4 bullet steps).
  - Status Definition badges & meanings.
  - Footer CTA: Full-width button `"📖 เปิดอ่านคู่มือฉบับเต็ม (/admin/guide/...) ↗"`.

### 4.3 PDF Export & Print View (`@media print`)
- Dedicated print stylesheet ensuring:
  - Global Admin sidebar, header, buttons, and drawers are hidden (`display: none !important;`).
  - Background is forced to pure white `#FFFFFF` with ink `#000000` / `#1E293B` for crisp, high-contrast printing.
  - Official temple header with logo, system title, export timestamp, and locale tag.
  - Automatic page-break control (`break-inside: avoid;` on step boxes; `page-break-before: always;` between major chapters).
  - Proper A4 dimensions with standard 15mm margins and page numbers.

---

## 5. Localization (`th`, `en`, `de`)

All UI strings and guide texts are fully defined in `src/messages/admin/{th,en,de}.json` under `"Admin.guide"`:

```json
{
  "Admin": {
    "sidebar": {
      "guide": "คู่มือการใช้งาน"
    },
    "header": {
      "help": "ช่วยเหลือ"
    },
    "guide": {
      "hubTitle": "ศูนย์รวมคู่มือการใช้งานระบบ",
      "hubSubtitle": "คำแนะนำและขั้นตอนการทำงานสำหรับผู้ดูแลระบบและเจ้าหน้าที่วัด",
      "searchPlaceholder": "ค้นหาคู่มือหรือขั้นตอนการทำงาน... (Ctrl+K)",
      "categories": "หมวดหมู่คู่มือ",
      "tableOfContents": "สารบัญในหน้านี้",
      "quickSteps": "ขั้นตอนด่วน",
      "statusLegend": "ความหมายของสถานะ",
      "faqs": "คำถามที่พบบ่อย (FAQ)",
      "relatedGuides": "คู่มือที่เกี่ยวข้อง",
      "exportPdf": "พิมพ์ / บันทึกเป็น PDF",
      "printHandbook": "พิมพ์คู่มือรวมทั้งเล่ม",
      "openFullGuide": "เปิดอ่านคู่มือฉบับเต็ม",
      "lastUpdated": "อัปเดตล่าสุด",
      "noResults": "ไม่พบคู่มือที่ตรงกับคำค้นหา",
      "allArticles": "บทความทั้งหมด",
      "contextHelp": "คำแนะนำเฉพาะหน้างาน",
      "contextHelpSubtitle": "ขั้นตอนแนะนำสำหรับหน้านี้"
    }
  }
}
```

---

## 6. Verification & Quality Checklist

1. **Type Safety:**
   - Run `./node_modules/.bin/tsc --noEmit` to ensure 0 TypeScript errors and 0 instances of `any` or `@ts-ignore`.
2. **Linting & Code Quality:**
   - Run `npm run lint` and verify compliance.
3. **Build Integrity:**
   - Run `npm run build` to verify App Router static generation and route hydration.
4. **Multi-language Verification:**
   - Verify that switching languages (`th`, `en`, `de`) via `AdminLanguageSwitcher` correctly updates the Docs Hub, Help Drawer, and Article texts without untranslated keys.
5. **Print Layout Verification:**
   - Open `/admin/guide/donations`, click **Print / Export PDF**, verify preview displays A4 layout, clean margins, and vector Thai fonts.
6. **Contextual Help Verification:**
   - Navigate to `/admin/donations`, `/admin/events`, `/admin/roles`, `/admin/media` and click `(?)` to verify drawer loads correct module tips.
