# Multilingual Visitor Chatbot & Knowledge Base Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack multilingual (TH, EN, DE) visitor Chatbot for the public website and an Admin Knowledge Base management interface for temple administrators.

**Architecture:** A Go Fiber backend service that aggregates live PostgreSQL temple data (events, schedules, monks, content) and curated Q&A records, applying persona and anti-hallucination guardrails before invoking Google Gemini API. A public Next.js floating chat widget adhering strictly to `DESIGN.md` tokens with suggested quick chips, and an admin DataTable/Drawer management surface for knowledge base curation.

**Tech Stack:** Go 1.24, Go Fiber v2, GORM, PostgreSQL, Gemini API (via HTTP client), Next.js 16 (App Router), React 19, TypeScript (strict, no `any`), TanStack Query, Tailwind CSS 4, Lucide React, `next-intl`.

## Global Constraints

- Preserve `th`, `en`, and `de` variants in all data models, DTOs, and UI strings.
- Strictly NO `any`, `as any`, or `@ts-ignore` in TypeScript; use `unknown` and narrow it.
- Strictly NO hardcoded text in UI components; use `next-intl` messages across all 6 message files (`messages/{th,en,de}.json` and `messages/admin/{th,en,de}.json`).
- Public UI styling MUST adhere to `DESIGN.md` (`0px` corner radius, `bg-site-canvas`, `text-site-foreground`, `border-site-border`, `bg-site-action`, `text-site-accent`, and `Europe/Berlin` timezone semantics).
- Admin routes MUST enforce granular permissions (`PermissionRequired("chatbot", "read/create/update/delete")`).
- Keep `backend/docs/openapi.yaml` synchronized with all new endpoints and schemas.

---

### Task 1: Database Migration, GORM Models & Seeder

**Files:**
- Create: `backend/migrations/000055_create_chatbot_knowledge_base.up.sql`
- Create: `backend/migrations/000055_create_chatbot_knowledge_base.down.sql`
- Create: `backend/internal/models/chatbot_knowledge_base.go`
- Modify: `backend/internal/config/config.go`
- Modify: `backend/internal/seeder/seed_roles_users.go`
- Modify: `backend/internal/seeder/seed_settings.go`
- Create: `backend/internal/seeder/seed_chatbot.go`
- Modify: `backend/internal/seeder/seeder.go`

**Interfaces:**
- Produces: `models.ChatbotKnowledgeBase` struct with JSONB `MultiLangText` Question & Answer, `datatypes.JSON` Keywords, Priority, and IsActive fields.
- Permissions: `chatbot` resource registered with `"all"` for admin role and `"all"` for editor role.

- [ ] **Step 1: Write database migration SQL files**

`backend/migrations/000055_create_chatbot_knowledge_base.up.sql`:
```sql
CREATE TABLE IF NOT EXISTS chatbot_knowledge_bases (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    category VARCHAR(100) NOT NULL DEFAULT 'general',
    question JSONB NOT NULL,
    answer JSONB NOT NULL,
    keywords JSONB DEFAULT '[]'::jsonb,
    priority INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_chatbot_kb_deleted_at ON chatbot_knowledge_bases(deleted_at);
CREATE INDEX IF NOT EXISTS idx_chatbot_kb_category ON chatbot_knowledge_bases(category);
CREATE INDEX IF NOT EXISTS idx_chatbot_kb_is_active ON chatbot_knowledge_bases(is_active);
CREATE INDEX IF NOT EXISTS idx_chatbot_kb_priority ON chatbot_knowledge_bases(priority DESC);
```

`backend/migrations/000055_create_chatbot_knowledge_base.down.sql`:
```sql
DROP TABLE IF EXISTS chatbot_knowledge_bases CASCADE;
```

- [ ] **Step 2: Create GORM model file `backend/internal/models/chatbot_knowledge_base.go`**

```go
package models

import (
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type ChatbotKnowledgeBase struct {
	gorm.Model
	Category string         `gorm:"type:varchar(100);index;not null;default:'general'" json:"category"`
	Question MultiLangText  `gorm:"type:jsonb;not null" json:"question"`
	Answer   MultiLangText  `gorm:"type:jsonb;not null" json:"answer"`
	Keywords datatypes.JSON `gorm:"type:jsonb;default:'[]'" json:"keywords"`
	Priority int            `gorm:"default:0;index" json:"priority"`
	IsActive bool           `gorm:"default:true;index" json:"is_active"`
}

func (ChatbotKnowledgeBase) TableName() string {
	return "chatbot_knowledge_bases"
}
```

- [ ] **Step 3: Register model in `backend/internal/config/config.go`**

