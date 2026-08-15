# Production Community Q&A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a production-ready, public-read and verified-member-write Community Q&A with first-post moderation, Accepted/Official/Helpful answers, notifications, privacy controls, and Admin operations.

**Architecture:** Add a deep Community module to the existing Next.js/Go/PostgreSQL monolith. Anonymous reads use `/api/v1/public/community`, public-account mutations use `/api/v1/accounts/community`, and staff operations use RBAC-protected `/api/v1/admin/community`; Community consumes only the stable public-account identity contract and reuses the existing durable operation outbox.

**Tech Stack:** Go 1.24, Fiber v2, GORM, PostgreSQL, Next.js 16 App Router, React 19, strict TypeScript, TanStack Query, Zod, React Hook Form, Tiptap 3, next-intl, Tailwind CSS 4.

**Approved design:** `docs/superpowers/specs/2026-08-16-community-qa-design.md` is the product and architecture source of truth for this plan.

## Global Constraints

- Supported content and interface locales are exactly `th`, `en`, and `de`.
- Initial scale is 10,000 accounts, 1,000 daily active users, and 100 concurrent users.
- API read p95 must stay below 400 ms; mutation p95 below 700 ms, excluding email delivery.
- 95 percent of Community email jobs must dispatch within 60 seconds.
- PostgreSQL is the source of truth; production uses numbered reversible migrations and must not use GORM AutoMigrate as a competing authority.
- Reuse `operation_outbox`, `OperationOutboxService`, and `cmd/operations-worker`; do not add Redis, Elasticsearch, Kafka, or a second queue.
- Public-account, temple-member, Admin, Website CMS, and Community boundaries remain separate.
- Community may read only public-account user ID, account status, email-verification state, display name, avatar, and preferred locale.
- No anonymous posting, nested replies, direct messages, uploads, realtime delivery, reputation points, downvotes, AI moderation, or automatic translation.
- Rich text permits only document, paragraph, text, bold, bullet list, ordered list, list item, and safe link nodes/marks.
- Public UI follows `DESIGN.md`: register rows, square controls, role-based theme tokens, restrained markers, WCAG 2.2 AA, 44-pixel targets, keyboard support, 200-percent zoom, and reduced motion.
- Frontend components never construct API URLs or own duplicate remote state; API, schemas, and TanStack Query hooks stay in `src/features/public/community/`.
- Admin operations use `PermissionRequired`; frontend permission checks are UX only.
- Update `backend/docs/openapi.yaml`, Go DTOs, frontend Zod schemas, and TypeScript types together.
- Keep unrelated worktree changes untouched. Execute this plan in an isolated worktree because the main workspace may contain concurrent Event Registration work.

---

## File and module map

### Backend domain

- `backend/internal/community/errors.go`: stable Community error codes and typed errors.
- `backend/internal/community/policy.go`: lifecycle, trust, edit, delete, ranking, and permission-free domain decisions.
- `backend/internal/community/richtext.go`: restricted Tiptap validation and plain-text extraction.
- `backend/internal/community/cursor.go`: typed opaque cursor encoding/decoding.
- `backend/internal/community/contracts.go`: request inputs and public/account/admin DTOs shared by handlers and services.
- `backend/internal/community/*_test.go`: pure policy and contract tests.

### Backend persistence and services

- `backend/internal/models/rich_text_document.go`: single-document JSONB value type.
- `backend/internal/models/community_content.go`: category, member state, question, answer, comment, vote, revision.
- `backend/internal/models/community_moderation.go`: report, moderation action, rate-limit bucket.
- `backend/internal/models/community_notification.go`: notification and preference models.
- `backend/internal/services/community_query_service.go`: public list/detail/search and member activity reads.
- `backend/internal/services/community_question_service.go`: question create/edit/delete request and trust gate.
- `backend/internal/services/community_interaction_service.go`: answer, comment, Accepted, Official, and vote mutations.
- `backend/internal/services/community_moderation_service.go`: queue, decisions, categories, reports, restrictions, audit.
- `backend/internal/services/community_notification_service.go`: in-app events/preferences and transactional outbox enqueue.
- `backend/internal/services/community_email_service.go`: localized Community email rendering and dispatch.
- `backend/internal/services/community_rate_limit_service.go`: PostgreSQL-backed account/IP limits.
- `backend/internal/services/community_retention_service.go`: anonymization, retention, counter reconciliation.

### Backend HTTP and operations

- `backend/internal/handlers/community_public_handler.go`: cacheable anonymous reads.
- `backend/internal/handlers/community_account_handler.go`: public-account mutations and viewer/member state.
- `backend/internal/handlers/community_admin_handler.go`: RBAC-protected moderation and category operations.
- `backend/internal/routes/routes.go`: route registration and Admin handler registry.
- `backend/internal/config/community.go`: feature flags, rate limits, and retention config.
- `backend/cmd/operations-worker/main.go`: Community email, retention, and reconciliation dispatch wiring.
- `backend/migrations/000045_create_community_qa.{up,down}.sql`: schema, constraints, indexes, and `pg_trgm`.
- `backend/migrations/000046_seed_community_qa.{up,down}.sql`: localized categories and Admin permission.

### Frontend public feature

- `frontend/src/features/public/community/types.ts`: domain types.
- `frontend/src/features/public/community/schema.ts`: Zod response/input schemas.
- `frontend/src/features/public/community/api.ts`: anonymous and account API functions.
- `frontend/src/features/public/community/server-api.ts`: server-safe public detail/list fetches.
- `frontend/src/features/public/community/queries.ts`: query keys, queries, mutations, invalidation.
- `frontend/src/features/public/community/form-schema.ts`: localized form validation.
- `frontend/src/features/public/community/components/`: register list, question detail, answer, comment, vote, report, forms, notifications.
- `frontend/src/features/public/community/editor/`: restricted Tiptap extensions/editor/renderer.
- `frontend/src/app/[locale]/(client)/community/`: public/member routes.

### Frontend Admin

- `frontend/src/features/admin-community/types.ts`: Admin DTO types.
- `frontend/src/features/admin-community/schema.ts`: Admin response schemas.
- `frontend/src/features/admin-community/queries.ts`: Admin Query hooks.
- `frontend/src/features/admin-community/components/`: queue, review, category, member-restriction UI.
- `frontend/src/services/communityAdminService.ts`: Admin HTTP boundary.
- `frontend/src/app/[locale]/admin/community/`: Admin routes.

---

### Task 1: Create Community schema, constraints, and GORM models

**Files:**
- Create: `backend/migrations/000045_create_community_qa.up.sql`
- Create: `backend/migrations/000045_create_community_qa.down.sql`
- Create: `backend/migrations/000046_seed_community_qa.up.sql`
- Create: `backend/migrations/000046_seed_community_qa.down.sql`
- Create: `backend/internal/models/rich_text_document.go`
- Create: `backend/internal/models/community_content.go`
- Create: `backend/internal/models/community_moderation.go`
- Create: `backend/internal/models/community_notification.go`
- Create: `backend/internal/models/community_test.go`
- Modify: `backend/internal/config/config.go`
- Modify: `docs/DATABASE.md`

**Interfaces:**
- Produces: `models.RichTextDocument`, `CommunityCategory`, `CommunityMemberState`, `CommunityQuestion`, `CommunityAnswer`, `CommunityComment`, `CommunityAnswerVote`, `CommunityPostRevision`, `CommunityReport`, `CommunityModerationAction`, `CommunityNotification`, `CommunityNotificationPreference`, and `CommunityRateLimitBucket`.
- Produces database tables and constraints consumed by every later backend task.

- [ ] **Step 1: Write failing persistence-shape tests**

```go
func TestCommunityQuestionTableAndDefaults(t *testing.T) {
	q := CommunityQuestion{}
	if q.TableName() != "community_questions" {
		t.Fatalf("table = %q", q.TableName())
	}
	if CommunityPublicationPublished != "published" {
		t.Fatalf("published constant changed")
	}
}

func TestRichTextDocumentRoundTrip(t *testing.T) {
	want := RichTextDocument(`{"type":"doc","content":[{"type":"paragraph"}]}`)
	value, err := want.Value()
	if err != nil { t.Fatal(err) }
	var got RichTextDocument
	if err := got.Scan(value); err != nil { t.Fatal(err) }
	if string(got) != string(want) { t.Fatalf("got %s", got) }
}
```

