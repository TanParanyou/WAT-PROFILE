# Go-Next Starter Template

## 📋 Overview

**Go-Next Starter Template** เป็น Full-stack starter template ที่รวม Backend (Go Fiber) + Frontend (Next.js) พร้อม features พื้นฐานที่จำเป็นสำหรับการพัฒนาเว็บแอปพลิเคชันสมัยใหม่

### 🎯 Purpose

สร้าง **reusable foundation** ที่สามารถนำไปปรับใช้กับโปรเจคประเภทต่างๆ ได้ เช่น:
- 🏪 E-commerce Platform
- 📝 Content Management System (CMS)
- 🏢 Business Management System (CRM, ERP)
- 📱 SaaS Application
- 🌐 Community Portal
- 🏛️ Temple/Organization Website (เช่น WAT-PROFILE)

### ✨ Key Features

#### Backend (Go Fiber)
- ✅ **Authentication & Authorization** - JWT with Refresh Token + Role-Based Access Control (RBAC)
- ✅ **File Upload & Storage** - Cloudflare R2 (S3-compatible)
- ✅ **Email Service** - SMTP with templating
- ✅ **Multi-language Support** - i18n ready
- ✅ **Database** - PostgreSQL + GORM ORM
- ✅ **Security** - CORS, Rate Limiting, Input Validation, Password Hashing (bcrypt)
- ✅ **API Documentation** - Swagger/OpenAPI
- ✅ **Logging & Monitoring** - Structured logging

#### Frontend (Next.js)
- ✅ **Admin Panel** - Ready-to-use dashboard
- ✅ **Authentication UI** - Login, Register, Forgot Password
- ✅ **API Client** - Axios with interceptors
- ✅ **UI Components Library** - Reusable components (DataTable, Modal, Loading, Forms)
- ✅ **Multi-language** - i18n with next-intl
- ✅ **TypeScript** - Type-safe
- ✅ **Responsive Design** - Tailwind CSS

### 🚀 Deployment Ready

- **Backend**: Railway / Render (Docker)
- **Database**: Railway PostgreSQL / Supabase
- **Storage**: Cloudflare R2
- **Frontend**: Vercel / Netlify
- **Cost**: ~$10-20/month (basic tier)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│                    (Next.js + Vercel)                        │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  Public    │  │    Admin     │  │   Member     │        │
│  │   Pages    │  │    Panel     │  │   Portal     │        │
│  └────────────┘  └──────────────┘  └──────────────┘        │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS/API Calls
┌───────────────────────────▼─────────────────────────────────┐
│                       Backend API                            │
│                   (Go Fiber + Railway)                       │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Auth     │  │    CRUD      │  │   Services   │        │
│  │    JWT     │  │   Handlers   │  │ Email/Upload │        │
│  └────────────┘  └──────────────┘  └──────────────┘        │
└───────────────────────────┬─────────────────────────────────┘
                            │
            ┌───────────────┼────────────────┐
            ▼               ▼                ▼
    ┌──────────────┐ ┌──────────┐  ┌─────────────┐
    │  PostgreSQL  │ │    R2    │  │    SMTP     │
    │   (Railway)  │ │(Cloudflare)│ │   Server    │
    └──────────────┘ └──────────┘  └─────────────┘
