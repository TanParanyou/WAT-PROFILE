# Account profile feedback and footer design

## Goal

Make profile-save feedback actionable at the point of action, and keep account
screens focused on account management rather than public-site navigation.

## Scope

- Apply only to the public account route family (`/[locale]/account/*`).
- Do not change API contracts, validation rules, or account permissions.
- Preserve Thai, English, and German messages already used by the account UI.

## Layout

The public-site layout will omit its full marketing footer on account routes.
Account routes will instead render a compact legal footer with the existing
localized Privacy and Impressum links. Navbar, cookie consent, social links,
and structured data stay unchanged.

The profile form will retain its tabbed structure. When the form is dirty, a
sticky bottom action bar will be shown. On mobile it stacks the status and
actions; at `sm` and above it presents them in a single row. The action bar
contains Discard and Save controls and remains above the browser edge while
the user scrolls.

## Feedback state

Field validation errors remain immediately beneath their associated controls,
with their existing invalid ARIA state and focus behavior.

Profile-level server errors and successful-save confirmation move from the top
of the account content into the sticky action bar. This puts outcome, recovery
action, and controls together. Only feedback relevant to the active profile or
preferences tab appears in this bar. Errors created by account-closing stay in
the security panel where that action occurs.

On a failed profile submission, React Hook Form continues to focus a mapped
field error. A non-field server error is announced in the action bar. Saving,
discarding, changing account, or changing tabs clears feedback that is no
longer applicable.

## Accessibility and verification

- Preserve `role="alert"` for errors and `role="status"`/`aria-live="polite"`
  for successful saves.
- Keep all controls at least 44px tall, maintain visible focus treatment, and
  avoid hiding a keyboard-focused active panel.
- Verify desktop and mobile layouts and run frontend lint, TypeScript checks,
  and build. The repository has no aggregate frontend test runner; add focused
  tests only where the existing account test setup supports them.
