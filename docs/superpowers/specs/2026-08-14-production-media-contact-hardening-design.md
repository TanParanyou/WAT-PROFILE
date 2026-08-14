# Production Media and Contact Hardening Design

**Date:** 2026-08-14

**Status:** Approved

## Goal

Remove the public server-side media fetch surface and make contact submission durable, abuse-resistant, and visible in the existing Admin Contacts workflow before production launch.

## Scope

This design delivers two independent vertical slices:

1. Managed-media cropping without a server-side external URL proxy.
2. Contact submission through the Go API with an atomic PostgreSQL record and operations-outbox notification.

The slices can be reviewed and deployed independently. They reuse the current Media Library, Contact Inquiry, Resend adapter, and Operations Outbox boundaries.

## Out of Scope

- Automatic import of arbitrary external image URLs.
- CAPTCHA or Cloudflare Turnstile.
- Distributed rate limiting.
- Automatic contact-data retention.
- Legacy authentication removal.
- A generic media-processing gateway.

These remain separate production-hardening workstreams.

## Architecture

### Managed media

```text
Admin
  -> Upload or Media Library
  -> managed R2/CDN URL
  -> browser fetches image directly
  -> browser crops image
  -> cropped file uploads through the authenticated backend
  -> backend stores object in R2 and metadata in PostgreSQL
```

The Next.js `/api/media-proxy` route is deleted. No application server fetches an administrator-supplied external URL. R2 or the configured CDN must allow `GET` and `HEAD` from the deployed frontend origin through its CORS policy.

### Contact submission

```text
Contact form
  -> POST /api/v1/public/contact
  -> validation, honeypot, and rate limit
  -> one PostgreSQL transaction
       -> create contact_inquiries row
       -> enqueue contact.notification outbox row
  -> generic success response

Operations worker
  -> claim contact.notification
  -> load ContactInquiry by contact_id
  -> send notification through Resend
  -> complete or retry with existing outbox backoff
```

PostgreSQL is the source of truth. A Resend outage does not lose the message or make the visitor resubmit it.

## Managed Media Design

### Allowed origins

The frontend receives a comma-separated `NEXT_PUBLIC_MEDIA_ALLOWED_ORIGINS` build-time value containing explicit HTTPS origins for managed R2/CDN assets. Wildcards are not accepted. Local development may include an explicit HTTP origin.

The value is public configuration, not a credential. A shared frontend utility parses and validates it once and exposes a managed/unmanaged classification function. This classification controls editing UX; the security boundary comes from deleting the server-side fetch route.

Production startup/build documentation must require:

- At least one explicit managed-media origin.
- HTTPS for every production origin.
- Matching R2/CDN CORS rules for the production frontend origin.

### Media Picker

`MediaPickerDialog` retains the complete media objects returned by `mediaService.list()` instead of reducing them to URL strings. Each item is classified as managed or external.

Managed items support preview, selection, and crop. External items remain selectable for backward compatibility, display an `External` badge, and disable crop. Their replacement action opens the existing file chooser so the administrator can upload a managed copy.

New local files continue using a browser `data:` URL for the pre-upload crop flow. After cropping, the file is uploaded through the authenticated media endpoint as it is today.

### URL fields

Manual URL entry moves under an `Advanced` disclosure. Media Library selection remains the primary workflow.

- Managed URL: normal preview and editable status.
- External URL: preview when the browser permits it, an unmanaged warning, and no crop action.
- Existing public pages continue rendering stored external URLs.
- The system never downloads or imports an external URL automatically.

### Crop errors

`cropUtils` fetches only managed HTTP(S) URLs directly from the browser. It accepts local `blob:` and `data:` sources used by upload flows. It never falls back to a server proxy.

If an allowed image cannot be loaded because of CORS, network failure, or an invalid response, the administrator sees a localized message equivalent to: “This image cannot be loaded for editing. Upload the file again.” Network or security implementation details are not shown.

### Affected UI surfaces

The managed-media behavior applies wherever `MediaPickerDialog` is used, including:

- Event and monk editors.
- Website CMS About, Privacy, Hero, Map, and rich-text sections.
- Admin Settings logo and hero-image fields.
- Rich-text toolbars that insert Media Library images.

Public Account avatar cropping and the standalone gallery upload flow use separate local-file crop/upload paths and are not changed.

## Contact Design

### Request contract

`POST /api/v1/public/contact` accepts a request-only contract rather than binding directly to the GORM model:

```json
{
  "name": "string, 1-120 Unicode code points",
  "email": "valid email, at most 254 characters",
  "subject": "string, 1-200 Unicode code points",
  "message": "string, 1-5000 Unicode code points",
  "locale": "th | en | de",
  "website": "honeypot; must be empty"
}
```

The backend trims text fields, normalizes email consistently with existing validation utilities, validates locale, and rejects malformed or oversized input before entering the transaction.

If the honeypot contains a value, the endpoint returns the same generic success shape as a valid submission but creates neither a contact row nor an outbox job. The honeypot value is never persisted or logged.

### Persistence

A new reversible migration, `000042_add_contact_communication_locale`, adds a non-null `communication_locale` column to `contact_inquiries`, defaults existing rows to `th`, and adds a check constraint allowing only `th`, `en`, and `de`. Its down migration removes the constraint and column. The GORM model changes with the migration.

