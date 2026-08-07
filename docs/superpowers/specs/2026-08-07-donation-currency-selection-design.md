# Donation Currency Selection Design

## Scope

Add an explicit currency control and validation rules for public and Admin
donation entry. The initial release accepts only euros (`EUR`). This fixes the
current mismatch in which the public client schema and API require a currency
but the form provides no input for it, and aligns staff-created records with
the same monetary policy.

## Decision

Public and Admin forms render an accessible, enabled `select` named `currency`
with `EUR` as its only option and default value. The selector makes the
denomination visible before submission and retains an extensible UI boundary
for future server-approved currencies. The UI will not offer arbitrary text
entry or currencies that the temple cannot reconcile.

## Components and data flow

- `DonationForm` adds a labeled currency selector beside the amount input.
- The existing `FormData` submission reads `currency` from that control.
- The existing Zod schema continues to require a three-character currency; it
  will additionally constrain the public form to `EUR`.
- The public feature payload type narrows its currency field to `EUR`, ensuring
  the client cannot submit another denomination through this form.
- New localized label and option copy is added consistently to `th`, `en`, and
  `de` public messages.

The Admin donation list gains an authorized action to open a Staff-Recorded
Donation form. Its request is a dedicated DTO rather than a persistence model.
Backend validation is strengthened for both the existing public payload and
the Admin payload.

## Admin workflow and authorization

- A Staff-Recorded Donation is created as `confirmed` by the authenticated
  staff member. It may use `cash` and does not require a Donation Proof.
- A Self-Reported Donation is created as `pending`; only a dedicated confirm
  action can make it `confirmed`.
- Replace the generic Admin update endpoint with narrowly scoped actions. A
  client must not set status, confirmation actor/time, receipt number, receipt
  object identity, or receipt-dispatch fields.
- Replace single and bulk deletion of Donation Records with an authorized
  cancellation action that requires an internal reason. Confirmed records stay
  retained for the financial audit trail. Record the cancellation actor and
  timestamp with the reason.
- Proof view/download requires the existing donations read permission and
  writes an audit event with the actor and donation ID. It must never expose a
  private storage key.
- Receipt dispatch requires `confirmed` status, an email address, and a
  receipt request. The backend enforces all three before it renders, queues,
  or sends a receipt.

## Receipt terminology and data migration

The product supports a General Donation Receipt, not a tax-deduction document.
Replace the persistence field currently named `tax_receipt_required` with
`receipt_requested`; retire the unused tax-receipt sent fields in favour of the
existing receipt-dispatch fields. Add `cancellation_reason`,
`cancelled_by_id`, and `cancelled_at`. Use a new reversible migration; do not
modify an existing numbered migration. Update model, DTOs, frontend types,
OpenAPI, and email/document code together.

## Error handling and accessibility

The native select remains keyboard operable and uses the existing form styling,
including the 44px minimum control height. Client validation continues to show
the existing localized generic submission error if validation or the request
fails. The selected currency is sent as part of the same multipart request as
the other form fields.

## Verification

- Run frontend lint and TypeScript type-checking.
- Confirm the form submits a multipart `currency=EUR` field.
- Add focused frontend schema tests and backend handler/service tests covering
  public and staff valid input, each validation boundary, status transitions,
  receipt guards, cancellation, and proof-access audit events.
- Check the form at mobile and desktop widths in Thai, English, and German.

## Validation boundary

Validation is deliberately duplicated. Frontend validation gives immediate
localized feedback, while backend validation is authoritative for every client
that calls the public API directly.

### Public frontend

- Accept a positive amount with at most two decimal places.
- Accept only `EUR` as the currency and only the existing supported donation
  methods.
- Require a non-blank donor name, a syntactically valid email, a valid locale,
  and a donation date.
- Treat the phone as optional, but validate it when present.
- Require one proof file and accept only PDF, JPEG, PNG, or WebP within the
  10 MB limit before submitting.

### Admin frontend

- Use a staff-specific Zod schema and request type. Require amount, `EUR`,
  date, and an allowed method; use the public donor fields only when supplied.
- Permit `cash` without a proof. Do not render or accept a proof field for a
  Staff-Recorded Donation in this slice.
- Show the receipt-request choice only when an email is supplied, and use
  field-level validation errors rather than a generic failure only.

### Backend

- Centralize shared rules for a non-positive or invalid-precision amount,
  non-`EUR` currency, invalid donation date, invalid optional phone number,
  and category validity. Apply source-specific rules at the public and staff
  request boundaries.
- Public requests reject unsupported method or locale, blank donor name,
  invalid email, and missing proof. Staff requests allow cash without proof,
  but reject a receipt request without a valid email.
- Require one proof smaller than or equal to 10 MB. Determine its allowed type
  from inspected file bytes, not the client-supplied MIME header; accept only
  PDF, JPEG, PNG, or WebP.
- Reject invalid requests before persisting a Donation Record or uploading the
  private proof. Preserve the error envelope with field-level validation
  details where the client can display them, and never expose a private storage
  key.
