# Admin Shared UI Components Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the missing `Textarea` UI component, enhance the `Button` UI component to support a square `icon` size, and refactor all admin pages to achieve 100% shared component usage instead of using raw HTML `<textarea>` and `<button>` elements.

**Architecture:** Create a standard reusable `Textarea` component in the frontend UI directory. Enhance `Button`'s tailwind class mappings with an `icon` size configuration. Refactor each admin view sequentially and verify the compilation of the frontend after each task.

**Tech Stack:** React, Next.js, TailwindCSS, TypeScript, react-hook-form

## Global Constraints

- No raw `<textarea>` tags allowed in admin pages or layout views.
- No raw `<button>` tag actions inside tables/lists allowed.
- All components must preserve existing TypeScript types and function props.

---

### Task 1: Create Textarea Component and Enhance Button Component

**Files:**
- Create: `frontend/src/components/ui/Textarea.tsx`
- Modify: `frontend/src/components/ui/Button.tsx`

**Interfaces:**
- Produces: `Textarea` component matching the form input style.
- Produces: `Button` component supporting `size="icon"`.

- [ ] **Step 1: Create the `Textarea` UI component**
  Write the following content to `frontend/src/components/ui/Textarea.tsx`:
  ```tsx
  "use client";

  import React from "react";
  import { cn } from "@/utils/cn";

  interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
  }

  const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, label, error, id, rows = 4, ...props }, ref) => {
      return (
        <div className="space-y-1">
          {label && (
            <label htmlFor={id} className="text-sm font-medium text-gray-700">
              {label}
            </label>
          )}
          <textarea
            id={id}
            rows={rows}
            className={cn(
              "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400",
              "focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500",
              "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed resize-y",
              error && "border-red-500 focus:ring-red-500/50 focus:border-red-500",
              className
            )}
            ref={ref}
            {...props}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      );
    }
  );

  Textarea.displayName = "Textarea";

  export { Textarea };
  export type { TextareaProps };
  ```

- [ ] **Step 2: Enhance the `Button` component size options**
  Modify `frontend/src/components/ui/Button.tsx` to add `icon` size options:
  Replace lines 7-8 and 25-29 with updated definitions:
  ```diff
  -type ButtonSize = 'sm' | 'md' | 'lg';
  +type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';
  ```
  And `sizeClasses`:
  ```diff
   const sizeClasses: Record<ButtonSize, string> = {
       sm: 'px-3 py-1.5 text-sm',
       md: 'px-4 py-2 text-sm',
       lg: 'px-6 py-2.5 text-base',
+      icon: 'p-1.5 text-sm',
   };
  ```

- [ ] **Step 3: Run static typecheck verification**
  Run: `cd frontend && npx tsc --noEmit`
  Expected: Success with no errors related to the new Textarea component or Button modifications.

- [ ] **Step 4: Commit**
  ```bash
  git add frontend/src/components/ui/Textarea.tsx frontend/src/components/ui/Button.tsx
  git commit -m "feat: add Textarea component and support size=icon in Button"
  ```

---

### Task 2: Refactor Settings Page and Contacts Page Textareas

**Files:**
- Modify: `frontend/src/app/[locale]/admin/settings/page.tsx`
- Modify: `frontend/src/app/[locale]/admin/contacts/page.tsx`

**Interfaces:**
- Consumes: `Textarea` from `@/components/ui/Textarea`
- Consumes: `Button` from `@/components/ui/Button`

- [ ] **Step 1: Refactor settings/page.tsx to use Textarea component**
  Open `frontend/src/app/[locale]/admin/settings/page.tsx`, import `Textarea` from `@/components/ui/Textarea` (replace or add next to other UI imports), and modify `renderInput` for the `textarea` case:
  ```tsx
  import { Textarea } from '@/components/ui/Textarea';
  ```
  Update case `'textarea'`:
  ```tsx
  case 'textarea':
      return (
          <Textarea
              id={setting.key}
              label={setting.key}
              value={val}
              onChange={(e) => handleChange(setting.key, e.target.value)}
              rows={4}
          />
      );
  ```

