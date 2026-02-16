# WAT-PROFILE Backend - Implementation Plan

## Context

วัดหลวงพ่อใส (Wat Loung Por Sai) ปัจจุบันใช้เว็บไซต์ Next.js แบบ static ที่เก็บข้อมูลใน JSON files ต้องการพัฒนาระบบ backend เพื่อ:

1. **Admin Panel** - จัดการเนื้อหาผ่านหน้าเว็บแทนการแก้ไข JSON
2. **ระบบสมาชิก/ผู้มีจิต** - ให้ศิษยานุศิษย์สมัครและ login เพื่อเข้าถึงฟีเจอร์พิเศษ
3. **ระบบบริจาค/บุญ** - บันทึกการบริจาค ออกใบเสร็จ รายงานทางบัญชี
4. **ระบบลงทะเบียนกิจกรรม** - ให้ผู้สนใจลงทะเบียนเข้าร่วมคอร์สปฏิบัติธรรม/งานบุญ

### ข้อกำหนดพิเศษ
- **Multi-language Support**: ทุก content ต้องรองรับ ไทย (th) / อังกฤษ (en) / เยอรมัน (de)
- **แยก Deployment**: หลายวัดสามารถใช้ระบบนี้ได้ แต่แต่ละวัดจะมี backend + database แยกกัน
- **ไม่ Dependency กับ 1931-DESIGN**: สร้าง backend ใหม่เฉพาะสำหรับวัด (แต่ใช้แนวทางจาก 1931-DESIGN เป็น reference)

---

## Architecture Overview

### Technology Stack

**Backend:**
- **Framework**: Go Fiber v2 (Fast, Express-like HTTP framework)
- **Database**: PostgreSQL (via Supabase หรือ Railway)
- **ORM**: GORM (Go Object-Relational Mapping)
- **Authentication**: JWT (JSON Web Tokens)
- **Storage**: Cloudflare R2 (S3-compatible, สำหรับรูปภาพ)
- **Email**: SMTP (Gmail หรือ Resend)
- **Scheduler**: robfig/cron (สำหรับ automated tasks)

**Frontend:**
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: React Context + React Query
- **i18n**: next-intl (มีอยู่แล้ว)

### System Architecture

```
┌─────────────────┐
│  Next.js        │
│  Frontend       │ ← User Interface (Public + Admin + Member)
│  (Vercel)       │
└────────┬────────┘
         │ HTTPS/REST API
         │
┌────────▼────────┐
│  Go Fiber       │
│  Backend        │ ← Business Logic + API
│  (Railway)      │
└────┬───┬───┬────┘
     │   │   │
     │   │   └──────► Cloudflare R2 (Images)
     │   └──────────► SMTP Server (Email)
     │
┌────▼────────────┐
│  PostgreSQL     │ ← Data Storage
│  (Railway/      │
│   Supabase)     │
└─────────────────┘
```

### โครงสร้าง Backend Project

```
wat-profile-backend/
├── cmd/
│   └── app/
│       └── main.go              # Entry point
├── internal/                    # Private application code
│   ├── config/
│   │   └── config.go            # Configuration management
│   ├── models/                  # Database models (GORM)
│   │   ├── user.go              # Auth user
│   │   ├── member.go            # Temple member
│   │   ├── event.go             # Events/activities
│   │   ├── monk.go              # Monks profile
│   │   ├── gallery.go           # Gallery images
│   │   ├── schedule.go          # Daily/weekly schedule
│   │   ├── donation.go          # Donations tracking
│   │   ├── event_registration.go
│   │   └── temple_setting.go    # Site settings
│   ├── handlers/                # HTTP handlers (controllers)
│   │   ├── auth_handler.go      # Auth endpoints
│   │   ├── member_handler.go
│   │   ├── event_handler.go
│   │   ├── monk_handler.go
│   │   ├── gallery_handler.go
│   │   ├── donation_handler.go
│   │   └── admin_handler.go
│   ├── services/                # Business logic
│   │   ├── auth_service.go
│   │   ├── email_service.go
│   │   ├── storage_service.go   # R2 uploads
│   │   ├── pdf_service.go       # Receipt generation
│   │   └── member_service.go
│   ├── middleware/              # HTTP middleware
│   │   ├── auth.go              # JWT verification
│   │   ├── admin.go             # Admin-only check
│   │   ├── cors.go
│   │   └── logger.go
│   ├── routes/
│   │   └── routes.go            # Route definitions
│   └── database/
│       ├── database.go          # DB connection
│       └── migrations.go        # Auto-migration
├── pkg/                         # Public reusable packages
│   └── utils/
│       ├── jwt.go               # JWT helper
│       ├── password.go          # Bcrypt hashing
│       └── response.go          # Standard API response
├── migrations/                  # SQL migrations
│   └── 001_initial_schema.sql
├── scripts/
│   └── import_json.go           # JSON → DB migration script
├── .env.example
├── Dockerfile
├── go.mod
└── go.sum
```

