# Unified RichText Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace divergent long-form content editors with one dynamic-locale Tiptap JSON editor, Media Library image flow, safe renderer, backend validation, and lazy migration across Website CMS, Events, Monks, Privacy, Impressum, and approved About fields.

**Architecture:** Tiptap JSON is the persisted representation; a single extension registry creates and renders documents. The frontend normalizes legacy string values on admin reads and requests a version-checked background migration, while the backend validates every new JSON document before storing it in existing JSONB columns. Public rendering consumes only the shared JSON renderer and never writes data.

**Tech Stack:** Next.js/React, TypeScript, Tiptap v3, React Hook Form, Zod, DOMPurify, Go 1.24, Fiber, GORM, PostgreSQL JSONB.

## Global Constraints

- Do not add automated tests; the user will manually verify behavior.
- Keep `th`, `en`, and `de` as the initial configured locales, but RichText values use `Record<string, JSONContent>` and must accept a later locale without component/type edits.
- Do not change JSONB column types or issue a destructive database migration.
- Public GET routes must never mutate records.
- Do not duplicate media upload/list/validation logic; RichText and ImageUpload use one shared picker.
- Only use heading levels 2 and 3; title fields remain the sole H1 owner.
- Never render raw legacy HTML directly; render generated HTML only after sanitization.
- Preserve existing draft/publish semantics for `ContentPage` and `ContentSection`.

---

## File Structure

| Path | Responsibility |
|---|---|
| `frontend/src/lib/rich-text/extensions.ts` | One configured extension list shared by editor, converter, and renderer. |
| `frontend/src/lib/rich-text/document.ts` | JSON types, empty document, legacy conversion, locale fallback, document guards. |
| `frontend/src/components/admin/media/MediaPickerDialog.tsx` | Existing-library selection plus new-file upload; returns one media URL. |
| `frontend/src/components/admin/rich-text/*.tsx` | Editor engine, toolbar, locale wrapper, and sanitized renderer. |
| `frontend/src/components/admin/ImageUpload.tsx` | Single-image wrapper around the shared picker. |
| `backend/internal/models/rich_text.go` | JSONB-capable localised rich-text model that reads both legacy strings and JSON documents. |
| `backend/internal/richtext/validation.go` | Server allow-list and URL validation for documents. |
| `backend/internal/services/richtext_migration_service.go` | Optimistic-lock, allow-listed background persistence of converted values. |
| `backend/internal/handlers/richtext_migration_handler.go` | Admin-only migration endpoint. |

## Task 1: Install the renderer and link extensions, then create the shared document contract

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`
- Create: `frontend/src/lib/rich-text/extensions.ts`
- Create: `frontend/src/lib/rich-text/document.ts`

**Interfaces:**
- Produces `richTextExtensions`, `RichTextDocument`, `LocalizedRichText`, `emptyRichTextDocument`, `normalizeLegacyRichText`, and `getLocalizedRichText`.
- Consumers: Tasks 3–8.

- [ ] **Step 1: Add the exact dependencies.**

Run:

```bash
cd frontend
npm install @tiptap/extension-link@^3.20.0 @tiptap/html@^3.20.0
```

- [ ] **Step 2: Define one extension registry.**

```ts
// frontend/src/lib/rich-text/extensions.ts
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";

export const richTextExtensions = [
  StarterKit.configure({ heading: { levels: [2, 3] } }),
  Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
  Image.configure({ HTMLAttributes: { class: "rounded-lg max-w-full h-auto my-4" } }),
];
```

- [ ] **Step 3: Define conversion and fallback helpers.**

```ts
// frontend/src/lib/rich-text/document.ts
import type { JSONContent } from "@tiptap/core";
import { generateJSON } from "@tiptap/html";
import { richTextExtensions } from "./extensions";

export type RichTextDocument = JSONContent;
export type LocalizedRichText = Record<string, RichTextDocument>;

export const emptyRichTextDocument = (): RichTextDocument => ({ type: "doc", content: [{ type: "paragraph" }] });
export const isRichTextDocument = (value: unknown): value is RichTextDocument =>
  typeof value === "object" && value !== null && (value as { type?: unknown }).type === "doc";

