# Production Hardening Review Remediation Design

## Goal

Resolve every production-readiness finding from the Contact and Media hardening
review while excluding `frontend/src/app/[locale]/admin/website`.

## Scope

### Contact HTTP contract

The OpenAPI definition for `POST /api/v1/public/contact` will exactly describe
the existing runtime envelopes:

- `400` returns the generic error envelope plus a `fields` map whose keys are
  request field names and whose values are validation messages.
- `429` returns `CONTACT_RATE_LIMITED` and an integer `Retry-After` header.
- The honeypot `website` remains unvalidated: a non-empty value always returns
  the same generic `201` success without a persistence write. Its OpenAPI
  schema will therefore not declare a maximum length.

No runtime request semantics change. The API contract is being aligned to the
already deliberate honeypot behavior.

### Contact response and public UI consistency

Add a status-aware success response utility so the public Contact handler can
return both real and honeypot success through the shared response boundary with
HTTP 201. The response body remains exactly:

```json
{ "success": true, "message": "Message received." }
```

Replace raw red and emerald Tailwind utilities in the public Contact form with
the existing public design tokens. Validation/root failure uses
`site-danger`/`site-danger-surface`; success uses the neutral public surface
and action/foreground tokens already available to the site. No message keys,
form behavior, or accessibility roles change.

### Dependency and rollout hygiene

Regenerate the tracked Yarn lockfile from the current frontend manifest so it
no longer retains deleted `resend` or `@react-email/*` packages. The npm
package-lock remains authoritative for `npm ci`; the Yarn lockfile is kept
consistent for developers that use Yarn.

Clarify production deployment instructions: configure and verify R2/CDN CORS
for managed-media `GET`/`HEAD` before building the frontend, because the origin
allowlist is baked into the production build and browser cropping requires CORS.

## Non-goals

- No changes under `frontend/src/app/[locale]/admin/website`.
- No retry, delivery, persistence, rate-limit, or Contact form behavioral
changes.
- No dependency additions or production environment values.

## Verification

- Parse the OpenAPI document and run the affected backend handler/package
  checks.
- Run the existing focused Contact API/schema tests and frontend type check.
- Verify no `resend` or `@react-email` entries remain in `frontend/yarn.lock`.
- Run `git diff --check` and confirm the deployment instructions state the
  CORS-before-build ordering.
