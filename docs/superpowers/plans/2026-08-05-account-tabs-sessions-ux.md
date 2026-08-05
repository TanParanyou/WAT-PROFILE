# Account Tabs and Sessions UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the account form into focused tabs with reliable dirty-state protection and redesign the sessions route as an accessible, localized device-management page.

**Architecture:** Keep `/account` as one route with local semantic tabs and a shared `useUnsavedChanges` hook. Keep `/account/sessions` as a separate route using the existing account query/mutation boundaries and the account session context for logout state. No backend contract changes.

**Tech Stack:** Next.js App Router, React 19, TypeScript, next-intl, TanStack Query, Tailwind CSS 4, lucide-react.

## Global Constraints

- Preserve `th`, `en`, and `de` message trees.
- Use `@/` imports and existing public semantic `site-*` tokens; never use admin tokens.
- Do not use TypeScript `any`, `as any`, or `@ts-ignore`.
- Keep HTTP access inside `features/public/account/api.ts` and query hooks in `queries.ts`.
- Keep interactive controls keyboard accessible, focus-visible, and at least 44px.
- Preserve existing avatar upload behavior and do not introduce a backend/API change.

## File Map

- Create `frontend/src/features/public/account/components/AccountTabs.tsx` for the local tablist.
- Create `frontend/src/features/public/account/hooks/useUnsavedChanges.ts` for dirty navigation and `beforeunload` protection.
- Modify `frontend/src/features/public/account/components/ProfileForm.tsx` to own tab state, baseline values, dirty action bar, and section rendering.
- Modify `frontend/src/features/public/account/components/SessionList.tsx` to implement account access states, session cards, localized timestamps, retry, and context-backed logout-all.
- Modify `frontend/src/features/public/account/components/SessionCard.tsx` to keep device/session presentation separate from query logic.
- Modify `frontend/src/messages/th.json`, `frontend/src/messages/en.json`, and `frontend/src/messages/de.json` with tab, dirty, session, device, timestamp, retry, and confirmation copy.
- Verify `frontend/src/features/public/account/messages.test.ts`, `frontend/src/features/public/account/*.test.ts`, TypeScript, focused ESLint, and production build.

### Task 1: Add tab and dirty-state primitives

**Files:**
- Create: `frontend/src/features/public/account/components/AccountTabs.tsx`
- Create: `frontend/src/features/public/account/hooks/useUnsavedChanges.ts`
- Modify: `frontend/src/messages/th.json`
- Modify: `frontend/src/messages/en.json`
- Modify: `frontend/src/messages/de.json`

**Interfaces:**
- `AccountTab = "profile" | "preferences" | "security"`.
- `AccountTabsProps = { activeTab: AccountTab; onChange: (tab: AccountTab) => void; isDirty: boolean; onNavigate?: (href: string) => boolean }`.
- `useUnsavedChanges({ isDirty, message }): { confirmNavigation: () => boolean }`.

- [ ] **Step 1: Add the localized tab and dirty copy**

Add the same keys under `Account.account` in all three locale files:

```json
{
  "tabsProfile": "Profile",
  "tabsPreferences": "Preferences",
  "tabsSecurity": "Security",
  "unsaved": "Unsaved changes",
  "unsavedBody": "You have changes that are not saved.",
  "saveAndContinue": "Save changes",
  "discardChanges": "Discard changes",
  "saved": "Changes saved"
}
```

Use natural Thai, English, and German translations rather than reusing login copy.

- [ ] **Step 2: Implement the dirty-state hook**

`useUnsavedChanges` must install `beforeunload` only while dirty and return `false`
from `confirmNavigation` when `window.confirm(message)` is rejected. Remove the
event listener on cleanup. The hook must not mirror remote data or perform API calls.

- [ ] **Step 3: Implement semantic AccountTabs**

Render a `role="tablist"` with three `button` elements. Each button must set
`role="tab"`, `aria-selected`, `aria-controls`, `tabIndex={0|-1}`, a visible focus
ring, and a minimum height of 44px. Use arrow-left/arrow-right/Home/End keyboard
navigation to move focus and activate the selected tab. Show a localized dirty
indicator beside the tab heading when `isDirty` is true.

- [ ] **Step 4: Run focused checks**

Run:

```bash
cd frontend
./node_modules/.bin/eslint src/features/public/account/components/AccountTabs.tsx src/features/public/account/hooks/useUnsavedChanges.ts
./node_modules/.bin/tsc --noEmit
```

Expected: exit code 0.

### Task 2: Refactor ProfileForm into tabs with a dirty action bar

**Files:**
- Modify: `frontend/src/features/public/account/components/ProfileForm.tsx`
- Use: `frontend/src/features/public/account/components/AccountTabs.tsx`
- Use: `frontend/src/features/public/account/hooks/useUnsavedChanges.ts`

**Interfaces:**
- Keep the existing `ProfileForm()` public component signature.
- Baseline is `{ displayName: string; preferredLocale: AccountLocale }` captured from the loaded account.
- `isDirty = displayName !== baseline.displayName || preferredLocale !== baseline.preferredLocale`.

- [ ] **Step 1: Add baseline and tab state**

