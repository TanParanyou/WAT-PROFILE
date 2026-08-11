# Donation Report Layout and Proof Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the public donation report a stable single-sheet layout and an accessible proof picker that previews images, describes PDFs, and never uploads before final submission.

**Architecture:** React Hook Form remains the single owner of the selected proof. A feature utility validates proof metadata and formats size; a controlled hook owns browser picker, drag state, and object-URL cleanup; a controlled component renders the picker. The existing multipart submit contract remains unchanged.

**Tech Stack:** Next.js 16, React 19, React Hook Form 7, Zod 4, next-intl 4, Tailwind CSS 4, lucide-react, Node `tsx --test`.

## Global Constraints

- Public proof types are PDF, JPEG, PNG, and WebP, maximum 10 MB.
- Proof stays a browser-local `File` until `submitSelfReportedDonation` posts the existing multipart request.
- Do not use Admin media/avatar upload APIs; they are authenticated and cannot accept public private proofs.
- Preserve `th`, `en`, and `de`; all new visible copy belongs to `DonationReportPage` messages.
- Use public role tokens only: square controls, 44px actions, 3px focus outlines, no new shadows or colours.
- Header, orientation rail, form sheet, and submit action share one `max-w-3xl` rail; the uploader outer height does not change after select, replace, or remove.
- Add no dependency.

---

## File Structure

| File | Responsibility |
|---|---|
| `frontend/src/features/public/donations/proof-upload.ts` | Pure proof type/size validation and locale-aware size formatting. |
| `frontend/src/features/public/donations/proof-upload.test.ts` | Direct `tsx` validation and formatting coverage. |
| `frontend/src/features/public/donations/useDonationProofUpload.ts` | Controlled picker, drag/drop, local validation, and object-URL lifecycle. |
| `frontend/src/features/public/donations/DonationProofUpload.tsx` | Stable-height accessible proof picker. |
| `frontend/src/features/public/donations/DonationReportForm.tsx` | One-sheet form layout and RHF `Controller` integration. |
| `frontend/src/app/[locale]/(client)/donate/report/page.tsx` | After-transfer rail and 44px back link. |
| `frontend/src/messages/{th,en,de}.json` | Orientation, picker, preview, replace/remove, and selection-error copy. |

### Task 1: Add testable proof-selection utilities

**Files:**
- Create: `frontend/src/features/public/donations/proof-upload.ts`
- Create: `frontend/src/features/public/donations/proof-upload.test.ts`

**Interfaces:**
- Produces `DonationProofMetadata`, `DONATION_PROOF_TYPES`, `DONATION_PROOF_MAX_BYTES`, `validateDonationProofMetadata`, `isDonationProofImage`, and `formatDonationProofSize`.
- Task 2 consumes `validateDonationProofMetadata(file, messages)` before setting form state.

- [ ] **Step 1: Write the failing utility test.**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { formatDonationProofSize, validateDonationProofMetadata } from "./proof-upload";

const messages = { invalidType: "invalid type", tooLarge: "too large" };

test("proof validation accepts supported files and rejects invalid metadata", () => {
  assert.equal(validateDonationProofMetadata({ type: "image/png", size: 1024 }, messages), null);
  assert.equal(validateDonationProofMetadata({ type: "text/plain", size: 1024 }, messages), "invalid type");
  assert.equal(validateDonationProofMetadata({ type: "application/pdf", size: 10 * 1024 * 1024 + 1 }, messages), "too large");
});

test("proof size uses localized compact formatting", () => {
  assert.equal(formatDonationProofSize(1_572_864, "en"), "1.5 MB");
});
```

- [ ] **Step 2: Run the test to verify it fails.**

Run: `cd frontend && ./node_modules/.bin/tsx --test src/features/public/donations/proof-upload.test.ts`

Expected: FAIL because `proof-upload.ts` does not exist.

- [ ] **Step 3: Implement the pure utility module.**

```ts
export interface DonationProofMetadata { type: string; size: number; }
export interface DonationProofValidationMessages { invalidType: string; tooLarge: string; }

export const DONATION_PROOF_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"] as const;
export const DONATION_PROOF_MAX_BYTES = 10 * 1024 * 1024;

export function validateDonationProofMetadata(file: DonationProofMetadata, messages: DonationProofValidationMessages): string | null {
  if (!DONATION_PROOF_TYPES.includes(file.type as (typeof DONATION_PROOF_TYPES)[number])) return messages.invalidType;
  if (file.size <= 0 || file.size > DONATION_PROOF_MAX_BYTES) return messages.tooLarge;
  return null;
}

export function isDonationProofImage(file: DonationProofMetadata): boolean {
  return file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/webp";
}

export function formatDonationProofSize(bytes: number, locale: string): string {
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(bytes / (1024 * 1024))} MB`;
}
```

