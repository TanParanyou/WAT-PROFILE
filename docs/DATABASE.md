# Database Operations

## Scope

PostgreSQL is the only application database. GORM owns runtime mapping; ordered SQL
migrations own deployable schema/data history.

| Concern | Source |
|---|---|
| Runtime model shape | `backend/internal/models/` |
| Versioned schema/data history | `backend/migrations/` |
| Migration runner | `backend/cmd/migrate/main.go` |
| Connection and AutoMigrate | `backend/internal/config/config.go` |
| Initial operational data | `backend/cmd/seed/main.go` |

## Connection

The backend requires `DATABASE_URL`. A typical local value is documented with
placeholders in `backend/.env.example`.

- Port `6543` or a `pooler.supabase.com` URL enables GORM simple protocol.
- `PREFER_SIMPLE_PROTOCOL=true` forces the same behavior.
- Pool settings are 25 open, 10 idle, 5-minute lifetime, 1-minute idle time.
- Never paste real connection strings into Markdown, source, logs, or commits.

## Migration commands

Run from `backend/`:

```bash
go run cmd/migrate/main.go version
go run cmd/migrate/main.go up
go run cmd/migrate/main.go down
```

`down`, `drop`, and `force` can destroy data or invalidate migration history. Run them
only against a confirmed non-production target, or with explicit production approval
and a verified backup.

Do not use `make be-migrate`: the current target omits the required CLI subcommand.

## Schema-change rules

- Add the next six-digit migration pair: `NNNNNN_description.up.sql` and `.down.sql`.
- Never renumber, edit, or delete a migration that may have been applied.
- Update the matching GORM model in the same change.
- Make the `up` migration safe for the known current schema.
- Make the `down` migration reverse only what the matching `up` introduced.
- Add indexes for actual query/filter/order paths, not speculative access.
- Use transactions for multi-step data migrations when PostgreSQL permits it.
- Preserve foreign-key delete behavior declared by existing models/migrations.
- Review generated SQL and affected-row scope before committing seed/data migrations.

## AutoMigrate

`cmd/app/main.go` calls `config.MigrateModels()` on startup. It runs unless
`DB_AUTO_MIGRATE=false`.

- Set `DB_AUTO_MIGRATE=false` in production.
- Apply versioned SQL migrations before starting the new application version.
- Do not use AutoMigrate and SQL migrations as competing production authorities.
- Local AutoMigrate may help development, but it does not replace migration files.

Community Q&A uses migrations `000046_create_community_qa` and
`000047_seed_community_qa` (with constraints refined in `000056`). The schema migration enables `pg_trgm`, creates only
Community-owned tables, and is reversible on a disposable database.

Recent notable migrations (up to `000059`):
- `000045_create_calendar_resources`: Managed calendar resource registry.
- `000048_create_event_categories`: Event category taxonomy.
- `000049_add_admin_security_features`: Two-factor authentication (TOTP/backup codes) and active session tracking.
- `000050_add_scheduled_publishing_to_events`: Event draft/publish scheduling.
- `000051_add_is_system_to_roles`: System role protection against accidental deletion.
- `000054_create_chantings_table`: Digital chanting book with Pali text, multi-language translations, and audio support.
- `000055_create_chatbot_knowledge_base`: AI Chatbot knowledge base Q&A pairs.
- `000058_create_news_and_site_alerts`: News articles, categories, and urgent site alert banners/popups.
- `000059_create_analytics_page_views`: Anonymized multi-entity page view tracking for Analytics Hub.

## Data contracts

- Localized text is JSONB through `models.MultiLangText`.
- Localized rich text is JSONB Tiptap content through `models.LocalizedRichText`.
- Public content must be active/published; drafts are admin-only.
- Website CMS publishing copies draft state to published snapshot fields.
- Ordered entities require deterministic `display_order`/`sort_order` handling.
- Role permissions are a JSONB resource-to-action map; admin routes enforce them.
- Community rich text is a single validated Tiptap JSONB document; the backend owns
  node/mark validation and extracted plain text.

## Seed operations

Run from `backend/` only after migrations:

```bash
go run cmd/seed/main.go
```

- Seed creates roles, an admin user, settings, CMS data, and donation categories.
- Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME` explicitly before production seed.
- The seed code contains local fallback admin credentials; never rely on them in production.
- Migration `000017` replaces fixture-owned public domains and performs broad deletes.
  Review its ownership boundary before applying it to a database with existing content.
- Migration `000034` adds the durable `operation_outbox` used by donation email and
  media-retention workers. Apply it before starting `cmd/operations-worker`.

## Verification

- Apply all migrations to an empty PostgreSQL database.
- Apply them to a copy of the previous release schema.
- Run `go test ./...` with an isolated test database where required.
- Run `go run cmd/migrate/main.go version` and record the expected version.
- Verify public reads, admin writes, permissions, and rollback behavior for changed tables.

## TODO: team confirmation

- Confirm the production backup/restore owner and retention policy.
- Confirm the production migration executor and release ordering.
- Add an automated empty-database plus upgrade-path migration check.
