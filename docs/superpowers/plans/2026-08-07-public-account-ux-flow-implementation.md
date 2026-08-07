# Public Account Journey UX/Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Execute inline in this repository; do not dispatch subagents.

**Goal:** ทำให้ public Account auth เป็น journey เดียวที่มี page context, navigation, success action และ authenticated account state ต่อเนื่องตั้งแต่ Login ถึง Reopen

**Architecture:** คง route และ backend auth contract เดิมไว้ แล้วแยก shell เป็น `AuthShell` กับ `AccountShell` โดยให้แต่ละ route ส่ง page context ของตัวเอง ใช้ navigation contract กลางสำหรับ deterministic back/return และ sync Account tabs ด้วย URL query `tab`. รวม form feedback และ flow footer เป็น primitives ที่ใช้ร่วมกัน โดยไม่รวมทุก flow เป็น wizard หน้าเดียว

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, `next-intl`, `@/navigation`, Tailwind CSS 4, TanStack Query, existing account API client

## Global Constraints

- ห้ามเพิ่ม login provider หรือเปลี่ยน auth/security semantics ของ backend
- คง route เดิมและรองรับ deep link จาก email/OAuth callback
- ใช้ `@/navigation` สำหรับ locale-aware `Link`, `useRouter` และ `usePathname`
- ห้ามให้ component สร้าง API URL หรือ import Axios; ใช้ `frontend/src/features/public/account/api.ts`
- ทุกข้อความใหม่ต้องมีใน `frontend/src/messages/th.json`, `en.json`, `de.json`
- ใช้ design tokens จาก `DESIGN.md`; ไม่ใส่ raw public colors ใน TSX
- ทุก input ต้องมี label, `name`, `autocomplete`, type ที่ถูกต้อง และ field error แบบ inline
- ทุก async feedback ใช้ `aria-live="polite"`; submit error ต้อง focus ช่องแรกที่ผิด
- ทุก interactive control มี visible focus และ touch target อย่างน้อย 44px
- destructive action ต้องมี confirmation
- รอบนี้ไม่เพิ่ม automated test, integration test, browser E2E, CI หรือ GitHub Actions
- ทุก task ต้องผ่าน type-check และ manual browser check ที่ `3002 → 8082` ตามขอบเขตของ task
- ห้าม stage หรือ commit ไฟล์งานค้างอื่นใน worktree

## File Map

### Create

- `frontend/src/features/public/account/accountNavigation.ts` — route/tab/return contract และ parser กลาง
- `frontend/src/features/public/account/components/AccountPageHeader.tsx` — eyebrow, h1, subtitle และ optional step
- `frontend/src/features/public/account/components/AccountFlowFooter.tsx` — next/back/help actions ของแต่ละ flow
- `frontend/src/features/public/account/components/AuthShell.tsx` — shell สำหรับ anonymous auth และ token routes
- `frontend/src/features/public/account/components/AccountField.tsx` — label/input/error accessibility primitive
- `frontend/src/features/public/account/components/AccountFeedback.tsx` — loading/error/success feedback primitive
- `frontend/src/features/public/account/components/AuthMethodPanel.tsx` — Google/password split และข้อความ “หรือ”

### Modify

