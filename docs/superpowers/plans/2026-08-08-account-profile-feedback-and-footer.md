# Account Profile Feedback and Footer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep account-management pages focused and place profile save feedback next to its recovery actions.

**Architecture:** The existing account navigation module will provide a pure route predicate used by the public footer to omit marketing content on account routes. The account layout will render a compact legal footer for all account screens. `ProfileForm` will own profile feedback state and render it inside its existing dirty-state action bar, while field-level React Hook Form errors remain next to their controls.

**Tech Stack:** Next.js App Router, React 19, TypeScript, next-intl, React Hook Form, Tailwind CSS 4, node:test.

## Global Constraints

- Apply footer behavior only to `/${locale}/account/*`; retain the Navbar, cookie consent, social links, and structured data.
- Reuse existing `Footer` translations and locale-aware `Link` navigation; do not add message keys.
- Preserve Thai, English, and German output, 44px action targets, visible focus indicators, and existing ARIA feedback semantics.
- Do not change API contracts, validation rules, authentication, or permissions.
- Do not use `any`, `as any`, or `@ts-ignore`.

---

### Task 1: Make account-route chrome testable and compact

**Files:**
- Modify: `frontend/src/features/public/account/accountNavigation.ts`
- Modify: `frontend/src/features/public/account/messages.test.ts`
- Modify: `frontend/src/components/layout/Footer.tsx`
- Create: `frontend/src/features/public/account/components/AccountLegalFooter.tsx`
- Modify: `frontend/src/app/[locale]/(client)/account/layout.tsx`

**Interfaces:**
- Consumes: locale-stripped pathname returned by `usePathname()`.
- Produces: `isAccountPath(pathname: string): boolean`, used to suppress the public marketing footer.
- Produces: `AccountLegalFooter`, rendered by the account route layout.

- [ ] **Step 1: Write the failing route-boundary test**

  In `frontend/src/features/public/account/messages.test.ts`, add the import and test:

  ```ts
  import { buildAccountHref, isAccountPath, parseAccountTab } from "./accountNavigation";

  test("isAccountPath matches only the account route family", () => {
    assert.equal(isAccountPath("/account"), true);
    assert.equal(isAccountPath("/account/login"), true);
    assert.equal(isAccountPath("/account/sessions"), true);
    assert.equal(isAccountPath("/accountant"), false);
    assert.equal(isAccountPath("/events"), false);
  });
  ```

- [ ] **Step 2: Run the focused test and confirm it fails**

  Run from `frontend/`:

  ```bash
  ./node_modules/.bin/tsx --test src/features/public/account/messages.test.ts
  ```

  Expected: FAIL because `isAccountPath` is not exported.

- [ ] **Step 3: Add the route predicate and use it in the full footer**

  Add this pure helper to `accountNavigation.ts`:

  ```ts
  export function isAccountPath(pathname: string): boolean {
    return pathname === "/account" || pathname.startsWith("/account/");
  }
  ```

  In `Footer.tsx`, read the locale-stripped pathname with the existing `usePathname` from `@/navigation`, import `isAccountPath`, and return `null` before constructing menu content when the predicate returns `true`.

- [ ] **Step 4: Add the account-only legal footer**

  Create `AccountLegalFooter.tsx` as a client component using `useTranslations("Footer")` and `Link` from `@/navigation`. Render a narrow, border-top footer containing only existing localized links to `/privacy` and `/impressum`, with the same site-token colors, focus treatment, and 44px minimum touch area.

  Update the account layout to render:

  ```tsx
  <>
    {children}
    <AccountLegalFooter />
  </>
  ```

  This applies the compact legal footer to login, recovery, and authenticated account pages without changing non-account routes.

- [ ] **Step 5: Re-run the focused test and commit**

  Run:

  ```bash
  cd frontend && ./node_modules/.bin/tsx --test src/features/public/account/messages.test.ts
  ```

  Expected: PASS for the account route predicate and existing message/navigation tests.

  Commit:

  ```bash
  git add frontend/src/features/public/account/accountNavigation.ts frontend/src/features/public/account/messages.test.ts frontend/src/components/layout/Footer.tsx frontend/src/features/public/account/components/AccountLegalFooter.tsx frontend/src/app/[locale]/\(client\)/account/layout.tsx
  git commit -m "fix(account): simplify account page footer"
  ```

