"use client";

import React, { useState, useRef, useEffect } from "react";
import { type Editor, useEditorState } from "@tiptap/react";
import { useTranslations } from "next-intl";
import {
  Undo,
  Redo,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code as CodeIcon,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  RemoveFormatting,
  List,
  ListOrdered,
  Indent as IndentIcon,
  Outdent as OutdentIcon,
  Quote,
  Minus,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Baseline,
  Highlighter,
  Maximize2,
  Minimize2,
  ChevronDown,
} from "lucide-react";
import { MediaPickerDialog } from "../media/MediaPickerDialog";
import { RichTextLinkDialog } from "./RichTextLinkDialog";
import {
  getRichTextToolbarState,
  setBlockType,
  clearAllFormatting,
  indent,
  outdent,
  type BlockType,
} from "@/lib/rich-text/editor-commands";

type RichTextToolbarProps = {
  editor: Editor;
  disabled?: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
};

type SavedSelection = {
  from: number;
  to: number;
};

const TEXT_COLORS = [
  { key: "default", value: "" },
  { key: "black", value: "#000000" },
  { key: "darkGray", value: "#4B5563" },
  { key: "red", value: "#DC2626" },
  { key: "orange", value: "#EA580C" },
  { key: "amber", value: "#D97706" },
  { key: "green", value: "#16A34A" },
  { key: "blue", value: "#2563EB" },
  { key: "purple", value: "#9333EA" },
];

const HIGHLIGHT_COLORS = [
  { key: "none", value: "" },
  { key: "yellow", value: "#FEF08A" },
  { key: "green", value: "#BBF7D0" },
  { key: "cyan", value: "#BAE6FD" },
  { key: "pink", value: "#FBCFE8" },
  { key: "orange", value: "#FED7AA" },
];