---

## Database Schema

### Core Tables

#### 1. Users & Authentication

```sql
-- Users (ระบบ Auth หลัก)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'member',      -- 'admin', 'member', 'guest'
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Password Reset Tokens
CREATE TABLE password_resets (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Members (ผู้มีจิต/สมาชิก) - extends users
CREATE TABLE members (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    member_code VARCHAR(20) UNIQUE NOT NULL,  -- Auto: WLP-2024-001
    first_name_th VARCHAR(100),
    last_name_th VARCHAR(100),
    first_name_en VARCHAR(100),
    last_name_en VARCHAR(100),
    birth_date DATE,
    gender VARCHAR(10),                       -- 'male', 'female', 'other'
    nationality VARCHAR(100),
    address_th TEXT,
    address_en TEXT,
    phone VARCHAR(20),
    line_id VARCHAR(100),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    membership_type VARCHAR(50) DEFAULT 'regular',  -- 'regular', 'lifetime'
    membership_status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive'
    membership_date DATE DEFAULT CURRENT_DATE,
    profile_image_url VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. Temple Content

```sql
-- Events (กิจกรรม/งานบุญ/คอร์ส)
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    title JSONB NOT NULL,                     -- {"th": "", "en": "Title", "de": ""}
    description JSONB,                        -- {"th": "", "en": "Description", "de": ""}
    event_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    location JSONB,                           -- {"th": "", "en": "Location", "de": ""}
    image_url VARCHAR(255),
    map_url TEXT,                             -- Google Maps embed URL
    event_type VARCHAR(50),                   -- 'meditation_course', 'ceremony', 'festival'
    is_recurring BOOLEAN DEFAULT false,
    recurring_pattern VARCHAR(50),            -- 'monthly', 'yearly'
    max_participants INT,                     -- NULL = unlimited
    registration_enabled BOOLEAN DEFAULT false,
    registration_deadline TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints: English (en) is required for multi-language fields
    CHECK (title ? 'en' AND title->>'en' IS NOT NULL AND title->>'en' != '')
);

-- Event Schedules (กำหนดการย่อยในแต่ละกิจกรรม)
CREATE TABLE event_schedules (
    id SERIAL PRIMARY KEY,
    event_id INT REFERENCES events(id) ON DELETE CASCADE,
    time TIME NOT NULL,
    activity JSONB NOT NULL,                  -- {"th": "", "en": "Activity", "de": ""}
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints: English (en) is required
    CHECK (activity ? 'en' AND activity->>'en' IS NOT NULL AND activity->>'en' != '')
);

-- Monks (พระสงฆ์)
CREATE TABLE monks (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    image_url VARCHAR(255),
    name JSONB NOT NULL,                      -- {"th": "", "en": "Monk Name", "de": ""}
    title JSONB,                              -- {"th": "พระอาจารย์", "en": "Venerable", "de": ""}
    bio JSONB,                                -- {"th": "", "en": "Biography", "de": ""}
    ordination_date DATE,                     -- วันอุปสมบท
    position VARCHAR(100),                    -- 'abbot', 'vice_abbot', 'monk'
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints: English (en) is required for name
    CHECK (name ? 'en' AND name->>'en' IS NOT NULL AND name->>'en' != '')
);

-- Gallery Categories
CREATE TABLE gallery_categories (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    name JSONB NOT NULL,                      -- {"th": "", "en": "Category Name", "de": ""}
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints: English (en) is required
    CHECK (name ? 'en' AND name->>'en' IS NOT NULL AND name->>'en' != '')
);