- [ ] **Step 2: Refactor contacts/page.tsx to use Textarea and Button components**
  Open `frontend/src/app/[locale]/admin/contacts/page.tsx`, import `Textarea` and `Button` (replace raw `<textarea>` and action `<button>` tags):
  ```tsx
  import { Textarea } from "@/components/ui/Textarea";
  import { Button } from "@/components/ui/Button";
  ```
  Update the reply textarea input:
  ```tsx
  <Textarea
    value={replyMessage}
    onChange={(e) => setReplyMessage(e.target.value)}
    rows={4}
    placeholder={t("contacts.replyPlaceholder")}
    label={t("contacts.replyMessage")}
  />
  ```
  And update action cell buttons in the table columns:
  ```tsx
  cell: (_, row) => (
    <div className="flex gap-2">
      <Button
        onClick={() => handleViewReply(row)}
        variant="ghost"
        size="icon"
        title={t("contacts.viewReply")}
      >
        <Eye size={16} />
      </Button>
      <PermissionGuard resource="contacts" action="delete">
        <Button
          onClick={() => handleDelete(row)}
          variant="danger"
          size="icon"
          title={t("common.delete")}
        >
          <Trash2 size={16} />
        </Button>
      </PermissionGuard>
    </div>
  )
  ```

- [ ] **Step 3: Run static typecheck verification**
  Run: `cd frontend && npx tsc --noEmit`
  Expected: PASS

- [ ] **Step 4: Commit**
  ```bash
  git add frontend/src/app/[locale]/admin/settings/page.tsx frontend/src/app/[locale]/admin/contacts/page.tsx
  git commit -m "refactor: replace raw textareas and contact buttons with shared components"
  ```

---

### Task 3: Refactor Action Buttons in Other Admin Pages

**Files:**
- Modify: `frontend/src/app/[locale]/admin/donations/categories/page.tsx`
- Modify: `frontend/src/app/[locale]/admin/donations/page.tsx`
- Modify: `frontend/src/app/[locale]/admin/events/page.tsx`
- Modify: `frontend/src/app/[locale]/admin/gallery/categories/page.tsx`
- Modify: `frontend/src/app/[locale]/admin/gallery/page.tsx`
- Modify: `frontend/src/app/[locale]/admin/members/page.tsx`
- Modify: `frontend/src/app/[locale]/admin/monks/page.tsx`
- Modify: `frontend/src/app/[locale]/admin/registrations/page.tsx`
- Modify: `frontend/src/app/[locale]/admin/roles/page.tsx`
- Modify: `frontend/src/app/[locale]/admin/schedules/page.tsx`
- Modify: `frontend/src/app/[locale]/admin/users/page.tsx`

**Interfaces:**
- Consumes: `Button` from `@/components/ui/Button`

- [ ] **Step 1: Replace raw action buttons in Donations Categories page**
  Modify action buttons in `donations/categories/page.tsx` columns to use `Button` with `size="icon"` and `variant="ghost"` / `variant="danger"`.

- [ ] **Step 2: Replace raw action buttons in Donations list page**
  Modify action buttons in `donations/page.tsx` columns to use `Button` with `size="icon"`.

- [ ] **Step 3: Replace raw action buttons in Events list page**
  Modify action buttons in `events/page.tsx` columns to use `Button` with `size="icon"`.

- [ ] **Step 4: Replace raw action buttons in Gallery Categories page**
  Modify action buttons in `gallery/categories/page.tsx` columns to use `Button` with `size="icon"`.

- [ ] **Step 5: Replace raw action buttons in Gallery list page**
  Modify action buttons in `gallery/page.tsx` columns to use `Button` with `size="icon"`.

- [ ] **Step 6: Replace raw action buttons in Members list page**
  Modify action buttons in `members/page.tsx` columns to use `Button` with `size="icon"`.

- [ ] **Step 7: Replace raw action buttons in Monks list page**
  Modify action buttons in `monks/page.tsx` columns to use `Button` with `size="icon"`.

- [ ] **Step 8: Replace raw action buttons in Registrations list page**
  Modify action buttons in `registrations/page.tsx` columns to use `Button` with `size="icon"`.

- [ ] **Step 9: Replace raw action buttons in Roles list page**
  Modify action buttons in `roles/page.tsx` columns to use `Button` with `size="icon"`.

- [ ] **Step 10: Replace raw action buttons in Schedules list page**
  Modify action buttons in `schedules/page.tsx` columns to use `Button` with `size="icon"`.

- [ ] **Step 11: Replace raw action buttons in Users list page**
  Modify action buttons in `users/page.tsx` columns to use `Button` with `size="icon"`.

- [ ] **Step 12: Verify full compilation**
  Run: `cd frontend && npx tsc --noEmit && npm run build`
  Expected: Success without any typescript compilation errors.

- [ ] **Step 13: Commit**
  ```bash
  git commit -am "refactor: convert all admin table action buttons to shared Button component with icon size"
  ```
