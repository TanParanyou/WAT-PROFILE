# Group Event Registration Design

**Date:** 2026-08-15

**Status:** Approved for implementation planning

**Scope:** Public client registration, member/guest management, admin approval, participant check-in, backend contracts, and database changes

## Summary

WAT-PROFILE will support group event registration through one primary contact and one to ten named participants. A registration can be created by either a guest or an authenticated member. Every new registration starts as `pending`, immediately reserves capacity for all active participants, and requires admin approval before becoming `confirmed`.

Guests manage or cancel a registration through a secret link delivered by email. Authenticated members can also manage registrations linked to their member profile. Before the registration deadline, a pending registration can add, update, or remove participants. A confirmed registration can update participant details or remove participants; adding a participant returns the group to `pending` for admin review. Removing a participant immediately releases one seat. Cancelling the group releases all its active seats.

The first release does not include a waitlist, split payments, paid registration, group sizes above ten, or per-event group-size configuration.

## Goals

- Let visitors register without creating an account.
- Prefill contact information for authenticated members without trusting client-supplied identity fields.
- Represent every attendee explicitly so capacity, dietary needs, accessibility needs, and check-in remain accurate.
- Prevent overbooking and duplicate active registrations under concurrent requests.
- Give guests a secure self-service path for edits and cancellation.
- Preserve a calm, accessible, multilingual public journey in Thai, English, and German.
- Reuse the existing admin permission boundary and durable operation outbox.

## Non-goals

- Waitlists or automatic promotion from a waitlist.
- Registration fees or donation checkout.
- Partial admin approval within one group.
- Public search by confirmation code.
- Adding participants after the registration deadline.
- Group sizes above ten or a configurable group-size limit in the first release.
- Automatic confirmation without admin review.

## Confirmed product decisions

1. Registration is hybrid: guests and authenticated members can submit the same form.
2. One registration has one primary contact and one to ten named participants.
3. The primary contact may or may not be a participant.
4. A new `pending` registration reserves all participant seats immediately.
5. Admin approval changes the whole group from `pending` to `confirmed`.
6. Guests receive an email link that can manage or cancel the registration.
7. Pending groups can be edited before the deadline.
8. Confirmed groups can update or remove participants before the deadline. Adding a participant returns the whole group to `pending`.
9. Removing participants releases capacity immediately; cancelling releases all capacity.
10. Check-in is recorded per participant.

## User journey

### Event detail

The event detail response includes a public registration summary:

- whether registration is enabled;
- registration deadline;
- maximum participants, or `null` for unlimited;
- active registered participant count;
- remaining seats, or `null` for unlimited;
- derived availability: `available`, `disabled`, `closed`, or `full`.

The page shows one primary registration action only when availability is `available`. Disabled registration does not show an action. Closed and full registration show a concise explanatory state instead of an active button. Exact remaining capacity is shown when the event has a limit.

### Registration form

The form is a single responsive journey rather than a multi-page wizard:

1. Enter primary contact name, email, and optional phone number.
2. Choose whether the primary contact is attending.
3. Add named participants up to the group limit of ten.
4. Enter optional dietary restrictions, accessibility or special needs, and notes for each participant.
5. Accept the current privacy notice.
6. Review the event, participant count, and contact details.
7. Submit once.

At least one participant is required. When the contact is attending, the client creates a participant entry from the contact name but keeps the fields editable. Member data is prefilled as a convenience; the member may correct contact details before submission.

### Submission result

On success, the client shows:

- the `pending` state and a plain-language explanation of admin approval;
- a non-secret confirmation code for support conversations;
- event title, date, location, and number of reserved seats;
- a reminder to check email for the management link;
- add-to-calendar and return-to-event actions.

Email delivery is durable but asynchronous. A registration remains valid if immediate email delivery fails. The outbox retries delivery, and the success screen tells the registrant to contact the temple with the confirmation code if no email arrives.

## Registration lifecycle

### Group status

