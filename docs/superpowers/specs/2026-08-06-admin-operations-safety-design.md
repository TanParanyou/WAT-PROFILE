# Admin Operations Safety Design

## Goal

Make three existing Admin domains safe to operate: media lifecycle, donation reconciliation, and personally identifiable data requests.

## Scope and delivery order

The work ships as three independently deployable vertical slices:

1. Media safety
2. Donation operations
3. Personal data requests

Each slice includes its schema, API, RBAC policy, Admin UI, OpenAPI contract, and tests. No slice depends on an unfinished later slice.

## 1. Media safety

`Media` remains the canonical uploaded object. Existing records reference it by URL rather than foreign key, so the backend must return a computed list of references before archival. The first release scans event images, monk images, gallery image/thumbnail URLs, member profile images, user avatars, and Website CMS section payloads for the media URL.

Deleting a media record becomes an archive operation. The Admin UI fetches the affected references and requires explicit confirmation. An archived asset is excluded from the normal library and can be restored for 30 days. A scheduled purge command permanently removes the database row and the R2 object only after `purge_after` is due. A restoration clears both archive timestamps.

The library also flags image assets whose `metadata.alt` lacks any of `th`, `en`, or `de`; it does not block publication.

## 2. Donation operations

A Donation Record has an origin: `self_reported` or `staff_recorded`. A self-reported bank-transfer or PayPal donation requires an uploaded Donation Proof and begins `pending`; a staff-recorded cash or bank-statement record may be created directly as `confirmed` by an authorized administrator. Existing records migrate to `staff_recorded` to preserve current behavior.

On a self-reported submission, the backend creates the Donation Record and proof metadata atomically, then sends a localized Donation Acknowledgement. Delivery failure is audited and retryable by staff; it must not discard the record. Confirming a donation is an explicit action, records the confirmer and timestamp, and is irreversible through the standard UI; cancellation remains available with a reason.

Receipt Dispatch is a separate staff action available only to a Confirmed Donation. It sends a localized, plain-text receipt email containing only receipt number, amount, currency, date, and the temple contact channel, then records dispatch time and operator. PDF generation and payment-provider integrations are out of scope.

## 3. Personal data requests

An authorized staff member creates a Personal Data Request using an email and optional requester name. The system searches Contact Inquiry, Event Registration, Donation Record, Member, and User/Profile data, then presents candidate records. Nothing is selected or changed automatically.

The staff member explicitly selects records and performs either export or erasure. Export produces a one-time, short-lived download with only selected records. Erasure nulls or replaces identifying fields but retains the minimum accounting fields for donations: receipt number, amount, currency, date, category, method, status, and non-identifying notes. It does not delete a user account automatically.

Every state transition and resulting operation writes an audit log without embedding personal-data payloads. Automatic retention and automatic erasure are intentionally deferred until the temple adopts a retention policy with its accounting/legal owner.

## Shared constraints

- Use the existing Go/Fiber/GORM service boundary; handlers do not query GORM directly.
- Every new Admin route uses `PermissionRequired` and is documented in `backend/docs/openapi.yaml`.
- Preserve Thai, English, and German user-facing copy.
- Use SQL migration `000029` and a reversible down migration; production continues with `DB_AUTO_MIGRATE=false`.
- Do not put payment proofs, personal-data exports, or personal-data values in audit `changes`.
- The current dirty worktree is unrelated; implementation must not absorb or reformat it.

## Acceptance scenarios

1. An image used by a Website CMS page cannot be archived without listing that page; it can be restored within 30 days.
2. A self-reported transfer without proof is rejected; with proof it creates a Pending Donation and sends an acknowledgement.
3. A staff member must confirm a donation before Receipt Dispatch becomes available.
4. A personal-data search returns candidates only; selected records require a separate confirm operation before erasure.
5. Erasing a donation removes donor identity and proof access while retaining the accounting fields above.
