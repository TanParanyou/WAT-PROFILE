# Rich Text Editor Interaction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every shared admin Rich Text field a full-canvas, localized, reliable editing surface whose formatting toolbar preserves selection and clearly reports its state.

**Architecture:** Keep Tiptap JSON, the extension registry, `MultiLangRichText`, Media Library integration, backend validation, and public rendering unchanged. Add a localized UI namespace, make `RichTextEditor` own full-surface focus and live editor state, and make `RichTextToolbar` issue selection-safe commands through a dedicated localized link dialog.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, next-intl, Tiptap 3, Lucide React, existing Modal/Input/Button components.

## Global Constraints

- Change only the shared admin Rich Text interaction; preserve the persisted `RichTextDocument` JSON format and public rendering.
- Reuse the existing Tiptap, Media Library, Modal, Input, Button, and next-intl dependencies; add no packages.
- Use `AdminIntlProvider`'s active TH/EN/DE locale and add matching keys to all three `frontend/src/messages/admin/*.json` files.
- Keep all changes accessible: real `button` elements, localized `aria-label` values, native localized `title` tooltips, and visible keyboard focus states.
- Do not alter the unrelated pre-existing backend worktree changes.
- There is no configured frontend React test runner. Verify the interaction manually and run the frontend lint/build checks.

---

## File Structure

- `frontend/src/messages/admin/th.json`, `en.json`, `de.json`: localized Rich Text labels, tooltips, link-dialog copy, and validation feedback.
- `frontend/src/components/admin/rich-text/RichTextLinkDialog.tsx`: localized, focused link form that validates an entered URL and returns it without mutating the editor.
- `frontend/src/components/admin/rich-text/RichTextToolbar.tsx`: selection-safe command controls, active/disabled state, localized labels, and Media Library selection restoration.
- `frontend/src/components/admin/rich-text/RichTextEditor.tsx`: full editing canvas, localized placeholder, outer focus behavior, and state passed to the toolbar.
- `frontend/src/components/admin/rich-text/MultiLangRichText.tsx`: retain its existing dynamic locale-map responsibility; only pass the shared localized placeholder if the editor API requires it.

### Task 1: Add the localized Rich Text copy

**Files:**
- Modify: `frontend/src/messages/admin/th.json`
- Modify: `frontend/src/messages/admin/en.json`
- Modify: `frontend/src/messages/admin/de.json`

**Interfaces:**
- Consumes: `useTranslations("Admin.richText")` from the existing `AdminIntlProvider`.
- Produces: identical `Admin.richText` key trees in TH, EN, and DE for Tasks 2–4.

- [ ] **Step 1: Add the failing compile-time call sites before declaring message keys**

  In the planned `RichTextToolbar.tsx` and `RichTextLinkDialog.tsx`, use these exact translation calls. They initially fail at runtime with missing-message errors until this task adds the keys:

  ```ts
  const t = useTranslations("Admin.richText");
  t("toolbar.bold");
  t("linkDialog.invalidUrl");
  ```

- [ ] **Step 2: Confirm the current messages lack the namespace**

  Run: `rg -n '"richText"' frontend/src/messages/admin/{th,en,de}.json`

  Expected: no Rich Text namespace exists.

- [ ] **Step 3: Add an identical key shape to every admin message file**

  Add `richText` directly beneath the existing `Admin` object in all three files. The complete key shape is:

  ```json
  "richText": {
    "placeholder": "…",
    "toolbar": {
      "undo": "…", "redo": "…", "paragraph": "…", "heading2": "…", "heading3": "…",
      "bold": "…", "italic": "…", "strike": "…", "bulletList": "…", "orderedList": "…",
      "blockquote": "…", "divider": "…", "link": "…", "image": "…", "clearFormat": "…",
      "unavailable": "…"
    },
    "blockType": { "paragraph": "…", "heading2": "…", "heading3": "…" },
    "linkDialog": {
      "title": "…", "urlLabel": "…", "urlPlaceholder": "https://example.com",
      "save": "…", "remove": "…", "invalidUrl": "…"
    }
  }
  ```

  Use these user-facing translations for the core toolbar labels:

  ```text
  th: ตัวหนา, ตัวเอียง, ขีดฆ่า, รายการหัวข้อย่อย, รายการลำดับเลข, ลิงก์, รูปภาพ, ล้างรูปแบบ
  en: Bold, Italic, Strikethrough, Bullet list, Numbered list, Link, Image, Clear formatting
  de: Fett, Kursiv, Durchgestrichen, Aufzählung, Nummerierte Liste, Link, Bild, Formatierung löschen
  ```

