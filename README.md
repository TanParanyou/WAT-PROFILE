# WAT-PROFILE

เว็บไซต์สาธารณะและระบบจัดการเนื้อหาของวัดหลวงพ่อใส รองรับภาษาไทย อังกฤษ และเยอรมัน

## Components

| Path | Runtime | Purpose |
|---|---|---|
| `frontend/` | Next.js 16, React 19, TypeScript | Public website, Admin Panel, Website CMS |
| `backend/` | Go Fiber, GORM | REST API, authentication, permissions, media, content |
| `backend/migrations/` | PostgreSQL SQL | Versioned schema and data migrations |
| `docs/` | Markdown | Database and deployment operations |

PostgreSQL stores application data. Cloudflare R2 stores uploaded media.

## Prerequisites

- Node.js and npm compatible with `frontend/package-lock.json`
- Go 1.24 or newer, as declared by `backend/go.mod`
- PostgreSQL
- R2 credentials only when upload features are required

## Local setup

```bash
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
make install
```

Set local values in the copied env files. Never commit either file.

Start both applications:

```bash
make dev
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8080`
- Health check: `http://localhost:8080/health`
- API reference UI: `http://localhost:8080/docs`

Database migrations and seed data are separate operations. Read
[`docs/DATABASE.md`](docs/DATABASE.md) before running either.

## Documentation

- AI entry point and verified commands: [`AGENTS.md`](AGENTS.md)
- Runtime boundaries and dependency flow: [`ARCHITECTURE.md`](ARCHITECTURE.md)
- Product intent: [`PRODUCT.md`](PRODUCT.md)
- UI design system: [`DESIGN.md`](DESIGN.md)
- Database changes and migrations: [`docs/DATABASE.md`](docs/DATABASE.md)
- Build and release specification: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)
- Deployment step-by-step guide (TH): [`docs/DEPLOYMENT_TH.md`](docs/DEPLOYMENT_TH.md)
- Production runbook & maintenance: [`docs/PRODUCTION_RUNBOOK.md`](docs/PRODUCTION_RUNBOOK.md)
- Admin User Manual (TH): [`docs/ADMIN-USER-MANUAL-TH.md`](docs/ADMIN-USER-MANUAL-TH.md)
- System status & capabilities: [`docs/REMAINING-TASKS.md`](docs/REMAINING-TASKS.md)
- Public account auth testing and acceptance: [`docs/AUTH_TESTING.md`](docs/AUTH_TESTING.md)
- Community Q&A production testing and rollout: [`docs/COMMUNITY_TESTING.md`](docs/COMMUNITY_TESTING.md)

Frontend and backend rules live in their respective `AGENTS.md` files. Historical
implementation plans are intentionally not part of the production documentation.

## Calendar resources

The reusable Calendar uses inline resources by default. A host can pass resource
definitions and event IDs directly; no resource-creation screen is required:

```ts
const resources = [{ id: "main-hall", title: "Main hall", group: "location" }];
const events = [{ ...event, resourceIds: ["main-hall"] }];
```

WAT also supports an optional managed registry at `/admin/calendar/resources`
and through the protected `/api/v1/admin/calendar-resources` CRUD endpoints.
The registry is only needed when resources require shared metadata, permissions,
public/private visibility, capacity, or filtering. Its permission resource is
`calendar_resources`; grant `read`, `create`, `update`, and `delete` independently
through the role editor. The default Admin sidebar does not require this route.

When the managed mode is used, events accept `resource_ids: number[]` in their
existing Admin create/update payload. The backend validates active resources and
replaces assignments inside the event transaction.

Calendar feeds return localized active resources, expose `resourceIds` on entries,
and keep `resourceId` as the first-ID compatibility alias. Public feeds include
only resources with `is_public = true`; Admin feeds may include private active
resources.

The reusable Calendar keeps semantic views (`month`, `week`, `day`) separate from
presentation layouts. Hosts can configure layouts without coupling the core to
WAT or a transport client:

```ts
const planningLayouts = {
  desktop: { month: "monthGrid", week: "timeline", day: "resourceDayGrid" },
  mobile: { month: "monthAgenda", week: "dayStrip", day: "timeGrid" },
  mobileBreakpoint: 640,
};
```

Interactions, recurrence/exception rules, conflict validation, and external
calendar synchronization remain deferred to their owning calendar slices.