- `frontend/src/app/[locale]/(client)/account/layout.tsx`
- `frontend/src/app/[locale]/(client)/account/page.tsx`
- `frontend/src/app/[locale]/(client)/account/login/page.tsx`
- `frontend/src/app/[locale]/(client)/account/register/page.tsx`
- `frontend/src/app/[locale]/(client)/account/forgot-password/page.tsx`
- `frontend/src/app/[locale]/(client)/account/reset-password/page.tsx`
- `frontend/src/app/[locale]/(client)/account/verify-email/page.tsx`
- `frontend/src/app/[locale]/(client)/account/confirm-email-change/page.tsx`
- `frontend/src/app/[locale]/(client)/account/reopen-request/page.tsx`
- `frontend/src/app/[locale]/(client)/account/reopen/page.tsx`
- `frontend/src/app/[locale]/(client)/account/link/page.tsx`
- `frontend/src/app/[locale]/(client)/account/sessions/page.tsx`
- `frontend/src/features/public/account/components/AccountShell.tsx`
- `frontend/src/features/public/account/components/AccountBackButton.tsx`
- `frontend/src/features/public/account/components/AccountTabs.tsx`
- `frontend/src/features/public/account/components/LoginForm.tsx`
- `frontend/src/features/public/account/components/RegisterForm.tsx`
- `frontend/src/features/public/account/components/RecoveryForms.tsx`
- `frontend/src/features/public/account/components/LifecycleForms.tsx`
- `frontend/src/features/public/account/components/LinkAccount.tsx`
- `frontend/src/features/public/account/components/ProfileForm.tsx`
- `frontend/src/features/public/account/components/SessionList.tsx`
- `frontend/src/features/public/account/components/CredentialForms.tsx`
- `frontend/src/features/public/account/components/AccountProviderMethods.tsx`
- `frontend/src/messages/th.json`
- `frontend/src/messages/en.json`
- `frontend/src/messages/de.json`

---

### Task 1: Add account route and navigation contract

**Files:**

- Create: `frontend/src/features/public/account/accountNavigation.ts`
- Modify: `frontend/src/features/public/account/components/AccountBackButton.tsx`

**Interfaces:**

- Produces `AccountTab`, `AccountDestination`, `parseAccountTab`, `buildAccountHref`, and `safeAccountReturnTo` for all later tasks.

- [ ] **Step 1: Define route and tab types**

Add the following contract without importing React or Axios:

```ts
export type AccountTab = "profile" | "preferences" | "security";

export type AccountDestination =
  | "/"
  | "/account"
  | "/account/login"
  | "/account/register"
  | "/account/forgot-password"
  | "/account/reset-password"
  | "/account/verify-email"
  | "/account/reopen-request"
  | "/account/reopen"
  | "/account/confirm-email-change"
  | "/account/link"
  | "/account/sessions"
  | `/account?tab=${AccountTab}`;

const accountTabs: readonly AccountTab[] = ["profile", "preferences", "security"];

export function parseAccountTab(value: string | null): AccountTab {
  return accountTabs.includes(value as AccountTab) ? (value as AccountTab) : "profile";
}

export function buildAccountHref(tab: AccountTab): `/account?tab=${AccountTab}` {
  return `/account?tab=${tab}`;
}
```

- [ ] **Step 2: Add safe internal return parsing**

Implement `safeAccountReturnTo(value: string | null, fallback: AccountDestination): AccountDestination` with these exact rules:

```ts
const allowedAccountPaths = new Set([
  "/account",
  "/account/login",
  "/account/register",
  "/account/forgot-password",
  "/account/verify-email",
  "/account/reopen-request",
  "/account/sessions",
]);

export function safeAccountReturnTo(
  value: string | null,
  fallback: AccountDestination,
): AccountDestination {
  if (!value || value.startsWith("//") || !value.startsWith("/")) return fallback;
  const [pathname, query = ""] = value.split("?", 2);
  if (!allowedAccountPaths.has(pathname)) return fallback;
  if (pathname !== "/account" || query === "") return pathname as AccountDestination;
  const tab = new URLSearchParams(query).get("tab");
  return buildAccountHref(parseAccountTab(tab));
}
```

- [ ] **Step 3: Make the back control a deterministic link**

Change `AccountBackButton` to accept `{ href: AccountDestination; label: string }` and render `Link` with the arrow icon. Remove `usePathname`, `useRouter`, `window.history.length`, and `getAccountBackHref`. Keep the existing focus class and `aria-label={label}`.

- [ ] **Step 4: Type-check the contract**

Run:

```bash
cd frontend && ./node_modules/.bin/tsc --noEmit
```

Expected: PASS; no account route or navigation type errors.

- [ ] **Step 5: Commit the isolated navigation change**

