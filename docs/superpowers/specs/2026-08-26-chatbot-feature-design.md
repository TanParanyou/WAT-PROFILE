# Design Document: Multilingual Visitor Chatbot & Knowledge Base

**Date:** 2026-08-26  
**Status:** Approved  
**Author:** AI Agent & Project Owner  
**Scope:** Full-stack (Backend Go Fiber + PostgreSQL + Frontend Next.js + Gemini LLM)

---

## 1. Executive Summary

This feature introduces an intelligent, multilingual Public Visitor Chatbot for the Wat Loung Por Sai website alongside an Admin Knowledge Base management interface. The chatbot acts as a virtual temple assistant for visitors in German, English, and Thai, answering inquiries about temple history, upcoming events, meditation schedules, monastic community, ordination procedures, and visiting etiquette.

The chatbot utilizes a **Hybrid Context Aggregator** model: combining dynamic real-time data from the temple's PostgreSQL database (events, schedules, monks, public content) with curated Q&A items managed by temple administrators in the Admin Panel. It enforces strict brand persona and safety guardrails to ensure polite, accurate, and faithful responses aligned with the temple's Theravada Forest Tradition identity.

---

## 2. Architecture & Data Flow

```text
+-------------------------------------------------------------------------+
|                              Frontend                                   |
|  +--------------------------------+   +-------------------------------+ |
|  | Public Floating Chat Widget    |   | Admin Knowledge Base Manager  | |
|  | (Next.js / Lucide / Tailwind)  |   | (/admin/chatbot)              | |
|  +----------------+---------------+   +---------------+---------------+ |
+-------------------|-----------------------------------|-----------------+
                    |                                   |
                    | POST /api/v1/public/chatbot/message
                    |                                   | Admin CRUD
                    v                                   v
+-------------------------------------------------------------------------+
|                         Backend (Go Fiber)                              |
|  +-------------------------------------------------------------------+  |
|  | Middlewares: RateLimiter, InputSanitizer, PermissionRequired      |  |
|  +---------------------------------+---------------------------------+  |
|                                    |                                    |
|                                    v                                    |
|  +-------------------------------------------------------------------+  |
|  | ChatbotService:                                                   |  |
|  | 1. Query matching Q&A from ChatbotKnowledgeBase table             |  |
|  | 2. Query upcoming Events, Schedules, Monks & About/Contact info    |  |
|  | 3. Assemble structured System Context + Persona Guardrails        |  |
|  | 4. Call Gemini 2.5 Flash API with user message & history          |  |
|  +-------------------+-------------------------------+---------------+  |
+----------------------|-------------------------------|------------------+
                       |                               |
                       v                               v
           +-----------------------+       +----------------------+
           | PostgreSQL (Database) |       | Google Gemini API    |
           +-----------------------+       +----------------------+
```

---

## 3. Database Schema

### 3.1 Model: `ChatbotKnowledgeBase` (`models.ChatbotKnowledgeBase`)
```go
package models

import (
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type ChatbotKnowledgeBase struct {
	gorm.Model
	Category string        `gorm:"type:varchar(100);index;not null" json:"category"` // e.g. "general", "practice", "visiting", "ordination"
	Question MultiLangText `gorm:"type:jsonb;not null" json:"question"`
	Answer   MultiLangText `gorm:"type:jsonb;not null" json:"answer"`
	Keywords datatypes.JSON `gorm:"type:jsonb" json:"keywords"`                     // JSON array of strings e.g. ["สวดมนต์", "chanting", "schedule"]
	Priority int           `gorm:"default:0" json:"priority"`
	IsActive bool          `gorm:"default:true;index" json:"is_active"`
}
```

### 3.2 System Settings
- `chatbot_enabled`: boolean string (`"true"` / `"false"`), default `"true"`.
- `chatbot_system_prompt_extra`: optional admin string for situational announcements or temple notices.

---

## 4. API Endpoints Specification

### 4.1 Public Endpoints
- **`POST /api/v1/public/chatbot/message`**
  - **Access:** Public (with IP-based rate limiting)
  - **Request Body:**
    ```json
    {
      "message": "string (1-500 chars, required)",
      "locale": "th | en | de (optional, default 'th')",
      "history": [
        {
          "role": "user | model",
          "content": "string"
        }
      ]
    }
    ```
  - **Response Body (`200 OK`):**
    ```json
    {
      "success": true,
      "data": {
        "reply": "string",
        "suggested_followups": ["string"]
      }
    }
    ```