```

### Key Architectural Decisions

1. **Monorepo Structure**: Backend และ Frontend อยู่ใน repository เดียวกัน แต่ deploy แยกกัน
2. **RESTful API**: ใช้ REST architecture (ไม่ใช่ GraphQL) เพื่อความง่ายและ compatibility
3. **JWT Authentication**: Stateless auth with access token + refresh token
4. **Role-Based Access Control (RBAC)**: Flexible permission system
5. **Separate Deployments**: แต่ละโปรเจคมี backend + database แยกกัน (ไม่ใช่ multi-tenant)

---

## 📂 Project Structure

### Backend Structure

```
backend/
├── cmd/
│   └── app/
│       └── main.go                 # Entry point
│
├── config/
│   ├── config.go                   # Configuration loader
│   └── database.go                 # Database connection
│
├── internal/
│   ├── models/                     # Database models (GORM)
│   │   ├── user.go
│   │   ├── role.go
│   │   ├── setting.go
│   │   ├── media.go
│   │   └── [domain-specific].go   # ← Add your models here
│   │
│   ├── handlers/                   # HTTP handlers
│   │   ├── auth_handler.go
│   │   ├── user_handler.go
│   │   ├── upload_handler.go
│   │   └── [domain]_handler.go    # ← Add your handlers here
│   │
│   ├── services/                   # Business logic
│   │   ├── auth_service.go
│   │   ├── email_service.go
│   │   ├── storage_service.go
│   │   └── [domain]_service.go    # ← Add your services here
│   │
│   ├── middleware/                 # HTTP middleware
│   │   ├── auth.go                 # JWT verification
│   │   ├── admin.go                # Admin role check
│   │   ├── cors.go                 # CORS configuration
│   │   └── rate_limit.go           # Rate limiting
│   │
│   ├── routes/
│   │   └── routes.go               # Route definitions
│   │
│   └── utils/                      # Utilities
│       ├── response.go             # JSON response helpers
│       ├── validator.go            # Input validation
│       └── password.go             # Password hashing
│
├── migrations/                     # SQL migrations
│   ├── 001_initial_schema.sql
│   └── 002_[feature].sql           # ← Add migration files here
│
├── scripts/                        # Utility scripts
│   └── seed.go                     # Database seeding
│
├── docs/                           # API documentation
│   └── swagger.yaml
│
├── .env.example                    # Environment variables template
├── Dockerfile                      # Docker configuration
├── go.mod
├── go.sum
└── README.md
```

### Frontend Structure

```
frontend/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── [locale]/               # i18n routing
│   │   │   ├── page.tsx            # Homepage
│   │   │   ├── login/page.tsx      # Login page
│   │   │   ├── register/page.tsx   # Registration
│   │   │   │
│   │   │   ├── admin/              # Admin panel
│   │   │   │   ├── layout.tsx      # Admin layout (protected)
│   │   │   │   ├── page.tsx        # Dashboard
│   │   │   │   ├── users/          # User management
│   │   │   │   ├── settings/       # Settings
│   │   │   │   └── [feature]/      # ← Add your admin pages here
│   │   │   │
│   │   │   └── [feature]/          # ← Add your public pages here
│   │   │
│   │   ├── api/                    # API routes (if needed)
│   │   └── layout.tsx              # Root layout
│   │
│   ├── components/                 # React components
│   │   ├── ui/                     # UI components
│   │   │   ├── Button.tsx
│   │   │   ├── DataTable.tsx       # Reusable table with pagination
│   │   │   ├── Modal.tsx           # Modal dialogs
│   │   │   ├── Loading.tsx         # Loading states
│   │   │   ├── Select.tsx          # Dropdown
│   │   │   ├── Checkbox.tsx        # Checkbox
│   │   │   └── ...
│   │   │
│   │   ├── admin/                  # Admin-specific components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── [Feature]Form.tsx   # ← Add your forms here
│   │   │
│   │   └── layout/                 # Layout components
│   │       ├── Navbar.tsx
│   │       └── Footer.tsx
│   │
│   ├── context/                    # React Context
│   │   └── AuthContext.tsx         # Authentication state
│   │
│   ├── services/                   # API services
│   │   ├── api.ts                  # Axios client with interceptors
│   │   ├── authService.ts          # Auth API calls
│   │   ├── userService.ts          # User API calls
│   │   └── [domain]Service.ts      # ← Add your services here
│   │
│   ├── types/                      # TypeScript types
│   │   ├── auth.ts
│   │   ├── user.ts
│   │   └── [domain].ts             # ← Add your types here
│   │
│   ├── hooks/                      # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useDataTable.ts         # Table with pagination
│   │   └── use[Feature].ts         # ← Add your hooks here
│   │
│   ├── lib/                        # Utilities
│   │   └── utils.ts
│   │
│   └── constants/                  # Constants
│       └── index.ts
│
├── public/                         # Static assets
├── messages/                       # i18n translations
│   ├── en.json
│   ├── th.json
│   └── de.json
│
├── .env.local.example
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 🗄️ Database Schema (Core Tables)

### 1. Users & Authentication

```sql
-- Users table (core authentication)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role_id UUID REFERENCES roles(id),
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Roles table (RBAC)
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,  -- 'admin', 'member', 'guest', etc.
    permissions JSONB,                  -- {"users": "crud", "posts": "read"}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Refresh tokens (for JWT refresh)
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Password reset tokens
CREATE TABLE password_resets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
```

### 2. Settings (Site Configuration)

```sql
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,   -- 'site_name', 'contact_email', etc.
    value TEXT,
    type VARCHAR(50),                    -- 'string', 'number', 'boolean', 'json'
    category VARCHAR(50),                -- 'general', 'email', 'social', etc.
    is_public BOOLEAN DEFAULT FALSE,     -- Can be accessed without auth
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_settings_category ON settings(category);
CREATE INDEX idx_settings_public ON settings(is_public);
```

### 3. Media/File Storage

```sql
CREATE TABLE media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255),
    mime_type VARCHAR(100),
    size BIGINT,                         -- bytes
    url TEXT NOT NULL,                   -- R2 URL
    path TEXT,                           -- R2 path/key
    uploaded_by UUID REFERENCES users(id),
    alt_text VARCHAR(255),               -- For images (SEO)
    category VARCHAR(50),                -- 'avatar', 'post', 'gallery', etc.
    metadata JSONB,                      -- Additional data (width, height, etc.)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_media_uploaded_by ON media(uploaded_by);
CREATE INDEX idx_media_category ON media(category);
```

