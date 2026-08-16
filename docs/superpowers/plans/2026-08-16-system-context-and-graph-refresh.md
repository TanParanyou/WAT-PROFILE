# System Context and Knowledge Graph Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ทำให้เอกสารอธิบายระบบ, คำศัพท์ร่วม, API/ข้อมูลปฏิบัติการ และ knowledge graph สะท้อน repository ปัจจุบันโดยไม่ดึง historical plans หรือ content drafts มาเป็น source of truth

**Architecture:** แยกหน้าที่เอกสารให้ชัด: `CONTEXT.md` เป็น ubiquitous language, `ARCHITECTURE.md` เป็นภาพรวม runtime และ boundary, README เป็น navigation, ส่วน OpenAPI/Database/Deployment เป็นสัญญาและ runbook เฉพาะด้าน หลังแก้เอกสารและตรวจสอบกับ source/config แล้วจึงสร้าง Graphify graph ใหม่จาก repository root เพราะกราฟเดิมผูกอยู่กับ `frontend/src/features/public/account` และไม่สามารถใช้ incremental update เพื่อแทนกราฟทั้งระบบได้อย่างถูกต้อง

**Tech Stack:** Markdown, OpenAPI YAML, Go/Fiber/GORM/PostgreSQL source contracts, Next.js/React/TypeScript source contracts, Graphify

## Global Constraints

- รักษาเนื้อหาและคำศัพท์ที่เกี่ยวกับ `th`, `en`, และ `de` ให้ครบถ้วน
- ให้ source/config เป็นหลักเมื่อเอกสารเก่าขัดกับ runtime behavior
- ไม่อ่านหรือรวม `docs/superpowers/` เข้า production documentation หรือ Graphify corpus
- ไม่แก้ `.env`, secret, token, production URL หรือ generated build artifacts
- รักษา backend changes ที่ยังไม่ commit ทั้งหมดไว้ และไม่ reformat ไฟล์ที่ไม่เกี่ยวข้อง
- ไม่ commit ระหว่าง execution จนกว่าผู้ใช้จะสั่งให้ commit โดยตรง; ใช้ diff review เป็น checkpoint แทน
- เอกสารต้องไม่อ้างว่า group event registration พร้อมใช้งานจนกว่า test, vet, build, migration และ OpenAPI validation ที่กำหนดในแผนจะผ่าน

## Verified Baseline

- `graphify-out/.graphify_root` ปัจจุบันชี้ไปที่ `frontend/src/features/public/account`
- กราฟเดิมมี 259 nodes, 689 edges, 12 communities และอธิบาย Account feature เท่านั้น
- การลอง incremental detection ที่ repository root รายงาน 1,097 new/changed files และ 46 deleted files เพราะ scan root ไม่ตรงกับ manifest เดิม จึงห้ามใช้ `graphify --update .` กับกราฟนี้
- corpus ทั้ง repo หลังตัด historical/local artifacts เบื้องต้นยังมีประมาณ 888 files และ 366,107 words; เกิน Graphify file-count warning ที่ 500 files โดย `frontend/` มีประมาณ 579 files และ `backend/` 292 files
- `CONTEXT.md` อัปเดตล่าสุด 2026-08-08 และยังไม่มีคำศัพท์ของ group registration, ownership, participants, privacy consent และ manage token
- `backend/README.md` ยังระบุ Go 1.22+ ขณะที่ `backend/go.mod` ใช้ Go 1.24
- `docs/admin_panel.md` ยังกล่าวว่า frontend ไม่มี Admin Panel และ `docs/REMAINING-TASKS.md` เป็น snapshot วันที่ 2026-02-22 จึงไม่ควรใช้เป็นสถานะระบบปัจจุบัน
- working tree มีงาน group event registration ที่ยังไม่ commit รวม model, migration `000044`, handler/service/domain logic และ tests

---

### Task 1: Define the Graphify corpus boundary

**Files:**
- Create: `.graphifyignore`
- Inspect: `.gitignore`
- Inspect: `AGENTS.md`

**Interfaces:**
- Consumes: repository documentation hierarchy from `AGENTS.md` and `.gitignore`
- Produces: a deterministic repository-root corpus that excludes historical plans, generated graph output, raw content drafts, mockups, and binary image assets