```bash
git add frontend/src/features/public/account/accountNavigation.ts frontend/src/features/public/account/components/AccountBackButton.tsx
git commit -m "refactor(account): centralize journey navigation"
```

---

### Task 2: Split auth and authenticated shells

**Files:**

- Create: `frontend/src/features/public/account/components/AccountPageHeader.tsx`
- Create: `frontend/src/features/public/account/components/AuthShell.tsx`
- Modify: `frontend/src/features/public/account/components/AccountShell.tsx`
- Modify: `frontend/src/app/[locale]/(client)/account/layout.tsx`

**Interfaces:**

- Consumes `AccountDestination` and `AccountBackButton` from Task 1.
- Produces `AccountPageContext` and the `AuthShell`/`AccountShell` composition used by every route page.

- [ ] **Step 1: Define the page context interface**

In `AccountPageHeader.tsx`, add:

```ts
export interface AccountPageContext {
  title: string;
  subtitle: string;
  backHref: AccountDestination;
  backLabel: string;
  eyebrow?: string;
  step?: { current: number; total: number };
}
```

Render one `h1`, optional eyebrow, subtitle, and optional step text. Use `text-wrap: balance` through the existing Tailwind utility or a class in `globals.css`; do not add raw colors.

- [ ] **Step 2: Implement `AuthShell`**

Implement this exact structure:

```tsx
export function AuthShell({
  context,
  children,
  footer,
}: {
  context: AccountPageContext;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-10 pt-28 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <header className="space-y-4">
          <AccountBackButton href={context.backHref} label={context.backLabel} />
          <AccountPageHeader context={context} />
        </header>
        {children}
        {footer ? <footer>{footer}</footer> : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update `AccountShell` to accept context**

Keep the authenticated max width and public tokens, but change its props to `{ context: AccountPageContext; children: ReactNode }`. Render the same header structure as `AuthShell` and do not render a generic `Account` title internally.

- [ ] **Step 4: Turn the account layout into a gate only**

Remove `AccountShell` from `account/layout.tsx`. Keep the feature flag check and return `children` when enabled:

```tsx
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NEXT_PUBLIC_PUBLIC_ACCOUNT_AUTH_ENABLED !== "true") notFound();
  return children;
}
```

- [ ] **Step 5: Type-check and inspect shell rendering**

Run:

```bash
cd frontend && ./node_modules/.bin/tsc --noEmit
```

Expected: PASS. Open `http://localhost:3002/th/account/login` and confirm there is one visible page `h1`, one deterministic back link, and no duplicate generic shell header.

- [ ] **Step 6: Commit the shell boundary**

```bash
git add frontend/src/features/public/account/components/AccountPageHeader.tsx frontend/src/features/public/account/components/AuthShell.tsx frontend/src/features/public/account/components/AccountShell.tsx frontend/src/app/'[locale]'/'(client)'/account/layout.tsx
git commit -m "refactor(account): split auth and account shells"
```

---

### Task 3: Compose every route with explicit page context

**Files:**

- Modify: `frontend/src/app/[locale]/(client)/account/page.tsx`
- Modify: `frontend/src/app/[locale]/(client)/account/login/page.tsx`
- Modify: `frontend/src/app/[locale]/(client)/account/register/page.tsx`
- Modify: `frontend/src/app/[locale]/(client)/account/forgot-password/page.tsx`
- Modify: `frontend/src/app/[locale]/(client)/account/reset-password/page.tsx`
- Modify: `frontend/src/app/[locale]/(client)/account/verify-email/page.tsx`
- Modify: `frontend/src/app/[locale]/(client)/account/confirm-email-change/page.tsx`
- Modify: `frontend/src/app/[locale]/(client)/account/reopen-request/page.tsx`
- Modify: `frontend/src/app/[locale]/(client)/account/reopen/page.tsx`
- Modify: `frontend/src/app/[locale]/(client)/account/link/page.tsx`
- Modify: `frontend/src/app/[locale]/(client)/account/sessions/page.tsx`

