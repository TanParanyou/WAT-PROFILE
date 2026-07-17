"use client";

import React, { useState } from "react";
import { type Editor, useEditorState } from "@tiptap/react";
import { useTranslations } from "next-intl";
import {
  Undo,
  Redo,
  Bold,
  Italic,
  Strikethrough,
  RemoveFormatting,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link,
  Image as ImageIcon,
} from "lucide-react";
import { MediaPickerDialog } from "../media/MediaPickerDialog";
import { RichTextLinkDialog } from "./RichTextLinkDialog";
import { getRichTextToolbarState } from "@/lib/rich-text/editor-commands";

type RichTextToolbarProps = {
  editor: Editor;
  disabled?: boolean;
};

type SavedSelection = {
  from: number;
  to: number;
};

export function RichTextToolbar({ editor, disabled = false }: RichTextToolbarProps) {
  const t = useTranslations("Admin.richText");
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<SavedSelection | null>(null);
  const toolbarState = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) =>
      currentEditor ? getRichTextToolbarState(currentEditor) : null,
  });

  const snapshotSelection = (): SavedSelection => ({
    from: editor.state.selection.from,
    to: editor.state.selection.to,
  });

  const keepEditorSelection = (event: React.MouseEvent<HTMLButtonElement | HTMLSelectElement>) => {
    event.preventDefault();
  };

  const handleLinkClick = () => {
    if (disabled) return;
    setPendingSelection(snapshotSelection());
    setIsLinkOpen(true);
  };

  const handleLinkSave = (url: string) => {
    setIsLinkOpen(false);
    const selection = pendingSelection ?? snapshotSelection();
    setPendingSelection(null);

    editor
      .chain()
      .focus()
      .setTextSelection(selection)
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  };

  const handleLinkRemove = () => {
    setIsLinkOpen(false);
    const selection = pendingSelection ?? snapshotSelection();
    setPendingSelection(null);

    editor
      .chain()
      .focus()
      .setTextSelection(selection)
      .extendMarkRange("link")
      .unsetLink()
      .run();
  };

  const handleImageClick = () => {
    if (disabled) return;
    setPendingSelection(snapshotSelection());
    setIsMediaOpen(true);
  };

  const insertImage = (url: string) => {
    setIsMediaOpen(false);
    const selection = pendingSelection ?? snapshotSelection();
    setPendingSelection(null);

    editor
      .chain()
      .focus()
      .setTextSelection(selection)
      .setImage({ src: url, alt: "" })
      .run();
  };

  const getBlockType = () => {
    return toolbarState?.blockType ?? "paragraph";
  };

  const handleBlockTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (disabled) return;
    const type = e.target.value;
    const chain = editor.chain().focus();
    
    if (type === "heading2") {
      chain.toggleHeading({ level: 2 }).run();
    } else if (type === "heading3") {
      chain.toggleHeading({ level: 3 }).run();
    } else {
      chain.setParagraph().run();
    }
  };

  const toolbarButtonClass = (isActive = false) => `
    p-1.5 rounded text-zinc-700 transition-colors
    focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500
    disabled:cursor-not-allowed disabled:opacity-40
    ${isActive ? "bg-zinc-200 font-bold" : "hover:bg-zinc-200"}
  `.trim();

  const getTitle = (key: string, isAvailable = true) => {
    if (disabled) return t("toolbar.unavailable");
    if (!isAvailable) {
      return `${t(`toolbar.${key}`)} (${t("toolbar.unavailable")})`;
    }
    return t(`toolbar.${key}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-zinc-200 bg-zinc-50 p-2">
      <button
        type="button"
        onMouseDown={keepEditorSelection}
        onClick={() => !disabled && editor.chain().focus().undo().run()}
        disabled={disabled || !toolbarState?.canUndo}
        className={toolbarButtonClass()}
        title={getTitle("undo", toolbarState?.canUndo)}
        aria-label={t("toolbar.undo")}
      >
        <Undo size={16} />
      </button>
      <button
        type="button"
        onMouseDown={keepEditorSelection}
        onClick={() => !disabled && editor.chain().focus().redo().run()}
        disabled={disabled || !toolbarState?.canRedo}
        className={toolbarButtonClass()}
        title={getTitle("redo", toolbarState?.canRedo)}
        aria-label={t("toolbar.redo")}
      >
        <Redo size={16} />
      </button>

      <div className="w-[1px] h-5 bg-zinc-300 mx-1" />

      <select
        value={getBlockType()}
        onChange={handleBlockTypeChange}
        onMouseDown={keepEditorSelection}
        disabled={disabled}
        className="px-2 py-1 text-xs rounded border border-zinc-300 bg-white text-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label={t("toolbar.paragraph")}
      >
        <option value="paragraph">{t("blockType.paragraph")}</option>
        <option value="heading2">{t("blockType.heading2")}</option>
        <option value="heading3">{t("blockType.heading3")}</option>
      </select>

      <div className="w-[1px] h-5 bg-zinc-300 mx-1" />

      <button
        type="button"
        onMouseDown={keepEditorSelection}
        onClick={() => !disabled && editor.chain().focus().toggleBold().run()}
        disabled={disabled || !editor.can().toggleBold()}
        className={toolbarButtonClass(toolbarState?.bold)}
        title={getTitle("bold", editor.can().toggleBold())}
        aria-label={t("toolbar.bold")}
      >
        <Bold size={16} />
      </button>
      <button
        type="button"
        onMouseDown={keepEditorSelection}
        onClick={() => !disabled && editor.chain().focus().toggleItalic().run()}
        disabled={disabled || !editor.can().toggleItalic()}
        className={toolbarButtonClass(toolbarState?.italic)}
        title={getTitle("italic", editor.can().toggleItalic())}
        aria-label={t("toolbar.italic")}
      >
        <Italic size={16} />
      </button>
      <button
        type="button"
        onMouseDown={keepEditorSelection}
        onClick={() => !disabled && editor.chain().focus().toggleStrike().run()}
        disabled={disabled || !editor.can().toggleStrike()}
        className={toolbarButtonClass(toolbarState?.strike)}
        title={getTitle("strike", editor.can().toggleStrike())}
        aria-label={t("toolbar.strike")}
      >
        <Strikethrough size={16} />
      </button>

      <div className="w-[1px] h-5 bg-zinc-300 mx-1" />

      <button
        type="button"
        onMouseDown={keepEditorSelection}
        onClick={() => !disabled && editor.chain().focus().toggleBulletList().run()}
        disabled={disabled || !editor.can().toggleBulletList()}
        className={toolbarButtonClass(toolbarState?.bulletList)}
        title={getTitle("bulletList", editor.can().toggleBulletList())}
        aria-label={t("toolbar.bulletList")}
      >
        <List size={16} />
      </button>
      <button
        type="button"
        onMouseDown={keepEditorSelection}
        onClick={() => !disabled && editor.chain().focus().toggleOrderedList().run()}
        disabled={disabled || !editor.can().toggleOrderedList()}
        className={toolbarButtonClass(toolbarState?.orderedList)}
        title={getTitle("orderedList", editor.can().toggleOrderedList())}
        aria-label={t("toolbar.orderedList")}
      >
        <ListOrdered size={16} />
      </button>
      <button
        type="button"
        onMouseDown={keepEditorSelection}
        onClick={() => !disabled && editor.chain().focus().toggleBlockquote().run()}
        disabled={disabled || !editor.can().toggleBlockquote()}
        className={toolbarButtonClass(toolbarState?.blockquote)}
        title={getTitle("blockquote", editor.can().toggleBlockquote())}
        aria-label={t("toolbar.blockquote")}
      >
        <Quote size={16} />
      </button>
      <button
        type="button"
        onMouseDown={keepEditorSelection}
        onClick={() => !disabled && editor.chain().focus().setHorizontalRule().run()}
        disabled={disabled || !editor.can().setHorizontalRule()}
        className={toolbarButtonClass()}
        title={getTitle("divider", editor.can().setHorizontalRule())}
        aria-label={t("toolbar.divider")}
      >
        <Minus size={16} />
      </button>

      <div className="w-[1px] h-5 bg-zinc-300 mx-1" />

      <button
        type="button"
        onMouseDown={keepEditorSelection}
        onClick={handleLinkClick}
        disabled={disabled}
        className={toolbarButtonClass(toolbarState?.link)}
        title={getTitle("link")}
        aria-label={t("toolbar.link")}
      >
        <Link size={16} />
      </button>
      <button
        type="button"
        onMouseDown={keepEditorSelection}
        onClick={handleImageClick}
        disabled={disabled}
        className={toolbarButtonClass()}
        title={getTitle("image")}
        aria-label={t("toolbar.image")}
      >
        <ImageIcon size={16} />
      </button>
      <button
        type="button"
        onMouseDown={keepEditorSelection}
        onClick={() => !disabled && editor.chain().focus().unsetAllMarks().clearNodes().run()}
        disabled={disabled}
        className={toolbarButtonClass()}
        title={getTitle("clearFormat")}
        aria-label={t("toolbar.clearFormat")}
      >
        <RemoveFormatting size={16} />
      </button>

      <RichTextLinkDialog
        isOpen={isLinkOpen}
        initialUrl={editor.getAttributes("link").href || ""}
        onClose={() => {
          setIsLinkOpen(false);
          setPendingSelection(null);
        }}
        onSave={handleLinkSave}
        onRemove={handleLinkRemove}
      />

      <MediaPickerDialog
        isOpen={isMediaOpen}
        onClose={() => {
          setIsMediaOpen(false);
          setPendingSelection(null);
        }}
        onSelect={insertImage}
      />
    </div>
  );
}