- [ ] **Step 4: Verify the translation files have matching keys and valid JSON**

  Run:

  ```bash
  node -e "const fs=require('fs'); for (const l of ['th','en','de']) { const x=JSON.parse(fs.readFileSync('frontend/src/messages/admin/'+l+'.json')); if (!x.Admin.richText) throw new Error(l+' missing Admin.richText'); }"
  ```

  Expected: command exits 0.

- [ ] **Step 5: Commit the localized copy**

  ```bash
  git add frontend/src/messages/admin/th.json frontend/src/messages/admin/en.json frontend/src/messages/admin/de.json
  git commit -m "feat: add rich text editor translations"
  ```

### Task 2: Create a validated, localized link dialog

**Files:**
- Create: `frontend/src/components/admin/rich-text/RichTextLinkDialog.tsx`

**Interfaces:**
- Consumes: `Modal`, `Input`, `Button`, and `useTranslations("Admin.richText")`; `isValidRichTextLink(url: string): boolean` declared in this file.
- Produces:

  ```ts
  type RichTextLinkDialogProps = {
    isOpen: boolean;
    initialUrl: string;
    onClose: () => void;
    onSave: (url: string) => void;
    onRemove: () => void;
  };
  export function isValidRichTextLink(url: string): boolean;
  export function RichTextLinkDialog(props: RichTextLinkDialogProps): React.JSX.Element;
  ```

- [ ] **Step 1: Write the failing URL-validation assertions beside the utility**

  Add the following Node test file, using the repository's existing `node:test` pattern:

  `frontend/src/components/admin/rich-text/RichTextLinkDialog.test.ts`

  ```ts
  import assert from "node:assert/strict";
  import test from "node:test";
  import { isValidRichTextLink } from "./RichTextLinkDialog";

  test("isValidRichTextLink accepts http, https, mailto, and internal paths", () => {
    for (const value of ["https://wat.example", "http://wat.example", "mailto:info@wat.example", "/events"]) {
      assert.equal(isValidRichTextLink(value), true);
    }
  });

  test("isValidRichTextLink rejects unsafe and malformed values", () => {
    for (const value of ["", "javascript:alert(1)", "ftp://example.com", "not a url"]) {
      assert.equal(isValidRichTextLink(value), false);
    }
  });
  ```

- [ ] **Step 2: Run the test and confirm it fails before implementation**

  Run: `cd frontend && npx tsx --test src/components/admin/rich-text/RichTextLinkDialog.test.ts`

  Expected: FAIL because the module and exported utility do not exist. If `tsx` is unavailable, do not add a dependency; record the unavailable runner and continue with the TypeScript build verification in Step 4.

- [ ] **Step 3: Implement the dialog and validator**

  Implement the exact protocol guard below, trimming whitespace before validation. It allows internal paths and the same `http`, `https`, and `mailto` schemes accepted by the backend Rich Text validator:

  ```ts
  export function isValidRichTextLink(value: string): boolean {
    const url = value.trim();
    if (url.startsWith("/")) return true;
    try {
      const parsed = new URL(url);
      return ["http:", "https:", "mailto:"].includes(parsed.protocol);
    } catch {
      return false;
    }
  }
  ```

  Build `RichTextLinkDialog` with the existing `Modal`, `Input`, and `Button` components. Reset the local URL/error state from `initialUrl` each time `isOpen` becomes true. On submit, show `t("linkDialog.invalidUrl")` below the field if the value is invalid; otherwise call `onSave(url.trim())`. Render the remove action only when `initialUrl` is non-empty. Cancel and modal close call `onClose` without calling `onSave` or `onRemove`.

- [ ] **Step 4: Verify the validator and type integration**

  Run:

  ```bash
  cd frontend && npx tsx --test src/components/admin/rich-text/RichTextLinkDialog.test.ts
  npm run build
  ```

  Expected: URL tests pass when `tsx` is available; the Next.js build completes without TypeScript errors.

- [ ] **Step 5: Commit the link dialog**

  ```bash
  git add frontend/src/components/admin/rich-text/RichTextLinkDialog.tsx frontend/src/components/admin/rich-text/RichTextLinkDialog.test.ts
  git commit -m "feat: add rich text link dialog"
  ```

### Task 3: Make toolbar commands selection-safe and stateful

**Files:**
- Modify: `frontend/src/components/admin/rich-text/RichTextToolbar.tsx`

**Interfaces:**
- Consumes: `Editor` from `@tiptap/react`, `RichTextLinkDialog`, `MediaPickerDialog`, and `Admin.richText` messages from Tasks 1–2.
- Produces:

  ```ts
  type RichTextToolbarProps = { editor: Editor; disabled?: boolean };
  ```

- [ ] **Step 1: Add the failing interaction checklist to the pull-request verification notes**

  Before changing the toolbar, reproduce in an Event editor: select existing text, click Bold, and observe whether the selected range is retained; then place the caret in a paragraph, activate Bold, type three characters, and observe whether they are bold. Record the current behavior as the failing baseline.