export function RichTextToolbar({
  editor,
  disabled = false,
  isFullscreen = false,
  onToggleFullscreen,
}: RichTextToolbarProps) {
  const t = useTranslations("Admin.richText");
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [isColorMenuOpen, setIsColorMenuOpen] = useState(false);
  const [isHighlightMenuOpen, setIsHighlightMenuOpen] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<SavedSelection | null>(null);

  const colorMenuRef = useRef<HTMLDivElement>(null);
  const highlightMenuRef = useRef<HTMLDivElement>(null);

  const toolbarState = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) =>
      currentEditor ? getRichTextToolbarState(currentEditor) : null,
  });

  // Close color popovers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorMenuRef.current && !colorMenuRef.current.contains(event.target as Node)) {
        setIsColorMenuOpen(false);
      }
      if (highlightMenuRef.current && !highlightMenuRef.current.contains(event.target as Node)) {
        setIsHighlightMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const handleLinkSave = (url: string, openInNewTab: boolean) => {
    setIsLinkOpen(false);
    const selection = pendingSelection ?? snapshotSelection();
    setPendingSelection(null);

    const attributes: { href: string; target?: string; rel?: string } = { href: url };
    if (openInNewTab) {
      attributes.target = "_blank";
      attributes.rel = "noopener noreferrer";
    }

    editor
      .chain()
      .focus()
      .setTextSelection(selection)
      .extendMarkRange("link")
      .setLink(attributes)
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

  const getBlockType = (): BlockType => {
    return toolbarState?.blockType ?? "paragraph";
  };

  const handleBlockTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (disabled) return;
    const type = e.target.value as BlockType;
    setBlockType(editor, type);
  };

  const getFontSize = () => {
    return toolbarState?.fontSize || "default";
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (disabled) return;
    const size = e.target.value;
    if (size === "default") {
      editor.chain().focus().unsetFontSize().run();
    } else {
      editor.chain().focus().setFontSize(size).run();
    }
  };

  const handleColorSelect = (color: string) => {
    setIsColorMenuOpen(false);
    if (!color) {
      editor.chain().focus().unsetColor().run();
    } else {
      editor.chain().focus().setColor(color).run();
    }
  };

  const handleHighlightSelect = (color: string) => {
    setIsHighlightMenuOpen(false);
    if (!color) {
      editor.chain().focus().unsetHighlight().run();
    } else {
      editor.chain().focus().setHighlight({ color }).run();
    }
  };

  const toolbarButtonClass = (isActive = false) => `
    p-1.5 rounded-none text-admin-body transition-colors
    focus-visible:outline-2 focus-visible:outline-admin-focus
    disabled:cursor-not-allowed disabled:opacity-40
    ${isActive ? "bg-admin-selected text-admin-selected-foreground font-bold hover:bg-admin-selected/80" : "hover:bg-admin-border hover:text-admin-foreground"}
  `.trim();

  const getTitle = (key: string, isAvailable = true) => {
    if (disabled) return t("toolbar.unavailable");
    if (!isAvailable) {
      return `${t(`toolbar.${key}`)} (${t("toolbar.unavailable")})`;
    }
    return t(`toolbar.${key}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-admin-border bg-admin-surface-muted p-1.5 sm:p-2 select-none">
      {/* Undo & Redo */}
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

      <div className="w-[1px] h-5 bg-admin-border mx-1" />

      {/* Block Type Dropdown */}
      <select
        value={getBlockType()}
        onChange={handleBlockTypeChange}
        disabled={disabled}
        className="px-2 py-1 text-xs rounded-none border border-admin-control-border bg-admin-surface text-admin-foreground focus-visible:outline-2 focus-visible:outline-admin-focus disabled:cursor-not-allowed disabled:opacity-40"
        aria-label={t("toolbar.paragraph")}
      >
        <option value="paragraph">{t("blockType.paragraph")}</option>
        <option value="heading1">{t("blockType.heading1")}</option>
        <option value="heading2">{t("blockType.heading2")}</option>
        <option value="heading3">{t("blockType.heading3")}</option>
        <option value="heading4">{t("blockType.heading4")}</option>
        <option value="blockquote">{t("blockType.blockquote")}</option>
        <option value="codeBlock">{t("blockType.codeBlock")}</option>
      </select>

      {/* Font Size Dropdown */}
      <select
        value={getFontSize()}
        onChange={handleFontSizeChange}
        disabled={disabled}
        className="px-2 py-1 text-xs rounded-none border border-admin-control-border bg-admin-surface text-admin-foreground focus-visible:outline-2 focus-visible:outline-admin-focus disabled:cursor-not-allowed disabled:opacity-40"
        aria-label={t("toolbar.fontSize")}
      >
        <option value="default">{t("toolbar.size")}</option>
        <option value="12px">12px</option>
        <option value="14px">14px</option>
        <option value="16px">16px</option>
        <option value="18px">18px</option>
        <option value="20px">20px</option>
        <option value="24px">24px</option>
        <option value="30px">30px</option>
        <option value="36px">36px</option>
      </select>

      <div className="w-[1px] h-5 bg-admin-border mx-1" />

      {/* Basic Marks: Bold, Italic, Underline, Strike, Code, Sub, Sup */}
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
        onClick={() => !disabled && editor.chain().focus().toggleUnderline().run()}
        disabled={disabled}
        className={toolbarButtonClass(toolbarState?.underline)}
        title={getTitle("underline")}
        aria-label={t("toolbar.underline")}
      >
        <UnderlineIcon size={16} />
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
      <button
        type="button"
        onMouseDown={keepEditorSelection}
        onClick={() => !disabled && editor.chain().focus().toggleCode().run()}
        disabled={disabled || !editor.can().toggleCode()}
        className={toolbarButtonClass(toolbarState?.code)}
        title={getTitle("code", editor.can().toggleCode())}
        aria-label={t("toolbar.code")}
      >
        <CodeIcon size={16} />
      </button>
      <button
        type="button"
        onMouseDown={keepEditorSelection}
        onClick={() => !disabled && editor.chain().focus().toggleSubscript().run()}
        disabled={disabled}
        className={toolbarButtonClass(toolbarState?.subscript)}
        title={getTitle("subscript")}
        aria-label={t("toolbar.subscript")}
      >
        <SubscriptIcon size={16} />
      </button>
      <button
        type="button"
        onMouseDown={keepEditorSelection}
        onClick={() => !disabled && editor.chain().focus().toggleSuperscript().run()}
        disabled={disabled}
        className={toolbarButtonClass(toolbarState?.superscript)}
        title={getTitle("superscript")}
        aria-label={t("toolbar.superscript")}
      >
        <SuperscriptIcon size={16} />
      </button>

      <div className="w-[1px] h-5 bg-admin-border mx-1" />

      {/* Text Color Picker Dropdown */}
      <div className="relative" ref={colorMenuRef}>
        <button
          type="button"
          onMouseDown={keepEditorSelection}
          onClick={() => !disabled && setIsColorMenuOpen((prev) => !prev)}
          disabled={disabled}
          className={`${toolbarButtonClass(Boolean(toolbarState?.textColor))} flex items-center gap-0.5`}
          title={t("toolbar.textColor")}
          aria-label={t("toolbar.textColor")}
        >
          <Baseline size={16} style={{ color: toolbarState?.textColor || undefined }} />
          <ChevronDown size={10} />
        </button>

        {isColorMenuOpen && (
          <div className="absolute left-0 top-full mt-1 z-30 bg-admin-surface border border-admin-border p-2 shadow-lg rounded-none grid grid-cols-3 gap-1.5 w-36">
            {TEXT_COLORS.map((c) => {
              const label = t(`colors.${c.key}`);
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => handleColorSelect(c.value)}
                  className="flex items-center gap-1.5 p-1 rounded-none text-xs hover:bg-admin-surface-muted text-admin-foreground w-full"
                  title={label}
                >
                  <span
                    className="w-4 h-4 rounded-none border border-admin-control-border inline-block flex-shrink-0"
                    style={{ backgroundColor: c.value || "transparent" }}
                  />
                  <span className="truncate text-[10px]">{label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Highlight Color Picker Dropdown */}
      <div className="relative" ref={highlightMenuRef}>
        <button
          type="button"
          onMouseDown={keepEditorSelection}
          onClick={() => !disabled && setIsHighlightMenuOpen((prev) => !prev)}
          disabled={disabled}
          className={`${toolbarButtonClass(Boolean(toolbarState?.highlight))} flex items-center gap-0.5`}
          title={t("toolbar.highlight")}
          aria-label={t("toolbar.highlight")}
        >
          <Highlighter size={16} style={{ backgroundColor: toolbarState?.highlight || undefined }} />
          <ChevronDown size={10} />
        </button>

        {isHighlightMenuOpen && (
          <div className="absolute left-0 top-full mt-1 z-30 bg-admin-surface border border-admin-border p-2 shadow-lg rounded-none grid grid-cols-2 gap-1.5 w-32">
            {HIGHLIGHT_COLORS.map((c) => {
              const label = t(`colors.${c.key}`);
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => handleHighlightSelect(c.value)}
                  className="flex items-center gap-1.5 p-1 rounded-none text-xs hover:bg-admin-surface-muted text-admin-foreground w-full"
                  title={label}
                >
                  <span
                    className="w-4 h-4 rounded-none border border-admin-control-border inline-block flex-shrink-0"
                    style={{ backgroundColor: c.value || "transparent" }}
                  />
                  <span className="truncate text-[10px]">{label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="w-[1px] h-5 bg-admin-border mx-1" />

      {/* Alignment Buttons */}
      <button
        type="button"
        onMouseDown={keepEditorSelection}
        onClick={() => !disabled && editor.chain().focus().setTextAlign("left").run()}
        disabled={disabled || !editor.can().setTextAlign("left")}
        className={toolbarButtonClass(toolbarState?.alignLeft)}
        title={getTitle("alignLeft", editor.can().setTextAlign("left"))}
        aria-label={t("toolbar.alignLeft")}
      >
        <AlignLeft size={16} />
      </button>
      <button
        type="button"
        onMouseDown={keepEditorSelection}
        onClick={() => !disabled && editor.chain().focus().setTextAlign("center").run()}
        disabled={disabled || !editor.can().setTextAlign("center")}
        className={toolbarButtonClass(toolbarState?.alignCenter)}
        title={getTitle("alignCenter", editor.can().setTextAlign("center"))}
        aria-label={t("toolbar.alignCenter")}
      >
        <AlignCenter size={16} />
      </button>
      <button
        type="button"
        onMouseDown={keepEditorSelection}
        onClick={() => !disabled && editor.chain().focus().setTextAlign("right").run()}
        disabled={disabled || !editor.can().setTextAlign("right")}
        className={toolbarButtonClass(toolbarState?.alignRight)}
        title={getTitle("alignRight", editor.can().setTextAlign("right"))}
        aria-label={t("toolbar.alignRight")}
      >
        <AlignRight size={16} />
      </button>
      <button
        type="button"
        onMouseDown={keepEditorSelection}
        onClick={() => !disabled && editor.chain().focus().setTextAlign("justify").run()}
        disabled={disabled || !editor.can().setTextAlign("justify")}
        className={toolbarButtonClass(toolbarState?.alignJustify)}
        title={getTitle("alignJustify", editor.can().setTextAlign("justify"))}
        aria-label={t("toolbar.alignJustify")}
      >
        <AlignJustify size={16} />
      </button>

      <div className="w-[1px] h-5 bg-admin-border mx-1" />

      {/* Lists & Indentation */}
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
        onClick={() => !disabled && outdent(editor)}
        disabled={disabled || !editor.can().liftListItem("listItem")}
        className={toolbarButtonClass()}
        title={getTitle("outdent", editor.can().liftListItem("listItem"))}
        aria-label={t("toolbar.outdent")}
      >
        <OutdentIcon size={16} />
      </button>
      <button
        type="button"
        onMouseDown={keepEditorSelection}
        onClick={() => !disabled && indent(editor)}
        disabled={disabled || !editor.can().sinkListItem("listItem")}
        className={toolbarButtonClass()}
        title={getTitle("indent", editor.can().sinkListItem("listItem"))}
        aria-label={t("toolbar.indent")}
      >
        <IndentIcon size={16} />
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

      <div className="w-[1px] h-5 bg-admin-border mx-1" />

      {/* Links, Image, Clear Formatting */}
      <button
        type="button"
        onMouseDown={keepEditorSelection}
        onClick={handleLinkClick}
        disabled={disabled}
        className={toolbarButtonClass(toolbarState?.link)}
        title={getTitle("link")}
        aria-label={t("toolbar.link")}
      >
        <LinkIcon size={16} />
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
        onClick={() => !disabled && clearAllFormatting(editor)}
        disabled={disabled}
        className={toolbarButtonClass()}
        title={getTitle("clearFormat")}
        aria-label={t("toolbar.clearFormat")}
      >
        <RemoveFormatting size={16} />
      </button>

      {/* Fullscreen Toggle */}
      {onToggleFullscreen && (
        <>
          <div className="flex-1" />
          <button
            type="button"
            onMouseDown={keepEditorSelection}
            onClick={onToggleFullscreen}
            className={toolbarButtonClass(isFullscreen)}
            title={isFullscreen ? t("toolbar.exitFullscreen") : t("toolbar.fullscreen")}
            aria-label={isFullscreen ? t("toolbar.exitFullscreen") : t("toolbar.fullscreen")}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </>
      )}

      {/* Link Dialog */}
      <RichTextLinkDialog
        isOpen={isLinkOpen}
        initialUrl={editor.getAttributes("link").href || ""}
        initialOpenInNewTab={editor.getAttributes("link").target === "_blank"}
        onClose={() => {
          setIsLinkOpen(false);
          setPendingSelection(null);
        }}
        onSave={handleLinkSave}
        onRemove={handleLinkRemove}
      />

      {/* Media Picker Dialog */}
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