```text
pending -> confirmed -> cancelled
   |             |
   +-----------> cancelled
```

- `pending`: reserves capacity and awaits admin approval.
- `confirmed`: approved by admin and still reserves capacity.
- `cancelled`: terminal for public operations and does not reserve capacity.

Legacy rows with group status `attended` remain readable and are treated like
`confirmed` for active-count queries. New check-in flows do not write `attended`
to the group; attendance belongs to participant rows.

Admin rejection uses `cancelled` with an admin cancellation origin and a required reason. The first release does not introduce a separate `rejected` status.

Adding a participant to a confirmed group before the deadline changes the group to `pending`, reserves the additional seat atomically, records an audit event, and notifies admins that review is required again. Removing a participant does not change a confirmed group back to pending.

### Participant attendance status

```text
registered -> attended
     |
     +-----> cancelled
```

- `registered`: active participant who consumes capacity.
- `attended`: checked in and continues to count as an attendee.
- `cancelled`: removed before attendance and no longer consumes capacity.

Participant rows are not physically deleted through public or admin workflows. Status changes preserve the audit trail.
An admin may correct an accidental check-in from `attended` back to `registered`;
this is an audited administrative correction rather than a normal lifecycle path.

## Data model

### `event_registrations`

The existing table remains the group record and primary contact boundary. It keeps the existing identifier, event relationship, member relationship, contact fields, status, confirmation code, cancellation fields, and timestamps. The schema adds:

- `locale VARCHAR(5) NOT NULL DEFAULT 'th'` constrained to `th`, `en`, or `de`;
- `privacy_notice_version VARCHAR(50)` for compatibility with legacy rows;
- `privacy_consent_at TIMESTAMPTZ` for compatibility with legacy rows;
- `manage_token_hash VARCHAR(64)` with a partial unique index when present;
- `manage_token_expires_at TIMESTAMPTZ` for compatibility with legacy rows;
- `cancellation_origin VARCHAR(20)` constrained to `registrant` or `admin` when present.

The service requires privacy consent and management-token values for every new
registration. The columns remain nullable only because existing rows have no
historical consent evidence or recoverable plaintext management token. Admin can
issue a new management link for a legacy registration after verifying the
contact request.

`registration_type` remains `guest` or `member`, but the server derives it. `member_id` is populated only from authenticated server context. Neither field is accepted from the public request body.

The confirmation code is a public reference, not an authentication secret. It cannot be used alone to view, edit, or cancel a registration.

### `event_registration_participants`

A new child table stores:

- `id BIGSERIAL PRIMARY KEY`;
- `registration_id INTEGER NOT NULL` referencing `event_registrations(id)` with `ON DELETE CASCADE`;
- `first_name VARCHAR(100) NOT NULL`;
- `last_name VARCHAR(100) NOT NULL`;
- `dietary_restrictions TEXT NOT NULL DEFAULT ''`;
- `special_needs TEXT NOT NULL DEFAULT ''`;
- `additional_notes TEXT NOT NULL DEFAULT ''`;
- `attendance_status VARCHAR(20) NOT NULL DEFAULT 'registered'` constrained to `registered`, `attended`, or `cancelled`;
- `attended_at TIMESTAMPTZ`;
- `cancelled_at TIMESTAMPTZ`;
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`;
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`.

Indexes support registration lookup, active-capacity counting, and admin attendance filters. Capacity counts participant rows whose attendance status is `registered` or `attended` and whose parent registration status is `pending`, `confirmed`, or the legacy `attended` state.

### Existing-data migration

The migration pair must be the next unused six-digit version at implementation time. It will:

1. add the group-management columns;
2. create the participant table and indexes;
3. backfill one participant for every existing registration using the existing registrant name and participant-specific notes; cancelled groups produce a cancelled participant, attended groups or rows with `attended = true` produce an attended participant, and all other groups produce a registered participant;
4. preserve all existing registration IDs and statuses;
5. add a partial unique index on `(event_id, lower(email))` for group statuses `pending`, `confirmed`, and legacy `attended`;
6. fail rather than silently discard data if existing active duplicate emails violate the unique index;
7. provide a down migration that removes only the newly introduced table, columns, constraints, and indexes.