-- Gallery
CREATE TABLE gallery (
    id SERIAL PRIMARY KEY,
    image_url VARCHAR(255) NOT NULL,
    thumbnail_url VARCHAR(255),               -- Optimized thumbnail
    caption JSONB,                            -- {"th": "", "en": "Caption", "de": ""}
    category_id INT REFERENCES gallery_categories(id) ON DELETE SET NULL,
    event_id INT REFERENCES events(id) ON DELETE SET NULL,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schedules (กำหนดการประจำ)
CREATE TABLE schedules (
    id SERIAL PRIMARY KEY,
    schedule_type VARCHAR(20) NOT NULL,       -- 'daily', 'weekly', 'online'
    day_of_week INT,                          -- 0=Sunday, 6=Saturday (for weekly)
    time_start TIME,
    time_end TIME,
    activity JSONB NOT NULL,                  -- {"th": "", "en": "Activity", "de": ""}
    location JSONB,                           -- {"th": "", "en": "Location", "de": ""}
    online_link TEXT,                         -- Facebook Live URL
    is_active BOOLEAN DEFAULT true,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints: English (en) is required for activity
    CHECK (activity ? 'en' AND activity->>'en' IS NOT NULL AND activity->>'en' != '')
);

-- Temple Settings (ตั้งค่าวัด)
CREATE TABLE temple_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB,                              -- {"th": "", "en": "Value", "de": ""}
    category VARCHAR(50),                     -- 'general', 'contact', 'social', 'bank'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. Donation System

```sql
-- Donation Categories (ประเภทบุญ)
CREATE TABLE donation_categories (
    id SERIAL PRIMARY KEY,
    name JSONB NOT NULL,                      -- {"th": "", "en": "Category Name", "de": ""}
    description JSONB,                        -- {"th": "", "en": "Description", "de": ""}
    is_active BOOLEAN DEFAULT true,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints: English (en) is required for name
    CHECK (name ? 'en' AND name->>'en' IS NOT NULL AND name->>'en' != '')
);

-- Donations
CREATE TABLE donations (
    id SERIAL PRIMARY KEY,
    receipt_number VARCHAR(50) UNIQUE NOT NULL,  -- Auto: DON-2024-001
    donor_type VARCHAR(20) NOT NULL,            -- 'member', 'guest', 'anonymous'
    member_id INT REFERENCES members(id) ON DELETE SET NULL,
    donor_name VARCHAR(255),                     -- For guest/anonymous
    donor_email VARCHAR(255),
    donor_phone VARCHAR(20),
    donor_address TEXT,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    donation_date DATE DEFAULT CURRENT_DATE,
    donation_method VARCHAR(50),                 -- 'bank_transfer', 'cash', 'paypal'
    category_id INT REFERENCES donation_categories(id) ON DELETE SET NULL,
    purpose JSONB,                               -- {"th": "", "en": "Purpose", "de": ""} - หมายเหตุเฉพาะ
    is_anonymous BOOLEAN DEFAULT false,
    tax_receipt_required BOOLEAN DEFAULT false,
    tax_receipt_sent BOOLEAN DEFAULT false,
    tax_receipt_sent_at TIMESTAMPTZ,
    notes TEXT,                                  -- Admin notes
    status VARCHAR(20) DEFAULT 'confirmed',      -- 'pending', 'confirmed', 'cancelled'
    created_by INT REFERENCES users(id) ON DELETE SET NULL,  -- Admin ที่บันทึก
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4. Event Registration System

```sql
-- Event Registrations
CREATE TABLE event_registrations (
    id SERIAL PRIMARY KEY,
    event_id INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    registration_type VARCHAR(20) NOT NULL,      -- 'member', 'guest'
    member_id INT REFERENCES members(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    dietary_restrictions TEXT,                   -- อาหารที่แพ้/ไม่ทาน
    special_needs TEXT,                          -- ความต้องการพิเศษ
    additional_notes TEXT,
    registration_status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'confirmed', 'cancelled', 'attended'
    confirmation_code VARCHAR(50) UNIQUE,        -- For email confirmation
    confirmed_at TIMESTAMPTZ,
    attended BOOLEAN DEFAULT false,
    attended_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 5. Contact & Inquiries

```sql
-- Contact Inquiries
CREATE TABLE contact_inquiries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    subject VARCHAR(500),
    message TEXT NOT NULL,
    inquiry_type VARCHAR(50),                    -- 'general', 'event', 'donation', 'volunteer'
    status VARCHAR(20) DEFAULT 'new',            -- 'new', 'read', 'replied', 'archived'
    replied_by INT REFERENCES users(id) ON DELETE SET NULL,
    replied_at TIMESTAMPTZ,
    reply_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes for Performance

```sql
-- Events
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_active ON events(is_active);
CREATE INDEX idx_events_type ON events(event_type);

-- Donations
CREATE INDEX idx_donations_date ON donations(donation_date);
CREATE INDEX idx_donations_member ON donations(member_id);
CREATE INDEX idx_donations_status ON donations(status);

-- Event Registrations
CREATE INDEX idx_registrations_event ON event_registrations(event_id);
CREATE INDEX idx_registrations_member ON event_registrations(member_id);
CREATE INDEX idx_registrations_status ON event_registrations(registration_status);

-- Gallery
CREATE INDEX idx_gallery_category ON gallery(category_id);
CREATE INDEX idx_gallery_event ON gallery(event_id);

-- Members
CREATE INDEX idx_members_user ON members(user_id);
CREATE INDEX idx_members_code ON members(member_code);
```

---

## API Endpoints

### Base URL
```
Production:  https://api-wat-profile.railway.app/api/v1
Development: http://localhost:8080/api/v1
```

### Authentication

```
POST   /api/v1/auth/register          - สมัครสมาชิก
POST   /api/v1/auth/login             - เข้าสู่ระบบ
POST   /api/v1/auth/refresh           - Refresh token
POST   /api/v1/auth/forgot-password   - ขอรหัสผ่านใหม่
POST   /api/v1/auth/reset-password    - ตั้งรหัสผ่านใหม่
GET    /api/v1/auth/profile           - ดูข้อมูลตัวเอง (Protected)
PUT    /api/v1/auth/profile           - แก้ไขข้อมูลตัวเอง (Protected)
```

**Request Example:**
```json
// POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

// Response
{
  "success": true,
  "data": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "user@example.com",
      "role": "member"
    }
  }
}
```

### Public APIs (ไม่ต้อง Authentication)

```
GET    /api/v1/public/settings                    - ตั้งค่าวัด (ชื่อ, ที่อยู่, ติดต่อ)
GET    /api/v1/public/events                      - รายการกิจกรรม (with pagination, filter)
GET    /api/v1/public/events/:slug                - รายละเอียดกิจกรรม
GET    /api/v1/public/monks                       - รายชื่อพระสงฆ์
GET    /api/v1/public/monks/:slug                 - ประวัติพระสงฆ์
GET    /api/v1/public/gallery                     - Gallery (with category filter)
GET    /api/v1/public/gallery/categories          - หมวดหมู่ Gallery
GET    /api/v1/public/schedule                    - กำหนดการประจำ (daily/weekly/online)
POST   /api/v1/public/contact                     - ส่งข้อความติดต่อ
POST   /api/v1/public/events/:id/register         - ลงทะเบียนกิจกรรม (guest)
GET    /api/v1/public/donation-categories         - ประเภทบุญ
POST   /api/v1/public/donations                   - บันทึกการบริจาค (guest/member)
GET    /api/v1/public/donations/receipt/:number   - ดูใบเสร็จ (public with receipt number)
```

### Member APIs (ต้อง login)

```
GET    /api/v1/members/me                         - ข้อมูลสมาชิกตัวเอง
PUT    /api/v1/members/me                         - แก้ไขข้อมูล
GET    /api/v1/members/me/donations               - ประวัติบริจาค
GET    /api/v1/members/me/events                  - กิจกรรมที่ลงทะเบียน
POST   /api/v1/members/events/:id/register        - ลงทะเบียนกิจกรรม (member)
DELETE /api/v1/members/events/:id/cancel          - ยกเลิกการลงทะเบียน
```

### Admin APIs (ต้องมีสิทธิ์ admin)

#### Events Management
```
GET    /api/v1/admin/events                       - List all events (with filters)
POST   /api/v1/admin/events                       - Create event
GET    /api/v1/admin/events/:id                   - Get event details
PUT    /api/v1/admin/events/:id                   - Update event
DELETE /api/v1/admin/events/:id                   - Delete event
PUT    /api/v1/admin/events/:id/toggle            - Toggle active status

# Event Registrations
GET    /api/v1/admin/events/:id/registrations     - รายชื่อผู้ลงทะเบียน
PUT    /api/v1/admin/events/:id/registrations/:regId  - อัพเดตสถานะ (confirm/cancel)
PUT    /api/v1/admin/events/:id/registrations/:regId/attendance  - บันทึกเข้าร่วม
GET    /api/v1/admin/events/:id/export            - Export CSV/PDF
POST   /api/v1/admin/events/:id/send-email        - ส่งอีเมลถึงผู้ลงทะเบียน
```

#### Monks Management
```
GET    /api/v1/admin/monks                        - List monks
POST   /api/v1/admin/monks                        - Create monk profile
GET    /api/v1/admin/monks/:id                    - Get monk details
PUT    /api/v1/admin/monks/:id                    - Update monk
DELETE /api/v1/admin/monks/:id                    - Delete monk
PUT    /api/v1/admin/monks/reorder                - Update display order
```

#### Gallery Management
```
GET    /api/v1/admin/gallery                      - List images
POST   /api/v1/admin/gallery                      - Upload image
PUT    /api/v1/admin/gallery/:id                  - Update image info
DELETE /api/v1/admin/gallery/:id                  - Delete image
PUT    /api/v1/admin/gallery/reorder              - Update display order

# Categories
GET    /api/v1/admin/gallery/categories           - List categories
POST   /api/v1/admin/gallery/categories           - Create category
PUT    /api/v1/admin/gallery/categories/:id       - Update category
DELETE /api/v1/admin/gallery/categories/:id       - Delete category
```

#### Donations Management
```
GET    /api/v1/admin/donations                    - List donations (with filters, pagination)
GET    /api/v1/admin/donations/:id                - Get donation details
PUT    /api/v1/admin/donations/:id                - Update donation
DELETE /api/v1/admin/donations/:id                - Delete donation
POST   /api/v1/admin/donations/:id/send-receipt   - ส่งใบเสร็จทางอีเมล
GET    /api/v1/admin/donations/export             - Export report (CSV/PDF)
GET    /api/v1/admin/donations/stats              - Statistics (total by month, category)

# Donation Categories
GET    /api/v1/admin/donation-categories          - List categories
POST   /api/v1/admin/donation-categories          - Create category
PUT    /api/v1/admin/donation-categories/:id      - Update category
DELETE /api/v1/admin/donation-categories/:id      - Delete category
```

#### Members Management
```
GET    /api/v1/admin/members                      - List members (with filters, search)
GET    /api/v1/admin/members/:id                  - Get member details
PUT    /api/v1/admin/members/:id                  - Update member
DELETE /api/v1/admin/members/:id                  - Delete member
PUT    /api/v1/admin/members/:id/toggle-status    - Activate/Deactivate
GET    /api/v1/admin/members/export               - Export CSV
```

#### Settings & Schedule
```
GET    /api/v1/admin/settings                     - Get all settings
PUT    /api/v1/admin/settings                     - Update settings (bulk)
PUT    /api/v1/admin/settings/:key                - Update single setting

# Schedule
GET    /api/v1/admin/schedules                    - List schedules
POST   /api/v1/admin/schedules                    - Create schedule
PUT    /api/v1/admin/schedules/:id                - Update schedule
DELETE /api/v1/admin/schedules/:id                - Delete schedule
```

#### Contact Inquiries
```
GET    /api/v1/admin/contacts                     - List inquiries (with status filter)
GET    /api/v1/admin/contacts/:id                 - Get inquiry details
PUT    /api/v1/admin/contacts/:id                 - Update status / reply
DELETE /api/v1/admin/contacts/:id                 - Delete inquiry
POST   /api/v1/admin/contacts/:id/reply           - ตอบกลับทางอีเมล
```

#### File Upload
```
POST   /api/v1/admin/upload/image                 - Upload to R2 (returns URL)
DELETE /api/v1/admin/upload/image                 - Delete from R2
```

---

## Implementation Phases

### **Phase 1: Core Backend Setup (Week 1-2)**

**Goal:** สร้าง backend พื้นฐาน + Auth + Admin Panel สำหรับจัดการ Events, Monks, Gallery

#### Tasks:

1. **ตั้งค่า Project** (Day 1-2)
   - [ ] สร้าง Go project structure
   - [ ] ติดตั้ง dependencies (Fiber, GORM, JWT, etc.)
   - [ ] ตั้งค่า `.env` และ config management
   - [ ] Setup PostgreSQL (Railway/Supabase)
   - [ ] Setup Cloudflare R2

2. **Database & Models** (Day 3-4)
   - [ ] สร้าง database models (User, Member, Event, Monk, Gallery, Schedule, Settings)
   - [ ] เขียน migration script
   - [ ] Run migration
   - [ ] สร้าง seed data (admin user)

3. **Authentication System** (Day 5-6)
   - [ ] JWT utilities (generate, verify)
   - [ ] Password hashing (bcrypt)
   - [ ] Auth handlers: register, login, refresh, forgot-password, reset-password
   - [ ] Auth middleware (Protected routes)
   - [ ] Admin middleware (Admin-only routes)

4. **Temple Content APIs** (Day 7-10)
   - [ ] Event handlers (CRUD)
   - [ ] Monk handlers (CRUD)
   - [ ] Gallery handlers (CRUD + categories)
   - [ ] Schedule handlers (CRUD)
   - [ ] Settings handlers (Get/Update)
   - [ ] Public APIs (read-only)

5. **File Upload Service** (Day 11-12)
   - [ ] R2 service (upload, delete)
   - [ ] Image optimization (resize, compress)
   - [ ] Upload handler

6. **JSON Migration Script** (Day 13-14)
   - [ ] อ่าน JSON files จาก `WAT-PROFILE/src/data/`
   - [ ] Map fields → database
   - [ ] Import: events, monks, gallery, schedule, contact
   - [ ] Upload images → R2
   - [ ] Validate migration

**Deliverables:**
- ✅ Backend running on Railway
- ✅ Public APIs working (events, monks, gallery, schedule, settings)
- ✅ Admin APIs working (CRUD for all content)
- ✅ Auth system working (login, register, JWT)
- ✅ JSON data migrated to database
- ✅ Images uploaded to R2

---

### **Phase 2: Member System (Week 3)**

**Goal:** ระบบสมาชิก/ผู้มีจิต - ให้สมาชิกสมัคร login และจัดการโปรไฟล์

#### Backend Tasks:

1. **Member Model & Service** (Day 1-2)
   - [ ] Member model (extends User)
   - [ ] Member service (create member, generate member_code)
   - [ ] Member handlers (get, update profile)
   - [ ] Admin member management handlers

2. **Member Registration Flow** (Day 3-4)
   - [ ] Registration form validation
   - [ ] Email verification (optional)
   - [ ] Welcome email

**Deliverables:**
- ✅ สมาชิกสมัครและ login ได้
- ✅ สมาชิกแก้ไขโปรไฟล์ได้
- ✅ Admin ดูรายชื่อสมาชิกได้

---

### **Phase 3: Donation System (Week 4)**

**Goal:** ระบบบริจาค - บันทึก ออกใบเสร็จ รายงาน

#### Backend Tasks:

1. **Donation Models** (Day 1)
   - [ ] Donation model
   - [ ] Donation category model

2. **Donation Handlers** (Day 2-3)
   - [ ] Create donation (public + member)
   - [ ] List donations (admin, with filters)
   - [ ] Update donation (admin)
   - [ ] Delete donation (admin)

3. **Receipt Generation** (Day 4-5)
   - [ ] PDF service (using gofpdf or similar)
   - [ ] Receipt template (TH/EN/DE)
   - [ ] Auto-generate receipt number
   - [ ] Email receipt to donor

4. **Donation Reports** (Day 6-7)
   - [ ] Statistics API (total by month, by category)
   - [ ] Export CSV
   - [ ] Export PDF report

**Deliverables:**
- ✅ ผู้ใช้ (guest/member) บริจาคได้
- ✅ ระบบออกใบเสร็จ PDF อัตโนมัติ
- ✅ Email ใบเสร็จให้ผู้บริจาค
- ✅ Admin ดูรายงานการบริจาคได้

---

### **Phase 4: Event Registration System (Week 5)**

**Goal:** ระบบลงทะเบียนกิจกรรม

#### Backend Tasks:

1. **Event Registration Model** (Day 1)
   - [ ] EventRegistration model

2. **Registration Handlers** (Day 2-3)
   - [ ] Register for event (guest/member)
   - [ ] Check capacity limit
   - [ ] Generate confirmation code
   - [ ] Email confirmation

3. **Admin Registration Management** (Day 4-5)
   - [ ] List registrations per event
   - [ ] Update registration status (confirm/cancel)
   - [ ] Mark attendance
   - [ ] Export attendee list (CSV/PDF)
   - [ ] Send bulk email to registrants

**Deliverables:**
- ✅ Guest/Member ลงทะเบียนกิจกรรมได้
- ✅ Email confirmation ส่งอัตโนมัติ
- ✅ สมาชิกยกเลิกการลงทะเบียนได้
- ✅ Admin จัดการรายชื่อได้

---

### **Phase 5: Enhancements & Polish (Week 6)**

**Goal:** ปรับปรุงและเพิ่มฟีเจอร์เสริม

#### Backend Tasks:

1. **Contact Inquiry Management** (Day 1-2)
   - [ ] Contact handlers (list, update status, reply)

2. **Dashboard Statistics** (Day 3-4)
   - [ ] Stats API: total members, donations this month, upcoming events
   - [ ] Recent activities

3. **Email Templates** (Day 5)
   - [ ] Registration confirmation
   - [ ] Event confirmation
   - [ ] Donation receipt
   - [ ] Password reset

4. **Testing & Bug Fixes** (Day 6-7)
   - [ ] API testing
   - [ ] Fix bugs
   - [ ] Performance optimization

**Deliverables:**
- ✅ Contact inquiry management working
- ✅ Dashboard statistics API ready
- ✅ Email templates finalized
- ✅ System tested and stable

---

## Frontend Integration Guide

### 1. Environment Variables

```env
# .env.local (Frontend)
NEXT_PUBLIC_API_URL=https://api-wat-profile.railway.app/api/v1
NEXT_PUBLIC_SITE_NAME=Wat Loung Por Sai
NEXT_PUBLIC_R2_PUBLIC_URL=https://wat-profile.r2.dev
```

### 2. API Client Setup

```typescript
// src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (add JWT token)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor (handle errors, refresh token)
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, try refresh
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const { data } = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });
        localStorage.setItem('access_token', data.access_token);
        // Retry original request
        return api.request(error.config);
      } catch {
        // Refresh failed, logout
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 3. Service Examples

```typescript
// src/services/eventService.ts
import api from './api';

export const eventService = {
  getPublicEvents: async (params?: { page?: number; limit?: number; type?: string }) => {
    return api.get('/public/events', { params });
  },

  getEventBySlug: async (slug: string) => {
    return api.get(`/public/events/${slug}`);
  },

  // Admin
  createEvent: async (data: EventFormData) => {
    return api.post('/admin/events', data);
  },

  updateEvent: async (id: number, data: EventFormData) => {
    return api.put(`/admin/events/${id}`, data);
  },

  deleteEvent: async (id: number) => {
    return api.delete(`/admin/events/${id}`);
  },
};
```

### 4. Auth Context

```typescript
// src/context/AuthContext.tsx
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '@/services/authService';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('access_token');
    if (token) {
      authService.getProfile().then(setUser).catch(() => {
        localStorage.clear();
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const { access_token, refresh_token, user } = await authService.login(email, password);
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    setUser(user);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  const isAdmin = () => user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

### 5. Converting Static Pages to Dynamic

**Before (Static JSON):**
```typescript
// src/app/[locale]/events/page.tsx
import events from '@/data/events.json';

export default function EventsPage() {
  return (
    <div>
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
```

**After (API-based):**
```typescript
// src/app/[locale]/events/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { eventService } from '@/services/eventService';
import { Loading } from '@/components/ui/Loading';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventService.getPublicEvents().then((data) => {
      setEvents(data.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <Loading variant="orbit" size="lg" />;

  return (
    <div>
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
```

---

## Deployment Guide

### Backend Deployment (Railway)

#### 1. Prerequisites
- GitHub account
- Railway account (connect with GitHub)
- Cloudflare R2 account
- Email account (Gmail with App Password)

#### 2. Setup Railway Project

```bash
# 1. Push code to GitHub
git init
git add .
git commit -m "Initial backend"
git branch -M main
git remote add origin https://github.com/your-org/wat-profile-backend.git
git push -u origin main

# 2. Go to Railway Dashboard
# - New Project → Deploy from GitHub
# - Select repository: wat-profile-backend
# - Add PostgreSQL plugin (auto-provision)
```

#### 3. Environment Variables

In Railway Dashboard → Settings → Variables:

```env
PORT=8080
DB_URL=${DATABASE_URL}  # Auto-injected by Railway PostgreSQL
ALLOWED_ORIGINS=https://wat-profile.vercel.app,https://watloungporsai.de

# JWT
JWT_SECRET=<generate-with: openssl rand -base64 32>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=wat-profile-uploads
R2_PUBLIC_URL=https://wat-profile-uploads.r2.dev

# SMTP (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=watloungporsai@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@watloungporsai.de
SMTP_FROM_NAME=Wat Loung Por Sai

# Admin Default User
ADMIN_EMAIL=admin@watloungporsai.de
ADMIN_PASSWORD=<strong-password>
```

#### 4. Dockerfile

```dockerfile
# Multi-stage build
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source
COPY . .

# Build
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/app

# Final stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy binary
COPY --from=builder /app/main .

# Expose port
EXPOSE 8080

CMD ["./main"]
```

#### 5. Deploy

```bash
# Railway auto-deploys on push
git add .
git commit -m "Ready for deployment"
git push origin main

# Check logs in Railway Dashboard
# Get deployment URL: https://your-app.up.railway.app
```

### Frontend Deployment (Vercel)

#### 1. Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```env
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app/api/v1
NEXT_PUBLIC_SITE_NAME=Wat Loung Por Sai
NEXT_PUBLIC_R2_PUBLIC_URL=https://wat-profile-uploads.r2.dev

# Resend (existing contact form)
RESEND_API_KEY=re_xxx
```

#### 2. Deploy

```bash
# Push to GitHub
git push origin main

# Vercel auto-deploys
# Get URL: https://wat-profile.vercel.app
```

### Cost Breakdown (Per Temple)

| Service | Plan | Cost |
|---------|------|------|
| Railway Backend | Hobby | $5-10/month |
| Railway PostgreSQL | Shared | $5/month |
| Cloudflare R2 | Pay-as-you-go | ~$0.15/month (100 images) |
| Vercel Frontend | Free | $0 |
| Domain (optional) | .de domain | €10-15/year |
| **Total** | | **~€15-20/month** |

---

## Development Workflow

### Local Development

#### 1. Backend

```bash
# Clone repository
git clone https://github.com/your-org/wat-profile-backend.git
cd wat-profile-backend

# Install dependencies
go mod download

# Setup .env
cp .env.example .env
# Edit .env with local settings

# Run PostgreSQL (Docker)
docker run --name postgres-wat -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15

# Run backend
go run cmd/app/main.go

# API available at http://localhost:8080
```

#### 2. Frontend

```bash
# In WAT-PROFILE directory
npm install

# Setup .env.local
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1

# Run dev server
npm run dev

# Open http://localhost:3000
```

### Testing

```bash
# Backend: Run tests
go test ./...

# Frontend: Run tests
npm test

# E2E tests (Playwright)
npm run test:e2e
```

---

## Security Considerations

### 1. JWT Security
- Use strong secret key (32+ characters)
- Short access token expiry (15 minutes)
- Rotate refresh tokens
- Validate token on every request

### 2. Password Security
- Hash with bcrypt (cost factor 12)
- Minimum 8 characters
- Require strong passwords for admins

### 3. Input Validation
- Validate all inputs (use struct tags)
- Sanitize HTML inputs
- Prevent SQL injection (use GORM properly)

### 4. CORS Configuration
```go
// Only allow specific origins
app.Use(cors.New(cors.Config{
    AllowOrigins: os.Getenv("ALLOWED_ORIGINS"),
    AllowMethods: "GET,POST,PUT,DELETE",
    AllowHeaders: "Origin,Content-Type,Authorization",
}))
```

### 5. Rate Limiting
```go
app.Use(limiter.New(limiter.Config{
    Max:        100,  // Max 100 requests
    Expiration: 1 * time.Minute,
}))
```

### 6. HTTPS Only
- Enforce HTTPS in production
- Use HSTS headers

---

## Monitoring & Maintenance

### Logging
```go
// Use structured logging
log.Info().
    Str("user_id", userId).
    Str("action", "create_donation").
    Msg("Donation created")
```

### Error Tracking
- Use Sentry or similar service
- Log all errors with context

### Database Backups
- Railway: Automatic daily backups (Hobby plan)
- Manual backups: `pg_dump` weekly

### Health Check
```go
// GET /api/v1/health
app.Get("/health", func(c *fiber.Ctx) error {
    return c.JSON(fiber.Map{
        "status": "ok",
        "timestamp": time.Now(),
        "db": db.DB().Ping() == nil,
    })
})
```

---

## Next Steps

After plan approval:

1. ✅ ตั้งค่า GitHub repositories (backend + frontend)
2. ✅ ตั้งค่า Railway project + PostgreSQL
3. ✅ ตั้งค่า Cloudflare R2
4. ✅ สร้าง backend project structure
5. ✅ เขียน database models
6. ✅ เขียน API handlers
7. ✅ สร้าง JSON migration script
8. ✅ Migrate data
9. ✅ Deploy backend
10. ✅ Update frontend to use APIs
11. ✅ Deploy frontend
12. ✅ Testing

---

## Reference Architecture (1931-DESIGN)

**หมายเหตุ:** โปรเจค 1931-DESIGN ที่ `D:\Developer\1931-DESIGN\backend` ใช้เป็น **แนวทาง/reference** เท่านั้น **ไม่แก้ไขหรือ fork โดยตรง**

### สิ่งที่เรียนรู้จาก 1931-DESIGN:

1. **โครงสร้าง Project** - แยก internal/pkg ชัดเจน
2. **Auth System** - JWT implementation pattern
3. **RBAC** - Role-based access control approach
4. **Middleware** - Auth, CORS, Security patterns
5. **File Upload** - R2 integration example
6. **Email** - SMTP service structure
7. **Database** - GORM usage patterns

### แต่เราจะสร้างใหม่เพื่อ:
- เหมาะกับ temple-specific needs
- ไม่มี complexity ที่ไม่จำเป็น (HR, Business Profile)
- Clean codebase เฉพาะสำหรับวัด
- แต่ละวัดสามารถ customize ได้อย่างอิสระ

---

**Created:** 2024-02-16
**Version:** 1.0.0
**Status:** Planning Phase