- [ ] **Step 1: Create the repository Graphify exclusions**

Create `.graphifyignore` with exactly these entries:

```gitignore
/graphify-out/
/docs/superpowers/
/design-plans/
/.impeccable/
/.codex/
/docs/info.md
/docs/admin_panel.md
/docs/REMAINING-TASKS.md
/docs/template/
/docs/website-cms/mockups/
/docs/website-cms/website-cms-superpowers-prd.md
/frontend/public/
*.png
*.jpg
*.jpeg
*.gif
*.webp
*.svg
```

- [ ] **Step 2: Verify excluded and included documents**

Run Graphify detection without building the graph and confirm the document list includes the authoritative root, frontend, backend, database, deployment, auth, CMS-contract, and calendar README files while omitting every path above:

```bash
$(cat graphify-out/.graphify_python) -c "
import json
from graphify.detect import detect
from pathlib import Path
r = detect(Path('.'))
print(json.dumps({
    'total_files': r['total_files'],
    'total_words': r['total_words'],
    'documents': r['files'].get('document', []),
}, indent=2, ensure_ascii=False))
"
```

Expected: no file under `docs/superpowers/`, `design-plans/`, `.impeccable/`, `.codex/`, or the generated `graphify-out/` directory is part of the normal corpus.

- [ ] **Step 3: Review the corpus configuration diff**

```bash
git diff --check -- .graphifyignore
git diff -- .graphifyignore
```

Expected: no whitespace errors and only the explicit corpus exclusions above.

### Task 2: Expand the shared domain language

**Files:**
- Modify: `CONTEXT.md`
- Inspect: `backend/internal/registrations/`
- Inspect: `backend/internal/models/event_registration.go`
- Inspect: `backend/internal/models/event_registration_participant.go`

**Interfaces:**
- Consumes: registration request/domain/model names from backend source
- Produces: canonical human-readable terms used by architecture, OpenAPI, frontend contracts, tests, and future plans

- [ ] **Step 1: Verify registration terminology from source**

```bash
rg -n "type (CreateRequest|CreateInput|Identity|DomainError)|RegistrationType|Participants|ManageToken|Privacy" \
  backend/internal/registrations backend/internal/models/event_registration*.go
```

Expected: every term added to `CONTEXT.md` maps to an implemented request, identity, participant, persistence, privacy, or token concept.

- [ ] **Step 2: Update the Event Registrations glossary**

Keep the existing status terms and add concise Thai definitions for:

- `Individual Registration`: one primary registrant with no additional participants
- `Group Registration`: one registration containing the primary registrant and one or more additional participants
- `Primary Registrant`: the person responsible for the registration and contact details
- `Registration Participant`: an additional attendee attached to a Group Registration, not an independent registration
- `Guest Registration`: a registration without public-account ownership
- `Account-Owned Registration`: a registration linked to the authenticated public account that created it
- `Registration Manage Token`: a time-limited opaque secret for a guest to manage one registration; only its hash is persisted
- `Registration Confirmation Code`: a human-facing reference, not an authentication credential
- `Registration Privacy Consent`: the recorded privacy-notice version and consent time associated with submission
- `Cancellation Origin`: whether cancellation was initiated by the registrant or staff

For each term, add `_Avoid_` guidance wherever a nearby term could cause a security or ownership misunderstanding. Do not rename existing persisted status values.

- [ ] **Step 3: Check vocabulary consistency**

```bash
rg -n "Group Registration|Primary Registrant|Registration Participant|Guest Registration|Account-Owned Registration|Registration Manage Token|Registration Confirmation Code|Registration Privacy Consent|Cancellation Origin" CONTEXT.md
git diff --check -- CONTEXT.md
```

Expected: all nine concepts are present and the file has no whitespace errors.

### Task 3: Synchronize the system overview and navigation

**Files:**
- Modify: `ARCHITECTURE.md`
- Modify: `README.md`
- Modify: `backend/README.md`
- Inspect: `frontend/AGENTS.md`
- Inspect: `backend/AGENTS.md`
- Inspect: `backend/internal/routes/routes.go`
- Inspect: `backend/cmd/`