- [ ] **Step 2: Run model tests and verify RED**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/models -run 'Community|RichTextDocument'`

Expected: FAIL because Community models and `RichTextDocument` do not exist.

- [ ] **Step 3: Add the JSONB value type and focused GORM models**

```go
type RichTextDocument json.RawMessage

func (d RichTextDocument) Value() (driver.Value, error) {
	if len(d) == 0 { return []byte(`{"type":"doc","content":[{"type":"paragraph"}]}`), nil }
	if !json.Valid(d) { return nil, errors.New("invalid rich text JSON") }
	return []byte(d), nil
}

func (d *RichTextDocument) Scan(value interface{}) error {
	raw, ok := value.([]byte)
	if !ok { return fmt.Errorf("unsupported rich text value %T", value) }
	if !json.Valid(raw) { return errors.New("invalid rich text JSON") }
	*d = append((*d)[:0], raw...)
	return nil
}
```

Define exact enum constants from the spec and give every model an explicit
`TableName()`. Use nullable UUID pointers for anonymizable authors and exactly-one
CHECK constraints for revision/report targets and answer authors.

- [ ] **Step 4: Write the reversible schema migration**

The up migration creates these tables in this order: `community_categories`,
`community_member_states`, `community_questions`, `community_answers`,
`community_comments`, `community_answer_votes`, `community_post_revisions`,
`community_reports`, `community_moderation_actions`, `community_notifications`,
`community_notification_preferences`, and `community_rate_limit_buckets`. Use the
complete column matrix, enums, timestamps, and nullability in the approved design.
The non-obvious relational constraints must include:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE community_answers
  ADD CONSTRAINT community_answers_id_question_uniq UNIQUE (id, question_id);
ALTER TABLE community_questions
  ADD CONSTRAINT community_questions_accepted_answer_fk
  FOREIGN KEY (accepted_answer_id, id)
  REFERENCES community_answers(id, question_id)
  DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE community_answers
  ADD CONSTRAINT community_answers_one_author_check
  CHECK ((author_user_id IS NOT NULL)::int + (author_admin_id IS NOT NULL)::int = 1);

ALTER TABLE community_post_revisions
  ADD CONSTRAINT community_post_revisions_one_target_check
  CHECK ((question_id IS NOT NULL)::int + (answer_id IS NOT NULL)::int +
         (comment_id IS NOT NULL)::int = 1);

ALTER TABLE community_reports
  ADD CONSTRAINT community_reports_one_target_check
  CHECK ((question_id IS NOT NULL)::int + (answer_id IS NOT NULL)::int +
         (comment_id IS NOT NULL)::int = 1);

ALTER TABLE community_answer_votes
  ADD CONSTRAINT community_answer_votes_pk PRIMARY KEY (answer_id, user_id);

ALTER TABLE community_rate_limit_buckets
  ADD CONSTRAINT community_rate_limit_buckets_pk
  PRIMARY KEY (subject_hash, subject_type, surface, window_started_at);
```

Add every CHECK, FK, unique constraint, partial unique idempotency index, keyset
index, answer ranking index, and `gin_trgm_ops` search index named in the design.
The down migration drops tables in reverse FK order and does not drop `pg_trgm`,
because another feature may use the extension.

- [ ] **Step 5: Seed localized categories and Admin permission**

`000046` inserts deterministic UUIDs and complete `th/en/de` JSON for the four
categories. It updates only active Admin roles named `admin`:

```sql
UPDATE roles
SET permissions = jsonb_set(
  COALESCE(permissions, '{}'::jsonb),
  '{community}',
  '"all"'::jsonb,
  true
)
WHERE name = 'admin' AND admin_access = true;
```

The seed down migration removes the `community` permission key and deactivates the
four deterministic categories. It does not hard-delete referenced categories or
Community content; the schema down migration remains the explicit destructive step
for a disposable database.

- [ ] **Step 6: Keep development AutoMigrate and database docs aligned**

Add the Community models to `MigrateModels()` after account models. Document migration
numbers, `pg_trgm`, production `DB_AUTO_MIGRATE=false`, and disposable up/down test
instructions in `docs/DATABASE.md`.

- [ ] **Step 7: Verify schema and models**

Run:

```bash
cd backend
GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/models -run 'Community|RichTextDocument'
GOCACHE=/private/tmp/wat-profile-go-cache go test ./...
GOCACHE=/private/tmp/wat-profile-go-cache go vet ./...
```

Expected: PASS. If `DATABASE_URL_TEST` exists, also migrate up then down against that
disposable target and confirm version returns to 44.

- [ ] **Step 8: Commit schema foundation**

```bash
git add backend/migrations/000045_create_community_qa.* backend/migrations/000046_seed_community_qa.* backend/internal/models backend/internal/config/config.go docs/DATABASE.md
git commit -m "feat(community): add production schema"
```

---

### Task 2: Implement pure Community policies and contracts

**Files:**
- Create: `backend/internal/community/errors.go`
- Create: `backend/internal/community/contracts.go`
- Create: `backend/internal/community/policy.go`
- Create: `backend/internal/community/richtext.go`
- Create: `backend/internal/community/cursor.go`
- Create: `backend/internal/community/policy_test.go`
- Create: `backend/internal/community/richtext_test.go`
- Create: `backend/internal/community/cursor_test.go`

**Interfaces:**
- Produces: `community.DomainError`, `ErrorCode`, `DeterminePublication`, `RecalculateLifecycle`, `CanEdit`, `CanDeleteQuestion`, `ValidateRichText`, `EncodeCursor`, `DecodeCursor`, and DTO/input types used by services and handlers.
- Consumes: Community enum constants and `models.RichTextDocument` from Task 1.

- [ ] **Step 1: Write policy tests first**

```go
func TestDeterminePublicationRequiresReviewForNewMember(t *testing.T) {
	got, err := DeterminePublication(models.CommunityTrustNew, false)
	if err != nil { t.Fatal(err) }
	if got != models.CommunityPublicationPendingReview { t.Fatalf("got %s", got) }
}

func TestRecalculateLifecycleKeepsResolvedWhileOfficialExists(t *testing.T) {
	got := RecalculateLifecycle(LifecycleInput{PublishedAnswers: 2, OfficialAnswers: 1})
	if got != models.CommunityLifecycleResolved { t.Fatalf("got %s", got) }
}
```

- [ ] **Step 2: Run policy tests and verify RED**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/community`

Expected: FAIL because package functions are undefined.

- [ ] **Step 3: Define stable errors and policy signatures**

```go
type ErrorCode string

const (
	CodeAccountNotEligible ErrorCode = "COMMUNITY_ACCOUNT_NOT_ELIGIBLE"
	CodeReviewRequired ErrorCode = "COMMUNITY_REVIEW_REQUIRED"
	CodeContentPending ErrorCode = "COMMUNITY_CONTENT_PENDING"
	CodeContentNotFound ErrorCode = "COMMUNITY_CONTENT_NOT_FOUND"
	CodeQuestionLocked ErrorCode = "COMMUNITY_QUESTION_LOCKED"
	CodeEditConflict ErrorCode = "COMMUNITY_EDIT_CONFLICT"
	CodeAlreadyReported ErrorCode = "COMMUNITY_ALREADY_REPORTED"
	CodeSelfVoteForbidden ErrorCode = "COMMUNITY_SELF_VOTE_FORBIDDEN"
	CodeRateLimited ErrorCode = "COMMUNITY_RATE_LIMITED"
	CodeIdempotencyConflict ErrorCode = "COMMUNITY_IDEMPOTENCY_CONFLICT"
)

type DomainError struct {
	Code ErrorCode
	Message string
	Field string
	RetryAfter time.Duration
	CurrentVersion int
}
```

Implement policy functions as pure functions. `RecalculateLifecycle` returns
`resolved` when Accepted or Official exists, `answered` when published answers exist,
otherwise `open`. Locked and archived transitions are explicit Admin operations.

- [ ] **Step 4: Add restricted rich-text validation**

```go
type RichTextLimits struct { MinText, MaxText int }

