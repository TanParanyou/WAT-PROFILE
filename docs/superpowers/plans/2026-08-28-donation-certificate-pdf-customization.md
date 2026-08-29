# Donation Certificate & Receipt PDF Customization & Signature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide an interactive, customizable Donation Certificate (ใบอนุโมทนาบัตร) and Receipt system with central Admin Settings, item-level editing, live A4 preview, digital signature pad, and browser print-to-PDF support for Thai, German, and English.

**Architecture:** 
1. Admin Settings stores global template settings (temple name, tax ID, blessing quotes, signatory name/title, seal & default signature images).
2. Admin Donations page includes a `DonationCertificateModal` featuring a split-view: on the left, an editable form and digital signature pad (Canvas); on the right, a live responsive A4 preview.
3. Print CSS (`@media print`) renders crisp, official A4 certificates with Sarabun & Inter typography, official temple seal, and digital/live signature without browser UI clutter.

**Tech Stack:** Next.js (App Router), TypeScript, Tailwind CSS / CSS Modules, HTML5 Canvas, React Hooks, TanStack Query.

## Global Constraints
- Preserve `th`, `en`, and `de` support.
- No `any`, `as any`, or `@ts-ignore`; use strict TypeScript types.
- Follow existing admin service and settings conventions (`settingsAdminService`, `donationAdminService`).
- Deferred upload / local base64 for live signature pad without generating unnecessary garbage files.
- Print media styling must isolate the document container (`print:block`, `@page { size: A4 portrait; margin: 10mm; }`).

---

### Task 1: Add Certificate Template Settings Tab in Admin Settings

**Files:**
- Modify: `frontend/src/app/[locale]/admin/settings/page.tsx`
- Modify: `frontend/src/types/entities.ts` (if needed for settings type extensions)

**Interfaces:**
- Consumes: `settingsAdminService.getAll()`, `settingsAdminService.updateBatch()`
- Produces: New `certificate` tab in Admin Settings managing:
  - `certificate_org_name_th`, `certificate_org_name_de`, `certificate_org_subtitle`
  - `certificate_tax_number`, `certificate_address`
  - `certificate_blessing_th`, `certificate_blessing_de`
  - `certificate_signatory_name`, `certificate_signatory_title`
  - `certificate_seal_url`, `certificate_signature_url`

- [ ] **Step 1: Update SettingsTab type and state in `frontend/src/app/[locale]/admin/settings/page.tsx`**
Add `"certificate"` to `SettingsTab` union and define initial state and change handlers for certificate fields.

- [ ] **Step 2: Add Certificate Tab UI in Settings Page**
Add the navigation item with `Award` / `FileCheck` icon and render sections:
  1. Organization & Tax Identification (ชื่อวัด, เลขทะเบียนสมาคม/ภาษี)
  2. Blessing & Acknowledgement Quotes (คำอนุโมทนาบุญและขอบคุณ TH/DE)
  3. Signatory Details (ชื่อ-ตำแหน่งผู้มีอำนาจลงนาม)
  4. Official Seal & Default Signature Pickers (`ShellMediaAssetField` with `MediaPickerDialog`)

- [ ] **Step 3: Verify Settings Tab with TypeScript check**
Run: `cd frontend && ./node_modules/.bin/tsc --noEmit`
Expected: PASS with no type errors.

---

### Task 2: Build HTML5 Digital Signature Pad Component

**Files:**
- Create: `frontend/src/app/[locale]/admin/donations/_components/SignaturePad.tsx`

**Interfaces:**
- Props:
  ```typescript
  interface SignaturePadProps {
    value: string | null; // Base64 data URL
    onChange: (dataUrl: string | null) => void;
    label?: string;
    clearButtonText?: string;
    helperText?: string;
  }
  ```

- [ ] **Step 1: Implement `SignaturePad.tsx`**
Create canvas-based drawing component:
  - Handles `onMouseDown`, `onMouseMove`, `onMouseUp`, `onTouchStart`, `onTouchMove`, `onTouchEnd`.
  - Retina / High-DPI canvas scaling (`window.devicePixelRatio`).
  - Smooth line drawing (`lineCap = "round"`, `lineJoin = "round"`).
  - Clear button to reset canvas.
  - Generates PNG Data URL on draw end and triggers `onChange(dataUrl)`.

- [ ] **Step 2: Verify component typing**
Run: `cd frontend && ./node_modules/.bin/tsc --noEmit`
Expected: PASS.

---

### Task 3: Build Interactive Donation Certificate Modal (`DonationCertificateModal.tsx`)

**Files:**
- Create: `frontend/src/app/[locale]/admin/donations/_components/DonationCertificateModal.tsx`

**Interfaces:**
- Props:
  ```typescript
  interface DonationCertificateModalProps {
    isOpen: boolean;
    onClose: () => void;
    donation: Donation | null;
    settings?: Record<string, string>;
    onUpdateDonation?: (id: number, data: Partial<Donation>) => Promise<void>;
  }
  ```

- [ ] **Step 1: Implement `DonationCertificateModal.tsx` split-screen layout**
  - **Left Form Controls:**
    - Donor Name, Address, Donation Date, Amount, Payment Method, Purpose
    - Language Mode: `bilingual` | `th` | `de`
    - Signature Mode: `saved` (uses `certificate_signature_url`) | `pad` (draws live on `SignaturePad`) | `none` (blank line)
  - **Right Live Certificate Sheet:**
    - Beautiful, formal temple certificate layout
    - Organization Header with German Tax Exemption Reference (§ 10b EStG)
    - Formal Certificate Title & Number (e.g. `CERT-2026-XXXX`)
    - Itemized summary table with Thai and German currency wording
    - Blessing quote & official statement
    - Seal image & Signature display (saved image / live canvas stroke / pen line)
    - Place & Date indicator

- [ ] **Step 2: Implement Print Optimization CSS**
Add `@media print` rules ensuring only the certificate container prints, forcing page size A4, zeroing margins, and removing all navigation/modal backdrop elements.

- [ ] **Step 3: Verify TypeScript typing**
Run: `cd frontend && ./node_modules/.bin/tsc --noEmit`
Expected: PASS.

---

### Task 4: Integrate Certificate Modal into Admin Donations Page

**Files:**
- Modify: `frontend/src/app/[locale]/admin/donations/page.tsx`

- [ ] **Step 1: Connect Certificate Action in DataTable and Row Actions**
  - Add state `certificateDonation: Donation | null` and `isCertificateModalOpen: boolean`.
  - Fetch certificate settings via TanStack Query (`queryKey: ["admin", "settings"]`).
  - Add action button `ออกใบอนุโมทนาบัตร` (Certificate Icon) in row actions.
  - Mount `DonationCertificateModal`.

- [ ] **Step 2: Verify Integration**
Run: `cd frontend && ./node_modules/.bin/tsc --noEmit`
Expected: PASS.

---

### Task 5: Verification & Full Build Test

**Files:**
- Test all touched files and build output.

- [ ] **Step 1: Run type check and lint**
Run: `cd frontend && ./node_modules/.bin/tsc --noEmit && npm run lint`

- [ ] **Step 2: Run frontend build**
Run: `make fe-build`

- [ ] **Step 3: Run backend test verification**
Run: `cd backend && go test ./... && go vet ./...`