- [ ] **Step 4: Run focused verification.**

Run: `cd frontend && ./node_modules/.bin/tsx --test src/features/public/donations/proof-upload.test.ts && ./node_modules/.bin/tsc --noEmit`

Expected: PASS.

- [ ] **Step 5: Commit the utility contract.**

```bash
git add frontend/src/features/public/donations/proof-upload.ts frontend/src/features/public/donations/proof-upload.test.ts
git commit -m "feat: validate donation proof selection"
```

### Task 2: Build the controlled proof-picker hook and component

**Files:**
- Create: `frontend/src/features/public/donations/useDonationProofUpload.ts`
- Create: `frontend/src/features/public/donations/DonationProofUpload.tsx`
- Modify: `frontend/src/messages/th.json`
- Modify: `frontend/src/messages/en.json`
- Modify: `frontend/src/messages/de.json`

**Interfaces:**
- Consumes Task 1 utilities.
- Produces `useDonationProofUpload({ file, onChange, validationMessages })` and `DonationProofUpload`.
- `DonationProofUpload` receives `id`, `file`, `onChange`, `error`, `locale`, and localized messages; it never posts a file.

- [ ] **Step 1: Add message keys in all three locales.**

Add these `DonationReportPage` keys with natural Thai and German translations:

```json
{
  "afterTransfer": "After your transfer",
  "afterTransferHint": "Have your transfer date and proof ready.",
  "categoryLoading": "Loading donation purposes…",
  "proofChoose": "Choose proof",
  "proofDrop": "or drop a file here",
  "proofReplace": "Choose a different file",
  "proofRemove": "Remove file",
  "proofPdf": "PDF document",
  "proofPreviewAlt": "Selected transfer proof preview",
  "proofSelectionInvalidType": "Use a PDF, JPG, PNG, or WebP file.",
  "proofSelectionTooLarge": "The file must be 10 MB or smaller."
}
```

- [ ] **Step 2: Implement the hook.**

```ts
interface UseDonationProofUploadOptions {
  file: File | undefined;
  onChange: (file: File | undefined) => void;
  validationMessages: DonationProofValidationMessages;
}

export function useDonationProofUpload(options: UseDonationProofUploadOptions) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!options.file || !isDonationProofImage(options.file)) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(options.file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [options.file]);

  const selectFile = useCallback((file: File) => {
    const error = validateDonationProofMetadata(file, options.validationMessages);
    if (error) { setSelectionError(error); return; }
    setSelectionError(null);
    options.onChange(file);
  }, [options]);
}
```

Expose `inputRef`, `isDragging`, `selectionError`, `previewUrl`, `selectFile`,
`openPicker`, `onInputChange`, `onDragEnter`, `onDragLeave`, `onDragOver`,
`onDrop`, and `removeFile`. `openPicker` clears the native input value before
clicking it. Track drag depth so crossing child nodes does not flicker the drop
state. `removeFile` clears selection error, invokes `onChange(undefined)`, and
clears the native input value.

- [ ] **Step 3: Implement the stable-height component.**

```tsx
export interface DonationProofUploadProps {
  id: string;
  file: File | undefined;
  error?: string;
  locale: string;
  onChange: (file: File | undefined) => void;
  messages: DonationProofUploadMessages;
}

export function DonationProofUpload({ id, file, error, locale, onChange, messages }: DonationProofUploadProps) {
  const upload = useDonationProofUpload({ file, onChange, validationMessages: { invalidType: messages.invalidType, tooLarge: messages.tooLarge } });
  const message = upload.selectionError ?? error;
  return <div className="min-h-[11rem] border border-site-border bg-site-surface p-4 sm:grid sm:grid-cols-[8rem_minmax(0,1fr)] sm:items-center sm:gap-5" aria-describedby={message ? `${id}-error` : undefined} />;
}
```

Use a visually hidden native input whose `accept` is `DONATION_PROOF_TYPES`, a
visible 44px button, and optional drag/drop. Render a fixed `8rem` preview
cell: image `<img>` includes explicit `width`, `height`, and localized `alt`;
PDF shows `FileText` and the PDF label. Render filename with `min-w-0
break-words`, locale-formatted size, polite selected-file status, and 44px
replace/remove actions. Use outline/background feedback without changing border
width; all icons are `aria-hidden` and actions have localized visible labels.

- [ ] **Step 4: Run targeted lint and type-check.**

Run: `cd frontend && ./node_modules/.bin/eslint src/features/public/donations/useDonationProofUpload.ts src/features/public/donations/DonationProofUpload.tsx && ./node_modules/.bin/tsc --noEmit`

Expected: PASS.

- [ ] **Step 5: Commit the proof picker.**