Initialize `activeTab` to `"profile"`. When the account ID changes, update both
form values and baseline. Do not reset the baseline while the same account is dirty.
Use `useUnsavedChanges` with the localized unsaved-leave message.

- [ ] **Step 2: Add guarded tab changes**

Before switching tabs, call `confirmNavigation()`. If it returns `false`, keep the
current tab and form values. If it returns `true`, activate the requested tab.

- [ ] **Step 3: Render the profile tab**

Keep email/status read-only, render `AvatarUpload`, and render the display-name
input. Do not make avatar upload part of the dirty baseline because it persists
immediately through its existing mutation.

- [ ] **Step 4: Render the preferences tab**

Move the preferred-language select into the preferences tab. Keep the existing
localized labels and `AccountLocale` type narrowing.

- [ ] **Step 5: Render the security tab**

Move the sessions link, logout action, and close-account flow into the security tab.
The sessions link must call `confirmNavigation()` before following the locale-aware
`Link` when the form is dirty. Keep close-account confirmation and error handling.

- [ ] **Step 6: Add the dirty action bar**

When `isDirty`, render a bordered action bar with the localized unsaved indicator,
“Discard changes”, and “Save changes”. The discard action restores baseline values
and clears form errors. The save action reuses `updateProfile.mutateAsync` and, on
success, updates the baseline to the saved values. Hide the bar when clean.

- [ ] **Step 7: Run account checks**

Run:

```bash
cd frontend
npm run test:account
./node_modules/.bin/eslint src/features/public/account/components/ProfileForm.tsx
```

Expected: account tests pass and the focused lint command exits 0.

### Task 3: Redesign the sessions page

**Files:**
- Create: `frontend/src/features/public/account/components/SessionCard.tsx`
- Modify: `frontend/src/features/public/account/components/SessionList.tsx`
- Modify: `frontend/src/messages/th.json`
- Modify: `frontend/src/messages/en.json`
- Modify: `frontend/src/messages/de.json`

**Interfaces:**
- `SessionCardProps = { session: AccountSession; locale: string; isRevoking: boolean; onRevoke: (id: string) => void }`.
- `SessionCard` must not import query hooks or Axios.

- [ ] **Step 1: Add session copy**

Add matching localized keys for `pageEyebrow`, `backToAccount`, `device`,
`lastActive`, `ipAddress`, `currentDevice`, `revokeConfirm`, `cancel`, `retry`,
`signInTitle`, `signInBody`, `signInAction`, `registerAction`, `loadError`,
`refresh`, `singleSession`, and `logoutAllDescription`.

- [ ] **Step 2: Implement SessionCard**

Use `Smartphone` for user-agent strings containing `Mobile`, otherwise `Laptop`.
Render the current-device badge, user-agent summary, IP prefix, and timestamp.
Format the timestamp with `new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(session.last_used_at))`.
Render a 44px revoke button only for non-current sessions and show a spinner while
that specific session is revoking.

- [ ] **Step 3: Add anonymous/loading/error states to SessionList**

Read `status`, `account`, and `accountLoading` from `useAccountSession`. Show the
same access CTA pattern as the account page for anonymous users. For query errors,
show a localized alert and a retry button using `sessionsQuery.refetch()`.

- [ ] **Step 4: Render the page structure**

Add a localized heading/subtitle, a locale-aware back link, current-session card
first, and other sessions below in a responsive card list. Show an explicit empty
state when the query returns no rows.

- [ ] **Step 5: Fix session actions**

Use the existing revoke mutation and clear the success message before each request.
For sign-out-everywhere, call `logoutAll` from `useAccountSession` instead of the
standalone mutation so navbar/account query state becomes anonymous immediately.
Show the action only when more than one session exists. Confirmation must provide
localized confirm and cancel buttons; cancel must not use the “current device” label.

- [ ] **Step 6: Run sessions checks**

Run:

```bash
cd frontend
./node_modules/.bin/eslint src/features/public/account/components/SessionCard.tsx src/features/public/account/components/SessionList.tsx
./node_modules/.bin/tsc --noEmit
```

Expected: exit code 0.

### Task 4: Final verification

**Files:**
- Verify: `frontend/src/features/public/account/messages.test.ts`
- Verify: `frontend/src/features/public/account/*.test.ts`
- Verify: `frontend/src/app/[locale]/(client)/account/page.tsx`
- Verify: `frontend/src/app/[locale]/(client)/account/sessions/page.tsx`

- [ ] **Step 1: Run localization and account tests**

Run `npm run test:account` from `frontend`; expected all existing tests pass.

- [ ] **Step 2: Run production checks**

Run `./node_modules/.bin/tsc --noEmit` and `npm run build` from `frontend`; expected
both commands exit 0.

- [ ] **Step 3: Run backend regression suite**

Run `GOCACHE=/private/tmp/wat-profile-go-cache go test ./...` from `backend`; no
backend contract changed, so all packages must remain green.

- [ ] **Step 4: Verify routes and diff hygiene**

Run:

```bash
curl -sS -o /dev/null -w '%{http_code} %{url_effective}\n' http://localhost:3002/th/account
curl -sS -o /dev/null -w '%{http_code} %{url_effective}\n' http://localhost:3002/th/account/sessions
git -c core.fsmonitor=false diff --check
```

Expected: both routes return `200` and diff check has no output.
