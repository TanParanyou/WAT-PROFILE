# Event Registration Deadline Validation Design

## Goal

Prevent Admin users from saving an event whose registration deadline is later
than the event's effective start time. This keeps the Admin configuration aligned
with the public registration policy, which closes registration at the earlier of
the configured deadline and the event start.

## Behaviour

- A configured `registration_deadline` must be less than or equal to the
  event's effective start time.
- The effective start uses the event date and optional event start time in the
  existing `Europe/Berlin` timezone. If no start time is supplied, the event
  starts at 00:00 on its start date.
- The Admin form reports a localized field error before submitting.
- The backend validates the same rule for both create and update requests so
  direct API callers cannot bypass the rule.
- Events without a deadline remain valid; registration still closes when the
  event starts.

## Implementation shape

- Add a pure backend event validation helper and unit tests for valid, invalid,
  missing-time, and boundary-equal cases.
- Call the helper from the event create/update handler after request parsing and
  before persistence, returning the existing bad-request response shape.
- Extend the Admin event Zod refinement to compare the date-only deadline with
  the event start date/time using the same Berlin semantics, and add the error
  message to `th`, `en`, and `de` Admin message files.

## Error handling and compatibility

- Existing events are not migrated or changed automatically.
- Existing registration availability logic remains authoritative at runtime.
- A validation failure is a client error and does not write the event or its
  resource assignments.

## Verification

- Backend unit tests, `go test ./...`, and `go vet ./...`.
- Frontend TypeScript, targeted lint, JSON validation, and production build.
- Manual Admin check for a deadline before, equal to, and after event start.