The contact service owns one transaction that:

1. Creates the `ContactInquiry` with status `new`.
2. Enqueues an outbox job with kind `contact.notification`.

The job key is `contact:notification:<contact_id>`. Its payload contains only `contact_id`; it does not duplicate name, email, subject, or message. If enqueue fails, the contact insert rolls back.

### Notification delivery

The operations worker handles `contact.notification`. It loads the Contact Inquiry at dispatch time and sends a concise notification through the existing Resend infrastructure.

Required server-only environment values:

- `CONTACT_NOTIFICATION_TO`
- `CONTACT_EMAIL_FROM`
- `RESEND_API_KEY`

The recipient is not derived from public site settings, so a content editor cannot redirect private inquiries. Application logs include the contact ID, outbox job ID, outcome, and trace ID, but never the visitor email or message body.

Existing outbox claiming, ownership, retry, and exponential-backoff behavior remains authoritative. A delivery failure is recorded on the job and retried without changing the visitor-visible submission result.

### Response and errors

Successful real and honeypot submissions return HTTP `201` with the same generic success response without echoing PII.

- Invalid input: HTTP `400` with field errors and trace ID.
- Rate limited: HTTP `429` with error code `CONTACT_RATE_LIMITED` and an integer-seconds `Retry-After` header.
- Transaction failure: rollback, HTTP `500` generic server error, and trace ID.
- Notification failure after commit: no visitor-visible failure; outbox retry handles it.

The current public-contact rate limit remains for this slice. The endpoint also gains explicit body-size constraints and the honeypot. Shared multi-instance rate limiting is handled by the later runtime-hardening workstream.

### Frontend behavior

The public Contact form calls `/api/v1/public/contact` through a focused public feature API and mutation boundary.

- Submit is disabled while one request is pending.
- Validation errors map to the owning fields.
- Entered values remain after a failure.
- Values reset after success.
- Success and error copy exists in Thai, English, and German.
- The honeypot is visually hidden, omitted from the accessibility tree and keyboard order, disables autocomplete, and remains available to basic form-filling bots.

The frontend email path is removed completely: delete the Next.js `/api/send-email` route, `emailService.ts`, `src/lib/resend.ts`, and `src/components/emails/ContactTemplate.tsx`; remove the `resend`, `@react-email/components`, and `@react-email/render` dependencies; and remove frontend examples for `RESEND_API_KEY`, `EMAIL_FROM`, and `CONTACT_EMAIL`.

## API and Documentation

`backend/docs/openapi.yaml` remains aligned with the contact request, generic success response, field errors, stable rate-limit code, and documented status codes.

Production deployment documentation gains:

- Managed-media origin and R2/CDN CORS requirements.
- Backend Contact notification environment values.
- Backend-before-frontend deployment order.
- Operations-worker requirement for Contact notification delivery.

No private recipient or sender values are committed.

## Rollout

1. Configure R2/CDN CORS for the deployed frontend origin.
2. Configure backend and worker Contact notification environment values.
3. Apply the Contact communication-locale migration.
4. Deploy the backend and operations worker.
5. Verify a direct API submission creates one Contact Inquiry and one outbox job.
6. Verify a failed email attempt remains retryable.
7. Deploy the frontend Contact integration.
8. Deploy managed-media UX and remove the unsafe media proxy.
9. Remove the obsolete frontend Resend dependencies and environment values.

Backend is deployed before the new frontend contract. Media deployment must not restore the unsafe proxy during rollback. If managed-media CORS is misconfigured, crop is disabled temporarily while selection and upload remain available.

## Verification and Acceptance

### Managed media

- `/api/media-proxy` returns `404` after deployment.
- Managed R2/CDN images preview and crop successfully.
- Local upload, crop, and authenticated upload remain functional.
- External Media Library items show `External` and cannot invoke crop.
- Manual external URLs remain renderable but clearly unmanaged.
- CORS/load failures produce localized actionable copy.

### Contact

- A valid submission creates exactly one Contact Inquiry and one outbox job.
- An outbox enqueue failure creates neither record.
- A populated honeypot returns generic success and creates neither record.
- Invalid and oversized fields receive field-level `400` responses.
- Rate limiting returns the stable `429` contract and `Retry-After`.
- A Resend failure leaves the Contact Inquiry intact and schedules retry.
- Retrying or rerunning the worker does not send duplicate completed jobs.
- Admin Contacts displays the submitted message immediately after commit.
- Thai, English, and German forms show complete success and error copy.

### Repository checks

- Frontend lint passes for touched files and the repository-wide existing error baseline does not grow.
- Frontend type-check passes.
- Frontend production build passes with explicit HTTPS API and managed-media origins.
- Backend tests for changed handlers/services/outbox behavior pass.
- Backend vet and build pass.
- Browser smoke covers Contact submission and managed/external crop behavior at mobile and desktop widths.

## Success Criteria

- No public application route performs an arbitrary server-side URL fetch.
- Contact submissions survive an email-provider outage.
- Every real Contact submission appears in Admin Contacts.
- Notification recipients are controlled only through server-side deployment configuration.
- Existing external images keep rendering without becoming eligible for crop or automatic import.
- No secrets, visitor PII, or message bodies enter frontend configuration, outbox payloads, or application logs.