**Interfaces:**
- Consumes: verified runtime components, route groups, auth boundaries, and current toolchain versions
- Produces: one coherent system overview with links to narrower sources of truth

- [ ] **Step 1: Update `ARCHITECTURE.md` runtime boundaries**

Add the event-registration flow to the system context:

```text
anonymous or public-account browser
  -> optional public-account authentication
  -> registration handler and request-size/error mapping
  -> registrations domain normalization and validation
  -> registration service transaction
     -> event registration + participants
     -> operation outbox notification job
```

Also update these sections:

- Backend boundaries: add `internal/registrations/` as the focused event-registration policy package
- API groups: describe optional authentication on the public event-registration route
- State ownership: add guest manage-token hash/expiry, public-account ownership, privacy-notice version, and operation outbox ownership
- Security boundaries: distinguish confirmation codes from manage tokens and note that raw manage tokens are never persisted
- Response contract: include optional stable `code` and `fields` alongside `success`, `error`, and `trace_id`
- Source of truth: link `CONTEXT.md` explicitly as the ubiquitous-language glossary
- Known gaps: remove only gaps disproved by current source; retain OpenAPI coverage, test-runner, migration-authority, and Docker Go-version gaps until separately resolved

- [ ] **Step 2: Update the root README documentation map**

Add `CONTEXT.md` as “shared domain language”, retain the current source-of-truth links, and state that `docs/info.md`, design plans, implementation plans, and legacy status snapshots are not runtime documentation.

- [ ] **Step 3: Rewrite stale backend onboarding sections**

In `backend/README.md`:

- change the prerequisite to Go 1.24 or newer
- replace the manually incomplete endpoint inventory with route-family examples and direct links to `internal/routes/routes.go` and `docs/openapi.yaml`
- update Event Registration features to cover individual/group submissions, guest/account ownership, participants, privacy consent, and outbox delivery
- replace the stale fixed model-count statement with links to `internal/models/` and `migrations/`
- retain local setup examples with placeholders only
- remove claims that cannot be verified from the current repository

- [ ] **Step 4: Detect contradictions in the overview docs**

```bash
rg -n "Go 1\.22|frontend ยังไม่มี admin|Core Models \([0-9]+ tables\)|confirmation code.*token|token.*confirmation code" \
  README.md ARCHITECTURE.md CONTEXT.md backend/README.md
git diff --check -- README.md ARCHITECTURE.md backend/README.md
```

Expected: no stale Go 1.22 or “Admin Panel does not exist” claim, and no text treats a confirmation code as an authorization token.

### Task 4: Align event-registration API, schema, and operations documentation

**Files:**
- Modify: `backend/docs/openapi.yaml`
- Modify: `docs/DATABASE.md`
- Modify: `docs/DEPLOYMENT.md`
- Inspect: `backend/migrations/000044_add_group_event_registrations.up.sql`
- Inspect: `backend/migrations/000044_add_group_event_registrations.down.sql`
- Inspect: `backend/internal/handlers/registration_handler.go`
- Inspect: `backend/internal/services/registration_create_service.go`
- Inspect: `backend/pkg/utils/response.go`

**Interfaces:**
- Consumes: current request/response/error contracts and migration/model behavior
- Produces: deployable API and operational documentation aligned with migration `000044`

- [ ] **Step 1: Update the OpenAPI registration operation**

Document `POST /public/events/{id}/register` with:

- optional public-account bearer authentication when the feature flag is enabled
- the actual individual/group request schema, primary registrant fields, participant list, locale, privacy notice version, and consent
- the created registration detail response and guest manage token behavior
- coded validation errors with field maps
- status responses `201`, `401`, `404`, `409`, `410`, `413`, `422`, and `500` matching handler/service mappings
- separate schemas for registration input, participant input/detail, registration detail, and coded field-error envelopes

Do not expose `manage_token_hash` or internal encryption material in any schema.

- [ ] **Step 2: Update database operations guidance**

Add migration `000044` to the schema prerequisites and document these invariants:

- `event_registrations` is the aggregate root
- participant rows are deleted with their parent registration
- public-account ownership uses nullable `user_id`; guest ownership uses a manage-token hash and expiry
- confirmation code uniqueness is not an authorization mechanism
- privacy notice version and consent timestamp are retained with the registration
- registration creation and its operation-outbox job commit atomically

