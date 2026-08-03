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
- Database changes: [`docs/DATABASE.md`](docs/DATABASE.md)
- Build and release state: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)
- Public account auth testing and acceptance: [`docs/AUTH_TESTING.md`](docs/AUTH_TESTING.md)

Frontend and backend rules live in their respective `AGENTS.md` files. Historical
implementation plans are intentionally not part of the production documentation.
