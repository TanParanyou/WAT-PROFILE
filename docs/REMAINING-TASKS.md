# WAT-PROFILE — สถานะโปรเจค (Project Status)

> เอกสารนี้สำหรับให้ AI ทำงานต่อได้เลย โดยอธิบาย context, สถานะปัจจุบัน, และ task ที่เหลือ
> อัปเดตล่าสุด: 2026-02-22

---

## ✅ สิ่งที่เสร็จแล้วทั้งหมด

### Backend (Go Fiber + GORM + PostgreSQL)
- JWT Auth (access 15min + refresh 7 days) + middleware `AuthRequired`
- RBAC Permission System — `PermissionsMap` JSONB, `PermissionRequired(resource, action)` middleware ครบทุก route
- CRUD Handlers ครบทุก entity: events, monks, gallery, schedules, donations, members, contacts, registrations, settings
- **Upload Endpoint** — `POST /admin/upload` → Cloudflare R2 (S3-compatible), Media model, 5MB limit, image-only
- **Dashboard Stats** — `GET /admin/dashboard/stats` → count ทุก entity
- **Storage Service** — `internal/storage/r2.go` (AWS SDK v2)
- Seed script: roles (admin, editor, accountant, member) + admin user + settings + donation categories
- Public routes แยกจาก admin routes
- Rate limiting, CORS, Graceful shutdown, zerolog, Scalar API docs

### Frontend Admin Panel (Next.js App Router)
- **Auth**: Login, AuthContext, JWT interceptor (auto-refresh on 401)
- **Permission**: `usePermission` hook, `PermissionGuard`, `PermissionButton` (defense in depth)
- **Layout**: AdminSidebar (permission-aware, **responsive** — mobile hamburger + overlay), AdminHeader, AdminLayout
- **UI Components**: Button, Input, Select, Checkbox, DataTable, Modal (Confirm/Form), Loading, StatusBadge, Toast
- **Admin Components**: MultiLangInput (TH/EN/DE), ImageUpload, AdminPageHeader
- **CRUD Pages ครบทุก entity**:
  - Events: list, create, edit
  - Monks: list, create, edit
  - Gallery: list, upload, categories (inline modal)
  - Schedules: list + inline modal create/edit
  - Donations: list, categories (inline modal)
  - Members: list
  - Contacts: list + view/reply modal
  - Registrations: list + inline status update
  - Settings: grouped editor
- **Dashboard**: stat cards แสดงข้อมูลจริงจาก API (clickable ไปหน้าแต่ละ entity)
- **Error Boundary**: `admin/error.tsx` สำหรับ error recovery
- **Build**: `npm run build` ผ่าน ✅, `go build ./...` ผ่าน ✅

---

## งานที่เหลือ (Optional Enhancements)

### 🟢 Enhancement 1: Form Validation (LOW PRIORITY)

ปรับปรุง validation ใน create/edit pages ให้ครบถ้วนขึ้น:
- Events: ตรวจสอบ event_date format, end_time > start_time
- Monks: slug ต้องเป็น URL-safe
- Gallery: image_url required
- Donations: amount > 0
- Auto-generate slug จาก name (ถ้าว่าง)

**Pattern**: ใช้ validation ก่อน submit ใน `handleSubmit` function ของแต่ละ page

### 🟢 Enhancement 2: Role Management UI (LOW PRIORITY)

สร้างหน้า Admin สำหรับจัดการ Roles ผ่าน UI:
- `/admin/users` — จัดการ users + assign role
- `/admin/roles` — สร้าง/แก้ไข roles + permissions

ปัจจุบัน roles จัดการผ่าน seed script เท่านั้น

### 🟢 Enhancement 3: Bulk Operations (LOW PRIORITY)

เพิ่มความสามารถ:
- Multi-select rows ใน DataTable
- Bulk delete / bulk status update
- Export to CSV

### 🟢 Enhancement 4: Search & Filter (LOW PRIORITY)

เพิ่ม search bar + filters ใน list pages:
- ใช้ `onSearch` จาก `useDataTable` hook (มี support อยู่แล้ว)
- Filter by status, date range, category

---

## โครงสร้างไฟล์สำคัญ

