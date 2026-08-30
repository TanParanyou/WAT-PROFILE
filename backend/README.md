# WAT-PROFILE Backend API 🏛️

Backend REST API for Wat Loung Por Sai temple management system built with Go Fiber v2 + PostgreSQL + GORM + JSONB Multi-language Support.

---

## ✨ Features

- 🔐 **Authentication & Security** - Multi-tiered JWT auth (In-Memory Admin token, SHA-256 rotating HttpOnly refresh cookie, 2FA/TOTP)
- 🛡️ **Granular RBAC** - Role-Based Access Control mapped via JSONB permissions with route middleware
- 🌐 **Multi-language (TH/EN/DE)** - First-class JSONB multi-language support across all entities
- 📅 **Events & Calendar** - Event schedules, categories, calendar resource registry, and scheduled publishing
- 👥 **Monks & Daily Schedules** - Monks directory with rich text bios and recurring/daily routine schedules
- 🖼️ **Gallery & Media Recycle Bin** - Cloudflare R2 integration, image crop, reference tracking, and 30-day trash retention
- 💰 **Donations & Certificates** - Self-reported donation proof review, staff entry, multi-currency, and digital signature PDF generation
- 🎟️ **Event Registrations & Check-in** - Individual & group registrations, QR passes, and mobile attendance check-in
- 📰 **News & Site Alerts** - Multilingual news articles, categories, urgent alert banners and emergency popups
- 📜 **Digital Chanting Book** - Pali text, multilingual translations, audio player integration, and holy days calendar
- 🤖 **AI Chatbot** - Integrated AI chatbot with prompt sanitization, rate limits, and Admin Knowledge Base
- 💬 **Community Q&A** - Dharma discussion forum with rich-text editor, official answers, voting, and moderation queue
- 📊 **Analytics Hub** - Privacy-friendly anonymized page view tracking and aggregation endpoints
- 💾 **Automated Backups** - Daily R2 database backups and JSON application snapshot export

---

## 🚀 Quick Start

### Prerequisites
- Go 1.24+ (Module declared as Go 1.24)
- PostgreSQL 15+

### 1. Install Dependencies

```bash
go mod download
```

### 2. Setup Environment

```bash
cp .env.example .env
```

Edit `.env` values (never commit this file).

### 3. Run Migrations & Seed

```bash
go run cmd/migrate/main.go up
go run cmd/seed/main.go
```

### 4. Run Backend API Server

```bash
go run cmd/app/main.go
```

- **Backend API:** `http://localhost:8080`
- **Health check:** `http://localhost:8080/health`
- **Scalar API Reference:** `http://localhost:8080/docs`
- **OpenAPI Asset:** `http://localhost:8080/docs/openapi.yaml`

---

## 📡 API Endpoints Overview

### Public Endpoints (No Auth Required)
- `GET /api/v1/public/events` — List events with filters & pagination
- `GET /api/v1/public/events/:slug` — Event details
- `GET /api/v1/public/calendar` — Public calendar feed
- `GET /api/v1/public/news` — Public news articles & categories
- `GET /api/v1/public/alerts` — Active urgent site alerts
- `GET /api/v1/public/chanting` — Digital chanting book entries
- `POST /api/v1/public/chatbot/message` — AI chatbot message interaction
- `GET /api/v1/public/monks` — Monks directory
- `GET /api/v1/public/gallery` — Gallery images & categories
- `GET /api/v1/public/schedules` — Daily & weekly routine schedules
- `POST /api/v1/public/donations` — Submit self-reported donation with proof slip
- `POST /api/v1/public/contact` — Submit contact inquiry
- `POST /api/v1/public/analytics/track` — Anonymized page view tracking
- `GET /api/v1/public/about`, `contact`, `privacy`, `impressum` — Static public content

### Auth Endpoints
- `POST /api/v1/auth/login` — Public member login
- `POST /api/v1/auth/refresh` — Refresh member access token
- `POST /api/v1/auth/admin/login` — Admin login (Strict rate limit, HttpOnly cookie)
- `POST /api/v1/auth/admin/refresh` — Rotate Admin session via cookie
- `POST /api/v1/auth/admin/logout` — Revoke Admin session

### Admin Endpoints (Admin Token + `PermissionRequired`)
- `/api/v1/admin/dashboard/*` — Real-time stats & overview
- `/api/v1/admin/analytics/*` — Analytics overview, trends, top resources
- `/api/v1/admin/events/*` & `/event-categories/*` — Events & category CRUD
- `/api/v1/admin/calendar-resources/*` — Calendar location/resource registry
- `/api/v1/admin/monks/*` — Monks directory management
- `/api/v1/admin/chanting/*` — Chanting book & audio management
- `/api/v1/admin/gallery/*` & `/upload` — Gallery & R2 file uploads
- `/api/v1/admin/media/*` — Media lifecycle, reference checks & recycle bin
- `/api/v1/admin/donations/*` — Donation proof review, confirmation & PDF certificates
- `/api/v1/admin/news/*` & `/news-categories/*` — News articles & categories
- `/api/v1/admin/site-alerts/*` — Site alert banners & popups
- `/api/v1/admin/chatbot/knowledge-base/*` — AI Chatbot knowledge base management
- `/api/v1/admin/community/*` — Community moderation queue, official answers & restrictions
- `/api/v1/admin/users/*` & `/roles/*` — User accounts & RBAC permission matrix
- `/api/v1/admin/audit-logs/*` — System audit logs with filter & export
- `/api/v1/admin/backup/*` — Daily R2 backup status & JSON snapshot export

---

## 🐳 Docker Deployment

The multi-stage `Dockerfile` compiles all binaries using `golang:1.25.0-alpine` with runtime on `alpine:3.20`:

```bash
docker build -t wat-profile-api .
docker run -p 8080:8080 --env-file .env wat-profile-api
```

---

## 📚 Documentation Links

- **Architecture**: [`../ARCHITECTURE.md`](../ARCHITECTURE.md)
- **Database & Migrations**: [`../docs/DATABASE.md`](../docs/DATABASE.md)
- **Deployment Specification**: [`../docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md)
- **Production Runbook**: [`../docs/PRODUCTION_RUNBOOK.md`](../docs/PRODUCTION_RUNBOOK.md)
- **Admin User Manual**: [`../docs/ADMIN-USER-MANUAL-TH.md`](../docs/ADMIN-USER-MANUAL-TH.md)

