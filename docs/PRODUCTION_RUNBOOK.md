# Production Runbook — WAT-PROFILE

คู่มือสำหรับการเตรียมความพร้อม, การติดตั้ง (Deployment), การตั้งค่าระบบ และการดูแลรักษาบนสภาพแวดล้อมจริง (Production Environment)

---

## 1. ภาพรวมสถาปัตยกรรมระบบ (System Architecture)

```
                       ┌──────────────────────────────┐
                       │     Internet Users / Web     │
                       └──────────────┬───────────────┘
                                      │ HTTPS (Port 443)
                                      ▼
                       ┌──────────────────────────────┐
                       │   Caddy SSL Reverse Proxy    │
                       └──────┬────────────────┬──────┘
                              │                │
              /api/*, /docs,  │                │ Default routes
              /health         │                │
                              ▼                ▼
                     ┌────────────────┐ ┌────────────────┐
                     │   Go Backend   │ │ Next.js Front  │
                     │  (Port 8080)   │ │  (Port 3000)   │
                     └───────┬────────┘ └────────────────┘
                             │
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
     ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
     │ PostgreSQL  │  │ Operations  │  │ Cloudflare  │
     │     16      │  │   Worker    │  │  R2 Storage │
     └─────────────┘  └─────────────┘  └─────────────┘
```

---

## 2. ข้อกำหนดขั้นต่ำของเครื่อง Server (Prerequisites)

- **OS**: Ubuntu 22.04 LTS / Debian 12 (หรือ Linux Server ที่รองรับ Docker)
- **Specs ขั้นต่ำ**: 2 CPU Cores, 4GB RAM, 40GB SSD
- **ซอฟต์แวร์ที่ต้องติดตั้ง**:
  - Docker (v24.0+)
  - Docker Compose V2 (`docker compose`)
  - Git
  - UFW Firewall (เปิด Port 80, 443, 22)
- **โดเมนและ DNS**:
  - Point A Record ของโดเมน (เช่น `watloungporsai.de` หรือ `api.watloungporsai.de`) มาที่ IP ของเครื่อง Server

---

## 3. การเตรียม Environment Variables (Configuration Checklist)

### 3.1 ฝั่ง Backend (`backend/.env`)

```ini
# Server
PORT=8080
ENV=production

# PostgreSQL
DATABASE_URL=postgresql://postgres:YOUR_STRONG_DB_PASSWORD@postgres:5432/wat_profile?sslmode=disable
DB_AUTO_MIGRATE=false

# Security & JWT (ห้ามใช้ค่า default, ต้องสุ่มใหม่อย่างน้อย 32 ตัวอักษร)
JWT_SECRET=USE_A_STRONG_RANDOM_SECRET_KEY_MIN_32_CHARS
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# CORS & Origins
ALLOWED_ORIGINS=https://watloungporsai.de,https://www.watloungporsai.de
ADMIN_ALLOWED_ORIGINS=https://watloungporsai.de,https://www.watloungporsai.de
ADMIN_COOKIE_SECURE=true
ADMIN_SESSION_EXPIRY=12h
ADMIN_SESSION_GRACE=30s

# Cloudflare R2 (S3-compatible Object Storage)
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=wat-profile-media
R2_PUBLIC_URL=https://pub-your-id.r2.dev

# Email Delivery (Resend หรือ SMTP สำหรับส่งใบอนุโมทนาบัตรและการแจ้งเตือน)
AUTH_EMAIL_DELIVERY_MODE=resend
RESEND_API_KEY=re_your_resend_api_key
ACCOUNT_EMAIL_FROM=no-reply@watloungporsai.de
CONTACT_EMAIL_FROM=contact@watloungporsai.de
CONTACT_NOTIFICATION_TO=office@watloungporsai.de

# Initial Admin Credentials (สำหรับรัน Seed ครั้งแรก)
ADMIN_EMAIL=admin@watloungporsai.de
ADMIN_PASSWORD=YOUR_SUPER_ADMIN_STRONG_PASSWORD
ADMIN_NAME=Wat Super Admin

# Feature Flags (เปิดใช้งานตามความพร้อมของวัด)
PUBLIC_ACCOUNT_AUTH_ENABLED=false
PUBLIC_COMMUNITY_READ_ENABLED=false
PUBLIC_COMMUNITY_WRITE_ENABLED=false
COMMUNITY_EMAIL_ENABLED=false
```

### 3.2 ฝั่ง Frontend (`frontend/.env`)

