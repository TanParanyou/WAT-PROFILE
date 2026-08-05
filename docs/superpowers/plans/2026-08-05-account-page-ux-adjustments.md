# Account Page UX Adjustments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/th/account` explicit for signed-out visitors, clearer for signed-in visitors, and accessible on mobile without changing API contracts.

**Architecture:** Keep account state in `AccountSessionProvider` and render explicit anonymous, loading, error, and authenticated branches in `ProfileForm`. Keep the account page single-route and flat-styled, but introduce semantic sections. Upgrade `CookieConsent` as a self-contained accessible dialog with focus restoration and reduced-motion support.

**Tech Stack:** Next.js 16 App Router, React 19, strict TypeScript, Tailwind CSS 4, next-intl, TanStack Query, Framer Motion.

## Global Constraints

- Preserve `th`, `en`, and `de` messages and behavior.
- Do not change backend/API contracts.
- Do not use TypeScript `any`, `as any`, or `@ts-ignore`.
- Keep public controls at least 44px high and retain visible keyboard focus.
- Keep account UI flat, square-cornered, and aligned with `DESIGN.md`.
- Do not fetch server data directly from `useEffect`; keep remote data in TanStack Query.
- Run frontend type-check and lint before completion.

## File Map

- Modify `frontend/src/features/public/account/AccountSessionProvider.tsx`: expose account query loading/error state through the existing account context contract.
- Modify `frontend/src/features/public/account/components/ProfileForm.tsx`: render auth gate, grouped authenticated sections, localized locale labels, and correct close-account cancellation.
- Modify `frontend/src/features/public/account/components/SessionList.tsx`: align session action labels and section presentation if needed by the grouping.
- Modify `frontend/src/components/layout/CookieConsent.tsx`: add compact responsive layout and accessible dialog/focus behavior.
- Modify `frontend/src/messages/th.json`, `frontend/src/messages/en.json`, `frontend/src/messages/de.json`: add access-gate, retry, cancel, and locale-label messages.
- Modify `frontend/src/features/public/account/messages.test.ts` or add a focused test beside existing account message tests: assert required keys exist in all locales.

---

### Task 1: Align account session state contract

**Files:**
- Modify: `frontend/src/features/public/account/AccountSessionProvider.tsx`
- Test: `frontend/src/features/public/account/api.test.ts` only if a provider contract test already exists; otherwise verify through TypeScript.

**Interfaces:**
- Produces `AccountSessionValue` fields `status`, `account`, `accountLoading`, `accountError`, `login`, `logout`, and `logoutAll`.
- `accountLoading` mirrors `useAccount(...).isPending`; `accountError` mirrors its error value without duplicating server data.

- [ ] **Step 1: Add query state to the context type and value**

Expose query state next to existing account data:

```tsx
export interface AccountSessionValue {
  status: AccountSessionStatus;
  account: Account | null;
  accountLoading: boolean;
  accountError: unknown;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
}
```

Use `accountQuery.isPending` and `accountQuery.error` in the memoized value. Do not add a second fetch or effect.

- [ ] **Step 2: Run type-check and verify mismatch is resolved**

Run:

```bash
cd frontend && ./node_modules/.bin/tsc --noEmit
```

Expected: no `accountLoading` property error from `ProfileForm`.

- [ ] **Step 3: Commit the contract change**

```bash
git add frontend/src/features/public/account/AccountSessionProvider.tsx
git commit -m "fix: align account session state contract"
```

---

### Task 2: Implement explicit auth gate and grouped account form

**Files:**
- Modify: `frontend/src/features/public/account/components/ProfileForm.tsx`
- Modify: `frontend/src/messages/th.json`
- Modify: `frontend/src/messages/en.json`
- Modify: `frontend/src/messages/de.json`
- Test: `frontend/src/features/public/account/messages.test.ts`

**Interfaces:**
- Consumes `status`, `account`, `accountLoading`, and `accountError` from `useAccountSession()`.
- Produces signed-out access gate and authenticated sections without changing mutation/API signatures.

