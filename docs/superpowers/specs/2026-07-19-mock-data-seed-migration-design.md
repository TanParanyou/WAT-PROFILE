# Mock Data Seed Migration Design

## Goal

Create a deterministic data migration that replaces the public website's active seed domains with normalized records generated from the JSON fixtures in `frontend/src/data`. The migration must make the public APIs usable from a fresh or existing database while preserving operational and user-generated records that are outside the fixture ownership boundary.

## Source of truth

The committed JSON fixtures are the authoring source for this one-time seed snapshot:

- `events.json`
- `monks.json`
- `gallery.json`
- `categories.json`
- `schedule.json`
- `site-settings.json`
- `website-cms.json`
- `about.json`
- `contact.json`

The runtime backend must not read files from the frontend directory. A typed Go generator reads these files during development, normalizes them into the backend contracts, and emits a self-contained SQL migration. Deployment continues to execute ordinary `golang-migrate` SQL files.

## Architecture

Use a hybrid generator-and-migration design:

```text
frontend/src/data/*.json
        |
        v
backend/internal/seedgen
  load -> validate -> normalize -> render SQL
        |
        v
backend/migrations/000017_replace_public_mock_data.up.sql
backend/migrations/000017_replace_public_mock_data.down.sql
        |
        v
PostgreSQL through the existing migration command
```

The generator has four narrow responsibilities:

1. Load only the known fixture files into concrete Go structs.
2. Validate cross-file references and values before producing SQL.
3. Normalize fixture shapes into the current database and public-content contracts.
4. Render stable SQL in a fixed order so regeneration produces reviewable diffs.

The generated SQL is committed. Production requires neither Go generation nor access to frontend assets.

## Ownership and preservation boundaries

### Replaced domains

The up migration replaces active records for:

- gallery images;
- all gallery categories, followed by the real categories represented by the fixtures;
- event schedules belonging to replaceable events;
- events that are not protected by registrations;
- monks;
- daily, weekly, and online schedules;
- the six CMS pages represented by `website-cms.json`;
- public settings keys represented by `site-settings.json` and the public shell contract.

The `all` gallery category is a client-side filter sentinel and is not inserted into `gallery_categories`.

### Preserved domains

The migration must not delete or rewrite:

- users and roles;
- members;
- donations and donation categories;
- event registrations;
- contact inquiries;
- media records;
- audit logs;
- privacy and legal/impressum content, because there are no matching fixture files;
- private or operational settings not owned by the public fixture set.

### Registered-event exception

Deleting an event referenced by `event_registrations` would cascade and destroy registrations. Therefore:

- an existing event with registrations and a slug present in the fixture is updated in place;
- its schedules are replaced with the fixture schedules;
- its `registration_enabled`, `max_participants`, and `registration_deadline` values are preserved because they are operational registration configuration absent from the fixture;
- an existing registered event whose slug is absent from the fixture is retained unchanged;
- only unregistered events absent from the fixture are deleted.

This exception takes priority over the general replace-all behavior for Events.

## Data normalization

### Events and event schedules

- Generate deterministic, unique slugs from the English title when a fixture has no slug.
- Preserve fixture ordering in `display_order`.
- Map `active` to `is_active`.
- Map localized title, location, and description into JSONB values with `th`, `en`, and `de` keys.
- Convert description strings to the canonical localized rich-text document rather than storing an object that React cannot render directly.
- Parse ISO fixture dates into `start_date` and `end_date`.
- Parse only valid `HH:mm` or `HH:mm - HH:mm` time values. Human labels such as `Fr. - So.` must not be cast to PostgreSQL `time`; because the current Event contract has no time-label field, these values produce null start/end times and the public UI displays the date without a misleading time.
- Insert valid nested event schedule rows after the owning event is upserted.
- Use disabled registration defaults for new or unregistered fixture events. Preserve operational registration fields when a matching existing event already has registrations.

### Monks

- Use the fixture slug as the stable identity.
- Map localized names and titles directly.
- Convert localized HTML biography content into canonical rich-text documents.
- Preserve fixture order and active state.
- Leave ordination date empty when the fixture does not provide a valid date.

### Gallery

- Insert real categories in fixture order, excluding `all`.
- Resolve each gallery item's category slug to the inserted category ID.
- Fail generation when an item refers to an unknown non-sentinel category.
- Map `src` to `image_url`; use the same URL for `thumbnail_url` only when no distinct thumbnail exists.
- Preserve caption languages, ordering, and active state.
- Leave `event_id` null unless an explicit, resolvable event relationship exists.