Add `&models.ChatbotKnowledgeBase{}` to `MigrateModels()`.

- [ ] **Step 4: Update RBAC roles and settings in seeder**

In `backend/internal/seeder/seed_roles_users.go`:
Add `"chatbot": "all"` to the `admin` and `editor` permissions map.

In `backend/internal/seeder/seed_settings.go`:
Add settings:
- `chatbot_enabled`: `"true"` (group: `"system"`, type: `"boolean"`)
- `chatbot_system_prompt_extra`: `""` (group: `"system"`, type: `"text"`)

Create `backend/internal/seeder/seed_chatbot.go` with initial seed questions across TH, EN, DE (e.g. visiting rules, chanting hours, meditation guidance, monk ordination inquiries) and call `s.SeedChatbotKnowledgeBase()` from `seeder.go`.

- [ ] **Step 5: Verify migration & model build**

Run: `cd backend && go vet ./... && go build ./...`
Expected: PASS with 0 errors.

---

### Task 2: Backend Chatbot & Knowledge Base Domain Services

**Files:**
- Create: `backend/internal/services/chatbot_knowledge_base_service.go`
- Create: `backend/internal/services/chatbot_knowledge_base_service_test.go`
- Create: `backend/internal/services/chatbot_service.go`
- Create: `backend/internal/services/chatbot_service_test.go`

**Interfaces:**
- `ChatbotKnowledgeBaseService`:
  - `GetAll(c context.Context, page, limit int, search, category string, activeOnly bool) ([]models.ChatbotKnowledgeBase, int64, error)`
  - `GetByID(c context.Context, id uint) (*models.ChatbotKnowledgeBase, error)`
  - `Create(c context.Context, item *models.ChatbotKnowledgeBase) error`
  - `Update(c context.Context, id uint, item *models.ChatbotKnowledgeBase) error`
  - `Delete(c context.Context, id uint) error`
- `ChatbotService`:
  - `ProcessMessage(c context.Context, req ChatMessageRequest) (*ChatMessageResponse, error)`
  - `GetQuickQuestions(c context.Context, locale string) ([]QuickQuestionDto, error)`

- [ ] **Step 1: Write Knowledge Base Service unit test `chatbot_knowledge_base_service_test.go`**

Test validation rules (e.g. question and answer in TH cannot be empty), CRUD operations and category filtering.

- [ ] **Step 2: Implement `chatbot_knowledge_base_service.go`**

Implement GORM operations with transaction safety and clean error handling.

- [ ] **Step 3: Write Chatbot Service unit test `chatbot_service_test.go`**

Test context builder, persona prompt formatting, fallback handling when API key is missing or service is disabled.

- [ ] **Step 4: Implement `chatbot_service.go`**

Features:
- `IsEnabled(c context.Context) bool` (checks `Setting` key `chatbot_enabled`).
- Query upcoming active events (within 30 days) from `events` table.
- Query active schedules from `schedules` table.
- Query resident monks summary from `monks` table.
- Query temple profile from `public_contents` (About, Contact, Visit info).
- Query active `ChatbotKnowledgeBase` records, scoring relevance by keywords and locale questions.
- Assemble structured Markdown system context + persona guidelines (Calm, polite, truthful, Theravada Forest Tradition, anti-hallucination, no political/commercial topics).
- Call Gemini 2.5 Flash HTTP endpoint (reuse Gemini client patterns from `ai_translation_service.go`).
- Format response with suggested follow-up questions.

- [ ] **Step 5: Run backend service tests**

Run: `cd backend && go test -v ./internal/services/chatbot*`
Expected: PASS.

---

### Task 3: Backend Handlers, Route Registration & OpenAPI Sync

**Files:**
- Create: `backend/internal/handlers/admin_chatbot_handler.go`
- Create: `backend/internal/handlers/admin_chatbot_handler_test.go`
- Create: `backend/internal/handlers/chatbot_handler.go`
- Create: `backend/internal/handlers/chatbot_handler_test.go`
- Modify: `backend/internal/routes/routes.go`
- Modify: `backend/docs/openapi.yaml`

**Interfaces:**
- Public routes:
  - `POST /api/v1/public/chatbot/message` -> `chatbotHandler.SendMessage`
  - `GET /api/v1/public/chatbot/quick-questions` -> `chatbotHandler.GetQuickQuestions`