### 4. Audit Logs (Optional but recommended)

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,         -- 'create', 'update', 'delete'
    entity_type VARCHAR(100),            -- 'user', 'post', etc.
    entity_id UUID,
    changes JSONB,                       -- Old/new values
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
```

### 5. Multi-language Support with JSONB 🌍

สำหรับเว็บไซต์ที่ต้องรองรับหลายภาษา ให้ใช้ **JSONB** แทนการสร้างหลาย columns (`field_th`, `field_en`, `field_de`)

#### ❌ แบบเดิม (ไม่ flexible):
```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_th VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    name_de VARCHAR(255),
    description_th TEXT,
    description_en TEXT,
    description_de TEXT
);
```

**ปัญหา:**
- ต้องเพิ่ม columns ทุกครั้งที่เพิ่มภาษาใหม่
- Database schema ไม่ flexible
- Query ซับซ้อน

#### ✅ แบบใหม่ (JSONB - Recommended):
```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name JSONB NOT NULL,                -- {"th": "ชื่อ", "en": "Name", "de": "Name"}
    description JSONB,                  -- {"th": "คำอธิบาย", "en": "Description", "de": "Beschreibung"}
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraint: English (en) is required as default language
    CHECK (name ? 'en' AND name->>'en' IS NOT NULL AND name->>'en' != '')
);

-- Index for querying by language
CREATE INDEX idx_products_name_en ON products ((name->>'en'));
CREATE INDEX idx_products_name_th ON products ((name->>'th'));
```

**ข้อดี:**
- ✅ **Flexible** - เพิ่มภาษาใหม่ได้โดยไม่ต้องเปลี่ยน schema
- ✅ **Scalable** - รองรับภาษาไม่จำกัด
- ✅ **Queryable** - PostgreSQL รองรับ JSONB operators
- ✅ **Cleaner** - ไม่มี columns ซ้ำซ้อน

#### ตัวอย่างการ Query JSONB:

```sql
-- ค้นหาโดยภาษาอังกฤษ
SELECT * FROM products WHERE name->>'en' ILIKE '%shirt%';

-- ดึงเฉพาะภาษาไทย
SELECT id, name->>'th' as name_th, description->>'th' as desc_th FROM products;

-- Update เฉพาะภาษาเดียว
UPDATE products
SET name = jsonb_set(name, '{de}', '"Neuer Name"')
WHERE id = '123';

-- เพิ่มภาษาใหม่
UPDATE products
SET name = name || '{"fr": "Nom français"}'::jsonb
WHERE id = '123';
```

#### GORM Model (Go):

```go
package models

import (
    "database/sql/driver"
    "encoding/json"
    "errors"
)

// MultiLangText represents a multi-language text field
type MultiLangText map[string]string

// Value implements driver.Valuer interface
func (m MultiLangText) Value() (driver.Value, error) {
    return json.Marshal(m)
}

// Scan implements sql.Scanner interface
func (m *MultiLangText) Scan(value interface{}) error {
    bytes, ok := value.([]byte)
    if !ok {
        return errors.New("type assertion to []byte failed")
    }
    return json.Unmarshal(bytes, &m)
}

// Get returns text in specified language with fallback
func (m MultiLangText) Get(lang string) string {
    if text, ok := m[lang]; ok && text != "" {
        return text
    }
    // Fallback to English
    if text, ok := m["en"]; ok {
        return text
    }
    // Return first available
    for _, text := range m {
        if text != "" {
            return text
        }
    }
    return ""
}