func ValidateRichText(raw models.RichTextDocument, limits RichTextLimits) (string, error)
```

Walk `richtext.Node`; accept only doc, paragraph, text, bullet list, ordered list, and
list item. Accept only bold and link marks. Permit relative paths beginning `/` or
absolute HTTPS URLs. Reject images, headings, embeds, raw HTML, unknown attrs, invalid
list nesting, and text outside the supplied limits. Return whitespace-normalized
plain text for search.

- [ ] **Step 5: Add cursor and DTO contracts**

```go
type QuestionCursor struct { LastActivityAt time.Time `json:"last_activity_at"`; ID uuid.UUID `json:"id"` }
func EncodeCursor(cursor QuestionCursor) string
func DecodeCursor(value string) (QuestionCursor, error)
```

Define typed list/detail/viewer/member/admin request and response structs in
`contracts.go`; JSON field names must match the design and future OpenAPI schemas.

- [ ] **Step 6: Verify pure domain package**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/community`

Expected: PASS, including unsafe link, unsupported node, invalid cursor, lifecycle,
edit, delete, ranking, and trust cases.

- [ ] **Step 7: Commit domain policy**

```bash
git add backend/internal/community
git commit -m "feat(community): define domain policies"
```

---

### Task 3: Add production config and PostgreSQL rate limiting

**Files:**
- Create: `backend/internal/config/community.go`
- Create: `backend/internal/config/community_test.go`
- Create: `backend/internal/services/community_rate_limit_service.go`
- Create: `backend/internal/services/community_rate_limit_service_test.go`
- Modify: `backend/cmd/app/main.go`
- Modify: `backend/internal/routes/routes.go`
- Modify: `backend/.env.example`
- Modify: `frontend/.env.example`
- Modify: `docs/DEPLOYMENT.md`

**Interfaces:**
- Produces: `config.CommunityConfig`, `LoadCommunityConfig(AccountAuthConfig)`, `CommunityRateLimitService.Consume`, and `ConsumeTx`.
- Consumes: `models.CommunityRateLimitBucket` from Task 1 and `community.CodeRateLimited` from Task 2.

- [ ] **Step 1: Write config invariant tests**

```go
func TestCommunityWriteRequiresReadAndAccountAuth(t *testing.T) {
	t.Setenv("PUBLIC_COMMUNITY_READ_ENABLED", "false")
	t.Setenv("PUBLIC_COMMUNITY_WRITE_ENABLED", "true")
	_, err := LoadCommunityConfig(AccountAuthConfig{Enabled: true})
	if err == nil { t.Fatal("expected invalid flag combination") }
}
```

- [ ] **Step 2: Verify config test RED**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/config -run Community`

Expected: FAIL because `LoadCommunityConfig` does not exist.

- [ ] **Step 3: Implement config with safe defaults**

```go
type CommunityConfig struct {
	ReadEnabled bool
	WriteEnabled bool
	EmailEnabled bool
	QuestionLimit RateLimit
	AnswerLimit RateLimit
	CommentLimit RateLimit
	VoteLimit RateLimit
	ReportLimit RateLimit
	SearchLimit RateLimit
	AuthorLinkRetention time.Duration
	SoftDeleteRetention time.Duration
	NotificationRetention time.Duration
	ModerationAuditRetention time.Duration
}
```

Defaults: all flags false; rate limits exactly match the design; retention defaults
are 90 days, 90 days, 180 days, and 24 months. Write requires read and account Auth.
Email requires write. Staging/production email requires the existing Resend sender.

- [ ] **Step 4: Write atomic rate-limit tests**

Test that the first N `ConsumeTx` calls succeed, N+1 returns a `DomainError` with
`COMMUNITY_RATE_LIMITED`, account and IP buckets are independent, and raw IP text is
absent from persisted rows.

- [ ] **Step 5: Implement the DB-backed limiter**

```go
type RateLimitRequest struct {
	SubjectType string
	Subject string
	Surface string
	Limit int
	Window time.Duration
}

func (s *CommunityRateLimitService) Consume(ctx context.Context, input RateLimitRequest) error
func (s *CommunityRateLimitService) ConsumeTx(ctx context.Context, tx *gorm.DB, input RateLimitRequest) error
```

Hash normalized subjects with SHA-256. Use one atomic PostgreSQL insert with
`ON CONFLICT DO UPDATE SET count = community_rate_limit_buckets.count + 1`
and `RETURNING count`; reject counts above the configured limit and include exact
retry duration.

- [ ] **Step 6: Wire and document flags without mounting routes yet**

Load `communityCfg` in `cmd/app/main.go`, add `communityCfg config.CommunityConfig`
as the final parameter of the existing `routes.SetupRoutes` signature, and retain it
for Task 4 route registration. Add concrete env examples with false defaults and
document flag dependencies and rollout order.

- [ ] **Step 7: Verify and commit config/rate limits**

Run:

```bash
cd backend
GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/config -run Community
GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/services -run CommunityRateLimit
GOCACHE=/private/tmp/wat-profile-go-cache go vet ./...
```

Expected: PASS.

```bash
git add backend/internal/config/community* backend/internal/services/community_rate_limit_service* backend/cmd/app/main.go backend/internal/routes/routes.go backend/.env.example frontend/.env.example docs/DEPLOYMENT.md
git commit -m "feat(community): add rollout config and limits"
```

---

### Task 4: Build categories and cacheable public read APIs

**Files:**
- Create: `backend/internal/services/community_query_service.go`
- Create: `backend/internal/services/community_query_service_test.go`
- Create: `backend/internal/handlers/community_public_handler.go`
- Create: `backend/internal/handlers/community_public_handler_test.go`
- Modify: `backend/internal/routes/routes.go`
- Modify: `backend/docs/openapi.yaml`

**Interfaces:**
- Produces: `NewCommunityQueryService`, `ListCategories`, `ListQuestions`, `GetQuestion`, and public DTO responses.
- Consumes: Task 1 models, Task 2 contracts/cursor, Task 3 search limiter/config.

- [ ] **Step 1: Write public visibility/query tests**

```go
func TestListQuestionsReturnsOnlyPublishedRows(t *testing.T) {
	service, db := newCommunityQueryFixture(t)
	seedCommunityQuestion(t, db, models.CommunityPublicationPublished, "visible")
	seedCommunityQuestion(t, db, models.CommunityPublicationPendingReview, "pending")
	page, err := service.ListQuestions(context.Background(), community.QuestionListInput{Limit: 20})
	if err != nil { t.Fatal(err) }
	if len(page.Items) != 1 || page.Items[0].Title != "visible" { t.Fatalf("items %#v", page.Items) }
}
```

- [ ] **Step 2: Run service test and verify RED**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/services -run CommunityQuery`

Expected: FAIL because the query service does not exist.

- [ ] **Step 3: Implement explicit-field public queries**

```go
func (s *CommunityQueryService) ListCategories(ctx context.Context) ([]community.CategoryDTO, error)
func (s *CommunityQueryService) ListQuestions(ctx context.Context, input community.QuestionListInput) (community.QuestionPageDTO, error)
func (s *CommunityQueryService) GetQuestion(ctx context.Context, id uuid.UUID) (community.QuestionDetailDTO, error)
```

Use explicit `Select` clauses, joins only to public account profiles, published-state
filters before search, validated category/locale/lifecycle filters, and `(last_activity_at,
id)` keysets. Map closed/null authors to `author_kind=former_member`. Return answers
in Official, Accepted, Helpful, published-time, UUID order.

- [ ] **Step 4: Add public handlers and ETag behavior**

Register when `ReadEnabled`:

```text
GET /api/v1/public/community/categories
GET /api/v1/public/community/questions
GET /api/v1/public/community/questions/:id
```

Search consumes the IP `search` bucket. Set `Cache-Control: public, max-age=60,
stale-while-revalidate=300`. Compute ETag from result version/latest activity; return
304 on matching `If-None-Match`. Invalid UUID/cursor/filter returns coded 400; hidden
or absent detail returns coded 404.

