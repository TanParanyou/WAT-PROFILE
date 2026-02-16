# WAT-PROFILE Backend API 🏛️

Backend API for Wat Loung Por Sai temple management system built with Go Fiber + PostgreSQL + JSONB Multi-language Support.

---

## ✨ Features

- ✅ **Authentication** - JWT with refresh tokens
- ✅ **RBAC** - Role-based access control
- ✅ **Multi-language** - JSONB support for TH/EN/DE
- ✅ **Temple Management** - Events, Monks, Gallery
- ✅ **Member System** - Temple member management
- ✅ **Donation System** - Donation tracking
- ✅ **Event Registration** - Event registration system

---

## 🚀 Quick Start

### Prerequisites
- Go 1.22+
- PostgreSQL 15+

### 1. Install Dependencies

```bash
go mod download
```

### 2. Setup Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/wat_profile?sslmode=disable
JWT_SECRET=your-super-secret-key-change-this
ALLOWED_ORIGINS=http://localhost:3000
```

### 3. Run PostgreSQL (Docker)

```bash
docker run --name postgres-wat \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=wat_profile \
  -p 5432:5432 \
  -d postgres:15
```

### 4. Run Backend

```bash
go run cmd/app/main.go
```

**Backend API:** http://localhost:8080

---

## 📡 API Endpoints

### Public Endpoints (No Auth)

```
GET  /api/v1/public/events           # List all events
GET  /api/v1/public/events/:slug     # Get event details
GET  /api/v1/public/monks            # List all monks
GET  /api/v1/public/monks/:slug      # Get monk details
GET  /api/v1/public/gallery          # List gallery images
GET  /api/v1/public/gallery/categories  # Gallery categories
```

### Auth Endpoints

```
POST /api/v1/auth/register           # Register new user
POST /api/v1/auth/login              # Login
POST /api/v1/auth/refresh            # Refresh access token
GET  /api/v1/auth/me                 # Get current user (Protected)
```

### Admin Endpoints (Auth + Admin Role Required)

```
# Events Management
GET    /api/v1/admin/events          # List events
POST   /api/v1/admin/events          # Create event
PUT    /api/v1/admin/events/:id      # Update event
DELETE /api/v1/admin/events/:id      # Delete event

# Monks Management
GET    /api/v1/admin/monks           # List monks
POST   /api/v1/admin/monks           # Create monk
PUT    /api/v1/admin/monks/:id       # Update monk
DELETE /api/v1/admin/monks/:id       # Delete monk

# Gallery Management
GET    /api/v1/admin/gallery         # List galleries
POST   /api/v1/admin/gallery         # Upload image
DELETE /api/v1/admin/gallery/:id     # Delete image
```

---

## 🧪 Test API

### 1. Health Check

```bash
curl http://localhost:8080/health
```

### 2. Register User

```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@watloungporsai.de",
    "password": "password123",
    "name": "Admin User"
  }'
```

### 3. Login

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@watloungporsai.de",
    "password": "password123"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "user": { ... }
  }
}
```

### 4. Create Event (Admin)

```bash
curl -X POST http://localhost:8080/api/v1/admin/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "slug": "meditation-retreat-2024",
    "title": {
      "th": "ปฏิบัติธรรมประจำปี",
      "en": "Annual Meditation Retreat",
      "de": "Jährlicher Meditations-Retreat"
    },
    "description": {
      "th": "คอร์สปฏิบัติธรรม 7 วัน",
      "en": "7-day meditation course",
      "de": "7-tägiger Meditationskurs"
    },
    "event_date": "2024-12-01T00:00:00Z",
    "event_type": "meditation_course",
    "is_active": true
  }'
```

### 5. Get Public Events

```bash
curl http://localhost:8080/api/v1/public/events
```

---

## 🗄️ Database Models

### Core Models (11 tables)

1. **users**, **roles** - Authentication & RBAC
2. **events**, **event_schedules** - Events management
3. **monks** - Monk profiles
4. **gallery**, **gallery_categories** - Gallery images
5. **schedules** - Daily/weekly schedules
6. **members** - Temple members
7. **donations**, **donation_categories** - Donation tracking
8. **event_registrations** - Event registrations
9. **contact_inquiries** - Contact form submissions

### Multi-language JSONB Example

```sql
-- Events table
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    title JSONB NOT NULL,  -- {"th": "", "en": "Title", "de": ""}
    description JSONB,
    event_date DATE NOT NULL,
    ...
);
```

---

## 🐳 Deployment

### Build Docker Image

```bash
docker build -t wat-profile-backend .
```

### Run with Docker Compose

```bash
docker-compose up -d
```

---

## 📚 Documentation

- **Full Implementation Plan**: `D:\syaco\WAT-PROFILE\docs\backend\README.md`
- **Template Documentation**: `D:\syaco\WAT-PROFILE\docs\template\README.md`

---

## 🔐 Security

- JWT tokens expire in 15 minutes (access) / 7 days (refresh)
- Passwords hashed with bcrypt
- CORS enabled for specified origins only
- Admin-only routes protected by middleware

---

## 🎯 Next Steps

1. ✅ Backend is running
2. Create admin user via `/auth/register`
3. Test endpoints with Postman/curl
4. Integrate with frontend
5. Deploy to Railway/Render

---

**Built with ❤️ for Wat Loung Por Sai**