export function normalizeLegacyRichText(value: unknown): RichTextDocument {
  if (isRichTextDocument(value)) return value;
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return emptyRichTextDocument();
  if (/<[a-z][\\s\\S]*>/i.test(text)) return generateJSON(text, richTextExtensions);
  return { type: "doc", content: text.split(/\\n{2,}/).map((paragraph) => ({ type: "paragraph", content: paragraph ? [{ type: "text", text: paragraph }] : [] })) };
}

export function getLocalizedRichText(value: LocalizedRichText, locale: string, defaultLocale: string): RichTextDocument {
  return value[locale] ?? value[defaultLocale] ?? Object.values(value).find(isRichTextDocument) ?? emptyRichTextDocument();
}
```

- [ ] **Step 4: Build the frontend.**

Run: `cd frontend && npx next build --webpack`

Expected: build exits with status 0 before consumers are migrated.

- [ ] **Step 5: Commit the contract.**

```bash
git add frontend/package.json frontend/package-lock.json frontend/src/lib/rich-text
git commit -m "feat: add rich text document contract"
```

## Task 2: Add backend rich-text storage, validation, and safe migration persistence

**Files:**
- Create: `backend/internal/models/rich_text.go`
- Create: `backend/internal/richtext/validation.go`
- Create: `backend/internal/services/richtext_migration_service.go`
- Create: `backend/internal/handlers/richtext_migration_handler.go`
- Modify: `backend/internal/models/event.go`
- Modify: `backend/internal/models/monk.go`
- Modify: `backend/internal/routes/routes.go`

**Interfaces:**
- Consumes: `LocalizedRichText` JSON emitted by Task 1.
- Produces `models.LocalizedRichText`, `richtext.Validate`, and `POST /api/v1/admin/rich-text/migrations`.

- [ ] **Step 1: Store locale values as raw JSON so old strings and new documents can coexist.**

```go
// backend/internal/models/rich_text.go
package models

type LocalizedRichText map[string]json.RawMessage

func (m LocalizedRichText) Value() (driver.Value, error) {
    if m == nil { return nil, nil }
    bytes, err := json.Marshal(m)
    if err != nil { return nil, err }
    return string(bytes), nil
}
func (m *LocalizedRichText) Scan(value any) error {
    if value == nil { *m = nil; return nil }
    var bytes []byte
    switch typed := value.(type) {
    case []byte: bytes = typed
    case string: bytes = []byte(typed)
    default: return errors.New("unsupported type for LocalizedRichText")
    }
    if len(bytes) == 0 { *m = LocalizedRichText{}; return nil }
    var result map[string]json.RawMessage
    if err := json.Unmarshal(bytes, &result); err != nil { return err }
    *m = LocalizedRichText(result)
    return nil
}
func (m *LocalizedRichText) UnmarshalJSON(data []byte) error {
    var result map[string]json.RawMessage
    if err := json.Unmarshal(data, &result); err != nil { return err }
    *m = LocalizedRichText(result)
    return nil
}
func (m LocalizedRichText) MarshalJSON() ([]byte, error) { return json.Marshal(map[string]json.RawMessage(m)) }
```

Implement `Value` and `Scan` with the same nil, `[]byte`, and `string` behavior as `models.JSONMap`; do not decode locale values into `string`.

- [ ] **Step 2: Change structured long-form fields only.**

```go
// backend/internal/models/event.go
Description LocalizedRichText `gorm:"type:jsonb" json:"description"`

