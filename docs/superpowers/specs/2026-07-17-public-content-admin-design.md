# Public Content Admin Design

## Decision

Replace the Website CMS management surface with four fixed, task-focused admin pages:

```text
/admin/about
/admin/contact
/admin/privacy
/admin/impressum
```

These routes manage exactly the data rendered by their matching public client pages. They do not expose page creation, section builders, draft/publish states, page keys, slugs, raw JSON, or generic content-management controls.

## Data ownership

`content_pages` remains the persistence model for the four records (`PAGE-ABOUT`, `PAGE-CONTACT`, `PAGE-PRIVACY`, and `PAGE-IMPRESSUM`). Each record is always live: an admin save updates the editable and published fields atomically. Existing `content_sections` may remain for backward compatibility but are not edited or rendered by these four dedicated flows.

Contact's visitor-visible data becomes one `PAGE-CONTACT` body document. Address, opening hours, map, social links, transport, bank details, form visibility, and success copy must no longer be read from mock site settings or editable through generic Settings. This provides one source of truth for the contact page and reusable public contact information.

The contact-form delivery recipient is **not** public content and is not editable in the admin form. It stays in server-only environment configuration (for example `CONTACT_EMAIL`), is never returned by `/public/contact`, and is never written to `content_pages` or audit metadata.

## Admin information architecture

The sidebar has a labelled group, **ข้อมูลเว็บไซต์**, containing the four direct routes. It is a new peer menu to **Website**: the existing Website/CMS menu, routes, components, APIs, and data remain unchanged in this scope. Public contact, social, and donation content is removed from `/admin/settings`. The generic Settings menu is hidden in this release because its current key-value UI has no remaining approved system configuration to expose; its backend records are retained untouched for rollback.

## Forms

All visitor-visible copy uses TH/EN/DE fields. Thai is required; EN and DE may be blank but show an incomplete-translation indicator. Each page has a single Save action, saving state/error feedback, last-saved timestamp, and a link to open its public page.

### About

- Page title and introduction.
- Intro: heading, description, founded date/text, location.
- Objective: heading, subtitle, rich text content.
- Administration: heading and rich text content.
- History: heading and rich text content.
- Buildings: heading plus repeatable name/description items.
- Sangha: heading, mission, rich text current work.

Monk cards are not editable here: they continue to use the Monk domain data.

### Contact

- Page title and introduction.
- Address, phone, and public email.
- Opening days, time, and notice.
- Map location name, embed URL, and directions URL.
- Parking, public-transport instructions, and driving instructions.
- Facebook, Instagram, Messenger, LINE, and YouTube URLs where the client supports them.
- Bank name, account name/number, IBAN, and BIC.
- Contact-form enabled state, success message, and privacy-page link. The delivery recipient remains server-only configuration.

### Privacy

- Page title.
- A single localized Rich Text document (`body.content`) for the complete policy.
- A read-only `last_updated` value set by the backend on every successful save.

The public client renders that rich-text document directly. It retains a temporary read-only fallback for the legacy `body.sections` shape until stored records are migrated.

### Impressum

- Page title.
- Legal organization name, legal form, address, phone, and public email.
- Legal representative/responsible person.
- Registry court and registry number.
- VAT/tax ID when applicable.
- Content-responsibility statement/person.

## Backend contract

The API exposes dedicated resource endpoints, authenticated with the existing `website` permission:

```text
GET /api/v1/admin/about       PUT /api/v1/admin/about
GET /api/v1/admin/contact     PUT /api/v1/admin/contact
GET /api/v1/admin/privacy     PUT /api/v1/admin/privacy
GET /api/v1/admin/impressum   PUT /api/v1/admin/impressum

GET /api/v1/public/about
GET /api/v1/public/contact
GET /api/v1/public/privacy
GET /api/v1/public/impressum
```

Handlers convert between dedicated DTOs and the fixed `ContentPage` records. They never accept `page_key`, `slug`, `status`, or arbitrary section data from the client. A save validates required Thai fields plus email and allowed URL fields on the server, updates both draft and published columns inside one database transaction, sets `published_at`/`last_updated`, and creates an audit-log record. Admin reads use editable fields; public reads require `published` status and map only the `Published*` snapshot.

## Migration and compatibility

- Keep existing content-page IDs and route slugs.
- Map existing About, Privacy, and Impressum bodies into the new dedicated shapes.
- Compose `PAGE-CONTACT` from existing contact page values plus the existing global contact settings record; after cutover, remove the contact/social/donation keys from the editable generic Settings UI.
- Run the data migration as an idempotent deployment migration, not only through the development seed command. Keep legacy settings rows and old content shapes for one release as rollback inputs.
- Public client readers support legacy data only during this release. Once all records are migrated, remove only the mock/settings fallbacks used by the four direct public pages; do not remove Website CMS imports or implementation.

## Non-goals

- No changes to Website CMS page list, arbitrary page creation, sections, reorder, clone, archive, preview mode, publishing workflow, routes, navigation, components, APIs, or data.
- No automated tests in this work, per the user’s explicit instruction.