Existing participant-specific columns on `event_registrations` remain during the compatibility release but receive no new writes. Removing them requires a later migration after the new model has been deployed and verified.

## API design

All responses use the existing project success/error envelope. OpenAPI and frontend contracts change in the same implementation.

### Public event detail

`GET /api/v1/public/events/{slug}` adds:

```json
{
  "registration": {
    "enabled": true,
    "deadline": "2026-09-10T21:59:00Z",
    "max_participants": 80,
    "registered_count": 65,
    "remaining": 15,
    "availability": "available"
  }
}
```

The backend derives this object. The client does not infer availability from dates or counts independently. Deadline comparisons use the stored instant while visitor-facing presentation follows `Europe/Berlin` semantics.

### Create registration

The existing endpoint remains:

`POST /api/v1/public/events/{id}/register`

Request:

```json
{
  "locale": "th",
  "contact": {
    "first_name": "Somchai",
    "last_name": "Jaidee",
    "email": "somchai@example.com",
    "phone": "+49 30 000000"
  },
  "participants": [
    {
      "first_name": "Somchai",
      "last_name": "Jaidee",
      "dietary_restrictions": "",
      "special_needs": "",
      "additional_notes": ""
    }
  ],
  "privacy_notice_version": "2026-08"
}
```

The server records the consent timestamp. It ignores no identity or status fields because the request contract does not contain them. A dedicated request type is used instead of binding directly into the GORM model.

Response data contains the registration ID, confirmation code, status, participant count, and event summary. It never returns the management token.

### Guest management

The email link opens a localized frontend management route with the opaque token in the URL fragment so the secret is not sent in HTTP referrers or ordinary server access logs. The frontend reads the fragment and sends the token in the request body to these public endpoints:

- `POST /api/v1/public/event-registrations/manage` — resolve the group and return the editable projection;
- `PATCH /api/v1/public/event-registrations/manage` — update contact or participant data;
- `POST /api/v1/public/event-registrations/cancel` — cancel the complete group.

The token is at least 256 bits of cryptographically secure randomness. Only a SHA-256 hash is stored. It expires when the event starts and is revoked when the registration is cancelled. Editing participants is additionally blocked after the registration deadline.

When an event has no registration deadline, its edit cutoff is the event start.
An event start is the `start_date` plus `start_time` in `Europe/Berlin`; when
`start_time` is absent, the start is 00:00 on `start_date` in that time zone.

### Member management

Authenticated members can list and manage registrations linked to their server-derived `member_id`:

- the existing `GET /api/v1/member/registrations` returns the group and participant projection;
- `PATCH /api/v1/member/registrations/{id}` applies the same edit policy as the guest management endpoint;
- `POST /api/v1/member/registrations/{id}/cancel` applies the same cancellation policy.

Member authorization is ownership-based and enforced by the backend. Frontend route guards are only a UX boundary.

### Admin operations

The existing admin list remains group-oriented and gains an explicit typed response. A registration detail view displays contact information, participant rows, dietary and special-needs summaries, and the confirmation code.

Admin operations include:

- confirm or cancel a whole registration;
- require a cancellation reason for admin cancellation;
- edit group and participant data after the public deadline;
- check in or undo check-in for an individual participant;
- issue or rotate a management link after verifying a legacy registrant;
- export group and participant data with unambiguous columns.

Admin capacity-increasing edits use the same event lock and capacity rule as
public edits. The first release has no capacity override.

Every mutation retains `PermissionRequired("events", action)` and writes an audit record without logging management tokens or complete request bodies.

## Backend design

### Contracts and handlers

Request-only structs live outside persisted models. Handlers parse and validate path parameters and payload shape, obtain optional authenticated member context, call the registration service, and map domain error codes to HTTP responses. Handlers do not access GORM directly.