- [ ] **Step 3: Update deployment and rollout guidance**

Add a Group Event Registration rollout section that requires migration `000044` before the new backend, confirms the operations worker can deliver registration jobs, smoke-tests anonymous and authenticated submissions, and verifies that `JWT_SECRET` rotation invalidates guest manage-token encryption/decryption behavior currently derived from that secret.

- [ ] **Step 4: Validate migration and OpenAPI consistency**

```bash
rg -n "event_registration_participants|manage_token_hash|privacy_notice_version|privacy_consent_at|user_id|cancellation_origin" \
  backend/migrations/000044_add_group_event_registrations.up.sql \
  backend/migrations/000044_add_group_event_registrations.down.sql \
  backend/internal/models/event_registration*.go \
  backend/docs/openapi.yaml \
  docs/DATABASE.md docs/DEPLOYMENT.md
git diff --check -- backend/docs/openapi.yaml docs/DATABASE.md docs/DEPLOYMENT.md
```

Expected: every persisted field is explained or intentionally internal, the down migration reverses only migration `000044`, and no raw token hash appears in a public response schema.

### Task 5: Retire misleading legacy system Markdown

**Files:**
- Modify: `docs/admin_panel.md`
- Modify: `docs/REMAINING-TASKS.md`
- Preserve unchanged: `docs/info.md`

**Interfaces:**
- Consumes: the source-of-truth table in `ARCHITECTURE.md`
- Produces: short legacy notices that cannot be mistaken for current system state

- [ ] **Step 1: Replace the obsolete Admin Panel plan with a legacy notice**

Replace `docs/admin_panel.md` with a short Thai document that states the file is a historical February 2026 plan, does not represent current runtime behavior, and links to:

- `../ARCHITECTURE.md`
- `../frontend/AGENTS.md`
- `../frontend/ADMIN_DESIGN.md`
- `../backend/internal/routes/routes.go`
- `../backend/docs/openapi.yaml`

- [ ] **Step 2: Replace the obsolete project-status snapshot with a legacy notice**

Replace `docs/REMAINING-TASKS.md` with a short Thai document that states the February 2026 checklist is not maintained, directs architecture questions to `../ARCHITECTURE.md`, setup to `../README.md`, and current work status to Git history plus the project issue tracker.

- [ ] **Step 3: Keep temple content separate from system documentation**

Do not edit `docs/info.md` in this work. Confirm the root README classifies it as a content draft rather than a runtime/system source.

- [ ] **Step 4: Verify legacy claims are gone**

```bash
rg -n "frontend ยังไม่มี admin|อัปเดตล่าสุด: 2026-02-22|Claude.s Plan" docs/admin_panel.md docs/REMAINING-TASKS.md
git diff --check -- docs/admin_panel.md docs/REMAINING-TASKS.md
```

Expected: the first command returns no matches and both files are concise legacy pointers.

### Task 6: Verify the documentation against the working implementation

**Files:**
- Verify: all files modified in Tasks 1-5
- Verify: current backend group-registration changes without modifying them

**Interfaces:**
- Consumes: updated documentation and current backend implementation
- Produces: evidence that documentation claims match executable behavior

- [ ] **Step 1: Run focused registration tests**

```bash
cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/registrations ./internal/models ./internal/services ./internal/middleware ./pkg/utils
```

Expected: all focused packages pass.

- [ ] **Step 2: Run backend verification**

```bash
cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./...
cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go vet ./...
cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go build -o bin/server ./cmd/app
```

Expected: tests, vet, and build pass; report any pre-existing integration-database requirement separately rather than weakening the checks.

- [ ] **Step 3: Validate Markdown links and YAML syntax**

Use a small read-only checker that resolves every relative Markdown link in the modified `.md` files, then parse `backend/docs/openapi.yaml` with the repository's available YAML parser. If no YAML parser is installed, use the existing frontend/backend OpenAPI tooling rather than adding a dependency.

Expected: no broken local links and valid YAML.

- [ ] **Step 4: Review only the intended diff**