**Interfaces:**

- Consumes `AuthShell`, `AccountShell`, `AccountPageContext`, and `AccountDestination` from Tasks 1–2.
- Produces a route-to-context mapping with no generic title fallback.

- [ ] **Step 1: Apply the route context mapping**

Use these exact visible title/subtitle/back destinations, using the existing `Account` translations and new navigation labels:

| Route | Shell | Title key | Subtitle key | Back destination |
|---|---|---|---|---|
| `/account` | `AccountShell` | `account.title` | `account.subtitle` | `/` |
| `/account/login` | `AuthShell` | `login.title` | `login.subtitle` | `/` |
| `/account/register` | `AuthShell` | `register.title` | `register.subtitle` | `/account/login` |
| `/account/forgot-password` | `AuthShell` | `forgotPassword.title` | `forgotPassword.subtitle` | `/account/login` |
| `/account/reset-password` | `AuthShell` | `resetPassword.title` | `resetPassword.subtitle` | `/account/forgot-password` |
| `/account/verify-email` | `AuthShell` | `verifyEmail.title` | `verifyEmail.subtitle` | `/account/login` |
| `/account/confirm-email-change` | `AuthShell` | `confirmEmailChange.title` | `confirmEmailChange.subtitle` | `/account?tab=security` |
| `/account/reopen-request` | `AuthShell` | `reopen.title` | `reopen.subtitle` | `/account/login` |
| `/account/reopen` | `AuthShell` | `reopen.title` | `reopen.subtitle` | `/account/login` |
| `/account/link` | `AccountShell` | `link.title` | `link.subtitle` | `/account?tab=security` |
| `/account/sessions` | `AccountShell` | `sessions.title` | `sessions.subtitle` | `/account?tab=security` |

Each page must call `getTranslations({ locale, namespace: "Account" })` and pass the same values used by `generateMetadata`, so browser-visible context and metadata cannot drift.

- [ ] **Step 2: Remove child-owned duplicate page headers**

Delete only the duplicate page header markup from `SessionList` and `ReopenRequestForm`. Keep section headings inside forms where they describe a subtask. Do not remove status/error headings.

- [ ] **Step 3: Preserve Suspense boundaries**

Keep `Suspense` around components that call `useSearchParams`; put the shell outside the `Suspense` boundary so the page title and back action render immediately.

- [ ] **Step 4: Verify direct navigation**

Open each route in a new tab at locale `th` and confirm:

- one visible `h1` matching the route
- back link reaches the mapped destination from a fresh tab
- token routes render their shell even when the query token is missing

- [ ] **Step 5: Commit route composition**

```bash
git add frontend/src/app/'[locale]'/'(client)'/account
git commit -m "refactor(account): give every route explicit context"
```

---

### Task 4: Centralize auth form fields, feedback, and provider choice

**Files:**

- Create: `frontend/src/features/public/account/components/AccountField.tsx`
- Create: `frontend/src/features/public/account/components/AccountFeedback.tsx`
- Create: `frontend/src/features/public/account/components/AuthMethodPanel.tsx`
- Modify: `frontend/src/features/public/account/components/LoginForm.tsx`
- Modify: `frontend/src/features/public/account/components/RegisterForm.tsx`

**Interfaces:**

- Produces reusable field and feedback components; API calls and existing validation functions remain unchanged.

- [ ] **Step 1: Add `AccountField`**

Implement a field wrapper with this contract:

```tsx
interface AccountFieldProps {
  id: string;
  label: string;
  error?: string | null;
  description?: ReactNode;
  children: ReactNode;
}
```

Render a `label`, `children`, optional description, and error paragraph with deterministic id `${id}-error`, `role="alert"`, and `aria-live="polite"`. The child input remains responsible for `aria-invalid` and `aria-describedby`.

- [ ] **Step 2: Add `AccountFeedback`**

Use a discriminated state:

```ts
type AccountFeedbackState =
  | { kind: "error"; message: string }
  | { kind: "success"; title: string; body: string }
  | { kind: "loading"; message: string };
```

