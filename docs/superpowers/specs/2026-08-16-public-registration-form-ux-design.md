# Public Event Registration Form UX Design

## Goal

Make the public event registration form easier to complete while safely using
available account data and validating input before submission.

## Behaviour

- An authenticated account pre-fills the contact email and display name into
  the first-name field when the account query becomes available.
- Prefill runs only while the form is pristine and never overwrites values the
  visitor has already entered.
- If a signed-in account token expires during submission, refresh it once via
  the HttpOnly session and retry the public request so ownership is preserved.
- Anonymous visitors keep the existing empty defaults.
- Contact first name, last name, and email are required; participant first and
  last names are also required.
- Client limits mirror backend limits for names, email, phone, and free-text
  participant fields, with localized messages in `th`, `en`, and `de`.
- Every invalid field exposes a visible message, `aria-invalid`, and a linked
  `aria-describedby`; submit focuses the first invalid field.

## UX shape

- Keep the current single-page flow and multi-participant support.
- Improve grouping and hierarchy with clear fieldset legends, required markers,
  participant count context, and consistent 44px controls.
- Keep optional dietary, accessibility, and notes fields optional.
- Preserve the existing unavailable/closed state and server error mapping.

## Implementation shape

- Read account state through `useAccountSession`; use React Hook Form `reset`
  with a pristine-form guard for one-time defaults.
- Extend the existing localized registration schema factory with participant
  required checks and max-length checks.
- Keep all backend enforcement unchanged and map server field errors through the
  existing typed error path.
- Add only the message keys needed by the schema and form UI to all three public
  locale files.

## Verification

- Add form-state/schema/API tests for authenticated defaults, pristine
  protection, expired-token recovery, required participant names, invalid
  email/lengths, and valid multi-person submissions.
- Run TypeScript, targeted ESLint, focused tests, JSON validation, and the
  production build.