- **`GET /api/v1/public/chatbot/quick-questions`**
  - **Access:** Public
  - **Query Params:** `locale=th|en|de`
  - **Response Body (`200 OK`):**
    ```json
    {
      "success": true,
      "data": [
        { "id": 1, "text": "ตารางปฏิบัติธรรมสัปดาห์นี้" },
        { "id": 2, "text": "การเดินทางมาวัด" },
        { "id": 3, "text": "การเตรียมตัวก่อนมาวัด" }
      ]
    }
    ```

### 4.2 Admin Endpoints (RBAC Resource: `chatbot`)
- **`GET /api/v1/admin/chatbot/knowledge-base`** (Permission: `chatbot:read`): Paginated list, search by keyword, filter by category/status.
- **`POST /api/v1/admin/chatbot/knowledge-base`** (Permission: `chatbot:create`): Create Q&A item.
- **`GET /api/v1/admin/chatbot/knowledge-base/:id`** (Permission: `chatbot:read`): Get single Q&A item.
- **`PUT /api/v1/admin/chatbot/knowledge-base/:id`** (Permission: `chatbot:update`): Update Q&A item.
- **`DELETE /api/v1/admin/chatbot/knowledge-base/:id`** (Permission: `chatbot:delete`): Soft delete Q&A item.

---

## 5. Backend Logic & Guardrails

### 5.1 Context Aggregation Pipeline
1. **Query Knowledge Base:** Search active entries matching keywords or query text across TH/EN/DE. If no direct keyword match, load top priority general FAQ entries.
2. **Query Live Site Data:**
   - Active upcoming events (within 30 days) from `events` table.
   - Recurring weekly chanting/meditation schedules from `schedules` table.
   - Basic monk count and resident information from `monks` table.
   - Temple contact details, address, opening hours from `public_contents` / settings.
3. **Prompt Composition:**
   - Combine Persona guidelines + Live Site Context + Knowledge Base Q&A + User History + User Query into Gemini prompt structure.

### 5.2 Persona & Guardrails
- **Tone:** Calm, polite, welcoming, truthful, and clear (aligning with `PRODUCT.md`).
- **Language:** Matches the user's active locale or prompt language (TH, EN, DE).
- **Anti-Hallucination:** If requested information is unknown or not present in the context, politely state lack of info and provide official contact channels (Contact Inquiry form or phone number).
- **Scope Restriction:** Decline political, commercial, or irrelevant personal questions politely.

---

## 6. Frontend UI Components

### 6.1 Public Floating Chat Widget (`frontend/src/components/chatbot/ChatWidget.tsx`)
- **Location:** Embedded in `frontend/src/app/[locale]/(client)/layout.tsx`.
- **States:**
  - Collapsed: Circular floating trigger button at bottom-right with temple color palette & icon.
  - Expanded: Floating card on desktop (w: 380px, h: 560px) / full-width drawer on mobile.
- **Features:**
  - Header with bot title, online badge, reset conversation button, and minimize button.
  - Suggested quick question chips loaded dynamically based on active locale.
  - Formatted message stream supporting markdown lists, bold text, and clickable internal links.
  - Typing indicator during API generation.
  - `sessionStorage` conversation caching so chat state persists across page navigation.

### 6.2 Admin Knowledge Base Manager (`frontend/src/app/[locale]/admin/chatbot/`)
- **Location:** Added to Admin navigation under the sidebar.
- **Table view:** Built with standard `useDataTable` pattern, filtering by category, search, and active status toggle.
- **Form Drawer:** Modal/Drawer using `MultiLangInput` for questions and answers across TH, EN, and DE with form validation.

---

## 7. Security, Resilience & Quality Assurance

1. **Rate Limiting:** Protect public chatbot endpoint (10 requests/min per IP) to prevent spam and LLM quota exhaustion.
2. **Graceful Fallbacks:** If `GEMINI_API_KEY` is unset or LLM request times out (15s), return a friendly fallback message directing visitors to contact options without 500 crashes.
3. **OpenAPI Synchronization:** Update `backend/docs/openapi.yaml` with all new chatbot endpoints and DTO definitions.
4. **Verification & Tests:**
   - Backend unit tests for `ChatbotService` and `ChatbotHandler`.
   - Run `go build ./...` and `go vet ./...` (backend).
   - Run `npm run build` and `tsc --noEmit` (frontend).