- Admin routes:
  - `GET /api/v1/admin/chatbot/knowledge-base` (`PermissionRequired("chatbot", "read")`)
  - `POST /api/v1/admin/chatbot/knowledge-base` (`PermissionRequired("chatbot", "create")`)
  - `GET /api/v1/admin/chatbot/knowledge-base/:id` (`PermissionRequired("chatbot", "read")`)
  - `PUT /api/v1/admin/chatbot/knowledge-base/:id` (`PermissionRequired("chatbot", "update")`)
  - `DELETE /api/v1/admin/chatbot/knowledge-base/:id` (`PermissionRequired("chatbot", "delete")`)

- [ ] **Step 1: Write handler tests `admin_chatbot_handler_test.go` and `chatbot_handler_test.go`**

Verify parameter parsing, HTTP status codes, validation error responses, and audit logging integration.

- [ ] **Step 2: Implement `admin_chatbot_handler.go` and `chatbot_handler.go`**

Use `utils.SuccessResponse`, `utils.PaginatedResponse`, and `utils.ErrorResponse` envelope. Parse body safely and audit mutations with `auditService`.

- [ ] **Step 3: Register routes in `backend/internal/routes/routes.go`**

Instantiate `ChatbotHandler` and `AdminChatbotHandler` and register them under the public and admin route groups with `middleware.PermissionRequired`.

- [ ] **Step 4: Update `backend/docs/openapi.yaml`**

Document all endpoints, request bodies, response schemas, and error shapes according to OpenAPI 3.0 specification.

- [ ] **Step 5: Verify backend builds and tests pass**

Run: `cd backend && go test ./... && go vet ./... && go build -o bin/server ./cmd/app`
Expected: PASS with 0 errors.

---

### Task 4: Frontend Contracts, API Clients & TanStack Query Hooks

**Files:**
- Create: `frontend/src/types/chatbot.ts`
- Create: `frontend/src/features/public/chatbot/types.ts`
- Create: `frontend/src/features/public/chatbot/api.ts`
- Create: `frontend/src/features/public/chatbot/queries.ts`
- Create: `frontend/src/services/adminChatbotService.ts`

**Interfaces:**
- Strictly typed TypeScript definitions:
  - `ChatbotKnowledgeBaseItem` (id, category, question: MultiLangText, answer: MultiLangText, keywords: string[], priority: number, is_active: boolean, created_at, updated_at).
  - `ChatbotMessageRequestDto` (`{ message: string; locale?: string; history?: { role: 'user' | 'model'; content: string }[] }`).
  - `ChatbotMessageResponseDto` (`{ reply: string; suggested_followups?: string[] }`).
  - `QuickQuestionDto` (`{ id: number; text: string; category?: string }`).
- Public API using `publicApi` from `@/services/publicService`.
- Admin Service using `createAdminService` / `adminApi` from `@/services/adminApi`.

- [ ] **Step 1: Create `frontend/src/types/chatbot.ts` and `frontend/src/features/public/chatbot/types.ts`**

Define exact interfaces with no `any`.

- [ ] **Step 2: Implement `frontend/src/features/public/chatbot/api.ts` and `queries.ts`**

Implement `sendChatMessage(payload)` and `fetchQuickQuestions(locale)`.
Create TanStack Query hooks `useQuickQuestions(locale)` and mutation `useSendChatMessage()`.

- [ ] **Step 3: Implement `frontend/src/services/adminChatbotService.ts`**

Implement typed admin service with standard CRUD, pagination, keyword search, and toggle active status.

- [ ] **Step 4: Verify frontend TypeScript type-checking**

Run: `cd frontend && ./node_modules/.bin/tsc --noEmit`
Expected: PASS.

---

### Task 5: Multilingual Translations (TH, EN, DE)

**Files:**
- Modify: `frontend/src/messages/th.json`
- Modify: `frontend/src/messages/en.json`
- Modify: `frontend/src/messages/de.json`
- Modify: `frontend/src/messages/admin/th.json`
- Modify: `frontend/src/messages/admin/en.json`
- Modify: `frontend/src/messages/admin/de.json`

**Keys:**
- Public `Chatbot` section:
  - `title`: "ผู้ช่วยข้อมูลวัดหลวงพ่อใส" / "Wat Loung Por Sai Assistant" / "Assistent des Klosters Wat Loung Por Sai"
  - `triggerAria`: "เปิดผู้ช่วยสนทนา" / "Open Chat Assistant" / "Chat-Assistent öffnen"
  - `welcomeMessage`: Welcome description in 3 languages.
  - `inputPlaceholder`: "พิมพ์ข้อความสอบถาม..." / "Type your message..." / "Ihre Nachricht eingeben..."
  - `send`: "ส่ง" / "Send" / "Senden"
  - `suggestedTitle`: "คำถามที่พบบ่อย" / "Suggested Questions" / "Häufige Fragen"
  - `disclaimer`: "ข้อมูลอาจมีการอัปเดต โปรดตรวจสอบกับเจ้าหน้าที่วัดหากต้องการยืนยัน" / "Information may change; please verify with temple staff." / "Angaben ohne Gewähr; bitte bei Bedarf beim Tempel nachfragen."
  - `clearChat`: "ล้างการสนทนา" / "Clear Conversation" / "Verlauf löschen"
  - `minimize`: "ย่อ" / "Minimize" / "Minimieren"
  - `close`: "ปิด" / "Close" / "Schließen"
  - `typing`: "กำลังคิดคำตอบ..." / "Typing..." / "Antwortet..."
  - `errorFallback`: "ขออภัย ระบบไม่สามารถตอบกลับได้ในขณะนี้ โปรดติดต่อวัดโดยตรง"