Render error with `role="alert"`, success/loading with `role="status"`, and keep `aria-live="polite"` on asynchronous states.

- [ ] **Step 3: Add `AuthMethodPanel`**

Move the repeated Google button and divider to a component with:

```ts
interface AuthMethodPanelProps {
  googleLabel: string;
  dividerLabel: string;
  loading: boolean;
  onGoogle: () => void;
}
```

Render the Google action first, then a visible divider text, then let the caller render the password form below it.

- [ ] **Step 4: Migrate Login**

Keep `loginAccount` through `useAccountSession().login`. Replace the duplicated input error markup with `AccountField`, group the three auxiliary links under one labelled navigation block, and add a localized `login.linksTitle`. Keep the existing email normalization and field focus behavior.

The Login layout order must be Google → “หรือ” → form → primary submit → auxiliary links.

- [ ] **Step 5: Migrate Register**

Keep `registerAccount`, `startGoogle`, password inspection, and current field mapping. Replace the duplicated Google/divider markup with `AuthMethodPanel` and use `AccountField` for display name, email, and password. Keep password requirements adjacent to the password field.

The register success state must contain only the success feedback plus an explicit verification resend link and a Login CTA, both rendered as 44px-or-larger controls.

- [ ] **Step 6: Verify auth form continuity**

At `http://localhost:3002/th/account/login` and `/register` verify:

- “หรือ” is visible between Google and password auth
- all errors remain inline and first invalid input receives focus
- auxiliary links are grouped and have clear purposes
- success state always offers a next action

- [ ] **Step 7: Commit auth form primitives**

```bash
git add frontend/src/features/public/account/components/AccountField.tsx frontend/src/features/public/account/components/AccountFeedback.tsx frontend/src/features/public/account/components/AuthMethodPanel.tsx frontend/src/features/public/account/components/LoginForm.tsx frontend/src/features/public/account/components/RegisterForm.tsx
git commit -m "refactor(account): unify auth form interactions"
```

---

### Task 5: Complete recovery, verification, reopen, and OAuth callback exits

**Files:**

- Create: `frontend/src/features/public/account/components/AccountFlowFooter.tsx`
- Modify: `frontend/src/features/public/account/components/RecoveryForms.tsx`
- Modify: `frontend/src/features/public/account/components/LifecycleForms.tsx`
- Modify: `frontend/src/features/public/account/components/LinkAccount.tsx`

**Interfaces:**

- Consumes `AccountDestination`, `AccountFeedback`, and `AccountField` from Tasks 1 and 4.
- Produces explicit next/back actions for every terminal flow state.

- [ ] **Step 1: Add `AccountFlowFooter`**

Implement:

```tsx
interface AccountFlowFooterProps {
  primary?: ReactNode;
  secondary?: ReactNode;
  links?: ReactNode;
}
```

Render actions in a vertical mobile stack and horizontal desktop row. Do not make navigation links look like plain body text when they are the next required action.

- [ ] **Step 2: Complete Forgot/Reset states**

In `RecoveryForms.tsx`:

- Forgot success → success feedback + Login primary link
- Forgot validation/server errors → email field error where possible
- Reset missing token → invalid-link feedback + Forgot password link + Login link
- Reset invalid/expired token → invalid-link feedback + request-new-link link + Login link
- Reset success → success feedback + Login primary link

Keep `validatePassword`, `inspectPassword`, and existing API calls unchanged.

- [ ] **Step 3: Complete Verify email states**

Keep automatic verification when `token` exists. For success, show Login CTA. For invalid token, show resend form plus links to Forgot/Login as appropriate. For missing token, show the resend form with a clear explanation that the user can paste the original email.

- [ ] **Step 4: Complete Reopen states**

In `LifecycleForms.tsx`:

- request submitted → success feedback + Login CTA
- confirmation success → account restored feedback + Login CTA
- missing/expired token → invalid-link feedback + Reopen request CTA + Login CTA

