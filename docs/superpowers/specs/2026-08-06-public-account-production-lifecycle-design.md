# Public Account Production Lifecycle Design

## Goal

Make the public-account authentication surface safe to enable in staging and
production, and give an account a complete credential and deletion lifecycle.

## Runtime security

When `PUBLIC_ACCOUNT_AUTH_ENABLED=true`, the backend accepts only
`ENV=development`, `staging`, or `production`. Staging and production require
HTTPS frontend, callback, and account origins; Resend email delivery; secure
cookies; and a non-placeholder `JWT_SECRET` of at least 32 bytes.

`PUBLIC_ACCOUNT_ALLOWED_ORIGINS` is the explicit allowlist used by account
cookie endpoints. It is distinct from `ADMIN_ALLOWED_ORIGINS`, has no wildcard,
and must be contained in `ALLOWED_ORIGINS`. Startup validates these values
before opening the database and gives Fiber only the validated CORS origins.

The Next.js production build rejects an enabled account UI without an HTTPS
`NEXT_PUBLIC_API_URL`. The existing account route feature flag remains the
authoritative UI gate.

## Credentials

Authenticated password users can change their password by submitting their
current password and a policy-valid replacement. Google-only users can add a
password only after completing the existing Google sign-in flow, which creates
a fresh authentication time. A successful password change retains the current
session with a newly issued access token and revokes all other sessions.

Changing email is a two-step operation. A recently authenticated user requests
a new email address; the service stores it only in a single-use, expiring action
token and sends confirmation to that new address. Confirmation atomically
updates `users.email`, invalidates other pending email changes, revokes all
other sessions, and sends a notification to the prior address. Google identity
subjects remain unchanged; the new address is used for account contact and
password login.

## Closure and retention

Closing an account immediately disables it, records `closed_at` and
`purge_after` (30 days later), clears the public avatar, and revokes all
sessions. A single-use email link can reopen the account before `purge_after`;
reopening never restores old sessions.

An idempotent command purges due closed accounts. It removes the account
profile, identities, sessions, action tokens, OAuth flows, stored avatar, and
user. Its remaining security events are anonymized by clearing the account
link, IP prefix, trace ID, and metadata while retaining timestamp, event type,
outcome, and provider.

Avatar records store their object key internally. New uploads delete the prior
known object, and purge deletes only keys under that account's avatar namespace.

## API and UI

The API adds protected password-change and email-change-request endpoints plus
anonymous email-confirmation and reopen endpoints. The account frontend adds
Security controls for password and email management, closure retention status,
and the email-driven reopen page. All new visitor-facing copy is present in
Thai, English, and German. OpenAPI documents every added contract.

## Boundaries

This work does not add CI, browser E2E, GitHub Actions, Docker release changes,
or a built-in scheduler. An external scheduler will invoke the purge command.
