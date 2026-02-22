Claude’s Plan
Admin Panel — Implementation Plan
Context
Backend API มีระบบ admin ครบ (JWT auth, RBAC with JSONB permissions, CRUD ทุก entity) แต่ frontend ยังไม่มี admin panel — ต้องสร้างใหม่ทั้งหมด โดยเน้น component-based architecture และ permission system เป็นหลัก

หลักการออกแบบ

1. Component-Based Architecture
   ทุกอย่างเป็น component ที่ reusable — ไม่เขียน logic ซ้ำในแต่ละหน้า

2. Permission-First Design
   Permission ตรวจทั้ง frontend (ซ่อน UI) และ backend (กัน API) — defense in depth

Permission System (หัวใจของระบบ)
Backend ที่มีอยู่แล้ว

// role.go — PermissionsMap JSONB
// ตัวอย่าง: {"events": "all", "monks": "read", "donations": ["create", "read"]}

// HasPermission(resource, action) — ตรวจสิทธิ์ระดับ resource+action
// middleware: PermissionRequired(resource, action) — มีแล้วแต่ยังไม่ได้ใช้
Backend — ปรับ routes ให้ใช้ PermissionRequired
ไฟล์: backend/internal/routes/routes.go

เปลี่ยนจาก AdminOnly เป็น PermissionRequired แบบ granular:

// เดิม: admin.Get("/events", eventHandler.GetEvents) ← ใช้ AdminOnly ครอบทั้ง group
// ใหม่: แยก permission ตาม action
admin.Get("/events", middleware.PermissionRequired("events", "read"), eventHandler.GetEvents)
admin.Post("/events", middleware.PermissionRequired("events", "create"), eventHandler.CreateEvent)
admin.Put("/events/:id", middleware.PermissionRequired("events", "update"), eventHandler.UpdateEvent)
admin.Delete("/events/:id", middleware.PermissionRequired("events", "delete"), eventHandler.DeleteEvent)
Frontend — Permission Components & Hooks

components/admin/
├── PermissionGuard.tsx # ครอบ content — ซ่อนถ้าไม่มีสิทธิ์
├── PermissionButton.tsx # Button ที่ disabled/hidden ตาม permission
└── PermissionRoute.tsx # ซ่อน sidebar link ตาม permission

hooks/
├── usePermission.ts # hook: can(resource, action) → boolean
└── useAuth.ts # user + permissions
usePermission Hook

const { can, canAny, canAll } = usePermission();

can('events', 'create') // boolean — มีสิทธิ์สร้าง event ไหม
canAny('events', ['read','create']) // boolean — มีสิทธิ์อย่างน้อย 1 action
canAll('events', ['read','delete']) // boolean — ต้องมีทุก action
PermissionGuard Component

// ซ่อน UI ที่ไม่มีสิทธิ์ — ไม่ใช่แค่ disable แต่ไม่ render เลย
<PermissionGuard resource="events" action="create">
<Button>สร้างกิจกรรมใหม่</Button>
</PermissionGuard>

// แสดง fallback ถ้าไม่มีสิทธิ์
<PermissionGuard resource="events" action="read" fallback={<NoPermission />}>
<EventsList />
</PermissionGuard>
PermissionButton Component

// Button ที่จัดการ permission ในตัว
<PermissionButton
resource="events"
action="delete"
variant="danger"
onClick={handleDelete}

> ลบ
> </PermissionButton>
> // → ถ้าไม่มีสิทธิ์ = ไม่แสดงเลย
> Sidebar — ซ่อนเมนูตาม permission

// AdminSidebar จะใช้ can() กรอง menu items
const menuItems = [
{ label: 'Dashboard', href: '/admin', icon: LayoutDashboard, alwaysShow: true },
{ label: 'กิจกรรม', href: '/admin/events', icon: Calendar, resource: 'events' },
{ label: 'พระสงฆ์', href: '/admin/monks', icon: Users, resource: 'monks' },
...
].filter(item => item.alwaysShow || can(item.resource, 'read'));
Reusable Admin Components
Page Components (ลด code ซ้ำ)

components/admin/
├── AdminPageHeader.tsx # หัวหน้า + breadcrumb + action buttons
├── AdminListPage.tsx # Template สำหรับ list page (DataTable + filters + ปุ่มสร้าง)
├── AdminFormPage.tsx # Template สำหรับ create/edit page
├── AdminLayout.tsx # Sidebar + Header + Content
├── AdminSidebar.tsx # Sidebar nav (permission-aware)
├── AdminHeader.tsx # Top bar (user, logout)
└── AdminAuthGuard.tsx # Auth + permission check
AdminListPage Component