- [ ] **Step 2: Confirm the current toolbar has the two failure sources**

  Run:

  ```bash
  rg -n 'window\.prompt|onMouseDown|disabled=|toggleHeading' frontend/src/components/admin/rich-text/RichTextToolbar.tsx
  ```

  Expected: `window.prompt` exists; no toolbar selection-preserving `onMouseDown` handler exists; headings are separate icon buttons.

- [ ] **Step 3: Introduce a reusable selection-preserving command wrapper**

  Add these helpers inside `RichTextToolbar`:

  ```ts
  type SavedSelection = { from: number; to: number };

  const snapshotSelection = (): SavedSelection => ({
    from: editor.state.selection.from,
    to: editor.state.selection.to,
  });

  const runCommand = (command: () => void) => {
    if (disabled) return;
    command();
  };

  const keepEditorSelection = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };
  ```

  Add `onMouseDown={keepEditorSelection}` to every formatting and insert button. Execute formatting through `editor.chain().focus()` so commands work both for a text range and for the stored mark/block style at a collapsed caret.

- [ ] **Step 4: Replace fixed heading icons with a localized block-type select**

  Render a `<select aria-label={t("toolbar.paragraph")}>` that derives its `value` from `editor.isActive("heading", { level: 2 })` and `{ level: 3 }`. Its options are `paragraph`, `heading2`, and `heading3`; on change run exactly one of:

  ```ts
  editor.chain().focus().setParagraph().run();
  editor.chain().focus().toggleHeading({ level: 2 }).run();
  editor.chain().focus().toggleHeading({ level: 3 }).run();
  ```

  Disable it when `disabled` is true.

- [ ] **Step 5: Wire the link and image commands to saved selections**

  Maintain `pendingSelection: SavedSelection | null` in the toolbar. Before opening either dialog, set it with `snapshotSelection()`. On link save, restore it and set the link:

  ```ts
  editor.chain()
    .focus()
    .setTextSelection(pendingSelection ?? snapshotSelection())
    .extendMarkRange("link")
    .setLink({ href: url })
    .run();
  ```

  On unlink, restore it and call `unsetLink()`. On image selection, restore it and call `setImage({ src: url, alt: "" })`. Clear `pendingSelection` whenever either dialog closes successfully or is cancelled.

- [ ] **Step 6: Apply localized labels, titles, active styles, and disabled states**

  For every toolbar control, use one `toolbarButton` class builder that includes `focus-visible:ring-2`, `disabled:cursor-not-allowed`, `disabled:opacity-40`, and an active background when the corresponding `editor.isActive(...)` is true. Set both:

  ```tsx
  aria-label={t("toolbar.bold")}
  title={t("toolbar.bold")}
  ```

  Use `editor.can()` to disable undo/redo and command controls that cannot run in the current state; when disabled for capability rather than the entire editor, append `t("toolbar.unavailable")` to the `title`.

- [ ] **Step 7: Verify interaction manually and with frontend checks**

  Run: `cd frontend && npm run lint && npm run build`

  Expected: both commands exit 0. Then manually verify Bold, Italic, Strike, both list types, quote, divider, clear formatting, undo/redo, heading select, link save/remove/invalid input, image insertion, and disabled state in the Event editor.

- [ ] **Step 8: Commit the toolbar interaction changes**

  ```bash
  git add frontend/src/components/admin/rich-text/RichTextToolbar.tsx
  git commit -m "fix: make rich text toolbar interactive"
  ```

### Task 4: Make the editor canvas fully focusable and visibly stateful

**Files:**
- Modify: `frontend/src/components/admin/rich-text/RichTextEditor.tsx`
- Modify: `frontend/src/components/admin/rich-text/MultiLangRichText.tsx`

**Interfaces:**
- Consumes: `useEditor`, `EditorContent`, and `useEditorState` from `@tiptap/react`; `RichTextToolbar` from Task 3; `Admin.richText.placeholder` from Task 1.
- Produces: unchanged public `RichTextEditorProps` and `MultiLangRichTextProps` except an optional `placeholder?: string` prop if `MultiLangRichText` needs caller-specific copy.

- [ ] **Step 1: Record the current failing canvas behavior**

  In an empty Event Rich Text field, click in the lower half of the white region, then type. Record that focus appears around only the initial ProseMirror paragraph and that the usable canvas does not visually fill the editor shell.

- [ ] **Step 2: Add live editor state for empty and focus styling**

  In `RichTextEditor`, derive state with `useEditorState` so React rerenders after Tiptap transactions:

  ```ts
  const { isEmpty, isFocused } = useEditorState({
    editor,
    selector: ({ editor }) => ({
      isEmpty: editor.isEmpty,
      isFocused: editor.isFocused,
    }),
  });
  ```

  Guard rendering until `editor` exists if the installed type signature does not accept `null`.