- [ ] **Step 1: Add complete localized message keys**

Add equivalent keys under `Account.account` in all three locale files:

```json
"accessTitle": "เข้าสู่ระบบเพื่อจัดการบัญชี",
"accessBody": "เข้าสู่ระบบเพื่อแก้ไขโปรไฟล์ ตรวจสอบเซสชัน และจัดการความปลอดภัยของบัญชี",
"loginAction": "เข้าสู่ระบบ",
"registerAction": "สร้างบัญชี",
"retry": "ลองโหลดข้อมูลอีกครั้ง",
"cancel": "ยกเลิก",
"profileSection": "โปรไฟล์",
"languageSection": "ภาษา",
"sessionsSection": "เซสชัน",
"securitySection": "ความปลอดภัย",
"localeThai": "ไทย",
"localeEnglish": "English",
"localeGerman": "Deutsch"
```

Use semantically equivalent translations in `en.json` and `de.json`; keep all keys present in all three files.

- [ ] **Step 2: Replace anonymous fallback with an access gate**

Render expected signed-out state without `role="alert"`:

```tsx
if (status === "anonymous") {
  return (
    <section aria-labelledby="account-access-title" className="space-y-4">
      <div>
        <h2 id="account-access-title" className="font-heading text-xl font-bold text-site-foreground">
          {t("account.accessTitle")}
        </h2>
        <p className="mt-2 text-sm text-site-muted">{t("account.accessBody")}</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/account/login" className={primaryActionClass}>
          {t("account.loginAction")}
        </Link>
        <Link href="/account/register" className={secondaryActionClass}>
          {t("account.registerAction")}
        </Link>
      </div>
    </section>
  );
}
```

Keep loading state before this branch. For authenticated missing/error state, retain `role="alert"`, use `account.loadError`, and add a retry only if the existing query exposes a refetch action through the provider contract; otherwise do not invent a second request path.

- [ ] **Step 3: Add semantic sections without card nesting**

Keep existing controls and mutations, but add headings and section boundaries:

```tsx
<section aria-labelledby="account-profile-title" className="space-y-5">
  <h2 id="account-profile-title" className="font-heading text-xl font-bold text-site-foreground">
    {t("account.profileSection")}
  </h2>
  {/* display name, avatar URL, save */}
</section>

<section aria-labelledby="account-language-title" className="space-y-5 border-t border-site-border pt-6">
  <h2 id="account-language-title" className="font-heading text-lg font-bold text-site-foreground">
    {t("account.languageSection")}
  </h2>
  {/* preferred language and save */}
</section>

<section aria-labelledby="account-sessions-title" className="space-y-4 border-t border-site-border pt-6">
  <h2 id="account-sessions-title" className="font-heading text-lg font-bold text-site-foreground">
    {t("account.sessionsSection")}
  </h2>
  {/* sessions link and logout */}
</section>

<section aria-labelledby="account-security-title" className="space-y-4 border-t border-site-border pt-6">
  <h2 id="account-security-title" className="font-heading text-lg font-bold text-site-foreground">
    {t("account.securitySection")}
  </h2>
  {/* close-account danger zone */}
</section>
```

Do not create decorative cards or nested elevated surfaces. Preserve full-width primary submit on mobile and use natural width on `sm` and above where appropriate.

- [ ] **Step 4: Replace raw locale values and wrong cancellation copy**

Keep option values stable, but localize labels:

```tsx
const localeLabels: Record<AccountLocale, string> = {
  th: t("account.localeThai"),
  en: t("account.localeEnglish"),
  de: t("account.localeGerman"),
};
```

Use `{t("account.cancel")}` for the close-account cancel button, never `t("account.logout")`.

- [ ] **Step 5: Run message tests and type-check**

Run:

```bash
cd frontend && node --test --import tsx src/features/public/account/messages.test.ts
cd frontend && ./node_modules/.bin/tsc --noEmit
```