- [ ] **Step 5: Add OpenAPI contracts and handler tests**

Document all query parameters, envelopes, cursor, category, author, question,
answer, comment, and stable errors. Handler tests assert 200, 304, 400, 404, cache
headers, and absence of email/internal IDs.

- [ ] **Step 6: Verify and commit public API**

Run:

```bash
cd backend
GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/services -run CommunityQuery
GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/handlers -run CommunityPublic
GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/routes -run AdminPolicy
```

Expected: PASS.

```bash
git add backend/internal/services/community_query_service* backend/internal/handlers/community_public_handler* backend/internal/routes/routes.go backend/docs/openapi.yaml
git commit -m "feat(community): expose published questions"
```

---

### Task 5: Build public Community list/detail frontend

**Files:**
- Create: `frontend/src/features/public/community/types.ts`
- Create: `frontend/src/features/public/community/schema.ts`
- Create: `frontend/src/features/public/community/schema.test.ts`
- Create: `frontend/src/features/public/community/api.ts`
- Create: `frontend/src/features/public/community/api.test.ts`
- Create: `frontend/src/features/public/community/server-api.ts`
- Create: `frontend/src/features/public/community/queries.ts`
- Create: `frontend/src/features/public/community/components/CommunityIndex.tsx`
- Create: `frontend/src/features/public/community/components/QuestionRegisterRow.tsx`
- Create: `frontend/src/features/public/community/components/QuestionDetail.tsx`
- Create: `frontend/src/features/public/community/components/AnswerList.tsx`
- Create: `frontend/src/features/public/community/components/CommunityFilters.tsx`
- Create: `frontend/src/app/[locale]/(client)/community/page.tsx`
- Create: `frontend/src/app/[locale]/(client)/community/category/[slug]/page.tsx`
- Create: `frontend/src/app/[locale]/(client)/community/q/[id]/[slug]/page.tsx`
- Modify: `frontend/src/components/layout/Navbar.tsx`
- Modify: `frontend/src/messages/th.json`
- Modify: `frontend/src/messages/en.json`
- Modify: `frontend/src/messages/de.json`
- Modify: `frontend/package.json`

**Interfaces:**
- Produces: validated public Community TypeScript API, stable `communityKeys`, SSR detail/list fetches, and read-only routes.
- Consumes: Task 4 public DTO/OpenAPI contract.

- [ ] **Step 1: Write schema tests with real envelopes**

```ts
test("question detail rejects private author fields", () => {
  const result = questionDetailEnvelopeSchema.safeParse({
    success: true,
    data: { ...publishedQuestionFixture, author: { ...publicAuthorFixture, email: "private@example.com" } },
  });
  assert.equal(result.success, false);
});
```

- [ ] **Step 2: Add and run the Community test script**

Add:

```json
"test:community": "tsx --test src/features/public/community/*.test.ts src/features/public/community/**/*.test.ts"
```

Run: `cd frontend && npm run test:community`

Expected: FAIL because schemas and APIs do not exist.

- [ ] **Step 3: Implement strict schemas, API functions, and query keys**

```ts
export const communityKeys = {
  all: ["community"] as const,
  questions: (filters: CommunityQuestionFilters) => ["community", "questions", filters] as const,
  question: (id: string) => ["community", "question", id] as const,
  viewer: (id: string) => ["community", "viewer", id] as const,
  myActivity: ["community", "my-activity"] as const,
  notifications: ["community", "notifications"] as const,
};
```

Anonymous reads use `publicApi`; account-only calls use the existing `accountApi` so
tokens remain memory-only. `server-api.ts` uses `API_BASE`, `cache: "no-store"`, and
the same Zod parsers.

- [ ] **Step 4: Build register-style pages and all async states**

Use URL-owned filters, opaque cursor load-more, default current locale, all-language
option, semantic headings, register rows, and complete loading/error/empty states.
The detail page server-renders published content and emits canonical metadata using
the question source locale and UUID/slug route.

- [ ] **Step 5: Add navigation and three-locale copy**

Show the Community link only when `NEXT_PUBLIC_COMMUNITY_ENABLED=true`. Add complete
`Community` message trees to `th`, `en`, and `de`; add a message test that recursively
compares key paths.

- [ ] **Step 6: Verify and commit public reads**

Run:

```bash
cd frontend
npm run test:community
./node_modules/.bin/eslint src/features/public/community 'src/app/[locale]/(client)/community' src/components/layout/Navbar.tsx
./node_modules/.bin/tsc --noEmit
npm run build
```

Expected: PASS; route output includes Community index, category, and question detail.

```bash
git add frontend/src/features/public/community 'frontend/src/app/[locale]/(client)/community' frontend/src/components/layout/Navbar.tsx frontend/src/messages frontend/package.json
git commit -m "feat(community): add public question browser"
```

---

### Task 6: Implement questions, first-post trust, revisions, and member activity

**Files:**
- Create: `backend/internal/services/community_question_service.go`
- Create: `backend/internal/services/community_question_service_test.go`
- Create: `backend/internal/handlers/community_account_handler.go`
- Create: `backend/internal/handlers/community_account_handler_test.go`
- Modify: `backend/internal/routes/routes.go`
- Modify: `backend/docs/openapi.yaml`

**Interfaces:**
- Produces: `CreateQuestion`, `UpdateQuestion`, `RequestQuestionDeletion`, `ListMyActivity`, and account routes.
- Consumes: policies/contracts from Task 2, limiter from Task 3, query service from Task 4, and public-account locals from `PublicAccountRequired`.

- [ ] **Step 1: Write transactional trust/idempotency tests**

```go
func TestCreateQuestionKeepsConcurrentFirstPostsPending(t *testing.T) {
	fixture := newCommunityQuestionFixture(t)
	results := createTwoQuestionsConcurrently(t, fixture)
	for _, result := range results {
		if result.PublicationStatus != models.CommunityPublicationPendingReview {
			t.Fatalf("status = %s", result.PublicationStatus)
		}
	}
}
```

Also test verified-email requirement, restricted accounts, identical idempotent retry,
different-payload idempotency conflict, optimistic version conflict, immediate edit,
pending significant revision, and deletion request after an answer exists.

- [ ] **Step 2: Run tests and verify RED**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/services -run CommunityQuestion`

Expected: FAIL because the service is missing.

- [ ] **Step 3: Implement service interfaces and row locking**

```go
type CommunityEventSink interface {
	RecordTx(ctx context.Context, tx *gorm.DB, event community.Event) error
}

