# Donation Report Form Density Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** ลดความกว้างและความสูงของ public donation report form โดยไม่เพิ่มขั้นตอนหรือเปลี่ยน validation/API

**Architecture:** ปรับ container และ spacing ที่ page/form composition กับ field grouping ใน `DonationReportForm.tsx` เท่านั้น ใช้ shared input components เดิมและคง stable error slots เพื่อไม่ให้ input เด้งเมื่อ validation เปลี่ยน

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, React Hook Form, Zod

## Global Constraints

- รักษา `th`, `en`, `de` และไม่เพิ่ม copy ใหม่
- คง input/touch target อย่างน้อย 44px และ visible focus state
- ไม่ใช้ `any`, ไม่เปลี่ยน API payload หรือ validation contract
- public UI ต้องใช้ role-based `site-*` tokens และไม่มี raw color ใน TSX
- mobile ต้องเป็นหนึ่งคอลัมน์และไม่มี horizontal overflow

---

### Task 1: Tighten public page measure

**Files:**
- Modify: `frontend/src/app/[locale]/(client)/donate/report/page.tsx`
- Modify: `frontend/src/features/public/donations/DonationReportPageContent.tsx`

**Interfaces:**
- Consumes: existing `DonationReportPageContent` and dirty-state callback
- Produces: a narrower page shell and tighter intro rhythm with unchanged links and copy

- [ ] **Step 1: Change the page shell measure**

Change the content wrapper from `max-w-3xl` to `max-w-2xl`; retain responsive page padding and `mx-auto`.

- [ ] **Step 2: Reduce intro rhythm without changing copy**

Change the intro stack from `mb-10 gap-5` to `mb-8 gap-4`, and the hint strip from `mb-10` to `mb-8`; retain the existing border and responsive two-column hint layout.

- [ ] **Step 3: Run TypeScript check**

Run `cd frontend && ./node_modules/.bin/tsc --noEmit`.
Expected: exit 0 with no type errors.

### Task 2: Compact form sections and preserve stable fields

**Files:**
- Modify: `frontend/src/features/public/donations/DonationReportForm.tsx`

**Interfaces:**
- Consumes: existing React Hook Form controls, `DatePicker`, `TimePicker`, and `DonationProofUpload`
- Produces: compact single-page layout with unchanged field names and error mapping

- [ ] **Step 1: Tighten fieldset spacing**

Change section padding from `p-6 sm:p-8` to `p-4 sm:p-6`, section grid gaps from `gap-6` to `gap-4`, and description line-height from `leading-7` to `leading-6`.

- [ ] **Step 2: Reduce section heading scale**

Change both fieldset legends from `text-2xl` to `text-xl`; keep `font-heading`, `text-site-foreground`, and semantic `legend` elements.

- [ ] **Step 3: Preserve grouping and error stability**

Keep the existing `md:grid-cols-2` layout, full-width phone/category/proof rows, 44px `inputClassName`, and all `min-h-*` helper/error slots. Only reduce the grid gap from `gap-6` to `gap-4` so errors cannot cause neighboring controls to resize.

- [ ] **Step 4: Tighten action footer spacing**

Change the final action region from `gap-4 ... p-6 sm:p-8` to `gap-3 ... p-4 sm:p-6`, keeping the submit button at `min-h-12` and the discard/error messages unchanged.

### Task 3: Verify responsive density and commit

**Files:**
- Test: `frontend/src/app/[locale]/(client)/donate/report/page.tsx`
- Test: `frontend/src/features/public/donations/DonationReportForm.tsx`

**Interfaces:**
- Consumes: compact layout from Tasks 1–2
- Produces: verified responsive public donation form

- [ ] **Step 1: Run targeted lint**

Run `cd frontend && ./node_modules/.bin/eslint src/features/public/donations/DonationReportForm.tsx 'src/app/[locale]/(client)/donate/report/page.tsx'`.
Expected: exit 0.

- [ ] **Step 2: Run production build**

Run `cd frontend && NEXT_PUBLIC_API_URL=https://localhost npm run build -- --webpack`.
Expected: exit 0 and route `/{locale}/donate/report` appears in the build output.

- [ ] **Step 3: Review source-level responsive invariants**

Confirm the form contains no fixed width wider than its parent, all grids collapse at mobile, and all controls retain `min-h-11` or `min-h-12`.

- [ ] **Step 4: Commit the density-only change**

Run:

```bash
git add frontend/src/app/[locale]/\(client\)/donate/report/page.tsx frontend/src/features/public/donations/DonationReportForm.tsx frontend/src/features/public/donations/DonationReportPageContent.tsx docs/superpowers/specs/2026-08-11-donation-report-form-density-design.md docs/superpowers/plans/2026-08-11-donation-report-form-density.md
git commit -m "fix: compact donation report form"
```

Expected: only the density/layout files and their design/plan docs are committed.