- Admin `ChatbotAdmin` and `Sidebar` keys for knowledge base management.

- [ ] **Step 1: Add keys to all 3 public message files (`th.json`, `en.json`, `de.json`)**
- [ ] **Step 2: Add keys to all 3 admin message files (`admin/th.json`, `admin/en.json`, `admin/de.json`)**
- [ ] **Step 3: Validate JSON format of all 6 files**

---

### Task 6: Frontend Public Floating Chat Widget

**Files:**
- Create: `frontend/src/components/chatbot/ChatWidget.tsx`
- Create: `frontend/src/components/chatbot/ChatMessageList.tsx`
- Create: `frontend/src/components/chatbot/ChatQuickChips.tsx`
- Modify: `frontend/src/app/[locale]/(client)/layout.tsx`

**Design & Behavioral Requirements:**
- Adheres strictly to `DESIGN.md`: `0px` border radius (`rounded-none`), `bg-site-canvas`, `text-site-foreground`, `border-site-border`, `bg-site-action`, `text-site-accent`, `focus-visible:ring-site-accent`.
- Floating trigger button fixed at bottom-right (`bottom-6 right-6 z-40`), with a discrete pill indicator.
- Chat card: 380px wide on desktop, slide-over/drawer on mobile screens.
- Supports markdown rendering for bullet lists, bold text, and clickable internal links.
- Uses `sessionStorage` to persist conversation history across page navigation.
- Smooth typing indicator while waiting for Gemini API response.
- Embedded cleanly in `layout.tsx` for all public client routes.

- [ ] **Step 1: Implement `ChatQuickChips.tsx` and `ChatMessageList.tsx`**
- [ ] **Step 2: Implement `ChatWidget.tsx` with responsive layout and keyboard accessibility**
- [ ] **Step 3: Embed `ChatWidget` in `frontend/src/app/[locale]/(client)/layout.tsx`**
- [ ] **Step 4: Run typecheck and linting**

Run: `cd frontend && npm run lint && ./node_modules/.bin/tsc --noEmit`
Expected: PASS.

---

### Task 7: Frontend Admin Knowledge Base Management Page & Form Drawer

**Files:**
- Create: `frontend/src/app/[locale]/admin/chatbot/page.tsx`
- Create: `frontend/src/components/admin/chatbot/KnowledgeBaseDrawer.tsx`
- Modify: `frontend/src/components/admin/AdminSidebar.tsx`

**Features:**
- Protected by `usePermission("chatbot", "read")`.
- Table listing Knowledge Base items using `useDataTable`, with category filters, keyword search, priority sorting, and active status toggles.
- Modal/Drawer with `MultiLangInput` for questions (text) and answers (textarea) across TH, EN, and DE.
- Category selector and keyword tag input.
- Added to Admin Sidebar under the Content/Website group.

- [ ] **Step 1: Implement `KnowledgeBaseDrawer.tsx` with form validation**
- [ ] **Step 2: Implement `/admin/chatbot/page.tsx` with DataTable and action controls**
- [ ] **Step 3: Add Chatbot menu item into `AdminSidebar.tsx`**
- [ ] **Step 4: Verify frontend build**

Run: `cd frontend && npm run build`
Expected: PASS with 0 build errors.

---

### Task 8: End-to-End Verification & Walkthrough Artifact

**Files:**
- Create / Update Walkthrough Artifact

- [ ] **Step 1: Run complete backend verification suite**
  - `cd backend && go test ./...`
  - `cd backend && go vet ./...`
  - `cd backend && go build -o bin/server ./cmd/app`

- [ ] **Step 2: Run complete frontend verification suite**
  - `cd frontend && ./node_modules/.bin/tsc --noEmit`
  - `cd frontend && npm run lint`
  - `cd frontend && npm run build`

- [ ] **Step 3: Verify OpenAPI Spec completeness and compliance**
