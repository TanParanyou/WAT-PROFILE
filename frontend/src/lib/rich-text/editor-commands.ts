import type { Editor } from "@tiptap/core";
import type { RichTextDocument } from "./document";

export type RichTextToolbarState = {
  canUndo: boolean;
  canRedo: boolean;
  blockType: "paragraph" | "heading2" | "heading3";
  bold: boolean;
  italic: boolean;
  strike: boolean;
  bulletList: boolean;
  orderedList: boolean;
  blockquote: boolean;
  link: boolean;
};

export function getRichTextToolbarState(editor: Editor): RichTextToolbarState {
  return {
    canUndo: editor.can().undo(),
    canRedo: editor.can().redo(),
    blockType: editor.isActive("heading", { level: 2 })
      ? "heading2"
      : editor.isActive("heading", { level: 3 })
        ? "heading3"
        : "paragraph",
    bold: editor.isActive("bold"),
    italic: editor.isActive("italic"),
    strike: editor.isActive("strike"),
    bulletList: editor.isActive("bulletList"),
    orderedList: editor.isActive("orderedList"),
    blockquote: editor.isActive("blockquote"),
    link: editor.isActive("link"),
  };
}

export function setEditorContentWithoutHistory(editor: Editor, value: RichTextDocument) {
  const nextDocument = editor.schema.nodeFromJSON(value);
  const transaction = editor.state.tr
    .replaceWith(0, editor.state.doc.content.size, nextDocument.content)
    .setMeta("preventUpdate", true)
    .setMeta("addToHistory", false);

  editor.view.dispatch(transaction);
}
