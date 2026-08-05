# Client Auth Password Hardening Design

Date: 2026-08-05
Status: Approved for implementation

## Context

Public client authentication currently accepts passwords with only a 12–128
character length check. The frontend and backend both participate in password
creation and reset, while login and reauthentication accept an existing
password without applying creation-policy rules.

The requested change is to make newly created passwords stricter and make the
requirements easy to understand while preserving existing users' ability to
sign in.

## Goals

- Apply one password policy to password registration and password reset.
- Keep the minimum at 12 characters and the maximum at 128 characters.
- Require at least 3 of 4 character groups: lowercase, uppercase, number, and
  special character.
- Allow spaces so users can choose a memorable passphrase.
- Show live, localized requirements in Thai, English, and German.
- Keep login and current-password reauthentication compatible with existing
  passwords.
- Keep frontend and backend validation aligned and covered by tests.

## Non-goals

- No forced password change for existing accounts.
- No password-strength meter, breached-password service, or database change.
- No change to login, account closure, Google linking, or other current-password
  verification flows.

## Policy

The password is validated as entered; it is not trimmed or silently normalized.
Length is counted as Unicode characters, with a range of 12–128. A password
passes the composition rule when at least three of these groups are present:

1. lowercase letter
2. uppercase letter
3. number
4. special character (a character that is neither a letter, number, nor
   whitespace)

Whitespace is allowed but does not count as a special character. The policy is
intentionally not applied to login or reauthentication because older valid
passwords must continue to work.

## UX and accessibility

Registration and reset-password forms will show a compact requirements panel
near the password field. Each requirement updates as the user types, with a
clear passed/not-passed state that does not rely on color alone. The form keeps
the existing show/hide password control and adds the requirements panel to the
field's accessible description. Submission errors remain localized and focus
the existing error summary or field error where available.

The panel will explain the policy in plain language: 12–128 characters, at
least 3 of 4 character groups, and spaces are allowed. Login keeps its current
simple password field without displaying creation requirements.

## Implementation shape

- Extend the existing frontend password validation module with shared policy
  constants, per-requirement state, and the final validation result.
- Add a small reusable frontend requirements component for Register and Reset
  Password; keep API calls in the existing account feature boundary.
- Extract backend password-policy validation into one reusable account-auth
  helper and call it from password registration and reset handling.
- Add the same localized message keys to `th.json`, `en.json`, and `de.json`.
- Preserve the existing error envelope and field name (`password`) so current
  error mapping remains compatible.

## Verification

- Frontend unit tests cover empty, 11/12/128/129-character boundaries, every
  composition combination, whitespace, and Unicode character counting.
- Backend tests cover registration and reset rejection/acceptance using the
  same boundary and composition cases.
- Run frontend lint and TypeScript checks, backend tests, and backend vet when
  the implementation is complete.
- Review the diff to confirm existing unrelated account-auth changes remain
  untouched and all three locale message trees stay in sync.
