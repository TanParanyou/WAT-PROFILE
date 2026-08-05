# Google Identity Linking Design

## Summary

Allow a public account created with email/password to connect the same Google
identity later from `/[locale]/account`. The link must be explicit, approval-based,
localized, and safe against cross-account linking. Existing Google sign-in and
registration remain separate flows.

## Goals

- Add a production-ready “Connect Google” action under Account sign-in methods.
- Require a recent authentication event; request the current password when the
  session is older than ten minutes.
- Allow linking only when the verified Google email matches the existing account.
- Require an approval link delivered to the existing account email before creating
  the identity association.
- Show pending, cooldown, connected, cancelled, and error states in `th`, `en`, and
  `de`.
- Auto-login after approval and return the user to `/account`.
- Allow unlinking only when a password identity remains and the user reauthenticates.
- Reject a Google identity already linked to another account without changing the
  current session.

## Non-goals

- Linking Google accounts with a different email address.
- Silent linking based only on an email match.
- Changing the existing anonymous Google login/register flow.
- Adding a new provider, MFA, or account merge workflow.

## Chosen approach

Use a dedicated authenticated Google-link start flow while reusing the existing
single-use email approval token and confirmation endpoint semantics.

Alternative approaches were rejected:

1. Reuse the anonymous Google start route and infer the target account from the
   Google email. This does not bind the OAuth attempt to the logged-in account.
2. Link immediately after OAuth. This removes the explicit approval boundary and
   increases the impact of a stolen active session.

## Architecture

### Backend flow

1. The account page calls an authenticated Google-link start endpoint.
2. The service checks the current account, recent `auth_time`, existing Google
   identity, and any active link approval cooldown.
3. The OAuth flow stores the target `user_id` in server-side state and continues
   with the existing PKCE, nonce, signed cookie, and one-time state protections.
4. The callback verifies Google and requires the verified email to match the target
   account. It rejects an identity owned by another account.
5. The callback creates a single-use `link_identity` action token, invalidates the
   previous pending token, sends the approval email, and redirects to the localized
   pending page.
6. The email link consumes the action token in a transaction, inserts the Google
   identity, creates a session, and redirects to `/account`.

The existing anonymous flow keeps its current behavior: an existing account with
the same email receives an approval email, while a new email creates a Google
account.

### Data model

Add nullable `link_user_id` to `auth_oauth_flows`, indexed for cleanup and auditing.
Anonymous Google flows leave it null; authenticated link flows set it to the target
account. No new identity table or credential field is needed.

### API contract

Add typed routes and OpenAPI documentation:

- `GET /api/v1/accounts/google/link/start` — authenticated, recent-auth gated;
  returns an authorization URL and sets the signed flow cookie.
- `GET /api/v1/accounts/google/link/status` — authenticated; returns whether Google
  is connected, whether an approval is pending, and server-calculated retry seconds.
- `DELETE /api/v1/account/providers/google` — authenticated; requires a recent
  reauthentication and password identity to remain.
- Existing `POST /api/v1/accounts/google/link/confirm` remains the single-use
  confirmation endpoint and returns a new session.

New stable error codes:

- `AUTH_GOOGLE_EMAIL_MISMATCH`
- `AUTH_GOOGLE_IDENTITY_IN_USE`
- `AUTH_GOOGLE_ALREADY_LINKED`
- `AUTH_GOOGLE_LINK_PENDING`

Errors retain `trace_id`; cooldown responses include a typed retry duration.

## Frontend UX

Create a focused provider component and hook under the public account feature:

- `useGoogleAccountLink` owns status loading, OAuth redirect state, cooldown timer,
  start, and unlink mutations.
- The provider section renders one of four stable states: connect, pending,
  connected, or unavailable/error.
- A stale session response opens the existing password reauthentication step, then
  retries the link start automatically.
- Google cancellation or browser Back returns to Account with the control enabled
  and no error banner.
- Pending state explains that the approval link was sent, disables duplicate starts,
  and enables a resend attempt after 60 seconds by restarting OAuth.
- Connected state shows the Google provider and a guarded “Disconnect” action.
- Disconnect requires the password, rejects removal of the final sign-in method, and
  refreshes the account/provider state after success.

The approval page confirms the token, adopts the returned session in
`AccountSessionProvider`, and replaces the route with `/account`. This avoids a
stale anonymous provider state in a tab that was opened directly from email.

All new copy and error messages are added to `frontend/src/messages/th.json`,
`en.json`, and `de.json`. Controls retain square public styling, 44px targets,
visible focus, and text-based error states.

## Security and failure handling

- OAuth state remains one-time, short-lived, PKCE-protected, nonce-protected, and
  stored server-side.
- The link flow is bound to the authenticated account before redirecting to Google.
- Google email verification is required; email comparison uses normalized values.
- Existing Google identities never move between accounts.
- The callback never sets a refresh cookie for the pending-approval outcome.
- Approval confirmation is atomic and single-use; races return an invalid/expired
  token response.
- Unlinking requires a password identity to remain and recent authentication.
- Network, OAuth cancellation, mismatch, in-use, cooldown, and expired-link states
  map to localized UI messages without leaking credentials or tokens.

## Verification

Backend:

- Service tests for target-account binding, same-email enforcement, already-linked
  identity rejection, pending cooldown, confirmation, unlink guards, and races.
- Handler tests for auth middleware, envelopes, cookies, redirects, and stable codes.
- `go test ./...`, `go vet ./...`, and `go build -o bin/server ./cmd/app`.

Frontend:

- API/schema tests for new success/error envelopes and retry fields.
- Hook/component tests for pending, cooldown, cancellation/back, reauth retry,
  connected, and unlink states.
- Account message tree parity tests for all locales.
- Targeted lint, TypeScript check, production build, and `git diff --check`.

## Acceptance criteria

- A password account can connect the same Google email from Account without creating
  a second account.
- No link occurs before email approval.
- A different Google email or already-owned Google identity is rejected safely.
- Browser Back/cancel never leaves the connect control stuck.
- Approval confirmation signs the user in and lands on the localized Account page.
- Unlink is unavailable when it would remove the final login method.
- Existing Google login and registration behavior remains unchanged.