func (s *CommunityQuestionService) CreateQuestion(ctx context.Context, actor uuid.UUID, clientIP string, input community.CreateQuestionInput) (community.QuestionMutationDTO, error)
func (s *CommunityQuestionService) UpdateQuestion(ctx context.Context, actor, questionID uuid.UUID, input community.UpdateQuestionInput) (community.QuestionMutationDTO, error)
func (s *CommunityQuestionService) RequestQuestionDeletion(ctx context.Context, actor, questionID uuid.UUID, version int) error
```

Inside one transaction: verify user status/email, consume account and IP limits, lock
or create member state with `FOR UPDATE`, validate category and rich text, enforce
idempotency, decide publication, persist revision/audit event, and return authoritative
state. Use a no-op event sink only while `WriteEnabled` remains false; Task 13 replaces
it before rollout.

- [ ] **Step 4: Register account routes and map errors**

When `WriteEnabled`, mount under `PublicAccountRequired`:

```text
POST   /api/v1/accounts/community/questions
PATCH  /api/v1/accounts/community/questions/:id
DELETE /api/v1/accounts/community/questions/:id
GET    /api/v1/accounts/community/activity
GET    /api/v1/accounts/community/questions/:id/viewer
```

Require `Idempotency-Key` UUID on create. Map typed errors to 400/403/404/409/422/429
with `trace_id`, field errors, retry seconds, and current version.

- [ ] **Step 5: Update OpenAPI and handler tests**

Test anonymous rejection, disabled/unverified rejection, pending 202 response,
published 201 response, idempotent replay, conflict, and DTO privacy.

- [ ] **Step 6: Verify and commit question authoring**

Run backend service, handler, route, full test, and vet commands. Expected: PASS.

```bash
git add backend/internal/services/community_question_service* backend/internal/handlers/community_account_handler* backend/internal/routes/routes.go backend/docs/openapi.yaml
git commit -m "feat(community): add moderated questions"
```

---

### Task 7: Build restricted editor, ask/edit forms, and member activity UI

**Files:**
- Create: `frontend/src/features/public/community/editor/extensions.ts`
- Create: `frontend/src/features/public/community/editor/CommunityRichTextEditor.tsx`
- Create: `frontend/src/features/public/community/editor/CommunityRichTextContent.tsx`
- Create: `frontend/src/features/public/community/editor/editor.test.ts`
- Create: `frontend/src/features/public/community/form-schema.ts`
- Create: `frontend/src/features/public/community/form-schema.test.ts`
- Create: `frontend/src/features/public/community/components/QuestionForm.tsx`
- Create: `frontend/src/features/public/community/components/MyCommunityActivity.tsx`
- Create: `frontend/src/app/[locale]/(client)/community/ask/page.tsx`
- Create: `frontend/src/app/[locale]/(client)/community/my/page.tsx`
- Create: `frontend/src/app/[locale]/(client)/community/q/[id]/edit/page.tsx`
- Modify: `frontend/src/features/public/community/api.ts`
- Modify: `frontend/src/features/public/community/queries.ts`
- Modify: `frontend/src/messages/th.json`
- Modify: `frontend/src/messages/en.json`
- Modify: `frontend/src/messages/de.json`

**Interfaces:**
- Produces member question mutations and restricted editor components.
- Consumes Task 5 frontend contracts and Task 6 account API.

- [ ] **Step 1: Write editor/form tests**

```ts
test("question schema counts extracted text, not JSON bytes", () => {
  const result = createQuestionSchema(messages).safeParse({
    locale: "th",
    category_id: categoryId,
    title: "คำถามเกี่ยวกับการปฏิบัติธรรม",
    body: paragraphDocument("เนื้อหาที่มีความยาวเพียงพอสำหรับคำถาม"),
  });
  assert.equal(result.success, true);
});
```

Assert editor extensions exclude image, heading, blockquote, code, strike, and raw
HTML while retaining paragraph, bold, lists, and link.

- [ ] **Step 2: Run tests and verify RED**

Run: `cd frontend && npm run test:community`

Expected: FAIL because editor/form modules are missing.

- [ ] **Step 3: Implement editor and form contracts**

```ts
export const communityExtensions = [
  StarterKit.configure({ heading: false, blockquote: false, code: false, codeBlock: false, strike: false, horizontalRule: false }),
  Link.configure({ openOnClick: false, protocols: ["https"] }),
];
```

Use React Hook Form + Zod, UUID idempotency keys, unsaved-change protection, API field
errors, 409 conflict UI, pending-review success state, and locale-aware return links.

- [ ] **Step 4: Build member activity states**

Show questions, answers, pending contributions, and pending revisions as register
rows. Anonymous users receive an Auth login prompt; loading account restoration never
briefly renders a forbidden state.

- [ ] **Step 5: Verify and commit authoring UI**

Run Community tests, targeted ESLint, type-check, and build. Expected: PASS.

```bash
git add frontend/src/features/public/community 'frontend/src/app/[locale]/(client)/community' frontend/src/messages
git commit -m "feat(community): add question authoring"
```

---

### Task 8: Implement answers, comments, Accepted, and Official lifecycle

**Files:**
- Create: `backend/internal/services/community_interaction_service.go`
- Create: `backend/internal/services/community_interaction_service_test.go`
- Modify: `backend/internal/handlers/community_account_handler.go`
- Modify: `backend/internal/handlers/community_account_handler_test.go`
- Modify: `backend/internal/routes/routes.go`
- Modify: `backend/docs/openapi.yaml`

**Interfaces:**
- Produces: `CreateAnswer`, `UpdateAnswer`, `DeleteAnswer`, `CreateComment`, `UpdateComment`, `DeleteComment`, `SetAcceptedAnswer`, `ClearAcceptedAnswer`, `SetOfficialAnswer`, and `ClearOfficialAnswer`.
- Consumes Task 2 lifecycle/rich-text policies and Task 6 event/trust infrastructure.

- [ ] **Step 1: Write lifecycle and constraint tests**

```go
func TestAcceptedAndOfficialMarkersCoexist(t *testing.T) {
	fixture := newCommunityInteractionFixture(t)
	accepted := fixture.publishMemberAnswer()
	official := fixture.publishStaffAnswer()
	fixture.accept(accepted.ID)
	fixture.markOfficial(official.ID)
	question := fixture.reloadQuestion()
	if question.AcceptedAnswerID == nil || question.OfficialAnswerCount != 1 || question.LifecycleStatus != models.CommunityLifecycleResolved {
		t.Fatalf("question %#v", question)
	}
}
```

Test same-question Accepted composite FK, self-answer allowed, one-level comment
ownership, locked/archived rejection, pending first answer/comment, significant edit
revision, and lifecycle rollback when markers disappear.

- [ ] **Step 2: Run service tests and verify RED**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/services -run CommunityInteraction`

Expected: FAIL because the service is missing.

- [ ] **Step 3: Implement transactional interaction methods**

```go
func (s *CommunityInteractionService) CreateAnswer(ctx context.Context, actor, questionID uuid.UUID, clientIP string, input community.CreateAnswerInput) (community.AnswerMutationDTO, error)
func (s *CommunityInteractionService) CreateComment(ctx context.Context, actor, questionID uuid.UUID, clientIP string, input community.CreateCommentInput) (community.CommentMutationDTO, error)
func (s *CommunityInteractionService) SetAcceptedAnswer(ctx context.Context, actor, questionID, answerID uuid.UUID, expectedVersion int) error
func (s *CommunityInteractionService) SetOfficialAnswer(ctx context.Context, adminID, answerID uuid.UUID, official bool, reason string) error
```

Lock question and affected answers. Update answer counters, Accepted relation, Official
count, lifecycle, revisions, moderation audit, and events atomically. Do not update
cached counters outside the transaction.

- [ ] **Step 4: Register member interaction routes**

```text
POST/PATCH/DELETE /api/v1/accounts/community/questions/:questionId/answers[/answerId]
POST/PATCH/DELETE /api/v1/accounts/community/questions/:questionId/comments[/commentId]
PUT/DELETE        /api/v1/accounts/community/questions/:questionId/accepted-answer
```

Official routes remain unmounted until Task 11 adds Admin permission enforcement.

- [ ] **Step 5: Verify contracts and commit interactions**

Run targeted service/handler tests, full Go tests, and vet. Expected: PASS.

```bash
git add backend/internal/services/community_interaction_service* backend/internal/handlers/community_account_handler* backend/internal/routes/routes.go backend/docs/openapi.yaml
git commit -m "feat(community): add answers and resolution"
```

---

### Task 9: Build answer, comment, and resolution UI

**Files:**
- Create: `frontend/src/features/public/community/components/AnswerForm.tsx`
- Create: `frontend/src/features/public/community/components/AnswerItem.tsx`
- Create: `frontend/src/features/public/community/components/CommentThread.tsx`
- Create: `frontend/src/features/public/community/components/AcceptedAnswerAction.tsx`
- Create: `frontend/src/features/public/community/interactions.test.ts`
- Modify: `frontend/src/features/public/community/api.ts`
- Modify: `frontend/src/features/public/community/queries.ts`
- Modify: `frontend/src/features/public/community/components/QuestionDetail.tsx`
- Modify: `frontend/src/features/public/community/components/AnswerList.tsx`
- Modify: `frontend/src/messages/th.json`
- Modify: `frontend/src/messages/en.json`
- Modify: `frontend/src/messages/de.json`

**Interfaces:**
- Produces complete member answer/comment/Accepted interactions.
- Consumes Task 8 API and Task 7 restricted editor.

- [ ] **Step 1: Write mutation/invalidation tests**

Assert create answer invalidates question, viewer, activity, and notifications keys;
Accepted mutation updates no optimistic lifecycle and waits for server confirmation;
pending answers render only to their owner.