### Registration service transaction

Create and capacity-increasing edits use one database transaction:

1. lock the event row with `SELECT ... FOR UPDATE`;
2. verify that the event is active, registration is enabled, the deadline has not passed, and the event has not started;
3. normalize the contact email by trimming whitespace and lowercasing the domain and comparison value;
4. validate one to ten participants and all field limits;
5. count active participants for `pending` and `confirmed` groups;
6. compare current capacity plus the requested positive delta with `max_participants`;
7. create or update the group and participant rows;
8. enqueue notification work in the operation outbox;
9. commit atomically.

Locking the event row serializes capacity-changing operations for one event. The partial unique index is the final duplicate-registration guard. Database constraint failures map to the stable duplicate domain error rather than an internal error.

Capacity-decreasing edits and cancellations also use a transaction so status changes, audit metadata, and notification outbox records remain consistent.

### Availability

The backend returns:

- `disabled` when registration is not enabled;
- `closed` when the deadline has passed or the event has started;
- `full` when remaining capacity is zero;
- `available` otherwise.

Unlimited events return `max_participants: null` and `remaining: null`.
When no deadline is configured, registration remains open until the derived
event start.

## Frontend design

Public registration code belongs under `frontend/src/features/public/event-registration/`:

- `types.ts`: public DTOs and mutation contracts;
- `schema.ts`: Zod validation for contact, participants, and consent;
- `api.ts`: public create/manage/cancel request functions;
- `queries.ts`: TanStack Query keys, detail query, and mutations;
- `components/EventRegistrationPanel.tsx`: availability and primary action;
- `components/EventRegistrationForm.tsx`: React Hook Form composition;
- `components/ParticipantFields.tsx`: one participant boundary;
- `components/EventRegistrationSuccess.tsx`: pending confirmation state;
- `components/RegistrationManagement.tsx`: token-backed edit and cancellation journey.

The event detail component composes the registration panel but does not perform HTTP requests itself. Successful create, edit, or cancel mutations invalidate both the event detail registration summary and the owning registration query.

The form uses a dedicated localized route at
`/[locale]/events/[slug]/register`. A group form with up to ten repeated
participants is too large for the shared modal at mobile widths and 200% zoom.
The email management journey uses
`/[locale]/events/registrations/manage#token=...`; the fragment is removed from
the visible address after the client reads it.

The public interface follows the existing register design: square controls, quiet rules, one clear graphite primary action, no decorative cards, and no blue registration-specific palette. All copy exists in `th`, `en`, and `de`.

## Validation and error handling

Client validation improves feedback but never replaces backend validation.

Stable domain error codes:

| Code | HTTP | Client behavior |
|---|---:|---|
| `REGISTRATION_DISABLED` | 409 | Explain that this event is not accepting registrations. |
| `REGISTRATION_CLOSED` | 409 | Refresh the event summary and show the deadline state. |
| `EVENT_FULL` | 409 | Refresh capacity and show the remaining-seat state. |
| `ALREADY_REGISTERED` | 409 | Offer member navigation or instructions to use the emailed management link. |
| `GROUP_LIMIT_EXCEEDED` | 422 | Attach the error to the participant section. |
| `VALIDATION_ERROR` | 422 | Map field errors to contact or participant inputs. |
| `MANAGE_TOKEN_INVALID` | 401 | Show an invalid-link state without exposing registration data. |
| `MANAGE_TOKEN_EXPIRED` | 410 | Explain that self-service has ended and provide the temple contact route. |
| `REGISTRATION_NOT_EDITABLE` | 409 | Explain the deadline or terminal status that prevents the action. |

Unexpected errors preserve the common trace ID and show a retry action. A failed mutation never produces an optimistic capacity change.

## Privacy and security