Map API errors through `useAccountErrorMessage`; do not expose account existence details.

- [ ] **Step 5: Complete Google link states**

In `LinkAccount.tsx`, keep `confirmGoogleLink` and `adoptCurrentSession`, but make each state actionable:

- approval sent → Login link
- confirming → loading feedback with explanation
- success → Account Security link
- invalid → retry/login link

Do not rely on the 900ms redirect as the only path; keep the visible destination link available.

- [ ] **Step 6: Manual recovery verification**

Use fresh tabs and inspect these transitions:

```text
/account/login → /account/forgot-password → /account/reset-password → /account/login
/account/register → /account/verify-email → /account/login
/account/login → /account/reopen-request → /account/reopen → /account/login
```

Expected: no terminal success or error state without a valid next action.

- [ ] **Step 7: Commit recovery flow changes**

```bash
git add frontend/src/features/public/account/components/AccountFlowFooter.tsx frontend/src/features/public/account/components/RecoveryForms.tsx frontend/src/features/public/account/components/LifecycleForms.tsx frontend/src/features/public/account/components/LinkAccount.tsx
git commit -m "fix(account): make recovery flows actionable"
```

---

### Task 6: Persist Account tabs in the URL

**Files:**

- Modify: `frontend/src/features/public/account/components/AccountTabs.tsx`
- Modify: `frontend/src/features/public/account/components/ProfileForm.tsx`
- Modify: `frontend/src/app/[locale]/(client)/account/page.tsx`

**Interfaces:**

- Consumes `parseAccountTab` and `buildAccountHref` from Task 1.
- Produces stable URLs `/account?tab=profile|preferences|security` and focus movement when the tab changes.

- [ ] **Step 1: Read the initial tab from the URL**

In `ProfileForm`, use `useSearchParams` and initialize the state with `parseAccountTab(searchParams.get("tab"))`. When the query changes, update `activeTab` without resetting the dirty baseline.

- [ ] **Step 2: Write tab changes to the URL**

Use locale-aware router replacement:

```ts
const handleTabChange = (tab: AccountTab): boolean => {
  if (tab === activeTab) return true;
  if (!confirmNavigation()) return false;
  setActiveTab(tab);
  router.replace(buildAccountHref(tab), { scroll: false });
  return true;
};
```

Keep the existing unsaved-change confirmation before changing the URL.

- [ ] **Step 3: Move focus to the active panel**

Give each panel heading a stable id (`account-panel-profile-heading`, `account-panel-preferences-heading`, `account-panel-security-heading`) and `tabIndex={-1}`. After an accepted tab change, call `requestAnimationFrame` and focus the active heading.

- [ ] **Step 4: Keep tab links on external account pages**

Change the Sessions link in `ProfileForm`, Account back link, and OAuth return path to `/account?tab=security`. Invalid or missing tab values must resolve to Profile without throwing.

- [ ] **Step 5: Manual URL verification**

Check:

- loading `/th/account?tab=security` opens Security
- refreshing keeps Security
- opening the URL in a new tab keeps Security
- changing a dirty Profile form still confirms before URL change
- keyboard focus moves to the new panel heading

- [ ] **Step 6: Commit URL-synced tabs**

```bash
git add frontend/src/features/public/account/components/AccountTabs.tsx frontend/src/features/public/account/components/ProfileForm.tsx frontend/src/app/'[locale]'/'(client)'/account/page.tsx
git commit -m "feat(account): persist settings tab in URL"
```

---

### Task 7: Make Security and Sessions transitions continuous

**Files:**

- Modify: `frontend/src/features/public/account/components/ProfileForm.tsx`
- Modify: `frontend/src/features/public/account/components/CredentialForms.tsx`
- Modify: `frontend/src/features/public/account/components/AccountProviderMethods.tsx`
- Modify: `frontend/src/features/public/account/components/SessionList.tsx`

**Interfaces:**

