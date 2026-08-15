# Production Community Q&A Design

**Date:** 2026-08-16

**Status:** Proposed; design sections approved in conversation, awaiting written-spec review

**Scope:** Public Community Q&A for verified public accounts
**Product:** WAT-PROFILE

## Context

WAT-PROFILE already has a public-account authentication boundary that is separate
from temple-member records and Admin authentication. Community Q&A is the first
consumer of that public-account identity. It must remain a separate domain rather
than extending Auth tables with discussion state or reusing Website CMS as a forum.

The feature serves Thai, English, and German readers. Anyone may read published
questions. An active public account with a verified email may ask, answer, comment,
vote, and report. Staff moderate and answer officially through the existing Admin
Panel without creating a second public account.

## Goals

- Let visitors find trustworthy answers about the temple, Dharma practice, visits,
  and activities.
- Let verified members ask questions and help one another through answers and
  one-level clarification comments.
- Distinguish community consensus, the question owner's accepted answer, and an
  official answer from the temple.
- Keep the first contribution from each account under review, then allow trusted
  accounts to publish immediately.
- Provide production-grade integrity, moderation, notifications, privacy handling,
  observability, rollout controls, and recovery procedures.
- Preserve the public-account, temple-member, Admin, CMS, and Community boundaries.

## Non-goals for the first release

- Anonymous posting or separate Community aliases
- Nested replies, direct messages, or realtime/WebSocket delivery
- File or image uploads in user-generated content
- Reputation points, badges, leaderboards, or downvotes
- AI-generated answers, AI moderation, or automatic translation
- Automatic hiding based only on report count or vote score
- External forum, search, queue, or cache infrastructure
- Activity registration or temple-member record creation

## Selected approach

Build a deep Community module inside the existing monolith.

```text
Browser
  -> Next.js Community routes
     -> public/account/admin Community API clients
        -> Go Fiber route groups
           -> Community handlers
              -> Community services and policies
                 -> PostgreSQL
                 -> notification outbox worker
                    -> existing account email sender
```

This approach reuses PostgreSQL, public-account Auth, Admin RBAC, localization,
logging, and email delivery. It adds no runtime dependency. Community owns its
tables and policies and consumes only stable identity contracts.

## Scale and service targets

The initial production envelope is:

- Up to 10,000 public accounts
- Up to 1,000 daily active users
- Up to 100 concurrent users
- At least 100,000 questions and 500,000 answers in staging load tests
- API read p95 below 400 ms under the documented staging load
- API mutation p95 below 700 ms, excluding asynchronous email delivery
- 95 percent of notification emails dispatched within 60 seconds

PostgreSQL remains sufficient at this scale. Redis, Elasticsearch, Kafka, and a
separate worker service are intentionally deferred until measured load requires
them.

## Domain boundaries

### Public Account Auth

Community may consume only:

- Authenticated public-account user ID
- Active/disabled/closed account status
- Email-verification state
- Public display name and avatar
- Preferred locale

Community must not read password identities, OAuth subjects, refresh sessions,
action tokens, security events, temple-member private data, or Admin credentials.

### Admin

Admin users moderate and publish official answers through Admin routes protected by
existing authentication and resource permissions. Public accounts never receive
Admin permissions. Public responses expose a translated temple staff label rather
than an Admin user's private profile.

### Website CMS

CMS does not store questions, answers, comments, votes, reports, or moderation
state. Community categories may reuse `MultiLangText`, but Community remains the
source of truth for its records.

## API route boundaries

- Anonymous reads: `/api/v1/public/community/*`
- Public-account mutations: `/api/v1/accounts/community/*`
- Admin operations: `/api/v1/admin/community/*`

The existing `/api/v1/member` group remains reserved for temple-member operations.

## Persistence model

All identifiers use UUIDs. All timestamps use `timestamptz`. All mutable records
include `created_at` and `updated_at`. Production uses numbered reversible SQL
migrations; GORM AutoMigrate is not a production migration authority.

### `community_categories`

- `id`
- `slug`, unique and immutable after first published use
- `name`, `MultiLangText` with exactly `th`, `en`, and `de`
- `description`, optional `MultiLangText`
- `sort_order`
- `is_active`
- `created_by_admin_id`, `updated_by_admin_id`
- timestamps

