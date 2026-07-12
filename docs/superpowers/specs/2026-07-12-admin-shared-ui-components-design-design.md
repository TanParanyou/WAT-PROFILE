# Design Specification: Admin Shared UI Components Alignment

This specification outlines the design and implementation plan for creating missing UI components and refactoring all admin screens to use shared components, achieving 100% shared component usage and eliminating raw HTML form/action tags.

## Goals
1. **Zero Raw Form Inputs:** Eliminate raw `<textarea>` tags in the admin panel and replace them with a unified shared `<Textarea>` component.
2. **Unified Action Buttons:** Replace raw `<button>` icon tags in list tables with the shared `<Button>` component supporting a new `icon` size.
3. **Consistency:** Ensure uniform visual layout, hover states, disabled states, and error handling across all admin forms.

---

## 1. New Component: `Textarea`

A shared textarea component matching the design language, focus states, and properties of our existing `Input` component.

### File: [Textarea.tsx](file:///Users/syaco/Documents/development/WAT-PROFILE/frontend/src/components/ui/Textarea.tsx)

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

---

## 2. Component Enhancement: `Button`

Extend the current [Button.tsx](file:///Users/syaco/Documents/development/WAT-PROFILE/frontend/src/components/ui/Button.tsx) component to support a square, compact size suitable for inline icon buttons in data tables.

### Modifications in `Button.tsx`
- Add `'icon'` to the `ButtonSize` type.
- Add `icon: 'p-1.5 text-sm'` mapping inside `sizeClasses`.
- Match focus ring and border styles dynamically.

---

## 3. Refactoring Plan

We will replace all instances of raw `<textarea>` and table action `<button>` elements with their shared counterparts.

### Section A: Textareas
- **Settings Page:** [settings/page.tsx](file:///Users/syaco/Documents/development/WAT-PROFILE/frontend/src/app/%5Blocale%5D/admin/settings/page.tsx)
  Replace the textarea block in `renderInput` with the new `<Textarea>` component.
- **Contacts Page:** [contacts/page.tsx](file:///Users/syaco/Documents/development/WAT-PROFILE/frontend/src/app/%5Blocale%5D/admin/contacts/page.tsx)
  Replace the reply field `<textarea>` with the new `<Textarea>` component.

### Section B: Icon Action Buttons
Replace raw `<button>` actions inside the columns list in:
- [contacts/page.tsx](file:///Users/syaco/Documents/development/WAT-PROFILE/frontend/src/app/%5Blocale%5D/admin/contacts/page.tsx)
- [donations/categories/page.tsx](file:///Users/syaco/Documents/development/WAT-PROFILE/frontend/src/app/%5Blocale%5D/admin/donations/categories/page.tsx)
- [donations/page.tsx](file:///Users/syaco/Documents/development/WAT-PROFILE/frontend/src/app/%5Blocale%5D/admin/donations/page.tsx)
- [events/page.tsx](file:///Users/syaco/Documents/development/WAT-PROFILE/frontend/src/app/%5Blocale%5D/admin/events/page.tsx)
- [gallery/categories/page.tsx](file:///Users/syaco/Documents/development/WAT-PROFILE/frontend/src/app/%5Blocale%5D/admin/gallery/categories/page.tsx)
- [gallery/page.tsx](file:///Users/syaco/Documents/development/WAT-PROFILE/frontend/src/app/%5Blocale%5D/admin/gallery/page.tsx)
- [members/page.tsx](file:///Users/syaco/Documents/development/WAT-PROFILE/frontend/src/app/%5Blocale%5D/admin/members/page.tsx)
- [monks/page.tsx](file:///Users/syaco/Documents/development/WAT-PROFILE/frontend/src/app/%5Blocale%5D/admin/monks/page.tsx)
- [registrations/page.tsx](file:///Users/syaco/Documents/development/WAT-PROFILE/frontend/src/app/%5Blocale%5D/admin/registrations/page.tsx)
- [roles/page.tsx](file:///Users/syaco/Documents/development/WAT-PROFILE/frontend/src/app/%5Blocale%5D/admin/roles/page.tsx)
- [schedules/page.tsx](file:///Users/syaco/Documents/development/WAT-PROFILE/frontend/src/app/%5Blocale%5D/admin/schedules/page.tsx)
- [users/page.tsx](file:///Users/syaco/Documents/development/WAT-PROFILE/frontend/src/app/%5Blocale%5D/admin/users/page.tsx)

All the above pages will use `<Button size="icon" variant="ghost">` (or `variant="danger"` for deletes) to enforce consistent paddings, borders, hover/focus rings, and disabled behaviors.

---

## 4. Verification Plan

1. **Static Build Check:** Run `npm run build` inside `frontend/` to confirm that all TypeScript types, exports, and imports compile cleanly.
2. **Visual Inspection:** Verify that textareas look consistent with regular text inputs. Check that icon action buttons in table rows are properly aligned and respond correctly to focus/hover styles.