```bash
git add frontend/src/features/public/donations/useDonationProofUpload.ts frontend/src/features/public/donations/DonationProofUpload.tsx frontend/src/messages/th.json frontend/src/messages/en.json frontend/src/messages/de.json
git commit -m "feat: add donation proof picker"
```

### Task 3: Integrate the picker and normalize the report layout

**Files:**
- Modify: `frontend/src/features/public/donations/DonationReportForm.tsx`
- Modify: `frontend/src/app/[locale]/(client)/donate/report/page.tsx`

**Interfaces:**
- Consumes `DonationProofUpload` through React Hook Form `Controller`.
- Preserves `SelfReportedDonationValues.proof` and final `submitSelfReportedDonation` behavior.
- Produces two semantic fieldsets inside one register sheet.

- [ ] **Step 1: Replace native proof registration with `Controller`.**

```tsx
import { Controller, useForm } from "react-hook-form";
import { DonationProofUpload } from "./DonationProofUpload";

<Controller
  control={control}
  name="proof"
  render={({ field }) => <DonationProofUpload id="donation-proof" file={field.value} locale={locale} error={errorMessage("proof") ?? undefined}
    onChange={(file) => { field.onChange(file); clearErrors("proof"); }}
    messages={{ choose: t("proofChoose"), drop: t("proofDrop"), replace: t("proofReplace"), remove: t("proofRemove"), pdf: t("proofPdf"), previewAlt: t("proofPreviewAlt"), invalidType: t("proofSelectionInvalidType"), tooLarge: t("proofSelectionTooLarge") }} />}
/>
```

Destructure `control` and `clearErrors` from `useForm`. Retain schema and
server error mapping; valid selected files populate `proof`, and the component
only displays local file-selection errors.

- [ ] **Step 2: Convert fieldsets to one continuous sheet.**

```tsx
<form onSubmit={handleSubmit(onSubmit)} noValidate className="border border-site-border bg-site-canvas">
  <fieldset className="grid gap-6 p-6 sm:p-8" aria-labelledby="donation-details-title" />
  <fieldset className="grid gap-6 border-t border-site-border p-6 sm:p-8" aria-labelledby="donor-proof-title" />
  <div className="grid gap-4 border-t border-site-border p-6 sm:p-8" />
</form>
```

Keep amount/currency and date/method as pairs. Set category container to
`md:col-span-2`, use `aria-busy={categoryQuery.isLoading}`, and show
`categoryLoading` while disabled. Set phone container to `md:col-span-2`.
Apply the existing visible focus classes to both checkboxes.

- [ ] **Step 3: Add page orientation and touch-safe back navigation.**

Replace the duplicated page-title eyebrow with `afterTransfer`. Add this rail
between header and form:

```tsx
<div className="mb-8 grid gap-2 border-y border-site-border py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-6">
  <p className="text-sm font-semibold text-site-accent">{t("afterTransfer")}</p>
  <p className="text-sm leading-6 text-site-body">{t("afterTransferHint")}</p>
</div>
```

Give the back link `inline-flex min-h-11 items-center` plus horizontal padding;
retain its visible focus state. Do not add a stepper, gradient, shadow, or new
visual token.

- [ ] **Step 4: Run automated verification.**

Run: `cd frontend && ./node_modules/.bin/tsx --test src/features/public/donations/proof-upload.test.ts && ./node_modules/.bin/tsc --noEmit && ./node_modules/.bin/eslint src/features/public/donations/proof-upload.ts src/features/public/donations/proof-upload.test.ts src/features/public/donations/useDonationProofUpload.ts src/features/public/donations/DonationProofUpload.tsx src/features/public/donations/DonationReportForm.tsx 'src/app/[locale]/(client)/donate/report/page.tsx'`

Expected: PASS.

- [ ] **Step 5: Run browser acceptance.**

At 375px and 1440px in `th`, `en`, and `de`, verify common rail alignment,
category full-row alignment, long German filename wrapping, image/PDF selected
states, local invalid-file rejection, stable uploader height after replace and
remove, visible keyboard focus, and final multipart proof submission.

- [ ] **Step 6: Commit layout integration.**

```bash
git add frontend/src/features/public/donations/DonationReportForm.tsx frontend/src/app/'[locale]'/'(client)'/donate/report/page.tsx
git commit -m "feat: stabilize donation report layout"
```

## Plan Self-Review

- Spec coverage: Tasks 1–3 cover local-only proof handling, preview/PDF metadata, fixed uploader geometry, one-sheet register layout, orientation rail, responsive fields, localization, and keyboard/mobile checks.
- Placeholder scan: every task names exact files, interfaces, commands, code, and commit scope.
- Type consistency: utility functions accept metadata; hook and component use browser `File`; `SelfReportedDonationValues.proof` remains a `File` until final multipart submission.
