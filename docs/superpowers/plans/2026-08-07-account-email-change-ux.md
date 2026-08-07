# Account Email Change UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use inline execution with the existing account frontend patterns; no subagents are needed for this focused change.

**Goal:** Keep email-change verification inside its own Account Security flow so it never focuses or routes users into password-change controls.

**Architecture:** Keep the existing `requestEmailChange` API contract. Refactor `CredentialForms` into two sibling flows with independent state, validation, error focus, loading state, and success notice, presented as a one-open-at-a-time accordion. Add localized copy for the email flow's credential instruction and confirmation state in `th`, `en`, and `de`.

**Tech Stack:** Next.js App Router, React 19, strict TypeScript, Tailwind CSS, `next-intl`, existing account API client and `node:test` account suite.

## Global Constraints

- Preserve the existing public register design tokens and square control treatment.
- Keep password and email credential states isolated; never share current-password field IDs or values.
- Preserve the existing `requestEmailChange(newEmail, currentPassword, locale)` API contract.
- Add every new public message key to `frontend/src/messages/th.json`, `en.json`, and `de.json`.
- Do not change backend routes, migrations, CI, or unrelated dirty-worktree files.

### Task 1: Split credential state and validation

**Files:**
- Modify: `frontend/src/features/public/account/components/CredentialForms.tsx`

- [x] Replace the shared `currentPassword`, `busy`, `noticeSection`, and field map with password-flow and email-flow state so each form owns its own current-password value and status.
- [x] Give the email form its own password input ID and local focus map; map `current_password` errors to that field rather than the password-change form.
- [x] Keep Google-only reauthentication scoped to the email/password actions that need it without moving focus to the sibling form.

### Task 2: Restructure the Account Security UI

**Files:**
- Modify: `frontend/src/features/public/account/components/CredentialForms.tsx`

- [x] Render the password-change form and email-change form as independent sections with their own descriptions, submit buttons, notices, and loading indicators.
- [x] Render the email form in this order: new email, account verification instruction, current password for password accounts (or Google confirmation action), then request button.
- [x] Keep success in the email section, clear only the sensitive email-flow password, and leave the user on the same section.
- [x] Wrap the two flows in accessible accordion rows; keep only the selected panel visible while preserving each panel's local input state.
- [x] Keep the accordion row as the single source for each title/summary and show a warm active surface with an accent edge when expanded.
- [x] Start the new-email field empty and map duplicate-email errors to that field; map invalid credentials to the email form's password field.

### Task 3: Localize email-change guidance

**Files:**
- Modify: `frontend/src/messages/th.json`
- Modify: `frontend/src/messages/en.json`
- Modify: `frontend/src/messages/de.json`

- [x] Add matching keys for the email security description, password verification label, Google verification guidance, and confirmation-state body in all three locales.
- [x] Keep language meaning aligned: submit the new email, verify ownership through the one-time link, and only then does the account email change.

### Task 4: Verify the focused frontend change

**Files:**
- Test: `frontend/src/features/public/account/*.test.ts`

- [x] Run the account test suite and confirm existing account API and message-tree checks pass (32 passed).
- [x] Run `./node_modules/.bin/tsc --noEmit` and targeted ESLint for `CredentialForms.tsx` plus the three message files.
- [x] Run `git diff --check` and inspect the final diff to confirm no unrelated files were changed.
