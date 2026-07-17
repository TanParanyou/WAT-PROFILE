# Unified RichText Design

Date: 2026-07-17
Status: Approved design direction, ready for implementation planning

## Goal

Replace the incompatible rich-text, markdown textarea, direct image-upload, and public rendering flows with one reusable rich-text capability for Website CMS, Events, Monks, Privacy, Impressum, and selected long-form About content.

The result must preserve existing content through lazy migration, use the existing Media Library flow for image selection, and allow new locales without changing the shared RichText component contract.

## Decisions

- Persist Tiptap/ProseMirror JSON as the canonical content format.
- Generate sanitized HTML only for rendering.
- Use one shared RichText editor, toolbar, image-picker bridge, and renderer.
- Use a dynamic locale map, not a fixed `th` / `en` / `de` type.
- Migrate legacy HTML, markdown, and plain strings lazily in the admin read/update flow.
- Use the existing ImageUpload media-library flow for inserting images.
- Keep the first toolbar focused on content authoring, not page building.
- Do not add automated tests in this work; the user will verify behavior manually. Build/type checks still remain part of implementation verification.

## Content Contract

```ts
type LocalizedRichText = Record<string, JSONContent>;
```

The locale list is supplied by the system locale registry/configuration. The editor must not assume a fixed number or fixed set of locales. Rendering uses the requested locale, then the configured default locale, then the first non-empty locale.

RichText is used for:

- Website `rich_text` section content.
- Event `description`.
- Monk `bio`.
- Privacy policy section content.
- Impressum/legal content.
- About long-form narrative fields: objective, administration, and history content.
- About introductory and sangha narrative fields only when they need multiple paragraphs, links, lists, or images.

RichText is not used for titles, short subtitles, SEO descriptions, card descriptions, gallery captions, schedule activities, addresses, times, or labels.

## Frontend Architecture

```text
components/admin/rich-text/
  RichTextEditor.tsx       Tiptap lifecycle and controlled JSON value
  RichTextToolbar.tsx      Formatting controls only
  RichTextImagePicker.tsx  Media-library command adapter
  MultiLangRichText.tsx    Dynamic-locale field wrapper
  RichTextContent.tsx      Shared JSON-to-HTML rendering and sanitization
```

`RichTextEditor` owns the Tiptap extension registry and accepts a JSON document and `onChange` callback. It does not know about Event, Monk, Website CMS, or API endpoints.

`MultiLangRichText` changes the active locale without unmounting the editor. It coordinates the active JSON document while preserving focus, selection, and undo history where the document has not changed externally.

`RichTextImagePicker` shares the selection/upload behavior of `ImageUpload`. It opens the Media Library, returns a selected URL, and inserts an image node. The editor must not make its own upload request or duplicate media validation.

`RichTextContent` is the only public/preview renderer. It generates HTML from the approved extension registry, sanitizes it, and applies a shared prose style. Website preview/public pages, Event detail, Monk detail, Privacy, and Impressum consume this component.

## Toolbar Baseline

- Undo and redo.
- Paragraph, heading 2, and heading 3.
- Bold, italic, strike, and clear formatting.
- Bullet list, numbered list, blockquote, and divider.
- Insert, edit, and remove link with URL validation.
- Insert image via Media Library / ImageUpload flow.
- Active-state, disabled-state, upload progress, and scoped error feedback.

The initial toolbar deliberately excludes H1, font selection, font size, arbitrary colors, tables, raw HTML, video embeds, code blocks, and text alignment. These may be added later as schema extensions after a specific content requirement exists.

## Backend Contract and Migration

The existing database columns are JSONB, so no column-type migration is required. Backend changes are still required because `MultiLangText` is `map[string]string` and cannot hold a structured Tiptap document.

- Add a `LocalizedRichText` backend type for `map[string]RichTextDocument` with JSONB scan/value support.
- Change Event `description` and Monk `bio` to use that type.
- Validate allowed document nodes, marks, and image/link attributes before persistence.
- Validate external links to `https`, `http`, or `mailto`, plus permitted internal paths.
- Validate image attributes to the supported URL/alt shape.
- Extend Website JSON-body validation for `body.richText` while retaining its existing JSONB storage.
- Keep the draft/publish flow structurally identical: published rich-text JSON is copied with the other published fields.
- Correct the Monk public contract so public rendering reads `bio`, matching the admin write field.

### Lazy Migration

On an admin read/update path, normalize each affected locale:

1. A valid Tiptap JSON document is retained.
2. Legacy HTML is parsed through the approved extension schema into JSON.
3. Legacy markdown or plain text is converted into paragraph nodes.
4. The normalized JSON is saved back without blocking the editor response.

Public GET routes never write to the database. If migration fails, preserve the source as plain text, return a non-destructive warning for administration, and never silently drop content.

## Rendering and Safety

- The renderer only accepts validated JSON documents.
- Its generated HTML is sanitized with an allow-list matching the editor schema.
- Images permit only supported `src` and `alt` attributes.
- Links permit only the validated protocols/paths and safe `rel` behavior.
- Missing translations use locale fallback; no rich-text content renders as an empty state rather than an error.

## Delivery Sequence

1. Add shared rich-text types, extension registry, editor, renderer, and Media Library adapter without changing consumers.
2. Add backend structured-content validation and lazy migration support.
3. Move Website `rich_text` sections and validate draft, preview, publish, and public rendering manually.
4. Move Events and Monks, including their public renderers and the Monk `bio` contract correction.
5. Move Privacy, Impressum, and selected About narrative fields.
6. Remove obsolete textarea/HTML upload/render paths only after their final consumer has moved.

This sequence keeps each domain operational while migration is underway and prevents duplicated editor or renderer implementations from reappearing.

## Verification

Per user request, no automated tests are added for this work. Manual verification covers locale switching, old-content migration, media-library image insertion, draft/publish behavior, public rendering, image/link sanitization, and adding a locale. Frontend build/type checks and backend compilation remain required before handoff.
