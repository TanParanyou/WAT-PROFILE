# Rich Text Editor Interaction Design

Date: 2026-07-17
Status: Awaiting written-spec review

## Goal

Make the shared admin Rich Text editor easy and reliable to use across Events, Monks, and Website CMS. Authors must be able to click anywhere in the visible editing canvas, type naturally, select existing text, and apply formatting with the toolbar.

## Scope

This work changes the shared frontend components under `frontend/src/components/admin/rich-text/`. It applies consistently to every existing consumer of `MultiLangRichText` without changing the persisted Tiptap JSON contract, backend validation, migration, or public rendering.

## Interaction Model

- The visible white canvas is one editable surface. Clicking any empty part of it focuses the editor and places the caret at the editable document position.
- The editable document fills the canvas, has the editor's existing minimum height, and shows a localized placeholder when empty.
- Formatting commands work in both standard modes:
  - When text is selected, they transform the selection.
  - When the caret is active, they toggle the stored mark or block style for subsequently typed text.
- Toolbar interaction preserves the current editor selection before issuing a command, so clicking a control does not silently discard the target selection.
- Toolbar controls reflect the active document state after each transaction. The current block is exposed as a Paragraph / Heading 2 / Heading 3 dropdown rather than separate ambiguous heading buttons.
- A disabled editor disables its toolbar and related dialogs.

## Localization and Accessibility

- Every toolbar icon has an accessible label and a localized tooltip derived from the active application locale (TH, EN, and DE).
- The tooltip may include relevant keyboard shortcuts.
- Controls have clear enabled, disabled, hover, and active styles; active formatting is visible without relying on a tooltip.
- Focus styling surrounds the complete editor surface, not only the first empty paragraph.

## Commands and Dialogs

- Retain the supported command set: undo, redo, paragraph/heading, bold, italic, strike, bullet list, ordered list, blockquote, divider, link, image, and clear formatting.
- Replace the browser `window.prompt` link flow with an application dialog containing a localized URL field, save action, unlink action when applicable, and inline validation feedback.
- The image command continues to use the existing Media Library picker. It restores the saved editor selection and inserts the selected image at that location.
- Commands unavailable in the current state are disabled. Their localized tooltip explains why they are unavailable rather than failing silently.

## Component Boundaries

- `RichTextEditor` owns the Tiptap instance, document canvas, focus behavior, current selection restoration, disabled state, placeholder, and subscription to transaction state.
- `RichTextToolbar` renders localized controls and delegates commands through a small editor-command interface. It does not own the document value.
- A link-dialog component owns only link input, URL validation display, and submit/cancel actions.
- `MultiLangRichText` remains responsible for locale switching and localized document values. Switching locale must not overwrite another locale's document.

## Error Handling

- Invalid or empty URLs are rejected in the link dialog with localized inline feedback and leave the document unchanged.
- Closing either the link dialog or Media Library makes no document change.
- A failed toolbar command leaves the document unchanged and is surfaced by its disabled state where that state can be known in advance.
- Existing form validation errors remain rendered below the editor.

## Acceptance Criteria

- In every Rich Text field, the entire visible canvas can be clicked to focus and begin typing.
- Selecting text and using each formatting command changes that selection as expected.
- Enabling a mark or block style at the caret formats subsequently entered text; disabling it returns subsequent text to the normal style.
- The toolbar retains the selected range when a command is clicked, and accurately renders active states after typing, selection changes, undo, redo, and locale changes.
- Tooltips and accessible labels appear in Thai, English, or German according to the active application locale.
- The link dialog validates input; image insertion via Media Library occurs at the original caret/selection position.
- Switching TH, EN, and DE retains each locale's independent document; saving and reloading retains all content.
- Disabled fields do not allow toolbar commands or dialogs.

## Verification

Run frontend type/build checks. Manually verify the acceptance criteria in at least one Event form, one Monk form, and one Website CMS Rich Text section in each supported locale.
