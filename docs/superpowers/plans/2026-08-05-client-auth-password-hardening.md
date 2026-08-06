# Client Auth Password Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce a 12–128 character password policy with at least 3 of 4 character groups for new password registration/reset, and explain it live in the public client auth UI.

**Architecture:** Keep password-policy inspection as a pure function in the existing frontend account validation module and as a pure helper in the backend `accountauth` package. Registration and reset services call the backend helper; Register and Reset Password render one shared requirements component driven by the frontend inspector. Login and current-password verification remain unchanged.

**Tech Stack:** Next.js 16, React 19, TypeScript, `next-intl`, Tailwind CSS 4, Go 1.24, Fiber, GORM, Node `node:test` frontend tests.

## Global Constraints

- Minimum password length is 12 Unicode characters; maximum is 128 Unicode characters.
- A valid password contains at least 3 of 4 groups: lowercase letter, uppercase letter, number, and special character.
- Whitespace is allowed and does not count as a special character.
- Apply the creation policy only to password registration and password reset; do not apply it to login or reauthentication.
- Preserve `th`, `en`, and `de` message keys and backend/frontend error field `password`.
- Do not trim or silently normalize password input.
- Do not use TypeScript `any`, `as any`, or `@ts-ignore`.
- Preserve unrelated pre-existing worktree changes.

---

### Task 1: Add the backend password-policy helper and unit tests

**Files:**
- Create: `backend/internal/accountauth/password_policy.go`
- Create: `backend/internal/accountauth/password_policy_test.go`

**Interfaces:**
- Produces `accountauth.PasswordPolicyResult` with booleans for `HasMinLength`, `HasMaxLength`, `HasLowercase`, `HasUppercase`, `HasNumber`, `HasSpecial`, an integer `CharacterGroups`, and `Valid`.
- Produces `accountauth.ValidatePasswordPolicy(password string) error`, returning an `AUTH_VALIDATION` field error for `password` when invalid and `nil` when valid.

- [ ] **Step 1: Write pure policy tests first**

Cover these cases in `password_policy_test.go`:

```go
func TestValidatePasswordPolicy(t *testing.T) {
	tests := []struct {
		name    string
		value   string
		wantErr bool
	}{
		{"empty", "", true},
		{"eleven characters", "Aa1!" + strings.Repeat("b", 7), true},
		{"twelve with three groups", "abcdefghij1!", false},
		{"twelve with lowercase uppercase number", "Abcdefghij1x", false},
		{"twelve with lowercase uppercase special", "Abcdefghijk!", false},
		{"twelve with lowercase number special", "abcdefghij1!", false},
		{"thirteen with only two groups", "abcdefghijkl!", true},
		{"128 characters", strings.Repeat("a", 126) + "1!", false},
		{"129 characters", strings.Repeat("a", 127) + "1!", true},
		{"spaces are allowed", "Abcdefghij 1!", false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidatePasswordPolicy(tt.value)
			if (err != nil) != tt.wantErr {
				t.Fatalf("ValidatePasswordPolicy() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}
```

Also test Unicode length with `strings.Repeat("ก", 12)` plus two qualifying groups, and assert the result counts Unicode runes rather than UTF-8 bytes.

- [ ] **Step 2: Run the focused test and confirm it fails**

Run `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/accountauth -run TestValidatePasswordPolicy -count=1`.

Expected: FAIL because `ValidatePasswordPolicy` and `PasswordPolicyResult` do not exist yet.

- [ ] **Step 3: Implement the helper**

Use `utf8.RuneCountInString` for length. Iterate over runes and classify with Go's Unicode helpers: `unicode.IsLower`, `unicode.IsUpper`, `unicode.IsNumber`, `unicode.IsLetter`, and `unicode.IsSpace`. A special character is a rune that is not a letter, number, or whitespace. Set `Valid` only when the length is in range and `CharacterGroups >= 3`. Return:

```go
accountauth.NewFieldError(
	accountauth.CodeValidation,
	"password",
	"Password must be 12–128 characters and meet at least 3 of 4 character requirements.",
)
```

for invalid input.

- [ ] **Step 4: Run the focused test and confirm it passes**

Run the same focused command. Expected: PASS.

### Task 2: Route registration and reset through the backend helper

**Files:**
- Modify: `backend/internal/services/account_registration_service.go`
- Modify: `backend/internal/services/account_recovery_service.go`
- Modify: `backend/internal/services/account_registration_service_test.go`
- Modify: `backend/internal/services/account_recovery_service_test.go`

**Interfaces:**
- Consumes `accountauth.ValidatePasswordPolicy` from Task 1.
- Produces the same existing `AUTH_VALIDATION` field error shape from both registration and reset endpoints.

- [ ] **Step 1: Add integration assertions before changing service code**

Extend the existing registration short-password test and reset bounds test to assert that a 12-character password with only two groups is rejected, while a 12-character password with three groups is accepted. Keep reset-token setup intact so the invalid policy is checked before token consumption.

Use these values in the service tests:

```go
	invalid := "abcdefghijkl!" // 13 characters, lowercase + special only
	valid := "Abcdefghijk1"    // 12 characters, lowercase + uppercase + number
```

Add a Unicode length case to ensure a password is not rejected merely because its UTF-8 byte length exceeds 12.

- [ ] **Step 2: Run focused service tests and confirm the new assertions fail**