Initial categories are Dharma and Practice, Visiting the Temple, Activities, and
General Questions, translated in all three locales. Admin may reorder or deactivate
categories. A category referenced by content cannot be hard deleted.

### `community_member_states`

- `user_id`, primary key and foreign key to the public-account user
- `trust_status`: `new`, `trusted`, `restricted`, or `banned`
- `first_approved_at`
- `restricted_until`
- `version`
- timestamps

The row is locked while deciding publication state. An account becomes `trusted`
after one question, answer, or comment is approved. Contributions already pending
remain pending; trust applies only to later submissions. Restriction reasons live in
the append-only moderation audit rather than this current-state table.

### `community_questions`

- `id`
- `author_user_id`, nullable after anonymization
- `category_id`
- `locale`: exactly `th`, `en`, or `de`
- `title`
- `slug`, derived from title and used only for readable URLs
- `body`, restricted Tiptap JSONB
- `body_text`, server-extracted searchable text
- `publication_status`: `pending_review`, `published`, `hidden`, or `deleted`
- `lifecycle_status`: `open`, `answered`, `resolved`, `locked`, or `archived`
- `accepted_answer_id`, nullable
- `published_answer_count`
- `official_answer_count`
- `version`
- `client_request_id`
- publication, hiding, deletion, and standard timestamps

Title length is 10-200 Unicode characters. Extracted body text is 20-20,000
characters. `(author_user_id, client_request_id)` is unique when the author remains
attached.

The migration adds a composite foreign key from `(accepted_answer_id, id)` to
`community_answers(id, question_id)`, backed by a unique constraint on the answer
pair. This guarantees that the accepted answer belongs to the same question.

### `community_answers`

- `id`
- `question_id`
- exactly one of `author_user_id` or `author_admin_id`
- `body`, restricted Tiptap JSONB
- `body_text`
- `publication_status`
- `is_official`
- `official_by_admin_id`, `official_at`
- `helpful_count`, non-negative cached counter
- `version`
- `client_request_id`
- publication, hiding, deletion, and standard timestamps

Extracted answer text is 5-20,000 characters. A staff-authored answer is official by
definition. An authorized staff user may also endorse a published member answer as
official without replacing its original author.

`community_answer_votes` remains the source of truth. `helpful_count` supports
sorting and is updated atomically in the vote transaction. A reconciliation job
repairs counter drift.

### `community_comments`

- `id`
- `question_id`
- optional `answer_id`
- `author_user_id`, nullable after anonymization
- `body`, restricted Tiptap JSONB
- `body_text`
- `publication_status`
- `version`
- `client_request_id`
- publication, hiding, deletion, and standard timestamps

An absent `answer_id` means a question comment. A present `answer_id` means an answer
comment, and the service verifies that the answer belongs to `question_id`. Comments
cannot have children, votes, Accepted status, or Official status. Extracted comment
text is 2-2,000 characters.

### `community_answer_votes`

- `answer_id`
- `user_id`
- `created_at`
- primary key `(answer_id, user_id)`

The service rejects voting on one's own answer, unpublished content, or a locked or
archived question. Toggle operations are atomic and idempotent.

### `community_post_revisions`

- `id`
- exactly one of `question_id`, `answer_id`, or `comment_id`, each backed by a
  foreign key
- `editor_user_id` or `editor_admin_id`
- body/title snapshot before and after the change
- `review_status`: `not_required`, `pending`, `approved`, or `rejected`
- reviewer and decision timestamps
- `created_at`

Before a question has an Accepted or Official answer, owner edits may publish
immediately while retaining history. After either marker exists, a member edit
creates a pending revision and the last approved version stays public.

### `community_reports`

- `id`
- reporter user ID
- exactly one of `question_id`, `answer_id`, or `comment_id`, each backed by a
  foreign key
- reason: `spam`, `harassment`, `misinformation`, `privacy`, `inappropriate`, or
  `other`
- optional details
- state: `open`, `reviewing`, `resolved`, or `dismissed`
- resolver and decision timestamps
- `created_at`
- unique open report per reporter and target