// backend/internal/models/monk.go
Bio LocalizedRichText `gorm:"type:jsonb" json:"bio"`
```

Do not alter title, location, schedule activity, gallery caption, or any database column definition.

- [ ] **Step 3: Validate every persisted document.**

`richtext.Validate` must decode each locale `json.RawMessage` into an object and reject any document that is not a `doc` root or contains a node outside `paragraph`, `heading`, `bulletList`, `orderedList`, `listItem`, `blockquote`, `horizontalRule`, `image`, or `text`; permit only `bold`, `italic`, `strike`, and `link` marks. Validate heading levels 2/3, image `src`/optional `alt`, and link `href` with `http`, `https`, `mailto`, or an absolute internal `/` path. Return a field-specific error such as `description.en.content[0]: unsupported node "table"`.

- [ ] **Step 4: Call validation in Event and Monk create/update handlers before service writes.**

```go
if err := richtext.ValidateLocalized(event.Description); err != nil {
    return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
}
```

Use the equivalent `monk.Bio` call. Legacy string values are permitted only in migration reads; ordinary create/update requests must contain validated document objects.

- [ ] **Step 5: Implement a narrow, optimistic-lock migration endpoint.**

Accept only this payload:

```go
type migrationRequest struct {
    Resource  string                 `json:"resource"`   // "event", "monk", or "content_page"
    ID        string                 `json:"id"`
    UpdatedAt time.Time              `json:"updated_at"`
    Field     string                 `json:"field"`      // "description", "bio", or "body"
    Value     json.RawMessage        `json:"value"`
}
```

The service must switch on the three allowed `(resource, field)` pairs, validate `Value`, and update only when `id` and `updated_at` still match. A zero-row update returns `ErrMigrationConflict`; handler responds `409`, and the client simply refetches rather than overwriting a newer edit. Register the route under existing admin authentication and `website`/domain update permissions; public routes remain read-only.

- [ ] **Step 6: Compile backend.**

Run: `cd backend && GOMODCACHE=/private/tmp/gomodcache GOCACHE=/private/tmp/go-build-cache GOPATH=/private/tmp/gopath go test ./...`

Expected: compilation succeeds; no automated test files are added.

- [ ] **Step 7: Commit backend contract.**

```bash
git add backend/internal/models backend/internal/richtext backend/internal/services/richtext_migration_service.go backend/internal/handlers/richtext_migration_handler.go backend/internal/routes/routes.go
git commit -m "feat: validate structured rich text"
```

## Task 3: Extract one Media Library picker and use it from ImageUpload

**Files:**
- Create: `frontend/src/components/admin/media/MediaPickerDialog.tsx`
- Modify: `frontend/src/components/admin/ImageUpload.tsx`
- Retire after migration: `frontend/src/components/admin/website/MediaPickerModal.tsx`

**Interfaces:**
- Produces `<MediaPickerDialog isOpen onClose onSelect />`, where `onSelect(url: string): void`.
- Consumers: `ImageUpload` and Task 4 toolbar.

- [ ] **Step 1: Move list/upload behavior into MediaPickerDialog.**

The dialog owns `mediaService.list()` and `mediaService.upload(file)`, reuses the ImageUpload limits (`image/*`, 5 MB), displays upload loading/error state, and calls `onSelect(media.url)` for either an existing image or a successful new upload. It must reset its file input after every selection and never expose a `File` to the RichText editor.

- [ ] **Step 2: Reduce ImageUpload to single-image preview plus the shared dialog.**

Preserve its public prop contract:

```ts
type ImageUploadProps = {
  label?: string;
  value?: string | File;
  onChange: (value: string | File) => void;
  className?: string;
};
```

For a new upload, `MediaPickerDialog` returns the uploaded URL, so `ImageUpload` calls `onChange(url)`. Keep preview, remove, and lightbox behavior unchanged.

- [ ] **Step 3: Delete the redundant website-only picker only after all imports point to MediaPickerDialog.**

Run: `rg "MediaPickerModal" frontend/src`

Expected: no import remains before deleting the file.

- [ ] **Step 4: Manually verify ImageUpload.**

Open an Event or Monk editor; select an existing image, upload a new image, remove it, and confirm each operation still updates the form.

- [ ] **Step 5: Commit shared media selection.**

```bash
git add frontend/src/components/admin/media frontend/src/components/admin/ImageUpload.tsx frontend/src/components/admin/website/MediaPickerModal.tsx
git commit -m "refactor: share media picker across admin fields"
```

## Task 4: Build the reusable editor, toolbar, locale wrapper, and renderer

**Files:**
- Create: `frontend/src/components/admin/rich-text/RichTextEditor.tsx`
- Create: `frontend/src/components/admin/rich-text/RichTextToolbar.tsx`
- Create: `frontend/src/components/admin/rich-text/RichTextImagePicker.tsx`
- Create: `frontend/src/components/admin/rich-text/MultiLangRichText.tsx`
- Create: `frontend/src/components/admin/rich-text/RichTextContent.tsx`
- Modify: `frontend/src/utils/sanitize.ts`

**Interfaces:**
- Consumes: Tasks 1 and 3.
- Produces controlled editor props `value: RichTextDocument`, `onChange(document: RichTextDocument): void`; renderer props `value`, `locale`, and `defaultLocale`.

- [ ] **Step 1: Implement RichTextEditor as a controlled JSON editor.**

```tsx
type RichTextEditorProps = {
  value: RichTextDocument;
  onChange: (value: RichTextDocument) => void;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
};

const editor = useEditor({
  immediatelyRender: false,
  extensions: richTextExtensions,
  content: value,
  onUpdate: ({ editor }) => onChange(editor.getJSON()),
});
```

On external `value` changes, compare `JSON.stringify(editor.getJSON())` before `editor.commands.setContent(value, false)` so form resets do not emit another update or create a feedback loop.

- [ ] **Step 2: Implement the baseline toolbar only.**

Use Tiptap commands for `undo`, `redo`, `setParagraph`, `toggleHeading({ level: 2 | 3 })`, `toggleBold`, `toggleItalic`, `toggleStrike`, `unsetAllMarks`, `toggleBulletList`, `toggleOrderedList`, `toggleBlockquote`, `setHorizontalRule`, `setLink`, and `unsetLink`. Tool buttons need an accessible label and `editor.isActive()` state. Do not add H1, table, colors, font controls, raw HTML, video, code blocks, or alignment.

- [ ] **Step 3: Insert images through MediaPickerDialog.**

```tsx
<MediaPickerDialog
  isOpen={isPickerOpen}
  onClose={() => setIsPickerOpen(false)}
  onSelect={(url) => editor?.chain().focus().setImage({ src: url, alt: "" }).run()}
/>
```

- [ ] **Step 4: Implement dynamic MultiLangRichText.**

```tsx
type RichTextLocale = { code: string; label: string };
type MultiLangRichTextProps = {
  label: string;
  locales: RichTextLocale[];
  defaultLocale: string;
  value: LocalizedRichText;
  onChange: (value: LocalizedRichText) => void;
};
```

Retain one `RichTextEditor` instance. When a locale changes, replace only the controlled value; do not render with `key={activeLocale}`. Seed a missing locale with `emptyRichTextDocument()`.

- [ ] **Step 5: Render JSON safely.**

```tsx
const document = getLocalizedRichText(value, locale, defaultLocale);
const html = sanitizeHtml(generateHTML(document, richTextExtensions));
return <div className={cn("prose max-w-none", className)} dangerouslySetInnerHTML={{ __html: html }} />;
```

Update `sanitizeHtml` to permit only the generated tags/attributes: h2, h3, p, br, strong, em, s, ul, ol, li, blockquote, hr, a, img, `href`, `src`, `alt`, `target`, and `rel`. Reject style/event attributes.

- [ ] **Step 6: Manually verify editor behavior.**

Create text, switch locales, return to the first locale, undo/redo, add/edit/remove a link, insert an existing image, and upload/insert a new image. Confirm the selected toolbar tool has the correct active state and the editor retains focus during normal typing.

- [ ] **Step 7: Commit shared RichText UI.**

```bash
git add frontend/src/components/admin/rich-text frontend/src/utils/sanitize.ts
git commit -m "feat: add shared rich text editor"
```

## Task 5: Move generic Website rich-text sections to the new contract and renderer

**Files:**
- Modify: `frontend/src/schemas/website-cms.schema.ts`
- Modify: `frontend/src/utils/websiteCms.ts`
- Modify: `frontend/src/components/admin/website/sections/RichTextSectionEditor.tsx`
- Modify: `frontend/src/components/public/website/PublicSectionRenderer.tsx`
- Modify: `frontend/src/types/website-cms.ts`

**Interfaces:**
- Consumes: `LocalizedRichText`, `normalizeLegacyRichText`, `MultiLangRichText`, and `RichTextContent`.
- Produces: `body.richText` for section type `rich_text`.

- [ ] **Step 1: Change the section schema and defaults.**

Replace `body.markdown` with `body.richText`. The Zod body schema must accept an object keyed by locale whose values have `{ type: "doc" }`; the template default is `{ richText: {} }`.

- [ ] **Step 2: Replace the textarea with a React Hook Form Controller.**

```tsx
<Controller
  control={form.control}
  name={"body.richText" as never}
  render={({ field }) => (
    <MultiLangRichText
      label="Content"
      locales={websiteLocales}
      defaultLocale={routing.defaultLocale}
      value={normalizeLocalizedRichText(field.value)}
      onChange={field.onChange}
      disabled={props.isSaving}
    />
  )}
/>
```

`normalizeLocalizedRichText` converts each legacy `body.markdown` string on admin load, marks it for a non-blocking migration mutation, and does not discard source text if conversion fails.

- [ ] **Step 3: Render only through RichTextContent.**

Replace `markdown.split(/\n{2,}/)` in `PublicSectionRenderer` with `<RichTextContent value={readLocalizedRichText(section.body)} locale={locale} defaultLocale={routing.defaultLocale} />`.

- [ ] **Step 4: Manually verify Website draft/publish behavior.**

Edit a legacy rich-text section, save, inspect the returned `body.richText` JSON, preview draft, publish, and verify the public page renders heading/list/link/image correctly without literal tags.

- [ ] **Step 5: Commit Website sections.**

```bash
git add frontend/src/schemas/website-cms.schema.ts frontend/src/utils/websiteCms.ts frontend/src/components/admin/website/sections/RichTextSectionEditor.tsx frontend/src/components/public/website/PublicSectionRenderer.tsx frontend/src/types/website-cms.ts
git commit -m "feat: use structured rich text in website sections"
```

## Task 6: Move Event and Monk rich-text fields end to end

**Files:**
- Modify: `frontend/src/types/entities.ts`
- Modify: `frontend/src/app/[locale]/admin/events/_components/EventEditor.tsx`
- Modify: `frontend/src/app/[locale]/admin/monks/_components/MonkEditor.tsx`
- Modify: `frontend/src/app/[locale]/(client)/events/[id]/page.tsx`
- Modify: `frontend/src/app/[locale]/(client)/monks/[id]/page.tsx`
- Modify: relevant Event/Monk request schemas and service types discovered by `rg "Event.*schema|Monk.*schema" frontend/src`

**Interfaces:**
- Consumes: Task 2 API contract and Task 4 components.
- Produces: Event `description` and Monk `bio` as `LocalizedRichText` through admin and public paths.

- [ ] **Step 1: Change only long-form form fields to LocalizedRichText.**

Wrap each React Hook Form field with `MultiLangRichText`; retain title and location as `MultiLangInput`. Normalize legacy values at form initialization and submit JSON documents.

- [ ] **Step 2: Replace Event plain-text rendering.**

Replace the Event detail `<p>{getLocalizedText(event.description, locale)}</p>` with `RichTextContent` so headings, lists, links, and images render rather than HTML/JSON appearing as text.

- [ ] **Step 3: Correct Monk rendering to read bio.**

Replace `monk.content` with `monk.bio` and remove the page-local `dangerouslySetInnerHTML`; use `RichTextContent` as the sole rendering path.

- [ ] **Step 4: Manually verify both domains.**

For an Event and a Monk: edit every active locale, save, reload, insert a library image, open the public detail page, and confirm locale fallback and sanitized links/images work.

- [ ] **Step 5: Commit Event and Monk migration.**

```bash
git add frontend/src/types/entities.ts frontend/src/app/[locale]/admin/events frontend/src/app/[locale]/admin/monks frontend/src/app/[locale]/\(client\)/events frontend/src/app/[locale]/\(client\)/monks frontend/src/schemas frontend/src/services
git commit -m "feat: render event and monk content as rich text"
```

## Task 7: Move Privacy, Impressum, and approved About narrative fields

**Files:**
- Modify: `frontend/src/components/admin/website/privacy/PrivacyPageEditor.tsx`
- Modify: `frontend/src/components/admin/website/impressum/ImpressumPageEditor.tsx`
- Modify: `frontend/src/components/admin/website/about/tabs/AboutIntroTab.tsx`
- Modify: `frontend/src/components/admin/website/about/tabs/AboutHistoryTab.tsx`
- Modify: `frontend/src/components/admin/website/about/tabs/AboutSanghaTab.tsx`
- Modify: `frontend/src/schemas/website-page.schema.ts`
- Modify: public Privacy, Impressum, and About renderers that consume these fields

**Interfaces:**
- Consumes: Task 4 and Website `JSONMap` body storage.
- Produces: long-form body values as localized JSON documents; keeps short fields plain text.

- [ ] **Step 1: Update form data and schemas.**

Make only these fields `LocalizedRichText`: privacy section `content`; legal/impressum long-form content if present; About `objective_content`, `administration_content`, and `history_content`. Keep `intro_description`, `sangha_mission`, and `sangha_current_work` plain until an editor explicitly opts them into RichText.

- [ ] **Step 2: Replace each selected field with MultiLangRichText.**

Use `Controller` or the form context `setValue`/`watch` pair so field dirty state remains owned by React Hook Form. Do not copy form values into Zustand.

- [ ] **Step 3: Replace matching public render sites with RichTextContent.**

For each moved field, remove paragraph splitting or plain string interpolation and render the normalized localized JSON. Do not alter titles, metadata, cards, contact descriptions, addresses, or transport labels.

- [ ] **Step 4: Manually verify legal/About content.**

Open Privacy, Impressum, and About admin pages; save one paragraph/list/link/image in each migrated field; publish where available; reload public pages and verify existing short text remains unchanged.

- [ ] **Step 5: Commit page-master migration.**

```bash
git add frontend/src/components/admin/website/privacy frontend/src/components/admin/website/impressum frontend/src/components/admin/website/about frontend/src/schemas/website-page.schema.ts frontend/src/app/[locale]/\(client\)/privacy frontend/src/app/[locale]/\(client\)/impressum frontend/src/app/[locale]/\(client\)/about
git commit -m "feat: migrate legal and about content to rich text"
```

## Task 8: Remove duplicate legacy editor behavior and perform release verification

**Files:**
- Delete: `frontend/src/components/admin/RichTextEditor.tsx`
- Delete: `frontend/src/components/admin/MultiLangRichText.tsx`
- Modify: all imports found by `rg 'components/admin/(RichTextEditor|MultiLangRichText)' frontend/src`
- Modify: `docs/superpowers/specs/2026-07-17-unified-richtext-design.md` only if final implementation changes an approved interface

**Interfaces:**
- Consumes: all migrated consumers.
- Produces: exactly one RichText implementation and no legacy direct upload endpoint usage.

- [ ] **Step 1: Verify every consumer has moved.**

Run:

```bash
rg -n 'RichTextEditor|MultiLangRichText|body\.markdown|setImage\(|/admin/upload' frontend/src
```

Expected: only the new `components/admin/rich-text` implementation contains editor/`setImage`; no old component imports, `body.markdown`, or direct upload code remain.

- [ ] **Step 2: Delete old components after the search is clean.**

Do not delete `ImageUpload`; it remains the single-image consumer of `MediaPickerDialog`.

- [ ] **Step 3: Run required compilation checks.**

```bash
cd frontend && npx next build --webpack
cd ../backend && GOMODCACHE=/private/tmp/gomodcache GOCACHE=/private/tmp/go-build-cache GOPATH=/private/tmp/gopath go test ./...
```

Expected: both commands exit with status 0. No automated tests are introduced.

- [ ] **Step 4: Give the user the manual verification checklist.**

Ask the user to verify: legacy content conversion, all configured locales plus a temporarily added locale, toolbar state, link/image safety, Media Library selection and upload, Event/Monk detail pages, Website draft/preview/publish, Privacy/Impressum/About rendering, and no literal HTML/JSON on public pages.

- [ ] **Step 5: Commit cleanup.**

```bash
git add -A
git commit -m "refactor: consolidate rich text workflows"
```

## Plan Self-Review

- Spec coverage: Tasks 1–4 implement one editor, dynamic locales, toolbar, media picker, renderer, and sanitizer. Tasks 2 and 5–7 cover backend JSONB compatibility, validation, safe migration, Website, Event, Monk, Privacy, Impressum, and About. Task 8 removes old code and provides the requested manual verification.
- No-placeholder scan: no task relies on unspecified tests or a future design decision; all data shapes, allowed nodes, paths, and commands are explicit.
- Type consistency: every consumer uses `LocalizedRichText = Record<string, JSONContent>` on the frontend and `models.LocalizedRichText = map[string]json.RawMessage` on the backend; strings are accepted only during legacy read/migration and JSON documents are required for normal writes.
