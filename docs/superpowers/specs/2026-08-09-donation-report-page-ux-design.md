# Donation Report Page UX Design

## Goal

Move the public donation-report form out of the home-page donation section so
the payment details stay calm and scannable, while reporting a completed bank
transfer or PayPal donation has a focused, accessible flow.

## Scope

- Keep the existing donation section as payment guidance: QR code, bank details,
  and one primary CTA.
- Add a locale-aware public route at `/donate/report` that contains the report
  form.
- Preserve the existing proof-backed `POST /public/donations` contract and its
  server-side validation.
- Improve client-side validation feedback, without weakening backend checks.

This does not create a payment checkout, a member-only donation flow, or a
multi-step wizard.

## Information Architecture

### Donation section

The home-page donation section continues to show the QR code and bank-transfer
details. It no longer renders `DonationForm` inline. A single primary action,
"Report a donation", links to `/donate/report`; its localized label is present
in Thai, English, and German.

### Report page

The page uses the public-site register layout: a short eyebrow, an `h1`, a
brief statement that a transfer/PayPal proof is required, and an unobtrusive
link back to donation instructions. It has one responsive form, constrained to
a readable measure rather than a wide two-column field grid.

The form is visually divided by labelled fieldsets and 1px rules:

1. **Donation details:** amount in EUR, donation date, transfer method, and
   optional active donation category.
2. **Contact and proof:** donor name, email, optional phone, proof upload,
   optional receipt request, and required privacy acknowledgement.

On desktop, short related fields may share a row (amount/currency and
method/date); mobile always uses one reading-order column. The final submit
control is full width on small screens and preserves the existing 44px minimum
target and focus treatment.

## Validation and Error Handling

The page uses React Hook Form with the existing Zod schema as the client-side
validation source. The backend remains authoritative and validates the same
rules before storing a proof or creating a record.

| Field | Client behavior | Backend behavior |
|---|---|---|
| Amount | Required, positive, at most 2 decimals | Re-validates positive EUR amount |
| Currency | Visible `EUR` select, fixed to EUR | Rejects any other value |
| Date | Required ISO date | Re-validates date |
| Method | Bank transfer or PayPal only | Re-validates allowed source |
| Category | Empty means general support; selected ID must be positive | Must resolve to an active category |
| Name / email | Both required; email format checked | Re-validates both |
| Phone | Optional; validates format when provided | Re-validates format when provided |
| Proof | Required PDF/JPEG/PNG/WebP, 1 byte–10 MB | Re-checks size and detected type |
| Privacy | Required checkbox | Required acknowledgement |
| Receipt | Optional; email required when checked | Re-validates email dependency |

Field errors appear beneath their related control after blur and after a submit
attempt. The first invalid field receives focus on submit. A server response
with field-level errors maps to those same controls; other errors remain in an
accessible form-level alert. A successful submission replaces the form area
with the existing localized success state and a link back to donation details.

## Data and Component Boundaries

- `DonationSection` owns payment guidance and the CTA only.
- A dedicated page composes a `DonationReportForm` feature component.
- `DonationReportForm` owns React Hook Form state and submits through the
  existing public donation API boundary.
- A feature query loads active categories through TanStack Query. It supports
  loading, retry, and an empty general-support fallback; it does not use a
  component `useEffect` fetch.
- The existing public donation schema remains the common client validation
  contract; it may gain localized error-message injection rather than storing
  English strings in the schema.

## Accessibility and Localization

- Each section uses `fieldset` and `legend`; every control has a visible label.
- Error text uses `aria-describedby`, invalid controls use `aria-invalid`, and
  form-level errors use `role="alert"`.
- File requirements are stated before opening the picker, not only after a
  failure.
- All new copy and validation messages are added to `th`, `en`, and `de`.
- The page is checked at mobile, tablet, and desktop widths for Thai and longer
  German text.

## Acceptance Criteria

- The home page no longer contains the donation-report fields or proof input.
- The CTA reaches `/[locale]/donate/report` and the browser back action retains
  normal navigation behavior.
- Invalid input exposes a local, understandable error at the field and cannot
  submit until corrected.
- A direct API request with invalid amount, date, phone, category, proof, or
  privacy acknowledgement is still rejected by the backend.
- A valid report remains pending, stores its private proof, and preserves the
  existing confirmation behavior.
- The page has equivalent Thai, English, and German content and works with
  keyboard-only operation.

## Out of Scope

- Payment processing or card checkout.
- Saving unfinished reports or multi-step resume.
- A public account/member history integration; its token audience remains a
  separate design decision.