Reports never hide content automatically. Reporter identity is never included in a
public or reported-author response.

### `community_moderation_actions`

Append-only audit records include actor Admin ID, action, target, reason, previous
state, next state, trace ID, and timestamp. Supported actions include approve,
reject, hide, restore, lock, unlock, archive, unarchive, endorse official, remove
official status, restrict account, unrestrict account, and ban account.

### Notifications

`community_notifications` stores recipient, event type, actor/target references,
dedupe key, read timestamp, and creation timestamp.

`community_notification_preferences` stores per-event email choices. Essential
moderation notices remain enabled; engagement email may be disabled.

`community_notification_outbox` stores a unique dedupe key, sanitized template
payload, attempt count, next attempt, delivered timestamp, and dead-letter state.
The payload does not contain credentials, access tokens, report details, or a copied
email address. The worker resolves the current recipient address when dispatching.

## Database indexes and search

- B-tree indexes cover publication/lifecycle state, category, locale, author, and
  activity timestamps.
- Feed pagination uses `(last_activity_at DESC, id DESC)` keysets.
- Answer ordering indexes cover question, publication state, Official status,
  Accepted relation, helpful count, and creation time.
- `pg_trgm` GIN indexes cover normalized title and extracted body text.
- Search always filters `publication_status = published` before ranking results.
- Pending, hidden, and deleted records never enter public search or sitemap output.

Every migration verifies extension availability in the deployment target. Migration
up/down tests run only against a disposable database. Production rollback disables
features first and leaves additive tables intact.

## Rich-text contract

Question and answer bodies support paragraph, bold, bullet list, ordered list, and
link nodes. Images, embeds, raw HTML, scripts, custom styles, and arbitrary node
attributes are rejected.

The backend validates the Tiptap schema, extracts plain text, enforces text limits,
and permits only internal relative links or HTTPS links. The frontend renders through
the existing sanitized rich-text boundary. Neither frontend validation nor
sanitization replaces backend validation.

## State and ranking rules

Publication and lifecycle are separate state machines.

```text
pending_review -> published -> hidden -> published
pending_review -> deleted
published -> deleted

open -> answered -> resolved
open/answered/resolved -> locked -> recalculated open/answered/resolved
open/answered/resolved/locked -> archived
```

- A published answer changes `open` to `answered`.
- An Accepted or Official answer changes the question to `resolved`.
- Removing the last Accepted/Official marker recalculates to `answered` or `open`.
- Locked questions remain readable but accept no member mutations.
- Archived questions remain readable and are removed from normal active feeds.
- Hidden and deleted content is unavailable to anonymous readers.

Answer ordering is deterministic:

1. Official answers
2. Accepted answer
3. Helpful count descending
4. Published timestamp ascending
5. UUID as final tie-breaker

Official and Accepted are independent markers. A question has at most one Accepted
answer and may have multiple Official answers. Helpful voting has no downvote or
public negative score. Authors may answer their own question but may not vote on
their own answer.

Question lifecycle fields and answer counters are updated in the same transaction
as answer publication or marker changes. A reconciliation job detects and repairs
drift.

## Trust and moderation flow

### Member submission

1. Require an active public account with verified email.
2. Validate account and IP rate limits.
3. Validate idempotency key and rich text.
4. Lock the member-state row.
5. Store a new member's contribution as `pending_review`; store a trusted member's
   contribution as `published` unless restricted.
6. Write audit and notification outbox records in the same transaction.
7. Return the authoritative publication state.

Approving the first contribution changes the account to `trusted`. Rejecting it does
not. Reports do not change trust automatically.

### Editing and deletion

- Owners may edit their published content unless the question is locked/archived or
  the content has Accepted/Official significance.
- Significant-content edits create a pending revision; the existing public version
  remains visible until approval.
- Owners may soft delete a question only while it has no published answer.
- A question with published answers requires an Admin removal request so answer
  context is not silently destroyed.
- All Admin state changes require a reason and append a moderation action.

### Reports and enforcement

