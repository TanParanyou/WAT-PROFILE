import type { Editor } from "@tiptap/core";
import type { RichTextDocument } from "./document";

export type BlockType =
  | "paragraph"
  | "heading1"
  | "heading2"
  | "heading3"
  | "heading4"
  | "blockquote"
  | "codeBlock";

export type RichTextToolbarState = {
  canUndo: boolean;
  canRedo: boolean;
  blockType: BlockType;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  code: boolean;
  codeBlock: boolean;
  subscript: boolean;
  superscript: boolean;
  bulletList: boolean;
  orderedList: boolean;
  blockquote: boolean;
  link: boolean;
  alignLeft: boolean;
  alignCenter: boolean;
  alignRight: boolean;
  alignJustify: boolean;
  textColor: string | null;
  highlight: string | null;
  fontSize: string;
};

export function getRichTextToolbarState(editor: Editor): RichTextToolbarState {
  let blockType: BlockType = "paragraph";

  if (editor.isActive("heading", { level: 1 })) {
    blockType = "heading1";
  } else if (editor.isActive("heading", { level: 2 })) {
    blockType = "heading2";
  } else if (editor.isActive("heading", { level: 3 })) {
    blockType = "heading3";
  } else if (editor.isActive("heading", { level: 4 })) {
    blockType = "heading4";
  } else if (editor.isActive("codeBlock")) {
    blockType = "codeBlock";
  } else if (editor.isActive("blockquote")) {
    blockType = "blockquote";
  }

  const textStyleAttrs = editor.getAttributes("textStyle");
  const highlightAttrs = editor.getAttributes("highlight");

  return {
    canUndo: editor.can().undo(),
    canRedo: editor.can().redo(),
    blockType,
    bold: editor.isActive("bold"),
    italic: editor.isActive("italic"),
    underline: editor.isActive("underline"),
    strike: editor.isActive("strike"),
    code: editor.isActive("code"),
    codeBlock: editor.isActive("codeBlock"),
    subscript: editor.isActive("subscript"),
    superscript: editor.isActive("superscript"),
    bulletList: editor.isActive("bulletList"),
    orderedList: editor.isActive("orderedList"),
    blockquote: editor.isActive("blockquote"),
    link: editor.isActive("link"),
    alignLeft: editor.isActive({ textAlign: "left" }),
    alignCenter: editor.isActive({ textAlign: "center" }),
    alignRight: editor.isActive({ textAlign: "right" }),
    alignJustify: editor.isActive({ textAlign: "justify" }),
    textColor: textStyleAttrs?.color || null,
    highlight: highlightAttrs?.color || null,
    fontSize: textStyleAttrs?.fontSize || "default",
  };
}

export function setBlockType(editor: Editor, type: BlockType): void {
  const chain = editor.chain().focus();

  if (type === "heading1") {
    chain.clearNodes().setHeading({ level: 1 }).run();
  } else if (type === "heading2") {
    chain.clearNodes().setHeading({ level: 2 }).run();
  } else if (type === "heading3") {
    chain.clearNodes().setHeading({ level: 3 }).run();
  } else if (type === "heading4") {
    chain.clearNodes().setHeading({ level: 4 }).run();
  } else if (type === "codeBlock") {
    chain.clearNodes().setCodeBlock().run();
  } else if (type === "blockquote") {
    chain.clearNodes().setBlockquote().run();
  } else {
    chain.clearNodes().setParagraph().run();
  }
}

export function clearAllFormatting(editor: Editor): void {
  editor
    .chain()
    .focus()
    .unsetAllMarks()
    .clearNodes()
    .unsetFontSize()
    .unsetColor()
    .unsetHighlight()
    .unsetTextAlign()
    .run();
}

export function indent(editor: Editor): boolean {
  if (editor.can().sinkListItem("listItem")) {
    return editor.chain().focus().sinkListItem("listItem").run();
  }
  return false;
}

export function outdent(editor: Editor): boolean {
  if (editor.can().liftListItem("listItem")) {
    return editor.chain().focus().liftListItem("listItem").run();
  }
  return false;
}

export function setEditorContentWithoutHistory(editor: Editor, value: RichTextDocument): void {
  const nextDocument = editor.schema.nodeFromJSON(value);
  const transaction = editor.state.tr
    .replaceWith(0, editor.state.doc.content.size, nextDocument.content)
    .setMeta("preventUpdate", true)
    .setMeta("addToHistory", false);

  editor.view.dispatch(transaction);
}