- [ ] **Step 2: Run Community tests and verify RED**

Run: `cd frontend && npm run test:community`

Expected: FAIL because interaction components/API functions are missing.

- [ ] **Step 3: Implement API and query mutations**

```ts
export function useCreateAnswer(questionId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAnswerInput) => createAnswer(questionId, input),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: communityKeys.question(questionId) }),
        client.invalidateQueries({ queryKey: communityKeys.myActivity }),
      ]);
    },
  });
}
```

Repeat explicit invalidation for comments and Accepted changes. Map coded errors to
localized messages and 409 refresh actions.

- [ ] **Step 4: Build accessible interaction UI**

Keep Official, Accepted, and Helpful markers independent. Comments remain one level.
Provide visible labels, button state, focus restoration after modal/editor actions,
pending-review banners, and locked/archived read-only states.

- [ ] **Step 5: Verify and commit interactions UI**

Run tests, targeted ESLint, type-check, and build. Expected: PASS.

```bash
git add frontend/src/features/public/community frontend/src/messages
git commit -m "feat(community): add answer interactions"
```

---

### Task 10: Add Helpful votes, reports, and counter reconciliation

**Files:**
- Modify: `backend/internal/services/community_interaction_service.go`
- Modify: `backend/internal/services/community_interaction_service_test.go`
- Create: `backend/internal/services/community_moderation_service.go`
- Create: `backend/internal/services/community_moderation_service_test.go`
- Modify: `backend/internal/handlers/community_account_handler.go`
- Modify: `backend/internal/handlers/community_account_handler_test.go`
- Modify: `backend/docs/openapi.yaml`
- Create: `frontend/src/features/public/community/components/HelpfulButton.tsx`
- Create: `frontend/src/features/public/community/components/ReportDialog.tsx`
- Modify: `frontend/src/features/public/community/api.ts`
- Modify: `frontend/src/features/public/community/queries.ts`
- Modify: `frontend/src/messages/{th,en,de}.json`

**Interfaces:**
- Produces: `ToggleHelpful`, `CreateReport`, `ReconcileCounters`, Helpful/report routes, and frontend actions.
- Consumes Task 3 limiter, Task 8 interaction locks, and Task 9 frontend detail UI.

- [ ] **Step 1: Write concurrency and abuse tests**

```go
func TestConcurrentHelpfulToggleDoesNotDriftCounter(t *testing.T) {
	fixture := newCommunityInteractionFixture(t)
	answer := fixture.publishOtherMemberAnswer()
	runConcurrentToggles(t, fixture.service, fixture.viewerID, answer.ID, 20)
	fixture.reconcile()
	if got := fixture.reloadAnswer(answer.ID).HelpfulCount; got < 0 || got > 1 {
		t.Fatalf("helpful_count = %d", got)
	}
}
```

Test self-vote rejection, duplicate report conflict, confidential reporter DTOs,
locked question vote rejection, and reports never changing publication state.

- [ ] **Step 2: Implement atomic vote and report methods**

```go
func (s *CommunityInteractionService) ToggleHelpful(ctx context.Context, actor, answerID uuid.UUID, clientIP string) (community.HelpfulResultDTO, error)
func (s *CommunityModerationService) CreateReport(ctx context.Context, reporter uuid.UUID, clientIP string, input community.CreateReportInput) error
func (s *CommunityInteractionService) ReconcileCounters(ctx context.Context, limit int) (int, error)
```

Use row locks plus unique vote/report constraints. Votes are source of truth;
reconciliation updates only mismatched cached counts and lifecycle counters.

- [ ] **Step 3: Add routes, OpenAPI, and frontend optimistic vote rollback**

```text
PUT    /api/v1/accounts/community/answers/:id/helpful
DELETE /api/v1/accounts/community/answers/:id/helpful
POST   /api/v1/accounts/community/reports
```

Helpful UI updates optimistically and restores the prior cache snapshot on failure.
Report UI never exposes whether another member reported the same target.

- [ ] **Step 4: Verify and commit Helpful/report slice**

Run backend race-oriented tests, frontend Community tests, targeted lint, type-check,
and build. Expected: PASS.

```bash
git add backend/internal/services/community_* backend/internal/handlers/community_account_handler* backend/docs/openapi.yaml frontend/src/features/public/community frontend/src/messages
git commit -m "feat(community): add helpful votes and reports"
```

---

### Task 11: Implement Admin categories, moderation, Official answers, and restrictions

**Files:**
- Modify: `backend/internal/services/community_moderation_service.go`
- Modify: `backend/internal/services/community_moderation_service_test.go`
- Create: `backend/internal/handlers/community_admin_handler.go`
- Create: `backend/internal/handlers/community_admin_handler_test.go`
- Modify: `backend/internal/routes/routes.go`
- Modify: `backend/internal/routes/admin_policy_test.go`
- Modify: `backend/docs/openapi.yaml`

**Interfaces:**
- Produces moderation queue/detail/decision, category CRUD/reorder, Official answer, revision decision, and member restriction Admin endpoints.
- Consumes Task 8 Official service method, Task 10 reports, existing Admin RBAC, and append-only moderation model.

- [ ] **Step 1: Write moderation state/audit tests**

Test approve first contribution changes member to trusted but leaves other pending
rows pending; every state change writes one immutable action; reject does not trust;
report dismiss does not hide; restore/lock/archive recalculate valid states; Official
answer requires reason and permission; category in use cannot be deleted.