Expected: message test passes and TypeScript reports no account component errors. If direct TypeScript test import fails due the repository’s known runner limitation, record it and rely on type-check plus existing test conventions.

- [ ] **Step 6: Commit account UX changes**

```bash
git add frontend/src/features/public/account/AccountSessionProvider.tsx frontend/src/features/public/account/components/ProfileForm.tsx frontend/src/messages/th.json frontend/src/messages/en.json frontend/src/messages/de.json frontend/src/features/public/account/messages.test.ts
git commit -m "feat: clarify public account experience"
```

---

### Task 3: Make cookie consent responsive and accessible

**Files:**
- Modify: `frontend/src/components/layout/CookieConsent.tsx`

**Interfaces:**
- Consumes existing `CookieConsent` translations and localStorage consent behavior.
- Produces an accessible, dismissible consent dialog with the same accept/decline/privacy outcomes.

- [ ] **Step 1: Add refs and focus lifecycle**

Use a ref for the dialog and previous focus. When consent becomes visible, focus the dialog container. On close, return focus only when the previously focused element is still connected.

Required shape:

```tsx
const dialogRef = useRef<HTMLDivElement>(null);
const previouslyFocusedRef = useRef<HTMLElement | null>(null);

useEffect(() => {
  if (!isVisible) return;
  previouslyFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  dialogRef.current?.focus();

  return () => {
    if (previouslyFocusedRef.current?.isConnected) previouslyFocusedRef.current.focus();
  };
}, [isVisible]);
```

Use `tabIndex={-1}` on the dialog container. Do not add a focus-trap dependency; the two actions and privacy link can remain in normal tab order.

- [ ] **Step 2: Add dialog semantics and Escape dismissal**

Use `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` pointing to the translated heading. Add a keydown handler that closes only on Escape and persists a safe decline decision through the existing `handleDecline` path.

- [ ] **Step 3: Reduce mobile footprint and honor reduced motion**

Keep desktop max width, but use smaller mobile padding and text spacing. Add a CSS reduced-motion branch for the panel transition; do not animate layout properties beyond the existing panel transform.

- [ ] **Step 4: Run frontend lint and type-check**

Run:

```bash
cd frontend && npm run lint
cd frontend && ./node_modules/.bin/tsc --noEmit
```

Expected: no lint or type errors in `CookieConsent` or account components.

- [ ] **Step 5: Commit cookie consent changes**

```bash
git add frontend/src/components/layout/CookieConsent.tsx
git commit -m "fix: improve cookie consent accessibility"
```

---

### Task 4: Verify live route and regression surface

**Files:**
- Verify: `frontend/src/app/[locale]/(client)/account/page.tsx`
- Verify: `frontend/src/app/[locale]/(client)/account/layout.tsx`
- Verify: `frontend/src/components/layout/CookieConsent.tsx`
- Verify: `frontend/src/features/public/account/components/ProfileForm.tsx`

- [ ] **Step 1: Start or reuse local frontend server**

Use existing local server at `http://localhost:3002` when available. Do not change `.env.local` or enable unrelated auth bypasses.

- [ ] **Step 2: Verify anonymous state in all locales**

Check `/th/account`, `/en/account`, and `/de/account`. Expected: access gate, login action, register action, no red error alert for normal anonymous state.

- [ ] **Step 3: Verify authenticated and destructive states**

With an existing local authenticated session, verify grouped headings, readable locale labels, correct cancel copy, and close-account confirmation. Do not submit destructive close-account action.

- [ ] **Step 4: Verify responsive and keyboard behavior**

Check 390×844 and 1440×900. Expected: consent panel does not dominate mobile viewport, dialog has accessible name, focus enters dialog, Escape dismisses safely, and reduced-motion preference removes transition.

- [ ] **Step 5: Review final diff and report test gap**

Run:

```bash
git diff --check
git diff --stat
```

Report any unavailable authenticated/browser verification separately; do not claim it passed without evidence.