```
WAT-PROFILE/
├── backend/
│   ├── cmd/
│   │   ├── app/main.go              # Entry point + R2 init
│   │   ├── seed/main.go             # Seed roles (admin/editor/accountant/member) + admin user
│   │   └── migrate/main.go          # DB migration
│   ├── internal/
│   │   ├── handlers/
│   │   │   ├── auth_handler.go
│   │   │   ├── event_handler.go
│   │   │   ├── monk_handler.go
│   │   │   ├── gallery_handler.go
│   │   │   ├── schedule_handler.go
│   │   │   ├── donation_handler.go
│   │   │   ├── member_handler.go
│   │   │   ├── registration_handler.go
│   │   │   ├── contact_handler.go
│   │   │   ├── settings_handler.go
│   │   │   ├── upload_handler.go     # POST /admin/upload → R2
│   │   │   └── dashboard_handler.go  # GET /admin/dashboard/stats
│   │   ├── middleware/
│   │   │   └── admin.go              # PermissionRequired middleware
│   │   ├── models/                   # ทุก entity model + Media model
│   │   ├── routes/routes.go          # ทุก route + granular permissions
│   │   └── storage/r2.go             # Cloudflare R2 client
│   ├── .env.example
│   └── go.mod
│
├── frontend/src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── layout.tsx            # AuthProvider + AdminAuthGuard
│   │   │   ├── page.tsx              # Dashboard (real stats)
│   │   │   ├── error.tsx             # Error boundary
│   │   │   ├── login/page.tsx
│   │   │   ├── events/               # list, create, [id]/edit
│   │   │   ├── monks/                # list, create, [id]/edit
│   │   │   ├── gallery/              # list, upload, categories
│   │   │   ├── schedules/page.tsx    # list + inline modal
│   │   │   ├── donations/            # list, categories
│   │   │   ├── members/page.tsx
│   │   │   ├── contacts/page.tsx     # list + reply modal
│   │   │   ├── registrations/page.tsx
│   │   │   └── settings/page.tsx
│   │   └── api/send-email/route.tsx
│   ├── components/
│   │   ├── admin/                    # AdminSidebar, AdminHeader, AdminLayout,
│   │   │                             # PermissionGuard, PermissionButton, Toast,
│   │   │                             # AdminPageHeader, StatusBadge, MultiLangInput, ImageUpload
│   │   └── ui/                       # DataTable, Modal, Button, Input, Select, Checkbox, Loading
│   ├── context/AuthContext.tsx
│   ├── hooks/                        # useAuth, usePermission, useDataTable, useToast
│   ├── services/
│   │   ├── api.ts                    # axios + interceptors
│   │   ├── authService.ts
│   │   └── adminService.ts           # generic CRUD factory + dashboardService
│   └── types/                        # entities, auth, api
│
└── docs/
    └── REMAINING-TASKS.md            # ← ไฟล์นี้
```

---

## Component API Reference (สำหรับ AI)

### useToast
```tsx
const { toasts, toast, removeToast } = useToast();
toast.success('สำเร็จ');  toast.error('ผิดพลาด');  toast.info('ข้อมูล');  toast.warning('เตือน');
// ใน JSX: <ToastContainer toasts={toasts} onRemove={removeToast} />
```

### useDataTable
```tsx
const { data, pagination, sort, isLoading, onPageChange, onSort, fetchData } =
    useDataTable<T>({ fetcher: (p) => service.getAll({ page: p.page, limit: p.limit }) });
// fetchData() ใช้ refresh ข้อมูล
```

### PermissionGuard / PermissionButton
```tsx
<PermissionGuard resource="events" action="create">...</PermissionGuard>
<PermissionButton resource="events" action="create" icon={<Plus size={16} />}>สร้าง</PermissionButton>
// resource: 'events' | 'monks' | 'gallery' | 'schedules' | 'donations' | 'members' | 'contacts' | 'settings' | 'users' | 'registrations'
// action: 'read' | 'create' | 'update' | 'delete'
```

### StatusBadge
```tsx
<StatusBadge label="Active" />        // auto-detect variant จาก label
<StatusBadge label="Custom" variant="warning" />
```

### AdminPageHeader
```tsx
<AdminPageHeader
    title="หัวข้อ"
    breadcrumbs={[{ label: 'Parent', href: '/admin/parent' }, { label: 'Current' }]}
    actions={<Button>Action</Button>}
/>
// ⚠️ ไม่มี prop "description" — ใช้ breadcrumbs แทน
// ⚠️ ใช้ "actions" ไม่ใช่ "action" (พหูพจน์)
```

### ToastContainer
```tsx
<ToastContainer toasts={toasts} onRemove={removeToast} />
// ⚠️ ต้องส่ง props ทั้ง 2 ตัว — ไม่ใช่ <ToastContainer /> เปล่าๆ
```

### MultiLangInput
```tsx
<MultiLangInput label="ชื่อ" value={form.name} onChange={(v) => setForm({...form, name: v})} required />
<MultiLangInput label="รายละเอียด" value={form.bio} onChange={(v) => setForm({...form, bio: v})} type="textarea" />
// type: 'input' | 'textarea' (default: 'input')
// ⚠️ ไม่มี prop "multiline" หรือ "rows"
```

### MultiLangText
```tsx
const emptyLang: MultiLangText = { th: '', en: '', de: '' };
// ⚠️ ต้องมี de field เสมอ
```

### ImageUpload
```tsx
<ImageUpload label="รูปภาพ" value={form.image_url} onChange={(url) => setForm({...form, image_url: url})} />
// ⚠️ ไม่มี prop "required"
// เรียก POST /admin/upload → Cloudflare R2
```

---

## Environment Setup

### Backend
```bash
cd backend
cp .env.example .env          # แก้ค่า DB, JWT, R2
go mod tidy
go run cmd/seed/main.go       # Seed roles + admin user
go run cmd/app/main.go        # Start API :8080
```

### Frontend
```bash
cd frontend
npm install
npm run dev                    # Start :3000
```

### ทดสอบ Login
- URL: `http://localhost:3000/admin/login`
- Email: `admin@watloungporsai.de`
- Password: `changeme123`

### Roles ที่มี
| Role | Description | Permissions |
|------|------------|-------------|
| admin | Full access | ทุก resource: all |
| editor | Content editor | events, monks, gallery, schedules: all / contacts: read |
| accountant | Finance | donations: all / members: read |
| member | Temple member | events, monks, gallery: read / donations, registrations: create |