### Schedules

- Daily fixtures become `schedule_type = 'daily'`.
- The Sunday weekly fixture becomes `schedule_type = 'weekly'` with `day_of_week = 0`.
- The online fixture becomes `schedule_type = 'online'`, with its title as the activity, its description as localized location/context, and its link in `online_link`.
- Single times populate `time_start`; valid ranges populate both `time_start` and `time_end`.
- Preserve source ordering within each schedule type.

### Public content

`website-cms.json` supplies the base metadata and sections for:

- `PAGE-HOME`
- `PAGE-ABOUT`
- `PAGE-CONTACT`
- `PAGE-EVENTS`
- `PAGE-GALLERY`
- `PAGE-MONKS`

All six seeded pages are published so their public endpoints cannot return 404 merely because a fixture page was marked draft. Draft fields and published snapshot fields are emitted from the same normalized seed payload, and `published_at` is set by the migration.

`about.json` enriches `PAGE-ABOUT.body` and is renamed into the current `AboutBody` contract, including `buddhaHistory -> history` and rich-text conversion.

`contact.json` enriches `PAGE-CONTACT.body` and is renamed into the current `ContactBody` contract, including `openingHours -> opening_hours`, `social -> socials`, map directions, transport entries, and bank fields. Fields absent from the fixture use language-neutral structural defaults: the contact form is enabled, its localized success-message values are empty, and its privacy link targets the public privacy route. No translated prose is invented by the generator.

Content sections for only these six pages are deleted and recreated. `PAGE-PRIVACY` and `PAGE-IMPRESSUM` remain untouched.

### Settings

The generator maps `site-settings.json` into the flat settings keys consumed by `GET /api/v1/public/settings`. It also emits the existing public-shell keys for site identity, localized address/contact copy, social links, logo, and sidebar behavior.

The migration deletes or upserts only the explicit generated key set. All other settings survive, including non-public operational configuration. Every public seed setting is marked `is_public = true` and receives an explicit type and category.

## Validation and failure policy

Generation fails before writing SQL when:

- a required fixture file is missing or invalid JSON;
- a localized required value lacks any of `th`, `en`, or `de`;
- generated slugs are empty or duplicated;
- a gallery category reference cannot be resolved;
- a date or time that claims to use a machine-readable format is invalid;
- a CMS page key or slug is duplicated;
- one of the six required CMS page keys is missing;
- a produced rich-text document is not valid JSON.

No permissive `map[string]interface{}`, Go `any`, TypeScript `any`, or unchecked type assertion is used to hide fixture/schema mismatches. Dynamic JSON fields use concrete structs or `json.RawMessage` at the serialization boundary.

## SQL behavior

The up migration uses an explicit transaction and performs operations in foreign-key-safe order:

1. remove all gallery rows and gallery categories;
2. remove schedules of replaceable events;
3. delete only unregistered events absent from the fixture;
4. upsert fixture events by slug and recreate their schedules;
5. replace monks and general schedules;
6. insert categories and gallery rows;
7. replace only the six fixture-owned content pages and their sections;
8. replace only fixture-owned setting keys;
9. synchronize integer sequences after explicit or generated inserts.

An error rolls back the complete migration. Stable slugs, page keys, setting keys, and deterministic ordering make the generated migration reviewable and safe against duplicate logical records.

The down migration removes records owned by this seed snapshot but cannot reconstruct data deleted by the up migration. It must retain any event that has acquired registrations after the up migration, applying the same registration-protection rule as the up path. A database backup is therefore required before applying this migration to an environment containing valuable data. The migration must not be executed against a database until its exact target has been confirmed separately.

## Verification scope

Per project direction, this work does not add or run automated tests. Verification is limited to:

- formatting the Go generator;
- compiling the generator and backend;
- generating the SQL twice and confirming byte-for-byte stable output;
- reviewing the generated SQL for forbidden table deletes and protected-domain references;
- checking migration version ordering;
- optionally applying the migration only to a disposable local database after receiving separate authorization.

Production or shared database execution is explicitly outside the implementation step.

## Non-goals

- Creating new fixture content for privacy or legal/impressum pages.
- Replacing frontend JSON with database exports.
- Running the migration automatically against the user's current database.
- Seeding user accounts, memberships, donations, registrations, inquiries, media, or audit history.
- Building a general-purpose data import framework beyond this committed fixture snapshot.