// Product model with multi-language fields
type Product struct {
    ID          string        `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
    Name        MultiLangText `gorm:"type:jsonb;not null" json:"name"`
    Description MultiLangText `gorm:"type:jsonb" json:"description"`
    Price       float64       `gorm:"type:decimal(10,2);not null" json:"price"`
    CreatedAt   time.Time     `json:"created_at"`
    UpdatedAt   time.Time     `json:"updated_at"`
}

// Example usage
func CreateProduct() {
    product := Product{
        Name: MultiLangText{
            "th": "เสื้อยืด",
            "en": "T-Shirt",
            "de": "T-Shirt",
        },
        Description: MultiLangText{
            "th": "เสื้อยืดคุณภาพดี",
            "en": "High quality t-shirt",
            "de": "Hochwertiges T-Shirt",
        },
        Price: 19.99,
    }
    db.Create(&product)
}

// Get product with specific language
func GetProduct(id string, lang string) {
    var product Product
    db.First(&product, "id = ?", id)

    name := product.Name.Get(lang)           // Returns text in requested language
    description := product.Description.Get(lang)
}
```

#### TypeScript Types (Frontend):

```typescript
// src/types/common.ts
export type MultiLangText = {
  th?: string;
  en: string;  // Required
  de?: string;
  [key: string]: string | undefined;
};

// src/types/product.ts
export interface Product {
  id: string;
  name: MultiLangText;
  description: MultiLangText;
  price: number;
  created_at: string;
  updated_at: string;
}

// Helper function to get text by language
export function getLocalizedText(
  text: MultiLangText | undefined,
  locale: string,
  fallback = ''
): string {
  if (!text) return fallback;
  return text[locale] || text.en || fallback;
}

// Example usage in React component
import { useLocale } from 'next-intl';

export function ProductCard({ product }: { product: Product }) {
  const locale = useLocale();

  return (
    <div>
      <h3>{getLocalizedText(product.name, locale)}</h3>
      <p>{getLocalizedText(product.description, locale)}</p>
      <span>${product.price}</span>
    </div>
  );
}
```

#### API Response Example:

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": {
      "th": "เสื้อยืด",
      "en": "T-Shirt",
      "de": "T-Shirt"
    },
    "description": {
      "th": "เสื้อยืดคุณภาพดี ผ้าฝ้าย 100%",
      "en": "High quality t-shirt, 100% cotton",
      "de": "Hochwertiges T-Shirt, 100% Baumwolle"
    },
    "price": 19.99
  }
}
```

#### Best Practices:

1. **Always require at least one language** (usually `en`) as default
2. **Use constraints** to enforce required languages
3. **Create indexes** on frequently queried language fields
4. **Provide fallback logic** in application layer
5. **Validate JSONB structure** before saving
6. **Use helper functions/methods** to get localized text

---

### 6. Domain-Specific Tables (Examples)

เมื่อปรับใช้กับโปรเจคจริง ให้เพิ่ม tables ตามความต้องการ:

**Example: Blog (with multi-language)**
```sql
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title JSONB NOT NULL,                -- {"th": "", "en": "Title", "de": ""}
    slug VARCHAR(255) UNIQUE NOT NULL,
    content JSONB,                       -- {"th": "", "en": "Content", "de": ""}
    excerpt JSONB,                       -- {"th": "", "en": "Excerpt", "de": ""}
    author_id UUID REFERENCES users(id),
    featured_image UUID REFERENCES media(id),
    status VARCHAR(20) DEFAULT 'draft',  -- 'draft', 'published'
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraint: English title is required
    CHECK (title ? 'en' AND title->>'en' IS NOT NULL AND title->>'en' != '')
);

-- Index for searching English titles
CREATE INDEX idx_posts_title_en ON posts ((title->>'en'));
```

**Example: E-commerce (with multi-language)**
```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name JSONB NOT NULL,                 -- {"th": "", "en": "Product Name", "de": ""}
    slug VARCHAR(255) UNIQUE NOT NULL,
    sku VARCHAR(100) UNIQUE,
    description JSONB,                   -- {"th": "", "en": "Description", "de": ""}
    price DECIMAL(10, 2) NOT NULL,
    stock INTEGER DEFAULT 0,
    category_id UUID REFERENCES categories(id),
    images JSONB,                        -- Array of media IDs: ["uuid1", "uuid2"]
    specifications JSONB,                -- {"color": "red", "size": "M", "weight": 500}
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraint: English name is required
    CHECK (name ? 'en' AND name->>'en' IS NOT NULL AND name->>'en' != '')
);

-- Indexes
CREATE INDEX idx_products_name_en ON products ((name->>'en'));
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
```

---

## 🔌 API Endpoints (Core)

Base URL: `/api/v1`

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | ❌ |
| POST | `/auth/login` | Login (returns access + refresh token) | ❌ |
| POST | `/auth/refresh` | Refresh access token | ❌ |
| POST | `/auth/logout` | Logout (invalidate refresh token) | ✅ |
| POST | `/auth/forgot-password` | Request password reset | ❌ |
| POST | `/auth/reset-password` | Reset password with token | ❌ |
| GET | `/auth/me` | Get current user info | ✅ |
| PUT | `/auth/me` | Update current user profile | ✅ |
| PUT | `/auth/change-password` | Change password | ✅ |

**Example Request: Login**
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "member"
    }
  }
}
```

### User Management Endpoints (Admin Only)

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/admin/users` | List all users (paginated) | Admin |
| GET | `/admin/users/:id` | Get user details | Admin |
| POST | `/admin/users` | Create new user | Admin |
| PUT | `/admin/users/:id` | Update user | Admin |
| DELETE | `/admin/users/:id` | Delete user | Admin |
| PUT | `/admin/users/:id/role` | Change user role | Admin |
| PUT | `/admin/users/:id/status` | Activate/deactivate user | Admin |

### Settings Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/settings` | Get public settings | ❌ |
| GET | `/admin/settings` | Get all settings | Admin |
| PUT | `/admin/settings/:key` | Update setting | Admin |
| POST | `/admin/settings` | Create new setting | Admin |

### File Upload Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/upload/image` | Upload image to R2 | ✅ |
| POST | `/upload/file` | Upload file to R2 | ✅ |
| DELETE | `/upload/:id` | Delete media | ✅ (Admin or Owner) |
| GET | `/media` | List media (paginated) | ✅ |

**Example Request: Upload Image**
```http
POST /api/v1/upload/image
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [binary]
category: "avatar"
alt_text: "Profile picture"
```