- Public requests are rate limited by IP and normalized email.
- The public handler binds only dedicated input contracts, preventing mass assignment of IDs, member relationships, statuses, timestamps, or tokens.
- Management tokens are never logged, returned by list APIs, stored in plaintext, or included in analytics.
- Email templates contain the secret link, but admin screens and exports contain only the confirmation code.
- Public event responses expose counts only, never registrant identities.
- Privacy consent records the accepted notice version and timestamp.
- Participant and contact data remain included in the existing personal-data discovery, export, and redaction workflows.
- Error responses do not reveal whether an arbitrary email belongs to a member account.

## Email notifications

The operation outbox sends localized messages for:

1. registration received (`pending`) with the management link;
2. registration confirmed;
3. registration cancelled by admin with the reason;
4. registration cancelled by the registrant;
5. a confirmed registration changed and returned to `pending`.

Messages use the registration locale and include the event date in `Europe/Berlin`. Delivery retries are idempotent, and each event type has a stable idempotency key per registration revision.

## Accessibility and localization

- All registration and management copy is complete in Thai, English, and German.
- Repeated participant sections have programmatic headings such as “Participant 2”.
- Add/remove controls include the participant name in their accessible label.
- Validation errors are associated with their fields and summarized at the form level after submission.
- Keyboard focus moves to the first invalid field or the success heading.
- Destructive cancellation requires explicit confirmation and does not rely on color alone.
- Controls remain at least 44px high, support 200% zoom, and preserve visible focus indicators.
- Long German labels and Thai text are tested at mobile, tablet, and desktop widths.

## Testing strategy

### Backend

- Service tests cover disabled, closed, started, full, unlimited, duplicate, and successful registration paths.
- Transaction tests submit concurrent groups against the last available seats and prove that only one succeeds.
- Edit tests cover positive and negative participant deltas, the ten-person limit, confirmed-to-pending revision, and deadline enforcement.
- Cancellation tests prove capacity release and token revocation.
- Token utility tests cover generation, hashing, invalid tokens, and expiry.
- Handler tests cover contract validation, stable error mapping, optional member linkage, and response redaction.
- Migration verification covers an empty database and an upgrade with existing registrations.

### Frontend

- Schema tests cover contact participation, one-to-ten participants, nested field errors, and privacy consent.
- Component tests cover available, disabled, closed, full, submitting, conflict, success, invalid-token, and expired-token states when a suitable React test runner is available.
- Query tests cover cache invalidation after create, edit, and cancel.
- Manual verification covers keyboard-only use, screen readers, 200% zoom, reduced motion, all three locales, and mobile/desktop layouts.

The repository currently lacks a working aggregate TypeScript test command. Any frontend tests added under the existing setup are documented as present but not executable through an aggregate runner until that infrastructure is repaired.

## Rollout and compatibility

1. Deploy the additive migration and backend read/write compatibility first.
2. Backfill participant rows for existing registrations.
3. Deploy typed admin responses and participant-aware admin screens.
4. Deploy the public event summary and registration client.
5. Keep legacy participant-specific group columns through one compatibility release.
6. Observe duplicate, full-capacity, email-delivery, and cancellation error rates.
7. Remove legacy columns only in a separately reviewed migration after production verification.

The feature can be disabled per event through the existing `registration_enabled` field. No global bypass or frontend-only feature flag can override backend availability.

## Acceptance criteria

- A guest or authenticated member can register one to ten named participants.
- The server derives identity and status fields and never mass-assigns the persisted model.
- Pending and confirmed participants consume capacity; cancelled participants do not.
- Concurrent requests cannot exceed event capacity.
- Active duplicate registrations for the same event and normalized contact email cannot be created.
- Admin can confirm or cancel a group and check in participants individually.
- Guests can securely edit before the deadline and cancel before the event starts.
- Members can manage only registrations linked to their member profile.
- All notification paths are durable and localized.
- Public and admin contracts, OpenAPI, migrations, models, permissions, and frontend types remain synchronized.
- Relevant backend tests, vet, build, frontend lint, type-check, and build pass before completion.
