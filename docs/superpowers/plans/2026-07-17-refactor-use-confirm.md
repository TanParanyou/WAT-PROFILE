# useConfirm Extraction and Lifecycle Safety Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separate confirmation-dialog orchestration from generic modal UI and resolve a pending `confirm()` as `false` when its owner unmounts.

**Architecture:** Retain `Modal` and `ConfirmModal` in `components/ui/Modal.tsx`. Move promise state, async loading, and lifecycle cleanup into `hooks/useConfirm.tsx`; preserve each consumer's current API: `const { confirm, ConfirmDialog } = useConfirm()`.

**Tech Stack:** React 19.2, TypeScript 5, Next.js 16, ESLint.

## Global Constraints

- Keep confirmations local; do not add `ConfirmProvider`, React context, or root-layout changes.
- Keep option fields and semantics: `title`, `message`, `confirmText`, `cancelText`, `variant`, and optional `onConfirm`.
- A rejected `onConfirm` keeps its dialog open and clears loading so the user can retry or cancel.
- Unmounting a component with a pending dialog resolves its promise with `false`.
- Do not add testing dependencies; this frontend has no component-test runner configured.

---

## File Map

| File | Change | Responsibility |
| --- | --- | --- |
| `frontend/src/components/ui/Modal.tsx` | Modify | UI primitive and modal types only. |
| `frontend/src/hooks/useConfirm.tsx` | Create | Confirmation promise state machine and cleanup. |
| Fourteen existing consumers | Modify | Import the hook from its new module only. |

### Task 1: Extract the hook

**Files:** Create `frontend/src/hooks/useConfirm.tsx`; modify `frontend/src/components/ui/Modal.tsx:229-299`.

**Interface:** `useConfirm(): { confirm: (options: UseConfirmOptions) => Promise<boolean>; ConfirmDialog: React.FC }`.

- [ ] Add `UseConfirmOptions` to the new hook file. It has the existing fields: `title`, `message`, `confirmText`, `cancelText`, `variant: ModalVariant`, and optional `onConfirm: () => Promise<void> | void`.
- [ ] Move the current state machine from `Modal.tsx` into the hook. Import `ConfirmModal` and `ModalVariant` from `@/components/ui/Modal`; do not change `ConfirmModal` UI behavior.
- [ ] Store the promise resolver in `useRef<((accepted: boolean) => void) | null>`, not React state.
- [ ] Implement one `settle(accepted: boolean)` callback: clear the ref before invoking it, resolve once, then reset the dialog state to closed/default.
- [ ] In `confirm(options)`, settle any older resolver as `false`, store the new resolver, and open the dialog. This prevents a second invocation leaking the first Promise.
- [ ] In confirmation, retain current semantics: without `onConfirm`, settle `true`; with it, set loading, await it, settle `true` on success, and on error clear loading while leaving the dialog open.
- [ ] In cancellation, do nothing while loading; otherwise settle `false`.
- [ ] Add unmount cleanup that only clears and resolves the pending ref as `false`; it must not call `setState` during cleanup.
- [ ] Return the existing `ConfirmDialog` adapter, passing state, `handleClose`, and `handleConfirm` to `ConfirmModal`.
- [ ] Delete `UseConfirmOptions` and `useConfirm` from `Modal.tsx`, then change its value export to `export { Modal, ConfirmModal, FormModal, useModal };`.

### Task 2: Migrate every consumer import

**Files:**

- `frontend/src/app/[locale]/admin/contacts/page.tsx`
- `frontend/src/app/[locale]/admin/donations/categories/page.tsx`
- `frontend/src/app/[locale]/admin/donations/page.tsx`
- `frontend/src/app/[locale]/admin/events/page.tsx`
- `frontend/src/app/[locale]/admin/gallery/categories/page.tsx`
- `frontend/src/app/[locale]/admin/gallery/page.tsx`
- `frontend/src/app/[locale]/admin/members/page.tsx`
- `frontend/src/app/[locale]/admin/monks/page.tsx`
- `frontend/src/app/[locale]/admin/registrations/page.tsx`
- `frontend/src/app/[locale]/admin/roles/page.tsx`
- `frontend/src/app/[locale]/admin/schedules/page.tsx`
- `frontend/src/app/[locale]/admin/users/page.tsx`
- `frontend/src/components/admin/website/MediaDetailsSidebar.tsx`
- `frontend/src/components/admin/website/WebsitePageEditorShell.tsx`

- [ ] In each file, replace `import { useConfirm } from "@/components/ui/Modal";` with `import { useConfirm } from "@/hooks/useConfirm";`.
- [ ] Do not change call sites, option values, callback logic, or `<ConfirmDialog />` placement. Keep `WebsitePageEditorShell`'s dialog at its root so `canLeaveCurrentForm` still guards tab and section navigation.
- [ ] Verify no old import remains with `rg 'useConfirm.*components/ui/Modal' -n frontend/src`; expected result: no matches.

### Task 3: Verify behavior and commit

- [ ] Run `cd frontend && npx tsc --noEmit`, `npm run lint`, and `npm run build`; expected result: each exits 0. Record separately any unrelated pre-existing failure.
- [ ] Events list acceptance: cancel delete (no action), then confirm delete (one action and loading until completion).
- [ ] Website editor acceptance: make an unsaved change, choose Stay when changing tab/section (blocked), then choose Continue (navigation proceeds).
- [ ] Media sidebar acceptance: start deletion confirmation, unmount/leave its owner before replying, and verify no deletion occurs and the awaiting call receives `false`.
- [ ] Run `git diff --check` and inspect the diff; expected scope: one new hook, `Modal.tsx` cleanup, and fourteen import-only edits.
- [ ] Commit with `git commit -m "refactor: extract confirmation hook"` after staging the sixteen scoped files.

## Self-Review

- This plan changes exactly 16 files: one new hook, one modal cleanup, and fourteen import-only consumers.
- It intentionally does not touch EventEditor because it does not call `useConfirm`.
- It adds no global provider, so graph communities do not become runtime coupling.