### Domain-Specific Endpoints

เพิ่ม endpoints ตามความต้องการของโปรเจค:

**Example: Blog**
```
GET    /posts              # List published posts
GET    /posts/:slug        # Get post by slug
GET    /admin/posts        # List all posts (admin)
POST   /admin/posts        # Create post (admin)
PUT    /admin/posts/:id    # Update post (admin)
DELETE /admin/posts/:id    # Delete post (admin)
```

**Example: E-commerce**
```
GET    /products           # List products
GET    /products/:id       # Get product details
POST   /cart               # Add to cart
POST   /checkout           # Create order
```

---

## 🛠️ Customization Guide

### Step 1: Define Your Domain

ก่อนเริ่ม ให้กำหนดว่าโปรเจคของคุณเป็นอะไร:
- Blog / News Site
- E-commerce
- Temple Website
- CRM / Business Management
- Community Portal
- etc.

### Step 2: Design Database Schema

1. ใช้ core tables ที่มีอยู่แล้ว (users, roles, settings, media, audit_logs)
2. เพิ่ม domain-specific tables ใน `migrations/`

**Example: Blog**
```sql
-- migrations/002_blog_schema.sql
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT,
    excerpt TEXT,
    author_id UUID REFERENCES users(id),
    category_id UUID REFERENCES categories(id),
    featured_image UUID REFERENCES media(id),
    status VARCHAR(20) DEFAULT 'draft',
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_category ON posts(category_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_published ON posts(published_at DESC);
```

### Step 3: Create Backend Models

สร้าง GORM models ใน `internal/models/`

**Example: `internal/models/post.go`**
```go
package models

import (
    "time"
    "github.com/google/uuid"
)

type Post struct {
    ID             uuid.UUID  `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
    Title          string     `gorm:"size:255;not null" json:"title"`
    Slug           string     `gorm:"size:255;uniqueIndex;not null" json:"slug"`
    Content        string     `gorm:"type:text" json:"content"`
    Excerpt        string     `gorm:"type:text" json:"excerpt"`
    AuthorID       uuid.UUID  `gorm:"type:uuid" json:"author_id"`
    Author         User       `gorm:"foreignKey:AuthorID" json:"author,omitempty"`
    CategoryID     *uuid.UUID `gorm:"type:uuid" json:"category_id"`
    Category       *Category  `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
    FeaturedImageID *uuid.UUID `gorm:"type:uuid" json:"featured_image_id"`
    FeaturedImage  *Media     `gorm:"foreignKey:FeaturedImageID" json:"featured_image,omitempty"`
    Status         string     `gorm:"size:20;default:draft" json:"status"`
    PublishedAt    *time.Time `json:"published_at"`
    CreatedAt      time.Time  `json:"created_at"`
    UpdatedAt      time.Time  `json:"updated_at"`
}

type Category struct {
    ID          uuid.UUID  `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
    Name        string     `gorm:"size:100;not null" json:"name"`
    Slug        string     `gorm:"size:100;uniqueIndex;not null" json:"slug"`
    Description string     `gorm:"type:text" json:"description"`
    ParentID    *uuid.UUID `gorm:"type:uuid" json:"parent_id"`
    CreatedAt   time.Time  `json:"created_at"`
    UpdatedAt   time.Time  `json:"updated_at"`
}
```

### Step 4: Create Backend Handlers

สร้าง API handlers ใน `internal/handlers/`

**Example: `internal/handlers/post_handler.go`**
```go
package handlers

import (
    "github.com/gofiber/fiber/v2"
    "your-project/internal/models"
    "your-project/internal/utils"
)

type PostHandler struct {
    // dependencies (e.g., services)
}

// GET /api/v1/posts
func (h *PostHandler) GetPosts(c *fiber.Ctx) error {
    var posts []models.Post

    // Query with pagination
    page := c.QueryInt("page", 1)
    limit := c.QueryInt("limit", 10)
    offset := (page - 1) * limit

    if err := db.Preload("Author").Preload("Category").
        Where("status = ?", "published").
        Order("published_at DESC").
        Limit(limit).
        Offset(offset).
        Find(&posts).Error; err != nil {
        return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch posts")
    }

    return utils.SuccessResponse(c, posts)
}

// GET /api/v1/posts/:slug
func (h *PostHandler) GetPost(c *fiber.Ctx) error {
    slug := c.Params("slug")
    var post models.Post

    if err := db.Preload("Author").Preload("Category").Preload("FeaturedImage").
        Where("slug = ? AND status = ?", slug, "published").
        First(&post).Error; err != nil {
        return utils.ErrorResponse(c, fiber.StatusNotFound, "Post not found")
    }

    return utils.SuccessResponse(c, post)
}