```ini
# Backend API Endpoint (URL โดเมนจริง)
NEXT_PUBLIC_API_URL=https://watloungporsai.de

# Cloudflare R2 Public Media Origin (ตรงกับ R2_PUBLIC_URL ใน backend)
NEXT_PUBLIC_MEDIA_ALLOWED_ORIGINS=https://pub-your-id.r2.dev

# Feature Flags (ตรงกับ backend)
NEXT_PUBLIC_PUBLIC_ACCOUNT_AUTH_ENABLED=false
NEXT_PUBLIC_COMMUNITY_ENABLED=false
```

---

## 4. ขั้นตอนการ Deploy ครั้งแรก (Initial Deployment)

### ขั้นที่ 1: Clone Repository และตั้งค่า Env
```bash
git clone https://github.com/TanParanyou/WAT-PROFILE.git /srv/wat-profile
cd /srv/wat-profile

# คัดลอกและแก้ไขไฟล์ .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
nano backend/.env
nano frontend/.env
```

### ขั้นที่ 2: รัน Database Migrations
รัน migration เพื่อสร้างตารางและดัชนีทั้งหมดใน PostgreSQL:
```bash
# สตาร์ท PostgreSQL ก่อน
docker compose -f docker-compose.prod.yml up -d postgres

# รอ Database พร้อม แล้วรัน migration
docker compose -f docker-compose.prod.yml run --rm backend /app/migrate up
```

### ขั้นที่ 3: รัน Essential Seeder
สร้างบทบาท (Roles), สิทธิ์การเข้าถึง (Permissions), บัญชี Super Admin, การตั้งค่าเว็บไซต์ (Site Settings) และหมวดหมู่เริ่มต้น:
```bash
docker compose -f docker-compose.prod.yml run --rm backend /app/seed --mode=essential
```

### ขั้นที่ 4: สตาร์ทระบบทั้งหมดด้วย Docker Compose
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### ขั้นที่ 5: ตรวจสอบสถานะการทำงาน (Verification)
```bash
# ตรวจสอบว่าทุก container อยู่ในสถานะ Up (healthy)
docker compose -f docker-compose.prod.yml ps

# ดู Logs การทำงาน
docker compose -f docker-compose.prod.yml logs -f backend
```

---

## 5. การตรวจสอบหลังการ Deploy (Smoke Test Checklist)

- [ ] **Health Check**: ตรวจสอบ `curl https://watloungporsai.de/health` คืนค่า `{"status":"ok"}`
- [ ] **Public Site**: เข้าหน้าแรก `https://watloungporsai.de/th` และทดสอบสลับภาษา (TH, EN, DE)
- [ ] **Admin Login**: เข้าหน้า `https://watloungporsai.de/admin/login` และล็อกอินด้วยบัญชี `ADMIN_EMAIL`
- [ ] **Media Upload**: เข้าหน้า Admin Media หรือ Gallery แล้วทดสอบอัปโหลดรูปภาพ 1 รูป เพื่อยืนยันการเชื่อมต่อ Cloudflare R2
- [ ] **Operations Worker**: ตรวจสอบ logs ของ worker:
  ```bash
  docker compose -f docker-compose.prod.yml logs --tail=50 operations-worker
  ```

---

## 6. การสำรองข้อมูลและการดูแลรักษา (Backup & Maintenance)

### การ Backup Database อัตโนมัติทุกวัน (Daily Automated Backup)
ตั้งค่า cron job บน Host เพื่อสำรองข้อมูล PostgreSQL ทุกคืนเวลา 03:00 น.:
```bash
sudo crontab -e
```
เพิ่มบรรทัดต่อไปนี้:
```cron
0 3 * * * docker exec wat_postgres pg_dump -U postgres wat_profile | gzip > /var/backups/wat_profile_$(date +\%Y\%m\%d).sql.gz && find /var/backups/ -name "wat_profile_*.sql.gz" -mtime +30 -delete
```

### การ Restore Database จากไฟล์ Backup
```bash
gunzip < /var/backups/wat_profile_YYYYMMDD.sql.gz | docker exec -i wat_postgres psql -U postgres -d wat_profile
```

### การอัปเดตเวอร์ชันใหม่ (Rolling Update)
เมื่อมีการ push โค้ดเวอร์ชันใหม่:
```bash
cd /srv/wat-profile
git pull origin main

# 1. รัน migration ใหม่ (ถ้ามี)
docker compose -f docker-compose.prod.yml run --rm backend /app/migrate up

# 2. Rebuild และ Restart เซอร์วิส
docker compose -f docker-compose.prod.yml up -d --build
```