- [ ] **Step 3: Make the complete white surface focus the document**

  Replace the passive padded `div` around `EditorContent` with a relative canvas whose minimum height belongs to both itself and `.ProseMirror`:

  ```tsx
  <div
    className="relative min-h-[180px] cursor-text p-4 [&_.ProseMirror]:min-h-[148px] [&_.ProseMirror]:outline-none"
    onMouseDown={(event) => {
      if (disabled || event.target !== event.currentTarget) return;
      event.preventDefault();
      editor?.commands.focus("end");
    }}
  >
    {isEmpty && !isFocused && <p className="pointer-events-none absolute left-4 top-4 text-sm text-zinc-400">{t("placeholder")}</p>}
    <EditorContent editor={editor} />
  </div>
  ```

  Keep the parent shell as the visual focus owner with a blue/amber ring when `isFocused` is true. Ensure clicking on actual document content remains handled by ProseMirror, while an empty lower canvas focuses the end of the document.

- [ ] **Step 4: Pass disabled state to the toolbar and preserve existing controlled-content synchronization**

  Replace the existing toolbar render with:

  ```tsx
  {editor && <RichTextToolbar editor={editor} disabled={disabled} />}
  ```

  Preserve the `JSON.stringify` comparison and `setContent(value, { emitUpdate: false })` effect so external locale/form changes do not cause an update loop.

- [ ] **Step 5: Keep `MultiLangRichText` focused on locale documents**

  Do not recreate an editor per locale. Continue passing the active `RichTextDocument` and `field.onChange` map updates. If adding a placeholder prop, use the shared translation inside `RichTextEditor` instead so no locale copy or translation function leaks into `MultiLangRichText`.

- [ ] **Step 6: Verify the shared behavior across every consumer category**

  Run: `cd frontend && npm run lint && npm run build`

  Expected: both commands exit 0. Manually check an Event, Monk, and Website CMS Rich Text field: click at the bottom of an empty canvas and type; select text and format it; switch TH/EN/DE and return to confirm documents remain separate; save and reload; disable a field and confirm no toolbar command/dialog opens.

- [ ] **Step 7: Commit the canvas changes**

  ```bash
  git add frontend/src/components/admin/rich-text/RichTextEditor.tsx frontend/src/components/admin/rich-text/MultiLangRichText.tsx
  git commit -m "fix: expand rich text editor canvas"
  ```

### Task 5: Final regression and handoff

**Files:**
- Modify: no source files unless a verification failure requires a focused fix.

**Interfaces:**
- Consumes: Tasks 1–4.
- Produces: verified shared Rich Text authoring behavior with no contract change.

- [ ] **Step 1: Run the complete frontend verification suite**

  Run:

  ```bash
  cd frontend && npm run lint && npm run build
  ```

  Expected: both commands exit 0.

- [ ] **Step 2: Run the manual acceptance matrix**

  Verify each case in TH, EN, and DE:

  1. Empty Event editor: click the lower canvas, type, select text, toggle Bold/Italic/Strike, and clear formatting.
  2. Existing Monk content: change Paragraph/H2/H3, both list types, quote, divider, undo, and redo.
  3. Website CMS section: select text, create a valid HTTPS link, remove it, attempt `javascript:alert(1)` and confirm it remains unchanged, then insert an existing Media Library image at the original selection.
  4. Switch every locale away and back, save, reload, and confirm no locale content has been replaced.
  5. Render a disabled Rich Text field and confirm every toolbar button, select, and dialog trigger is unavailable.

- [ ] **Step 3: Inspect the final diff for scope and data-contract regressions**

  Run:

  ```bash
  git diff HEAD~4..HEAD -- frontend/src/components/admin/rich-text frontend/src/messages/admin
  git status --short
  ```

  Expected: only localized Rich Text UI changes are in the feature commits; unrelated backend edits remain unstaged and untouched.

- [ ] **Step 4: Commit only a focused verification fix if needed**

  If and only if verification reveals a Rich Text regression, add the exact failing files and commit with `fix: resolve rich text editor regression`. Otherwise make no extra commit.

## Plan Self-Review

- Spec coverage: Tasks 1–4 cover full canvas focus, selection preservation, caret formatting, live active states, localized tooltips, link validation/dialog, Media Library insertion, disabled state, dynamic locale preservation, and unchanged JSON/public contracts. Task 5 covers the acceptance matrix.
- Placeholder scan: no incomplete requirements or deferred implementation markers remain.
- Type consistency: `RichTextToolbar` accepts `editor` and optional `disabled`; `RichTextLinkDialog` owns URL validation and receives callbacks; `RichTextEditor` remains the owner of Tiptap lifecycle and controlled value synchronization.
