# Shared Donation Date Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reuse the existing date-picker interaction in the public donation report while preserving the current date-only API contract and the Admin UI.

**Architecture:** Extend the shared `DatePicker` with a theme-neutral public variant and explicit locale/placeholder props. The public form will remain controlled by React Hook Form and will continue emitting `YYYY-MM-DD`; no donation time field or backend schema change is included.

**Tech Stack:** Next.js App Router, React 19, TypeScript, React Hook Form, Zod, `react-datepicker`, `date-fns`, Tailwind role tokens.

## Global Constraints

- Preserve `th`, `en`, and `de` locale behavior.
- Keep the donation API payload as `donation_date: YYYY-MM-DD`.
- Do not use Admin color tokens in public components.
- Keep 44px touch targets, keyboard focus, mobile layout, and reduced-motion behavior.
- Do not add a time field until the backend contract explicitly supports it.

### Task 1: Make the shared date picker theme-aware

**Files:**
- Modify: `frontend/src/components/ui/DatePicker.tsx`
- Test: `frontend/src/components/ui/DatePicker.test.tsx` (if the existing test setup can execute component tests; otherwise verify through type-check/build)

**Interfaces:**
- Add `variant?: "admin" | "public"` with `admin` as the backward-compatible default.
- Add `locale?: "th" | "en" | "de"` and `placeholder?: string` props.
- Keep `value` and `onChange` as `YYYY-MM-DD` strings.

- [ ] Define variant class maps using existing `admin-*` and `site-*` role tokens.
- [ ] Pass the caller's placeholder and locale-safe display format without changing the emitted value.
- [ ] Keep the existing Admin call sites compiling without changes.

### Task 2: Use the shared picker in the public donation form

**Files:**
- Modify: `frontend/src/features/public/donations/DonationReportForm.tsx`
- Modify: `frontend/src/messages/th.json`
- Modify: `frontend/src/messages/en.json`
- Modify: `frontend/src/messages/de.json`

**Interfaces:**
- `DonationReportForm` supplies `variant="public"`, the active locale, and a localized placeholder to `DatePicker`.
- Form state remains `donation_date` and continues to validate with the existing Zod schema.

- [ ] Replace the native date input with a controlled `DatePicker` through `Controller`.
- [ ] Preserve `aria-invalid`, field error rendering, and focus behavior.
- [ ] Add/verify date-picker placeholder messages in all three public locales.

### Task 3: Verify the date-only contract

**Files:**
- Verify: `frontend/src/features/public/donations/schema.ts`
- Verify: `backend/internal/donations/validation.go`
- Verify: `backend/docs/openapi.yaml`

- [ ] Confirm no `donation_time` field is introduced.
- [ ] Run frontend targeted lint, type-check, production build, and donation tests.
- [ ] Run `git diff --check` and confirm no unrelated files are modified.