### Task 2: Co-locate profile feedback with save and discard controls

**Files:**
- Modify: `frontend/src/features/public/account/components/ProfileForm.tsx`

**Interfaces:**
- Consumes: existing React Hook Form errors (`errors.displayName`, `errors.preferredLocale`, `errors.root.server`) and `saved` state.
- Produces: a sticky profile-action bar visible only for a dirty profile form or a profile-level save result.
- Produces: `closeError: string | null`, rendered only in the account-closing security panel.

- [ ] **Step 1: Move profile-level feedback into an explicit feedback block**

  Remove the top-level `errors.root?.server` and `saved` alerts from the outer `space-y-8` container. Define `const hasProfileFeedback = Boolean(errors.root?.server?.message || saved);` and a `profileFeedback` render block beside the form action area that:

  ```tsx
  {errors.root?.server?.message ? (
    <div role="alert" aria-live="polite" className="flex items-start gap-2 border border-red-700 bg-red-50 p-3 text-sm text-red-700">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <span>{errors.root.server.message}</span>
    </div>
  ) : saved ? (
    <div role="status" aria-live="polite" className="flex items-start gap-2 border border-emerald-700 bg-emerald-50 p-3 text-sm text-emerald-700">
      <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <span>{t("account.saved")}</span>
    </div>
  ) : null}
  ```

  Keep field errors in their existing `AccountField` positions and leave the server-error mapping and `shouldFocus: true` behavior unchanged.

- [ ] **Step 2: Keep account-closing feedback in the Security panel and make profile feedback tab-aware**

  Add `const [closeError, setCloseError] = useState<string | null>(null);`. In `handleClose`, replace the current `setError("root.server", ...)` with `setCloseError(...)`, clear it when beginning or cancelling the close confirmation, and render it as `role="alert"` directly above the closing controls. This prevents a close-account error from being shown in the profile save bar.

  On tab changes, call `clearErrors("root.server")` and `setSaved(false)` before navigation so a save result from Profile or Preferences does not appear in Security. Keep the existing `handleDiscard` behavior, which clears all form feedback after resetting values.

- [ ] **Step 3: Replace the bottom dirty box with a sticky action bar**

  Replace the existing `isDirty` conditional with a condition that renders when `isDirty || hasProfileFeedback`. Use a wrapper with `sticky bottom-0 z-40 border-t border-site-border bg-site-canvas/95 p-4 backdrop-blur-sm` and ensure the feedback block sits directly above its action row. Preserve the current discard and submit handlers, loading spinner, disabled submit behavior, primary/secondary styles, and mobile-first stacked layout.

  When the form is clean after a successful save, show the success block with a single dismiss control only if a control is needed to close it; otherwise clear `saved` when the tab changes or the next form interaction makes the feedback stale. Do not render save/discard buttons for a clean form.

- [ ] **Step 4: Verify profile flows manually**

  Run the frontend dev server and check `/th/account?tab=profile` at mobile and desktop widths:

  ```bash
  cd frontend && npm run dev
  ```

  Verify: invalid display name renders next to its input and receives focus; API-level error renders next to the save controls; save result announces success; discard clears feedback; tab switching clears profile feedback; sticky bar stays visible and does not cover focused inputs; keyboard focus rings remain visible.

- [ ] **Step 5: Run static checks and commit**

  Run from `frontend/`:

  ```bash
  npm run lint
  ./node_modules/.bin/tsc --noEmit
  npm run build
  ```

  Expected: all commands exit successfully.

  Commit:

  ```bash
  git add frontend/src/features/public/account/components/ProfileForm.tsx
  git commit -m "fix(account): align profile feedback with save actions"
  ```

## Plan self-review

- Spec coverage: Task 1 hides the full public footer on every account route and supplies the compact legal replacement; Task 2 co-locates profile-level feedback and save actions while retaining field-level accessibility and focus behavior.
- Placeholder scan: no unresolved requirements or deferred behavior.
- Type consistency: `isAccountPath(pathname: string): boolean` is defined before its sole component consumer; profile feedback remains derived from existing typed React Hook Form state.