// POST /api/v1/admin/posts (Admin only)
func (h *PostHandler) CreatePost(c *fiber.Ctx) error {
    var input models.Post

    if err := c.BodyParser(&input); err != nil {
        return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid input")
    }

    // Get current user from context (set by auth middleware)
    user := c.Locals("user").(*models.User)
    input.AuthorID = user.ID

    if err := db.Create(&input).Error; err != nil {
        return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create post")
    }

    return utils.SuccessResponse(c, input)
}
```

### Step 5: Add Routes

อัพเดท `internal/routes/routes.go`

```go
package routes

import (
    "github.com/gofiber/fiber/v2"
    "your-project/internal/handlers"
    "your-project/internal/middleware"
)

func Setup(app *fiber.App) {
    api := app.Group("/api/v1")

    // ... existing routes (auth, users, etc.) ...

    // Public routes
    posts := api.Group("/posts")
    posts.Get("/", postHandler.GetPosts)
    posts.Get("/:slug", postHandler.GetPost)

    // Admin routes
    admin := api.Group("/admin", middleware.AuthRequired, middleware.AdminOnly)
    admin.Get("/posts", postHandler.GetAllPosts)
    admin.Post("/posts", postHandler.CreatePost)
    admin.Put("/posts/:id", postHandler.UpdatePost)
    admin.Delete("/posts/:id", postHandler.DeletePost)
}
```

### Step 6: Create Frontend Types

สร้าง TypeScript types ใน `src/types/`

**Example: `src/types/post.ts`**
```typescript
export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author_id: string;
  author?: User;
  category_id?: string;
  category?: Category;
  featured_image_id?: string;
  featured_image?: Media;
  status: 'draft' | 'published';
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePostInput {
  title: string;
  content: string;
  excerpt: string;
  category_id?: string;
  featured_image_id?: string;
  status: 'draft' | 'published';
}
```

### Step 7: Create Frontend Services

สร้าง API service ใน `src/services/`

**Example: `src/services/postService.ts`**
```typescript
import api from './api';
import { Post, CreatePostInput } from '@/types/post';

export const postService = {
  // Public
  getPosts: async (page = 1, limit = 10) => {
    const { data } = await api.get<{ data: Post[] }>('/posts', {
      params: { page, limit },
    });
    return data.data;
  },

  getPost: async (slug: string) => {
    const { data } = await api.get<{ data: Post }>(`/posts/${slug}`);
    return data.data;
  },

  // Admin
  getAllPosts: async (page = 1, limit = 10) => {
    const { data } = await api.get<{ data: Post[] }>('/admin/posts', {
      params: { page, limit },
    });
    return data.data;
  },

  createPost: async (input: CreatePostInput) => {
    const { data } = await api.post<{ data: Post }>('/admin/posts', input);
    return data.data;
  },

  updatePost: async (id: string, input: Partial<CreatePostInput>) => {
    const { data } = await api.put<{ data: Post }>(`/admin/posts/${id}`, input);
    return data.data;
  },

  deletePost: async (id: string) => {
    await api.delete(`/admin/posts/${id}`);
  },
};
```

### Step 8: Create Frontend Pages

สร้าง pages ใน `src/app/[locale]/`

**Example: Public Posts Page**
`src/app/[locale]/blog/page.tsx`
```typescript
'use client';

import { useEffect, useState } from 'react';
import { postService } from '@/services/postService';
import { Post } from '@/types/post';
import { PageLoading } from '@/components/ui/Loading';
import Link from 'next/link';

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await postService.getPosts();
        setPosts(data);
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) return <PageLoading text="Loading posts..." />;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Blog</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link key={post.id} href={`/blog/${post.slug}`}>
            <div className="border rounded-lg p-6 hover:shadow-lg transition">
              {post.featured_image && (
                <img
                  src={post.featured_image.url}
                  alt={post.title}
                  className="w-full h-48 object-cover rounded mb-4"
                />
              )}
              <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
              <p className="text-gray-600 line-clamp-3">{post.excerpt}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

**Example: Admin Posts Management Page**
`src/app/[locale]/admin/posts/page.tsx`
```typescript
'use client';

import { useDataTable } from '@/hooks/useDataTable';
import { DataTable, Column } from '@/components/ui/DataTable';
import { postService } from '@/services/postService';
import { Post } from '@/types/post';
import { useConfirm } from '@/components/ui/Modal';

export default function AdminPostsPage() {
  const { confirm, ConfirmDialog } = useConfirm();
  const { data, pagination, sort, onPageChange, onSort, isLoading, refetch } =
    useDataTable<Post>({
      fetcher: (params) => postService.getAllPosts(params.page, params.limit),
      initialPagination: { limit: 10 },
    });

  const handleDelete = async (id: string) => {
    if (await confirm({
      title: 'Delete Post',
      message: 'Are you sure you want to delete this post?',
      variant: 'danger',
    })) {
      await postService.deletePost(id);
      refetch();
    }
  };

  const columns: Column<Post>[] = [
    { header: 'Title', accessorKey: 'title', sortable: true },
    { header: 'Author', accessorKey: 'author.name' },
    { header: 'Status', accessorKey: 'status' },
    {
      header: 'Actions',
      cell: (_, row) => (
        <div className="flex gap-2">
          <button onClick={() => handleEdit(row)}>Edit</button>
          <button onClick={() => handleDelete(row.id)}>Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Posts Management</h1>
      <DataTable
        columns={columns}
        data={data}
        pagination={pagination}
        sorting={sort}
        onPageChange={onPageChange}
        onSort={onSort}
        isLoading={isLoading}
      />
      <ConfirmDialog />
    </div>
  );
}
```