Reports enter an Admin queue and do not auto-hide content. Admin may dismiss a
report, hide or restore content, lock or archive a question, or restrict/ban an
account. The content author receives a notification for an enforcement action but
never receives reporter identity.

Default configurable rate limits are:

- Questions: 5 per hour and 20 per day per account
- Answers: 20 per hour per account
- Comments: 30 per hour per account
- Votes: 120 per hour per account
- Reports: 10 per hour per account
- Search: 60 per minute per IP

Account and IP limits are both enforced. Payload-size limits run before JSON or rich
text parsing. Rate-limit responses include a stable code and retry duration.

## Permissions

Admin uses existing RBAC with these Community resources/actions:

- `community:read`
- `community:moderate`
- `community:answer_officially`
- `community:manage_categories`
- `community:restrict_members`

Every Admin route applies `PermissionRequired`. Frontend guards improve UX but are
never authoritative.

## Public UX

### Routes

- `/[locale]/community`
- `/[locale]/community/category/[slug]`
- `/[locale]/community/ask`
- `/[locale]/community/q/[id]/[slug]`
- `/[locale]/community/my`
- `/[locale]/community/notifications`

The question UUID is authoritative; slug changes do not break identity. Locale-aware
navigation uses the existing routing helpers.

### Community index

The page uses register rows rather than card grids. Each row shows publication or
lifecycle marker, category, source language, question title, answer count, helpful
summary, and latest activity. Default language follows the current site locale, and
the user may select all languages. Search, category, language, lifecycle, and sort
filters remain in the URL.

### Question detail

The page displays one source language, question content, answers, one-level comments,
Official/Accepted/Helpful markers, and moderation-safe author information. Owners see
pending and revision-review state. Anonymous users see sign-in prompts only at write
actions.

Public visual treatment follows `DESIGN.md`: register rows, square controls, quiet
hairlines, restrained Terracotta markers, no decorative card grid, and no gamified
leaderboard styling. All controls meet keyboard, screen-reader, focus, 44-pixel touch
target, 200-percent zoom, and reduced-motion requirements.

### Member pages

`community/my` lists the current member's questions, answers, pending contributions,
and pending revisions. `community/notifications` provides unread filtering, mark-one,
and mark-all-read actions. The Account menu shows a capped unread count.

## Admin UX

- `/[locale]/admin/community`
- `/[locale]/admin/community/moderation`
- `/[locale]/admin/community/questions/[id]`
- `/[locale]/admin/community/categories`
- `/[locale]/admin/community/members`

The moderation queue supports status/reason/category/language/age filters and oldest
pending first. The decision view includes sanitized content, revision comparison,
prior moderation history, account trust state, and explicit approve/reject/hide/
restrict actions. Every destructive or restrictive action requires confirmation and
a reason.

Staff write Official answers through Admin. Public responses use a localized temple
staff identity. Admin may endorse an existing member answer without changing its
author.

## API contract

### Public reads

- List active categories
- List/search published questions with opaque cursor pagination
- Read published question, answers, and comments

### Public-account mutations

- Create/update/request deletion of a question
- Create/update/delete an answer or comment
- Toggle Helpful vote
- Select or clear Accepted answer
- Submit a report
- Read/mark notifications and update email preferences
- Read the current member's Community activity

### Admin operations

- Read moderation queues and content history
- Approve/reject/hide/restore/lock/archive content
- Post or endorse an Official answer
- Manage categories
- Restrict/unrestrict/ban Community participation
- Read moderation audit entries

All responses use the repository envelope. Public DTOs and viewer-specific state are
separate so anonymous responses remain cacheable. Viewer state includes `has_voted`,
`can_edit`, `can_accept`, and pending ownership state and is always `no-store`.

Opaque cursors contain a validated ordering tuple. Every mutable post carries a
monotonic `version`. PATCH requests include the expected version; stale writes return
HTTP 409 with `COMMUNITY_EDIT_CONFLICT` and the current version.

Create question, answer, and comment requests include a UUID idempotency key. The
same account/key/payload returns the original result; reuse with a different payload
returns HTTP 409.

Stable error codes include:

- `COMMUNITY_ACCOUNT_NOT_ELIGIBLE`
- `COMMUNITY_REVIEW_REQUIRED`
- `COMMUNITY_CONTENT_PENDING`
- `COMMUNITY_CONTENT_NOT_FOUND`
- `COMMUNITY_QUESTION_LOCKED`
- `COMMUNITY_EDIT_CONFLICT`
- `COMMUNITY_ALREADY_REPORTED`
- `COMMUNITY_SELF_VOTE_FORBIDDEN`
- `COMMUNITY_RATE_LIMITED`
- `COMMUNITY_IDEMPOTENCY_CONFLICT`

Validation errors include field-level details. Unknown database or internal errors
return a generic message plus `trace_id` and are logged without request bodies or
user-generated rich-text payloads.

## Caching and SEO

- Published public list/detail responses support ETag and short-lived cache headers.
- Viewer state and all account/admin responses use `no-store`.
- Mutations invalidate affected list, category, detail, sitemap, and metadata caches.
- Initial published question content is server rendered; client mutations use TanStack
  Query and invalidate stable Community query keys.
- The canonical URL uses the question's source locale. Other locale shells remain
  accessible but point canonical metadata to the source-locale URL.
- Only published content enters sitemap output.
- Pending, hidden, deleted, and private member pages use `noindex` and are excluded
  from public caches.

## Notifications

In-app events include new answer, clarification comment, Accepted status, Official
status, first-contribution decision, revision decision, and moderation action.

Email defaults are enabled for new answers, Official status, first-contribution
approval, and moderation decisions. Helpful votes aggregate into one in-app event and
never send one email per vote. Users may disable engagement email by event type.
Essential moderation delivery remains enabled.

Notification rows and email outbox rows are written in the domain transaction. A Go
worker running inside the API process claims batches using `FOR UPDATE SKIP LOCKED`,
uses exponential backoff, deduplicates by event key, and moves exhausted work to a
dead-letter state. Multi-instance operation remains safe. Email failure never rolls
back a published contribution.

## Privacy and retention

- Public responses expose only display name and avatar from the public-account
  profile contract.
- Reporter identity and report details remain private to authorized moderators.
- Account export includes the user's questions, answers, comments, votes,
  notifications, and current Community restrictions.
- Account closure immediately renders the public author as "Former member" and
  removes the avatar.
- Internal author linkage remains for 90 days for appeal and abuse review, then is
  anonymized by the retention worker.
- Soft-deleted standalone content is purged after 90 days.
- Content needed to preserve a thread becomes an authorless tombstone instead of
  disappearing.
- Read notifications are retained for 180 days.
- Delivered outbox rows are retained for 30 days; dead-letter rows for 90 days.
- Moderation audit is retained for 24 months.

These are product defaults, not legal advice. The designated privacy owner must
approve the retention schedule before production member-write is enabled.

## Security

- Public-account and Admin middleware remain authoritative and isolated.
- Authorization checks load the target record and verify ownership/state in the same
  service transaction as the mutation.
- Rate limits apply by account and IP.
- Unsafe rich-text nodes, HTML, oversized payloads, and unsafe link protocols are
  rejected.
- Content rendering uses the existing sanitizer and a restrictive Content Security
  Policy.
- Queries select explicit public fields and never serialize persistence models
  directly.
- Report, moderation, and notification endpoints prevent IDOR through recipient or
  permission checks.
- Logs include event type, IDs, outcome, latency, and trace ID but exclude content,
  email, access tokens, and report details.
- CSRF protection follows the existing public-account bearer-access-token boundary;
  refresh cookies are not accepted as mutation authorization.

## Operations and observability

Feature flags:

- `PUBLIC_COMMUNITY_READ_ENABLED`
- `PUBLIC_COMMUNITY_WRITE_ENABLED`
- `COMMUNITY_EMAIL_ENABLED`
- `NEXT_PUBLIC_COMMUNITY_ENABLED`

Metrics include request rate/error/latency, rate-limit counts, pending moderation
age, report backlog, outbox lag/retries/dead letters, reconciliation drift, and
retention failures. Health reporting exposes worker liveness without exposing queue
payloads.