Run `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/services -run 'Test(RegisterPassword|ResetPassword)' -count=1`.

Expected: the composition and Unicode assertions fail against the existing length-only implementation.

- [ ] **Step 3: Replace duplicate length checks with the helper**

Remove the registration service's local `minPasswordLen`/`maxPasswordLen` password check and call `accountauth.ValidatePasswordPolicy(in.Password)`. Remove the recovery service's local `validatePasswordLength` helper and call the same account-auth helper at the start of `ResetPassword`. Leave display-name and token validation order unchanged except that password policy remains before token consumption.

- [ ] **Step 4: Run focused backend tests**

Run:

```bash
cd backend
GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/accountauth ./internal/services -count=1
```

Expected: PASS.

### Task 3: Extend frontend policy inspection and tests

**Files:**
- Modify: `frontend/src/features/public/account/validation.ts`
- Modify: `frontend/src/features/public/account/messages.test.ts`

**Interfaces:**
- Produces `PasswordPolicyResult` with the same length/group fields used by the UI.
- Keeps `validatePassword(password)` returning `passwordRequired`, `passwordMin`, `passwordMax`, or a new `passwordComplexity` message key.
- Consumes no React or translation dependencies.

- [ ] **Step 1: Add failing pure validation cases**

Update the existing password test to cover 12/128 boundaries, the 3-of-4 group rule, whitespace, and Unicode characters. Add an assertion that a valid 12-character value with three groups returns `null`, and a two-group value returns `passwordComplexity`.

- [ ] **Step 2: Run the focused frontend test and confirm it fails**

Run `cd frontend && npm run test:account -- --test-name-pattern='validatePassword'`. Expected: FAIL because the new complexity assertion is not implemented yet.

- [ ] **Step 3: Implement `inspectPassword` and update `validatePassword`**

Use `Array.from(password).length` for Unicode character count. Match frontend Unicode categories with property escapes: lowercase `\p{Ll}`, uppercase `\p{Lu}`, number `\p{N}`, and special characters not in `\p{L}`, `\p{N}`, or whitespace. Return the same group count and validity rules as the backend. Do not trim or normalize the value.

- [ ] **Step 4: Run the focused frontend validation test**

Expected: PASS, including the existing email/display-name/return-to tests and the message-tree parity test.

### Task 4: Add the shared live password-requirements UI

**Files:**
- Create: `frontend/src/features/public/account/components/PasswordRequirements.tsx`
- Modify: `frontend/src/features/public/account/components/RegisterForm.tsx`
- Modify: `frontend/src/features/public/account/components/RecoveryForms.tsx`
- Modify: `frontend/src/messages/th.json`
- Modify: `frontend/src/messages/en.json`
- Modify: `frontend/src/messages/de.json`

**Interfaces:**
- `PasswordRequirements` accepts `requirements: PasswordPolicyResult` and renders the localized checklist.
- Register and Reset Password pass the same `inspectPassword(password)` result and connect the checklist through `aria-describedby`.

- [ ] **Step 1: Add all localized policy copy**

Add a matching `Account.passwordPolicy` object to all three message files with keys for the title, length rule, group-count rule, lowercase, uppercase, number, special character, and spaces-allowed note. Add `validation.passwordComplexity` in all three locale files. Keep the text concise and avoid security jargon.

- [ ] **Step 2: Build the accessible checklist component**

Render a semantic `ul` with one `li` per requirement. Use text plus a check/circle icon with `aria-hidden` so state is not conveyed by color alone. Give the panel a stable id, a heading, and `aria-live="polite"`; do not add an effect or a custom interaction. Preserve the public square-corner, border, surface, focus, and minimum touch-target conventions from `DESIGN.md`.

- [ ] **Step 3: Wire RegisterForm**

Compute `const passwordRequirements = inspectPassword(password)` during render. Keep the existing submit-time error mapping, add the requirements id to the password input's `aria-describedby`, and render the panel immediately after `PasswordInput`. The existing registration overview remains, but the password-specific checklist becomes the source of truth for the password field.

- [ ] **Step 4: Wire ResetPasswordForm**

Use the same component and `aria-describedby` connection in `ResetPasswordForm`. Preserve the existing token and API error handling; only password-policy failures use the new localized validation key.

- [ ] **Step 5: Run lint and type-check for the touched frontend**

Run `cd frontend && npm run lint` and `./node_modules/.bin/tsc --noEmit`. Expected: PASS with no new accessibility or type errors.

### Task 5: Verify the complete change and preserve the dirty worktree

**Files:**
- Inspect only: all files changed by Tasks 1–4 and the pre-existing account-auth diff.

- [ ] **Step 1: Run backend verification**

Run `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./...` and `GOCACHE=/private/tmp/wat-profile-go-cache go vet ./...`. Expected: PASS or a clearly reported pre-existing/environmental failure.

- [ ] **Step 2: Run frontend verification**

Run `cd frontend && npm run test:account`, `npm run lint`, `./node_modules/.bin/tsc --noEmit`, and `npm run build`. Expected: PASS.

- [ ] **Step 3: Review the final diff**

Run `git diff --check` and inspect `git diff --stat` plus the targeted file diffs. Confirm no changes were made to login/reauthentication policy, no secrets/generated files were added, all locale trees match, and the pre-existing dirty account-auth changes remain present.