---

## 🚀 Setup & Deployment

### Initial Setup

#### 1. Clone Template

```bash
git clone https://github.com/your-org/go-next-starter.git my-project
cd my-project
rm -rf .git
git init
```

#### 2. Backend Setup

```bash
cd backend

# Install dependencies
go mod download

# Copy environment variables
cp .env.example .env

# Edit .env with your values
# - DATABASE_URL
# - JWT_SECRET
# - R2 credentials
# - SMTP credentials

# Run migrations
go run cmd/migrate/main.go

# Seed database (optional)
go run scripts/seed.go

# Run development server
go run cmd/app/main.go
```

#### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local

# Edit .env.local
# - NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1

# Run development server
npm run dev
```

### Environment Variables

#### Backend (`.env`)

```env
# Server
PORT=8080
ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# JWT
JWT_SECRET=your-super-secret-key-change-this
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_URL=https://your-bucket.r2.dev

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

#### Frontend (`.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_SITE_NAME=My Project
```

### Deployment

#### Backend (Railway)

1. **Create Railway Project**
   ```bash
   # Install Railway CLI
   npm i -g @railway/cli

   # Login
   railway login

   # Create project
   railway init
   ```

2. **Add PostgreSQL**
   - Go to Railway dashboard
   - Click "New" → "Database" → "PostgreSQL"
   - Copy `DATABASE_URL`

3. **Deploy Backend**
   ```bash
   cd backend
   railway up
   ```

4. **Set Environment Variables**
   - Go to Railway dashboard → Variables
   - Add all variables from `.env`

#### Frontend (Vercel)

1. **Connect Repository**
   - Go to vercel.com
   - Import Git Repository

2. **Configure Build**
   - Framework: Next.js
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`

3. **Set Environment Variables**
   - Add `NEXT_PUBLIC_API_URL` (your Railway backend URL)

4. **Deploy**

---

## 📖 Usage Examples

### Example 1: Blog Platform

**Domain Models:**
- Posts, Categories, Tags
- Comments

**Key Features:**
- Public blog listing
- Post detail pages
- Admin post management
- Category management
- Comment moderation

**Database Tables:**
- `posts` (title, content, author_id, category_id, status, published_at)
- `categories` (name, slug, parent_id)
- `tags` (name, slug)
- `post_tags` (post_id, tag_id)
- `comments` (post_id, user_id, content, status)

### Example 2: E-commerce Platform

**Domain Models:**
- Products, Categories, Brands
- Orders, Order Items
- Shopping Cart
- Customers

**Key Features:**
- Product catalog
- Shopping cart
- Checkout flow
- Order management
- Customer accounts

**Database Tables:**
- `products` (name, sku, price, stock, category_id)
- `categories` (name, slug, parent_id)
- `cart_items` (user_id, product_id, quantity)
- `orders` (user_id, total, status, shipping_address)
- `order_items` (order_id, product_id, quantity, price)

### Example 3: Temple Website (WAT-PROFILE)

**Domain Models:**
- Events, Monks, Gallery
- Donations, Donation Categories
- Event Registrations
- Members

**Key Features:**
- Event listing & registration
- Monk profiles
- Photo gallery
- Donation tracking
- Member portal

**Database Tables:**
- `events` (title, description, date, location, max_participants)
- `monks` (name, title, biography, photo_url)
- `gallery` (title, description, images, category)
- `donations` (donor_name, amount, category_id, receipt_number)
- `event_registrations` (event_id, user_id, status)

---

## 🔒 Security Best Practices

### 1. Authentication
- ✅ Use bcrypt for password hashing (cost 12+)
- ✅ Implement JWT with short access token expiry (15min)
- ✅ Use refresh tokens with longer expiry (7 days)
- ✅ Store refresh tokens securely (database)
- ✅ Invalidate tokens on logout

### 2. Authorization
- ✅ Implement Role-Based Access Control (RBAC)
- ✅ Check permissions on every protected endpoint
- ✅ Use middleware for consistent auth checks
- ✅ Never trust client-side role checks

### 3. Input Validation
- ✅ Validate all user inputs
- ✅ Use parameterized queries (GORM handles this)
- ✅ Sanitize HTML content (prevent XSS)
- ✅ Validate file uploads (type, size, extension)

### 4. CORS
- ✅ Configure allowed origins properly
- ✅ Don't use `*` in production
- ✅ Set `credentials: true` only when needed

### 5. Rate Limiting
- ✅ Implement rate limiting on auth endpoints
- ✅ Limit API calls per user/IP
- ✅ Protect against brute force attacks