- [ ] **Step 2: Run tests and verify RED**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/services -run CommunityModeration`

Expected: FAIL because moderation operations are incomplete.

- [ ] **Step 3: Implement focused Admin service methods**

```go
func (s *CommunityModerationService) ListQueue(ctx context.Context, input community.ModerationListInput) (community.ModerationPageDTO, error)
func (s *CommunityModerationService) DecideContent(ctx context.Context, adminID uuid.UUID, input community.ModerationDecisionInput) error
func (s *CommunityModerationService) DecideRevision(ctx context.Context, adminID, revisionID uuid.UUID, approve bool, reason string) error
func (s *CommunityModerationService) RestrictMember(ctx context.Context, adminID, userID uuid.UUID, input community.MemberRestrictionInput) error
func (s *CommunityModerationService) SaveCategory(ctx context.Context, adminID uuid.UUID, input community.CategoryInput) (community.CategoryDTO, error)
```

Lock target/current-state rows, validate transitions, persist content/member state and
append-only audit in one transaction, and enqueue author-facing events.

- [ ] **Step 4: Register every Admin route through the declarative registry**

Use resource `community` with actions `read`, `moderate`, `answer_officially`,
`manage_categories`, and `restrict_members`. Add definitions and handler-map entries;
never mount a Community Admin handler outside `registerAdminRoutes`.

- [ ] **Step 5: Expand route-policy tests and OpenAPI**

`admin_policy_test.go` must fail if any Community Admin route lacks resource/action or
handler mapping. Handler tests cover 401, 403, 400, 404, 409, and successful audited
decisions.

- [ ] **Step 6: Verify and commit Admin backend**

Run service, handler, route policy, full tests, vet, and backend build. Expected: PASS.

```bash
git add backend/internal/services/community_moderation_service* backend/internal/handlers/community_admin_handler* backend/internal/routes backend/docs/openapi.yaml
git commit -m "feat(community): add admin moderation"
```

---

### Task 12: Build Admin moderation and category UI

**Files:**
- Create: `frontend/src/features/admin-community/types.ts`
- Create: `frontend/src/features/admin-community/schema.ts`
- Create: `frontend/src/features/admin-community/schema.test.ts`
- Create: `frontend/src/features/admin-community/queries.ts`
- Create: `frontend/src/features/admin-community/components/ModerationQueue.tsx`
- Create: `frontend/src/features/admin-community/components/ModerationReviewPanel.tsx`
- Create: `frontend/src/features/admin-community/components/RevisionDiff.tsx`
- Create: `frontend/src/features/admin-community/components/CategoryManager.tsx`
- Create: `frontend/src/features/admin-community/components/MemberRestrictionPanel.tsx`
- Create: `frontend/src/services/communityAdminService.ts`
- Create: `frontend/src/app/[locale]/admin/community/page.tsx`
- Create: `frontend/src/app/[locale]/admin/community/moderation/page.tsx`
- Create: `frontend/src/app/[locale]/admin/community/questions/[id]/page.tsx`
- Create: `frontend/src/app/[locale]/admin/community/categories/page.tsx`
- Create: `frontend/src/app/[locale]/admin/community/members/page.tsx`
- Modify: `frontend/src/components/admin/AdminSidebar.tsx`
- Modify: `frontend/src/components/admin/PermissionEditor.tsx`
- Modify: `frontend/src/messages/admin/th.json`
- Modify: `frontend/src/messages/admin/en.json`
- Modify: `frontend/src/messages/admin/de.json`
- Modify: `frontend/package.json`

**Interfaces:**
- Produces complete Admin Community operations.
- Consumes Task 11 Admin API and existing Admin list/permission components.

- [ ] **Step 1: Add Admin schema and permission-map tests**

Test strict parsing of queue/detail/audit DTOs and assert `PermissionEditor` exposes
exact Community actions instead of forcing the generic CRUD set.

- [ ] **Step 2: Extend test script and verify RED**

Include `src/features/admin-community/*.test.ts` in `test:community`. Run it and expect
missing module failures.

- [ ] **Step 3: Implement Admin service and query boundary**

Use `adminApi`/existing authenticated service convention, strict Zod parsing, stable
query keys, URL-owned list state, and invalidation after every moderation/category/
restriction decision.

- [ ] **Step 4: Build queue and decision pages**

Use `AdminListToolbar`, list-state hooks, shared loading/error/empty states,
`PermissionGuard`, sanitized content preview, revision before/after comparison,
mandatory reason input, explicit confirmations, and focus restoration.

- [ ] **Step 5: Add custom Community permissions**

Refactor `PermissionEditor` resource definitions to include per-resource action lists:

```ts
{ key: "community", label: "Community Q&A", actions: ["read", "moderate", "answer_officially", "manage_categories", "restrict_members"] }
```

Preserve existing CRUD resources unchanged and localize new Admin copy in all three
Admin message files.

- [ ] **Step 6: Verify and commit Admin UI**

Run Community tests, targeted ESLint, type-check, and build. Expected: PASS.

```bash
git add frontend/src/features/admin-community frontend/src/services/communityAdminService.ts 'frontend/src/app/[locale]/admin/community' frontend/src/components/admin/AdminSidebar.tsx frontend/src/components/admin/PermissionEditor.tsx frontend/src/messages/admin frontend/package.json
git commit -m "feat(community): add moderation console"
```

---

### Task 13: Add durable in-app and email notifications

**Files:**
- Create: `backend/internal/services/community_notification_service.go`
- Create: `backend/internal/services/community_notification_service_test.go`
- Create: `backend/internal/services/community_email_service.go`
- Create: `backend/internal/services/community_email_service_test.go`
- Modify: `backend/internal/services/operation_dispatcher.go`
- Modify: `backend/internal/services/operation_dispatcher_test.go`
- Modify: `backend/cmd/operations-worker/main.go`
- Modify: `backend/internal/handlers/community_account_handler.go`
- Modify: `backend/internal/routes/routes.go`
- Modify: `backend/docs/openapi.yaml`

**Interfaces:**
- Produces real `CommunityEventSink`, in-app notification/preferences endpoints, and Community email dispatch jobs.
- Consumes Task 6/8/11 domain events, existing `OperationOutboxService`, existing account email sender, and public account/profile records.

- [ ] **Step 1: Write transaction/dedupe tests**

Test domain rollback when notification/outbox insert fails, duplicate event keys create
one notification/job, Helpful events aggregate, disabled engagement preference skips
email but retains in-app notification, moderation email remains enabled, and payloads
contain no email/content/report details.

- [ ] **Step 2: Implement the event sink**

```go
func (s *CommunityNotificationService) RecordTx(ctx context.Context, tx *gorm.DB, event community.Event) error
func (s *CommunityNotificationService) List(ctx context.Context, userID uuid.UUID, input community.NotificationListInput) (community.NotificationPageDTO, error)
func (s *CommunityNotificationService) MarkRead(ctx context.Context, userID, notificationID uuid.UUID) error
func (s *CommunityNotificationService) MarkAllRead(ctx context.Context, userID uuid.UUID) error
func (s *CommunityNotificationService) SavePreferences(ctx context.Context, userID uuid.UUID, input community.NotificationPreferencesInput) error
```

Use deterministic notification and outbox dedupe keys. Enqueue job kinds
`community.answer`, `community.official`, `community.approval`, and
`community.moderation` through `EnqueueTx`.

- [ ] **Step 3: Implement localized email dispatch**

```go
func (s *CommunityEmailService) Send(ctx context.Context, job models.OperationOutbox) error
```

Resolve current recipient/user/profile and target URL at dispatch time. Render complete
Thai, English, and German subject/plain text. Escape display names and use only the
configured frontend origin. Return success without sending when account is closed or
preference changed after enqueue.

- [ ] **Step 4: Extend dispatcher without another positional constructor argument**

```go
func (d *OperationDispatcher) WithCommunityEmails(service *CommunityEmailService) *OperationDispatcher {
	d.communityEmails = service
	return d
}
```

Dispatch `community.*` kinds to the service. Wire it in `cmd/operations-worker` and
retain existing donation/contact/registration/media jobs unchanged.

- [ ] **Step 5: Replace no-op event sink and add account routes**

Inject the real notification service into question/interaction/moderation services
before any write route is mounted. Add list, unread count, mark read/all, and
preferences routes with recipient ownership enforcement.

- [ ] **Step 6: Verify and commit notifications backend**

Run notification, dispatcher, domain rollback, full Go tests, vet, and operations
worker build. Expected: PASS.

```bash
git add backend/internal/services/community_notification_service* backend/internal/services/community_email_service* backend/internal/services/operation_dispatcher* backend/cmd/operations-worker/main.go backend/internal/handlers/community_account_handler.go backend/internal/routes/routes.go backend/docs/openapi.yaml
git commit -m "feat(community): add durable notifications"
```

---

### Task 14: Build notifications UI and navbar unread badge

**Files:**
- Create: `frontend/src/features/public/community/components/NotificationList.tsx`
- Create: `frontend/src/features/public/community/components/NotificationPreferences.tsx`
- Create: `frontend/src/features/public/community/components/CommunityUnreadBadge.tsx`
- Create: `frontend/src/app/[locale]/(client)/community/notifications/page.tsx`
- Modify: `frontend/src/features/public/community/types.ts`
- Modify: `frontend/src/features/public/community/schema.ts`
- Modify: `frontend/src/features/public/community/api.ts`
- Modify: `frontend/src/features/public/community/queries.ts`
- Modify: `frontend/src/components/layout/Navbar.tsx`
- Modify: `frontend/src/messages/{th,en,de}.json`

**Interfaces:**
- Produces in-app notification list/preferences and unread badge.
- Consumes Task 13 notification API and current `AccountSessionProvider` status.

- [ ] **Step 1: Write notification schema/query tests**

Test unread count, strict event types, recipient-safe DTOs, mark-all invalidation, and
query disabled while account session is loading/anonymous.

- [ ] **Step 2: Implement API and queries**

Poll unread count every 60 seconds only while authenticated and document-visible;
do not add WebSocket/realtime infrastructure. Mark-one/all updates cache after server
confirmation. Preferences use a complete event-type record.

- [ ] **Step 3: Build accessible notification UI**

Use register rows, semantic time elements in `Europe/Berlin`, unread text/icon beyond
color, keyboard actions, loading/error/empty states, and capped navbar label `99+`.
Do not expose report details in notification copy.

- [ ] **Step 4: Verify and commit notifications UI**

Run Community tests, targeted lint, type-check, and build. Expected: PASS.

```bash
git add frontend/src/features/public/community 'frontend/src/app/[locale]/(client)/community/notifications' frontend/src/components/layout/Navbar.tsx frontend/src/messages
git commit -m "feat(community): add member notifications"
```

---

### Task 15: Integrate privacy export, anonymization, retention, and maintenance jobs

**Files:**
- Create: `backend/internal/services/community_retention_service.go`
- Create: `backend/internal/services/community_retention_service_test.go`
- Modify: `backend/internal/services/personal_data_discovery_service.go`
- Modify: `backend/internal/services/personal_data_export_service.go`
- Modify: `backend/internal/services/personal_data_action_service.go`
- Modify: `backend/internal/services/personal_data_request_service_test.go`
- Modify: `backend/internal/services/operation_dispatcher.go`
- Modify: `backend/cmd/operations-worker/main.go`
- Modify: `docs/DEPLOYMENT.md`

**Interfaces:**
- Produces Community privacy domains, daily retention/reconciliation jobs, and operational runbook entries.
- Consumes Task 1 retention fields, Task 10 reconciliation, Task 13 operation dispatcher.

- [ ] **Step 1: Write privacy/retention tests**

Test discovery/export includes only the request subject's Community records; account
closure public DTO becomes Former member immediately; author FKs null after 90 days;
standalone deleted content purges after 90 days; referenced content becomes tombstone;
read notifications purge after 180 days; moderation audit purges after 24 months;
expired rate buckets purge; unrelated users/domains remain untouched.

- [ ] **Step 2: Add explicit privacy domains**

Add `community_question`, `community_answer`, `community_comment`,
`community_vote`, and `community_notification` to discovery/export/action switches.
Exports use public-safe DTOs plus the request subject's moderation restriction state;
they never include reporter identity, other members' private data, or outbox payloads.

- [ ] **Step 3: Implement bounded retention methods**

```go
type CommunityRetentionResult struct {
	AuthorsAnonymized int
	ContentPurged int
	TombstonesCreated int
	NotificationsPurged int
	RateBucketsPurged int
	AuditRowsPurged int
	CountersReconciled int
}

func (s *CommunityRetentionService) RunDue(ctx context.Context, limit int) (CommunityRetentionResult, error)
```

Process bounded batches with `FOR UPDATE SKIP LOCKED` and statement timeouts. Never
delete a question/answer needed by a surviving thread. Log IDs/counts, not content.

- [ ] **Step 4: Add deterministic daily operation jobs**

Enqueue:

```text
community:retention:YYYY-MM-DD       kind community.retention_due
community:reconcile:YYYY-MM-DD       kind community.reconcile_counts
```

Extend dispatcher and worker wiring. Repeated cron invocations must reuse the same
job keys.

- [ ] **Step 5: Verify and commit privacy/retention**

Run targeted privacy, retention, dispatcher, full tests, vet, and worker build.
Expected: PASS.

```bash
git add backend/internal/services/community_retention_service* backend/internal/services/personal_data_* backend/internal/services/operation_dispatcher* backend/cmd/operations-worker/main.go docs/DEPLOYMENT.md
git commit -m "feat(community): add privacy retention"
```

---

### Task 16: Complete SEO, sitemap, production acceptance, and release gates

**Files:**
- Modify: `frontend/src/app/sitemap.ts`
- Modify: `frontend/src/app/robots.ts`
- Modify: `frontend/src/features/public/community/server-api.ts`
- Modify: `frontend/src/app/[locale]/(client)/community/q/[id]/[slug]/page.tsx`
- Create: `backend/cmd/community-load-fixture/main.go`
- Create: `docs/COMMUNITY_TESTING.md`
- Modify: `docs/DEPLOYMENT.md`
- Modify: `README.md`
- Modify: `backend/docs/openapi.yaml`
- Modify: `docs/superpowers/specs/2026-08-16-community-qa-design.md`

**Interfaces:**
- Produces dynamic published-question sitemap entries, production fixture generator, complete acceptance/rollback runbook, and final source alignment.
- Consumes every earlier task.

- [ ] **Step 1: Write SEO and metadata tests**

Test canonical locale equals question source locale, UUID remains authoritative when
slug differs, pending/hidden/deleted/member pages emit `noindex`, sitemap includes only
published rows, and Community-disabled mode emits no Community routes.

- [ ] **Step 2: Implement bounded dynamic sitemap reads**

Fetch published question sitemap records through a dedicated public endpoint using
cursor pages and a hard per-run ceiling documented in `COMMUNITY_TESTING.md`. Include
source-locale canonical URLs only. Keep static sitemap entries unchanged.

- [ ] **Step 3: Add a guarded load-fixture command**

`cmd/community-load-fixture` must refuse `ENV=production`, require an explicit
`COMMUNITY_FIXTURE_CONFIRM=generate`, use deterministic seeded accounts/categories,
batch inserts, and produce 100,000 questions plus 500,000 answers without sending
notifications. Document cleanup against a disposable staging database only.

- [ ] **Step 4: Write exact production acceptance runbook**

`docs/COMMUNITY_TESTING.md` must contain commands and expected results for:

- Migration up/down on disposable PostgreSQL
- Anonymous/member/new/trusted/restricted/Admin browser flows
- Accepted/Official/Helpful coexistence
- Report confidentiality and moderation audit
- XSS/unsafe link/payload/rate-limit/IDOR/race checks
- Thai/English/German and mobile/desktop/keyboard/screen-reader/zoom/dark-mode checks
- Outbox retry/dead-letter recovery
- Privacy export/anonymization/retention
- 100k/500k load run and p95 thresholds
- Backup restore and feature-flag rollback rehearsal

- [ ] **Step 5: Run repository verification**

```bash
cd backend
GOCACHE=/private/tmp/wat-profile-go-cache go test ./...
GOCACHE=/private/tmp/wat-profile-go-cache go vet ./...
GOCACHE=/private/tmp/wat-profile-go-cache go build -o bin/server ./cmd/app
GOCACHE=/private/tmp/wat-profile-go-cache go build -o bin/operations-worker ./cmd/operations-worker
GOCACHE=/private/tmp/wat-profile-go-cache go build -o bin/community-load-fixture ./cmd/community-load-fixture

cd ../frontend
npm run test:community
npm run lint
./node_modules/.bin/tsc --noEmit
npm run build

cd ..
git diff --check
git status --short
```

Expected: every command PASS. Generated `backend/bin/*` files remain ignored and are
not staged. If the repository-wide frontend lint exposes a pre-existing unrelated
failure, record its exact file/rule in `docs/COMMUNITY_TESTING.md`; no Community file
may have a lint error.

- [ ] **Step 6: Review contract and secret safety**

Confirm route registry, Admin permissions, models, migrations, OpenAPI, Zod schemas,
locale messages, env examples, and deployment docs agree. Search staged content for
email addresses, JWTs, OAuth credentials, raw IPs, request bodies, and outbox payloads;
only documented test fixtures and non-secret example values may match.

- [ ] **Step 7: Commit final hardening**

```bash
git add frontend/src/app/sitemap.ts frontend/src/app/robots.ts frontend/src/features/public/community/server-api.ts 'frontend/src/app/[locale]/(client)/community/q/[id]/[slug]/page.tsx' backend/cmd/community-load-fixture docs/COMMUNITY_TESTING.md docs/DEPLOYMENT.md README.md backend/docs/openapi.yaml docs/superpowers/specs/2026-08-16-community-qa-design.md
git commit -m "test(community): complete production gates"
```

---

## Final rollout checklist

- [ ] Apply `000045` and `000046` with all Community flags false.
- [ ] Deploy API and operations worker; verify health, worker claims, and no Community email dispatch.
- [ ] Grant least-privilege Community permissions and verify denied-route audit.
- [ ] Verify four categories in `th`, `en`, and `de`.
- [ ] Enable public read in staging and verify cache/SEO visibility.
- [ ] Enable member write only for designated staging accounts.
- [ ] Complete `docs/COMMUNITY_TESTING.md`, privacy-owner retention approval, load test, backup restore, and rollback rehearsal.
- [ ] Enable production public read.
- [ ] Enable production member write.
- [ ] Enable Community email only after outbox lag/error metrics pass.
- [ ] Monitor API p95, errors, rate-limit counts, moderation age, report backlog, outbox lag/dead letters, reconciliation drift, and retention failures.