// Component สำเร็จรูป — แค่ส่ง config ก็ได้หน้า list ครบ
<AdminListPage
title="จัดการกิจกรรม"
resource="events" // ← permission resource
service={eventAdminService} // ← API service
columns={eventColumns} // ← DataTable columns
createHref="/admin/events/create"
filters={[ // ← optional filter fields
{ key: 'status', type: 'select', options: statusOptions }
]}
/>
AdminFormPage Component

// Component สำเร็จรูป สำหรับ create/edit
<AdminFormPage
title="สร้างกิจกรรม"
resource="events"
service={eventAdminService}
backHref="/admin/events"
id={params.id} // ← ถ้ามี = edit mode, ไม่มี = create

> {(form, setForm) => (

    <>
      <MultiLangInput label="ชื่อ" value={form.title} onChange={...} required />
      <MultiLangInput label="รายละเอียด" value={form.description} onChange={...} type="textarea" />
      <ImageUpload label="รูปภาพ" value={form.image_url} onChange={...} />
    </>

)}
</AdminFormPage>
Form Components

components/admin/
├── MultiLangInput.tsx # Input/Textarea สำหรับ th/en/de (tab switch)
├── ImageUpload.tsx # Drag-drop upload + preview
├── StatusBadge.tsx # สี badge ตาม status
├── DashboardStats.tsx # Stat cards
└── Toast.tsx # Toast notification system
UI Components (copy จาก 1931-DESIGN + ปรับ)

components/ui/
├── DataTable.tsx # ตาราง + pagination + sorting
├── Modal.tsx # Modal, ConfirmModal, FormModal
├── Loading.tsx # Loading spinners
├── Button.tsx # Button variants
├── Input.tsx # Form input
├── Select.tsx # Dropdown
└── Checkbox.tsx # Checkbox/toggle
โครงสร้างไฟล์ทั้งหมด

frontend/src/
├── app/admin/
│ ├── layout.tsx # AuthGuard + AdminLayout
│ ├── page.tsx # Dashboard
│ ├── login/page.tsx # Login (ไม่มี sidebar)
│ ├── events/
│ │ ├── page.tsx # ใช้ AdminListPage
│ │ ├── create/page.tsx # ใช้ AdminFormPage
│ │ └── [id]/edit/page.tsx # ใช้ AdminFormPage (edit mode)
│ ├── monks/ # เหมือน events
│ ├── gallery/
│ │ ├── page.tsx
│ │ ├── upload/page.tsx
│ │ └── categories/page.tsx
│ ├── schedules/page.tsx
│ ├── donations/
│ │ ├── page.tsx
│ │ └── categories/page.tsx
│ ├── members/
│ │ ├── page.tsx
│ │ └── [id]/page.tsx
│ ├── contacts/page.tsx
│ ├── registrations/page.tsx
│ └── settings/page.tsx
│
├── components/
│ ├── admin/ # Admin-specific (ข้างบน)
│ └── ui/ # Copy จาก 1931-DESIGN
│
├── context/
│ └── AuthContext.tsx # User + permissions state
│
├── hooks/
│ ├── useAuth.ts
│ ├── usePermission.ts # can(resource, action)
│ ├── useDataTable.ts
│ └── useToast.ts
│
├── services/
│ ├── api.ts # Axios + interceptors
│ ├── authService.ts
│ ├── eventAdminService.ts
│ ├── monkAdminService.ts
│ ├── galleryAdminService.ts
│ ├── scheduleAdminService.ts
│ ├── donationAdminService.ts
│ ├── memberAdminService.ts
│ ├── contactAdminService.ts
│ ├── registrationAdminService.ts
│ └── settingsAdminService.ts
│
└── types/
├── api.ts # ApiResponse, PaginatedResponse
├── auth.ts # User, Role, Permission types
├── event.ts
├── monk.ts
├── gallery.ts
├── schedule.ts
├── donation.ts
├── member.ts
├── contact.ts
├── registration.ts
└── setting.ts
Phases
Phase 1: Permission + Auth Foundation (~15 files)
เป้าหมาย: ระบบ auth + permission ใช้ได้ + login ได้

Copy UI components จาก 1931-DESIGN
สร้าง types: api.ts, auth.ts (รวม Role, Permission types)
สร้าง services/api.ts (Axios + interceptors + 401/403 handling)
สร้าง services/authService.ts
สร้าง context/AuthContext.tsx (user + permissions state)
สร้าง hooks/useAuth.ts, hooks/usePermission.ts
สร้าง PermissionGuard.tsx, PermissionButton.tsx
อัปเดต next.config.ts (rewrites)
Backend: ปรับ routes.go ให้ใช้ PermissionRequired แทน AdminOnly
Phase 2: Admin Shell (~8 files)
เป้าหมาย: Admin layout + login + dashboard ใช้ได้