### 6. HTTPS Only
- ✅ Use HTTPS in production
- ✅ Set secure cookies
- ✅ Enable HSTS headers

### 7. Environment Variables
- ✅ Never commit `.env` files
- ✅ Use strong random secrets for JWT_SECRET
- ✅ Rotate secrets regularly
- ✅ Use different secrets for dev/prod

---

## 📊 Monitoring & Logging

### Backend Logging

```go
// Use structured logging (e.g., zerolog, zap)
import "github.com/rs/zerolog/log"

log.Info().
    Str("user_id", userID).
    Str("action", "login").
    Msg("User logged in")

log.Error().
    Err(err).
    Str("endpoint", "/api/v1/posts").
    Msg("Failed to fetch posts")
```

### Error Tracking

Consider integrating:
- Sentry (error tracking)
- Datadog (APM)
- New Relic (performance monitoring)

### Database Monitoring

- Monitor slow queries
- Set up connection pooling
- Regular backups (automated on Railway/Supabase)

---

## 🧪 Testing

### Backend Testing

```go
// internal/handlers/auth_handler_test.go
package handlers_test

import (
    "testing"
    "github.com/stretchr/testify/assert"
)

func TestLogin(t *testing.T) {
    // Setup test database
    // Create test user
    // Make request
    // Assert response
}
```

### Frontend Testing

```typescript
// src/services/__tests__/postService.test.ts
import { postService } from '../postService';

describe('postService', () => {
  it('should fetch posts', async () => {
    const posts = await postService.getPosts();
    expect(posts).toBeDefined();
    expect(Array.isArray(posts)).toBe(true);
  });
});
```

---

## 📚 Additional Resources

### Go Fiber
- [Official Docs](https://docs.gofiber.io/)
- [Middleware](https://docs.gofiber.io/api/middleware)

### Next.js
- [Official Docs](https://nextjs.org/docs)
- [App Router](https://nextjs.org/docs/app)

### GORM
- [Official Docs](https://gorm.io/docs/)
- [Associations](https://gorm.io/docs/associations.html)

### Cloudflare R2
- [R2 Docs](https://developers.cloudflare.com/r2/)
- [S3 API Compatibility](https://developers.cloudflare.com/r2/api/s3/)

---

## 🎯 Roadmap

### Phase 1: Core Foundation ✅
- Authentication & Authorization
- File Upload
- Email Service
- Multi-language Support
- Admin Panel

### Phase 2: Enhancements (Future)
- [ ] Two-Factor Authentication (2FA)
- [ ] OAuth Integration (Google, Facebook)
- [ ] WebSocket Support (Real-time)
- [ ] Notification System (Email, Push)
- [ ] Advanced Search (Elasticsearch)
- [ ] Caching (Redis)
- [ ] Queue System (Background Jobs)

### Phase 3: DevOps (Future)
- [ ] CI/CD Pipeline
- [ ] Automated Testing
- [ ] Load Testing
- [ ] Performance Optimization
- [ ] CDN Integration

---

## 📝 License

MIT License - Feel free to use this template for any project.

---

## 🤝 Contributing

This is a template project. Fork it, customize it, and make it your own!

If you find bugs or have suggestions, feel free to open issues.

---

## ✅ Checklist for New Project

When starting a new project with this template:

### Backend
- [ ] Clone template
- [ ] Update `go.mod` with your module name
- [ ] Copy `.env.example` → `.env` and configure
- [ ] Design domain-specific database schema
- [ ] Create migration files
- [ ] Create GORM models
- [ ] Create handlers & services
- [ ] Add routes
- [ ] Test endpoints
- [ ] Deploy to Railway

### Frontend
- [ ] Update `package.json` name
- [ ] Copy `.env.local.example` → `.env.local`
- [ ] Create TypeScript types
- [ ] Create API services
- [ ] Create pages (public & admin)
- [ ] Create components
- [ ] Configure i18n translations
- [ ] Test UI flows
- [ ] Deploy to Vercel

### Database
- [ ] Create PostgreSQL instance (Railway/Supabase)
- [ ] Run migrations
- [ ] Seed initial data (roles, settings)
- [ ] Test connections

### Storage
- [ ] Create Cloudflare R2 bucket
- [ ] Configure CORS
- [ ] Set up public access
- [ ] Test file uploads

### Email
- [ ] Configure SMTP credentials
- [ ] Create email templates
- [ ] Test password reset flow
- [ ] Test notification emails

### Production
- [ ] Set up custom domain
- [ ] Configure SSL/HTTPS
- [ ] Set up monitoring
- [ ] Enable error tracking
- [ ] Configure backups
- [ ] Document deployment process

---

## 📞 Support

For template-specific questions or issues, refer to:
- Backend documentation: `/backend/README.md`
- Frontend documentation: `/frontend/README.md`
- Deployment guides in this document

---

**Happy Coding! 🚀**

Built with ❤️ using Go Fiber and Next.js