Background jobs use bounded batches, statement timeouts, graceful shutdown, and
multi-instance-safe row claiming. Cleanup and reconciliation failures alert but do
not block API reads.

## Testing strategy

### Policy and unit tests

- Publication and lifecycle transitions
- First-contribution trust decisions
- Answer ranking and marker coexistence
- Ownership, edit, deletion, voting, and report rules
- Rich-text node/link/size validation
- Cursor and idempotency behavior
- Notification dedupe and retention calculations

### PostgreSQL service tests

- FK, CHECK, UNIQUE, and composite accepted-answer constraints
- Transaction rollback and counter consistency
- Simultaneous first contributions
- Concurrent vote toggles and Accepted changes
- Revision approval and lifecycle recalculation
- Outbox claims across worker instances
- Retention anonymization and tombstone behavior

Tests use an isolated disposable test database, never a developer or production
database.

### Handler and contract tests

- Success envelopes, stable errors, field errors, and trace IDs
- Anonymous/public-account/Admin access isolation
- Ownership and IDOR attempts
- Rate-limit and retry metadata
- OpenAPI and frontend Zod schema agreement

### Frontend and browser acceptance

- Loading, error, empty, pending, published, hidden, locked, and conflict states
- Ask, answer, comment, vote, accept, report, moderation, and notification flows
- Thai, English, and German content and long-label behavior
- Mobile, tablet, desktop, keyboard, screen reader, 200-percent zoom, dark theme,
  and reduced motion
- Anonymous SEO/canonical behavior and non-indexable private states
- Unchanged Admin login/CMS and unchanged public-account Auth flows

### Production-readiness tests

- Migration up/down on disposable PostgreSQL
- Load test with at least 100,000 questions and 500,000 answers
- XSS, unsafe links, oversized payloads, rate-limit bypass, and race scenarios
- Backup and restore drill
- Outbox retry/dead-letter recovery drill
- Feature-flag rollback rehearsal

## Rollout and rollback

1. Deploy additive migrations with all Community flags disabled.
2. Deploy backend routes and workers with member write disabled.
3. Grant Admin Community permissions and enable moderation UI.
4. Seed and verify localized categories.
5. Enable public read for seeded/test content.
6. Enable member write for designated test accounts.
7. Complete contract, browser, security, load, accessibility, backup, and privacy
   gates.
8. Enable production member write.
9. Enable email delivery after outbox metrics and sender configuration pass.

Rollback disables frontend, member-write, email, then public-read flags. Additive
tables remain to preserve content and audit history. Destructive down migrations are
restricted to confirmed disposable environments.

## Delivery slices

1. Foundation: schema, permissions, categories, public reads, search, cache, and SEO
2. Question/trust: create, edit, revisions, first-post moderation, and Admin queue
3. Answers: answers, comments, Accepted/Official markers, and lifecycle updates
4. Helpful/reports: atomic voting, ranking reconciliation, reports, and enforcement
5. Notifications/privacy: in-app events, preferences, outbox email, export,
   anonymization, and retention
6. Production hardening: contract, race, security, load, accessibility, backup,
   observability, staged rollout, and rollback

Each slice remains behind feature flags. Production member write opens only after all
six slices and release gates pass.

## Acceptance criteria

- Anonymous visitors can search and read only published questions in all supported
  locale shells.
- Active verified public accounts can submit one-language questions, answers, and
  one-level comments without gaining temple-member or Admin access.
- A new account's first contribution requires approval; later trusted contributions
  publish immediately unless the account is restricted.
- Accepted, Official, and Helpful states coexist and produce deterministic ranking.
- Reports enter an auditable Admin queue and never auto-hide content.
- Staff answer and moderate through explicit Admin permissions.
- Edits preserve revision history and significant edits require review.
- In-app and optional email notifications are durable, deduplicated, and retryable.
- Public caches and SEO never expose pending, hidden, deleted, or member-private
  state.
- Account export, closure, anonymization, retention, and tombstones follow the stated
  policy.
- Migrations, models, routes, permissions, services, OpenAPI, frontend contracts,
  locale messages, tests, and operations documentation agree.
- All repository checks and production-readiness gates pass before member write is
  enabled.