```bash
git status --short
git diff --check
git diff -- .graphifyignore CONTEXT.md ARCHITECTURE.md README.md backend/README.md \
  backend/docs/openapi.yaml docs/DATABASE.md docs/DEPLOYMENT.md \
  docs/admin_panel.md docs/REMAINING-TASKS.md
```

Expected: existing backend implementation changes remain intact; documentation changes are limited to the listed files.

### Task 7: Replace the feature-only graph with the curated system graph

**Files:**
- Regenerate (ignored): `graphify-out/graph.json`
- Regenerate (ignored): `graphify-out/graph.html`
- Regenerate (ignored): `graphify-out/GRAPH_REPORT.md`
- Regenerate (ignored): `graphify-out/manifest.json`
- Regenerate (ignored): `graphify-out/cost.json`
- Preserve backup outside Git: `/private/tmp/wat-profile-account-graph-2026-08-08/`

**Interfaces:**
- Consumes: verified source code plus the curated authoritative Markdown corpus
- Produces: a repository-root graph whose vocabulary includes the updated `CONTEXT.md` and system documentation

- [ ] **Step 1: Stop at the Graphify corpus-size checkpoint**

Run detection after Tasks 1-6 and present the exact corpus summary plus top-level counts. Because the expected corpus is still over 500 files, explicitly ask the user whether to continue with the recommended full-system root build or narrow the graph to `backend/`, `frontend/`, or documentation only. Continue only after that scope choice.

- [ ] **Step 2: Back up the existing feature graph**

After full-system scope is approved, copy the current generated output to:

```text
/private/tmp/wat-profile-account-graph-2026-08-08/
```

Verify the backup contains `graph.json`, `GRAPH_REPORT.md`, and `manifest.json` before replacing generated output. This keeps the old Account graph recoverable while preventing its root, manifest, memory, and labels from contaminating the system graph.

- [ ] **Step 3: Run a fresh repository-root Graphify extraction**

Do not use `--update`: initialize `INPUT_PATH=.` and run the full Graphify pipeline in default (non-deep, undirected) mode. Run deterministic AST extraction and semantic extraction concurrently. If no Gemini key is configured, print the required Graphify tip once and use Graphify semantic subagents for the authoritative Markdown chunks; do not wait for an API key.

Expected: `.graphify_root` becomes the absolute repository root, code nodes come from current frontend/backend files, and semantic nodes include the updated system docs.

- [ ] **Step 4: Run graph integrity and output checks**

Run Graphify's extraction diagnostic before labeling, surface every dangling/missing/self-loop/collapsed-edge warning, label communities with 2-5 word plain-language names, then generate HTML and the audit report.

Expected outputs:

```text
graphify-out/graph.json
graphify-out/graph.html
graphify-out/GRAPH_REPORT.md
graphify-out/manifest.json
graphify-out/cost.json
```

- [ ] **Step 5: Verify that the system graph answers system questions**

Run these queries:

```bash
graphify query "What documents are the sources of truth for system context, product behavior, frontend, backend, database, deployment, and API contracts?"
graphify query "Trace group event registration from the public route through validation, ownership, persistence, participants, and operation outbox delivery."
graphify query "How is a guest registration different from an account-owned registration, and which credentials may authorize management?"
```

Expected: results cite root/backend/frontend source locations rather than returning only React Account Context nodes, and the confirmation code is never presented as a management credential.

- [ ] **Step 6: Report graph summary and repository status**

Present the graph node/edge/community counts, token cost, health warnings, God Nodes, Surprising Connections, Suggested Questions, absolute output paths, and final `git status --short`. Note that Graphify output remains ignored and `.graphifyignore` is the only committed graph configuration file introduced by this work.

## Self-Review Results

- Spec coverage: the plan covers updated project data/context, current system Markdown, stale-document handling, API/schema/operations alignment, and Graphify regeneration after documentation changes.
- Placeholder scan: no implementation placeholder is left; every content change names the exact concepts, files, commands, or expected evidence.
- Type and terminology consistency: `Group Registration`, `Primary Registrant`, `Registration Participant`, `Guest Registration`, `Account-Owned Registration`, `Registration Manage Token`, and `Registration Confirmation Code` are used consistently across Tasks 2, 4, and 7.
- Scope boundary: `docs/info.md` and historical plans/specifications are explicitly excluded because they are content/history rather than current system truth.