สร้าง AdminSidebar (permission-aware menu)
สร้าง AdminHeader, AdminLayout, AdminAuthGuard
สร้าง Login page
สร้าง Admin layout (/admin/layout.tsx)
สร้าง Toast + useToast
สร้าง Dashboard placeholder
Phase 3: Reusable Page Components (~7 files)
เป้าหมาย: Template components สำเร็จรูปสำหรับ CRUD

AdminPageHeader.tsx
AdminListPage.tsx (DataTable + filters + create button + permission)
AdminFormPage.tsx (form + save/cancel + permission + loading)
MultiLangInput.tsx
ImageUpload.tsx
StatusBadge.tsx, DashboardStats.tsx
useDataTable.ts hook
Phase 4: Types + Services (~18 files)
Type files ทั้ง 9 entities (ตาม backend models)
Admin service files ทั้ง 9 entities
Phase 5: CRUD Pages (~20 files)
เป้าหมาย: ทุก entity มีหน้า CRUD ครบ

แต่ละหน้าใช้ AdminListPage / AdminFormPage — code น้อยมากต่อหน้า:

Events (list, create, edit)
Monks (list, create, edit)
Gallery (list, upload, categories)
Schedules (list + inline)
Donations (list + filters, categories)
Members (list, detail)
Contacts (list + reply)
Registrations (list + status)
Phase 6: Settings + Dashboard + Polish (~5 files)
Settings page (grouped editor)
Dashboard กับ real stats
Form validation
Error boundaries
Responsive sidebar
Backend Changes
routes.go — PermissionRequired แทน AdminOnly

// ก่อน:
admin := api.Group("/admin", middleware.AuthRequired, middleware.AdminOnly)
admin.Get("/events", eventHandler.GetEvents)

// หลัง:
admin := api.Group("/admin", middleware.AuthRequired)
admin.Get("/events", middleware.PermissionRequired("events", "read"), eventHandler.GetEvents)
admin.Post("/events", middleware.PermissionRequired("events", "create"), eventHandler.CreateEvent)
admin.Put("/events/:id", middleware.PermissionRequired("events", "update"), eventHandler.UpdateEvent)
admin.Delete("/events/:id", middleware.PermissionRequired("events", "delete"), eventHandler.DeleteEvent)
// ... ทำแบบเดียวกันทุก entity
Seed เพิ่ม role ใหม่ (ตัวอย่าง)

// role: "editor" — จัดการ content แต่ไม่เข้าถึง members/settings
{
Name: "editor",
Permissions: PermissionsMap{
"events": "all",
"monks": "all",
"gallery": "all",
"schedules": "all",
"contacts": "read",
},
}

// role: "accountant" — จัดการ donations + members เท่านั้น
{
Name: "accountant",
Permissions: PermissionsMap{
"donations": "all",
"members": "read",
},
}
Config Changes
next.config.ts — เพิ่ม API proxy

async rewrites() {
return [{
source: '/api/v1/:path*',
destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/:path*`,
}];
}
.env.local — เพิ่ม

NEXT_PUBLIC_API_URL=http://localhost:8080
Dependencies — เพิ่ม axios
Verification
cd backend && go run cmd/seed/main.go → seed roles + admin
cd backend && go run cmd/app/main.go → start API
cd frontend && npm run dev
Login: /admin/login → admin@watloungporsai.de / changeme123
Permission test: สร้าง user ที่มี role "editor" → ตรวจว่า Settings/Members ซ่อน
403 test: editor ลอง call /api/v1/admin/settings → ต้องได้ 403
CRUD test: สร้าง/แก้ไข/ลบ event
Token refresh: รอ 15 นาที → ตรวจ auto-refresh
npm run build → ต้องผ่าน
ไฟล์สำคัญที่ต้องอ้างอิง
ไฟล์ เหตุผล
backend/internal/models/role.go PermissionsMap + HasPermission logic
backend/internal/middleware/admin.go PermissionRequired middleware
backend/internal/routes/routes.go ทุก API endpoint — ต้องปรับ
backend/pkg/utils/response.go Response format
backend/cmd/seed/main.go Seed roles + admin
1931-DESIGN/frontend/src/components/ui/DataTable.tsx Copy + ปรับ
1931-DESIGN/frontend/src/components/ui/Modal.tsx Copy + ปรับ
หมายเหตุ
File Upload: ต้องเพิ่ม POST /admin/upload ที่ backend (ใช้ Media model ที่มีอยู่)
Permission granularity: ใช้ 5 actions: read, create, update, delete, all
Defense in depth: Frontend ซ่อน UI + Backend ตรวจ API — ถ้าคนข้าม frontend ก็ยังถูกกัน
Sidebar auto-filter: เมนูที่ไม่มีสิทธิ์จะไม่แสดงเลย — ไม่ใช่แค่ disabled
AdminListPage/AdminFormPage: ลด boilerplate ได้ ~80% — แต่ละ CRUD page มีแค่ ~30-50 บรรทัด