- Consumes URL tab contract from Task 6 and existing account API/query hooks.
- Produces Security actions that preserve context after re-auth, OAuth, email confirmation, logout-all, and close-account states.

- [ ] **Step 1: Preserve Security context for OAuth and re-auth**

Change all Security-originated Google starts to pass `"/account?tab=security"`:

- `CredentialForms` Google re-authentication
- `AccountProviderMethods` provider link/retry
- `ProfileForm` Google close-account re-authentication

After the callback, `LinkAccount` must keep the Account Security destination link.

- [ ] **Step 2: Keep credential feedback local to its section**

Ensure password and email change success/error feedback renders directly below the corresponding section heading, not only in a shared top-level banner. Keep current field mapping and recent-auth behavior. On success, clear only the relevant fields and preserve the active Security tab.

- [ ] **Step 3: Make Sessions a child destination of Security**

Use the shell header context from Task 3, remove duplicate header markup in `SessionList`, and add a visible secondary action to return to `/account?tab=security`.

- [ ] **Step 4: Complete logout-all exit**

After successful `logoutAll`, navigate to `/account/login?reason=logout-all`. `LoginForm` reads only the allow-listed reason `logout-all` and renders localized status copy explaining that all sessions ended and the user must sign in again. Do not put arbitrary server text in the query string.

- [ ] **Step 5: Keep close-account lifecycle understandable**

After `useCloseAccount` succeeds:

- clear close-password and confirmation state
- keep the returned `purge_after` in the account query data
- show the closed-account status with purge date and Reopen request CTA
- do not show old Security actions as if the account remained active

The existing `useCloseAccount` mutation already stores `account_status="closed"` and `purge_after` in the current account query. Keep that behavior, render the closed state before Account tabs, and do not issue a replacement session or reuse the old access token.

- [ ] **Step 6: Manual Security verification**

Verify:

- Security → Google re-auth → callback returns to Security
- Security → change password/email → success remains in Security
- Security → Sessions → return link restores Security tab
- Sessions → logout all → Login with explanatory status
- close account → closed status, purge date, Reopen CTA

- [ ] **Step 7: Commit Security continuity**

```bash
git add frontend/src/features/public/account/components/ProfileForm.tsx frontend/src/features/public/account/components/CredentialForms.tsx frontend/src/features/public/account/components/AccountProviderMethods.tsx frontend/src/features/public/account/components/SessionList.tsx
git commit -m "fix(account): preserve security flow context"
```

---

### Task 8: Align Thai, English, and German copy and interaction semantics

**Files:**

- Modify: `frontend/src/messages/th.json`
- Modify: `frontend/src/messages/en.json`
- Modify: `frontend/src/messages/de.json`
- Modify: `frontend/src/features/public/account/components/AccountPageHeader.tsx`
- Modify: `frontend/src/features/public/account/components/AuthShell.tsx`
- Modify: `frontend/src/features/public/account/components/AccountShell.tsx`
- Modify: `frontend/src/features/public/account/components/AccountFlowFooter.tsx`
- Modify: `frontend/src/features/public/account/components/LoginForm.tsx`
- Modify: `frontend/src/features/public/account/components/RegisterForm.tsx`
- Modify: `frontend/src/features/public/account/components/RecoveryForms.tsx`
- Modify: `frontend/src/features/public/account/components/LifecycleForms.tsx`
- Modify: `frontend/src/features/public/account/components/LinkAccount.tsx`
- Modify: `frontend/src/features/public/account/components/ProfileForm.tsx`
- Modify: `frontend/src/features/public/account/components/SessionList.tsx`
- Modify: `frontend/src/features/public/account/components/AccountProviderMethods.tsx`

**Interfaces:**

- Produces complete message trees for all new page context, navigation, divider, feedback, logout, confirmation, and recovery actions.

- [ ] **Step 1: Add the shared navigation and flow keys**

Add these keys to all three locale files with equivalent intent:

```text
Account.navigation.backToSite
Account.navigation.backToLogin
Account.navigation.backToAccount
Account.navigation.backToSecurity
Account.navigation.or
Account.flow.step
Account.flow.logoutAllComplete
Account.confirmEmailChange.title
Account.confirmEmailChange.subtitle
Account.reopen.title
Account.reopen.subtitle
Account.link.subtitle
```

Use the following copy intent in each locale: back to site, back to login, back to account, back to Security, or, step indicator, logout-all completion, email-change confirmation title/subtitle, reopen title/subtitle, and Google-link subtitle. The actual values must be translated in TH/EN/DE and must not be English fallbacks. Keep existing `Account` keys intact unless a key is explicitly replaced at every locale.

- [ ] **Step 2: Add specific next-step copy**

Add localized copy for:

- verification resend
- reset-link resend
- invalid/expired token
- email-change success return to Security
- account restored → Login
- logout-all completed → Login
- Login auxiliary-links heading
- Sessions return-to-Security action

Every error message must state the next action, not only the failure.

- [ ] **Step 3: Defer automated message testing**

Do not add or run automated message tests in this implementation pass. Keep the existing `frontend/src/features/public/account/messages.test.ts` unchanged and record it for the follow-up test/CI pass. Use type-check plus the manual locale matrix in the next step as the current verification.

- [ ] **Step 4: Manual locale/layout check**

At `/th`, `/en`, and `/de`, inspect Login, Register, Forgot, Security, and Sessions at mobile width and desktop width. German labels must wrap without clipping; Thai headings must not overlap controls.

- [ ] **Step 5: Commit copy and semantics**

```bash
git add frontend/src/messages/th.json frontend/src/messages/en.json frontend/src/messages/de.json frontend/src/features/public/account
git commit -m "copy(account): align journey guidance across locales"
```

---

### Task 9: Run final verification and record deferred test work

**Files:**

- Modify: none
- Verify: all files changed by Tasks 1–8

- [ ] **Step 1: Run type-check and lint**

```bash
cd frontend && ./node_modules/.bin/tsc --noEmit
cd frontend && npm run lint
```

Expected: both commands pass with no new warnings in Account files.

- [ ] **Step 2: Run production build without editing env files**

```bash
cd frontend && NEXT_PUBLIC_API_URL=https://account.example.test NEXT_PUBLIC_PUBLIC_ACCOUNT_AUTH_ENABLED=true npm run build
```

Expected: build completes successfully and does not require changes to `.env` or `.env.local`.

- [ ] **Step 3: Perform the complete manual matrix**

At `http://localhost:3002` with API `http://localhost:8082`, verify:

```text
Login → Register → Verify → Login
Login → Forgot password → Reset password → Login
Login → Reopen request → Reopen confirmation → Login
Account → Security → Password/email change → Security
Account → Security → Sessions → Security
Account → Close → Closed status → Reopen request
Google login/link → callback → original Account context
```

Repeat direct-link, refresh, keyboard, mobile, desktop, and TH/EN/DE checks.

- [ ] **Step 4: Record deferred automation scope**

Do not add CI or E2E in this round. Record the following as follow-up work: route-flow browser E2E, error/focus regression tests, OAuth callback integration tests, and CI enforcement.

- [ ] **Step 5: Commit only if verification is clean**

```bash
git status --short
git diff --check HEAD~8..HEAD
```

Expected: only intentional Account UX commits are present in the branch; unrelated worktree files remain unstaged.

---

## Self-review checklist

- [x] Every spec requirement maps to at least one task: shells/navigation (Tasks 1–3), shared form states (Task 4), recovery/lifecycle exits (Task 5), URL tabs (Task 6), Security/Sessions continuity (Task 7), localization/accessibility (Task 8), manual verification (Task 9).
- [x] No backend auth capability or migration is added.
- [x] No automated test/CI work is introduced; type-check, lint, build, and manual browser checks are the only current verification.
- [x] All new interfaces have concrete names and parameter types.
- [x] Every task has exact files, implementation steps, verification, and a focused commit.
- [x] No external return URL is accepted; account return paths are allow-listed.
