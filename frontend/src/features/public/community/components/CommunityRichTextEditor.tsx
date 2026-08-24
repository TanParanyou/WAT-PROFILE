"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import { useTranslations } from "next-intl";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Link as LinkIcon,
  List,
  ListOrdered,
  Redo,
  RemoveFormatting,
  Undo,
  Unlink,
} from "lucide-react";
import type { RichTextDocument } from "@/lib/rich-text/document";
import { setEditorContentWithoutHistory } from "@/lib/rich-text/editor-commands";

interface CommunityRichTextEditorProps {
  value: RichTextDocument;
  onChange: (value: RichTextDocument) => void;
  placeholder: string;
  disabled?: boolean;
  error?: string;
  compact?: boolean;
}

const restrictedExtensions = [
  StarterKit.configure({
    heading: false,
    blockquote: false,
    code: false,
    codeBlock: false,
    hardBreak: false,
    horizontalRule: false,
    italic: false,
    strike: false,
  }),
  Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true, protocols: ["https"] }),
];

function isSafeLink(value: string): boolean {
  const trimmed = value.trim();
  return (trimmed.startsWith("/") && !trimmed.startsWith("//")) || /^https:\/\/[^\s]+$/i.test(trimmed);
}

export function CommunityRichTextEditor({
  value,
  onChange,
  placeholder,
  disabled = false,
  error,
  compact = false,
}: CommunityRichTextEditorProps) {
  const t = useTranslations("Community");
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  const [linkError, setLinkError] = useState("");
  const selectionRef = useRef<{ from: number; to: number } | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: restrictedExtensions,
    content: value,
    editable: !disabled,
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getJSON());
    },
  });

  const editorState = useEditorState({
    editor,
    selector: (ctx) => ({
      isEmpty: ctx.editor ? ctx.editor.isEmpty : true,
      isFocused: ctx.editor ? ctx.editor.isFocused : false,
      canUndo: ctx.editor ? ctx.editor.can().undo() : false,
      canRedo: ctx.editor ? ctx.editor.can().redo() : false,
      bold: ctx.editor ? ctx.editor.isActive("bold") : false,
      bulletList: ctx.editor ? ctx.editor.isActive("bulletList") : false,
      orderedList: ctx.editor ? ctx.editor.isActive("orderedList") : false,
      link: ctx.editor ? ctx.editor.isActive("link") : false,
      canToggleBold: ctx.editor ? ctx.editor.can().toggleBold() : false,
      canToggleBulletList: ctx.editor ? ctx.editor.can().toggleBulletList() : false,
      canToggleOrderedList: ctx.editor ? ctx.editor.can().toggleOrderedList() : false,
    }),
  });

  const isEmpty = editorState?.isEmpty ?? true;
  const isFocused = editorState?.isFocused ?? false;

  useEffect(() => {
    if (!editor) return;
    const currentJSONStr = JSON.stringify(editor.getJSON());
    const incomingJSONStr = JSON.stringify(value);
    if (currentJSONStr !== incomingJSONStr) {
      setEditorContentWithoutHistory(editor, value);
    }
  }, [value, editor]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  const openLink = () => {
    if (!editor || disabled) return;
    selectionRef.current = { from: editor.state.selection.from, to: editor.state.selection.to };
    setLinkValue(editor.getAttributes("link").href ?? "");
    setLinkError("");
    setLinkOpen((prev) => !prev);
  };

  const saveLink = () => {
    if (!editor || !isSafeLink(linkValue)) {
      setLinkError(t("linkInvalid"));
      return;
    }
    const selection = selectionRef.current;
    if (selection) {
      editor.chain().focus().setTextSelection(selection).setLink({ href: linkValue.trim() }).run();
    }
    setLinkOpen(false);
    selectionRef.current = null;
  };

  const removeLink = () => {
    if (!editor) return;
    const selection = selectionRef.current;
    if (selection) {
      editor.chain().focus().setTextSelection(selection).unsetLink().run();
    }
    setLinkOpen(false);
    selectionRef.current = null;
  };

  const ringStyle = isFocused
    ? "border-site-focus ring-2 ring-site-focus/30"
    : error
    ? "border-site-danger"
    : "border-site-border hover:border-site-border/80";

  return (
    <div className={`border bg-site-canvas transition-all ${ringStyle}`}>
      {/* Editor Toolbar matching Admin style */}
      {editor && (
        <div className="flex flex-wrap items-center gap-1 border-b border-site-border bg-site-surface/60 p-1.5 sm:p-2">
          {/* Undo / Redo */}
          <ToolbarButton
            label={t("editorUndo")}
            active={false}
            disabled={disabled || !editorState?.canUndo}
            onClick={() => editor.chain().focus().undo().run()}
          >
            <Undo size={15} />
          </ToolbarButton>
          <ToolbarButton
            label={t("editorRedo")}
            active={false}
            disabled={disabled || !editorState?.canRedo}
            onClick={() => editor.chain().focus().redo().run()}
          >
            <Redo size={15} />
          </ToolbarButton>

          <div className="mx-0.5 sm:mx-1 h-4 w-[1px] bg-site-border" aria-hidden="true" />

          {/* Formatting */}
          <ToolbarButton
            label={t("editorBold")}
            active={Boolean(editorState?.bold)}
            disabled={disabled || !editorState?.canToggleBold}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold size={15} />
          </ToolbarButton>
          <ToolbarButton
            label={t("editorBulletList")}
            active={Boolean(editorState?.bulletList)}
            disabled={disabled || !editorState?.canToggleBulletList}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List size={15} />
          </ToolbarButton>
          <ToolbarButton
            label={t("editorOrderedList")}
            active={Boolean(editorState?.orderedList)}
            disabled={disabled || !editorState?.canToggleOrderedList}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered size={15} />
          </ToolbarButton>

          <div className="mx-0.5 sm:mx-1 h-4 w-[1px] bg-site-border" aria-hidden="true" />

          {/* Link & Clear Format */}
          <ToolbarButton
            label={t("editorLink")}
            active={Boolean(editorState?.link) || linkOpen}
            disabled={disabled}
            onClick={openLink}
          >
            <LinkIcon size={15} />
          </ToolbarButton>
          <ToolbarButton
            label={t("editorClearFormat")}
            active={false}
            disabled={disabled}
            onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          >
            <RemoveFormatting size={15} />
          </ToolbarButton>

          {/* Link Expandable Form */}
          {linkOpen && (
            <form
              className="mt-2 flex min-h-10 basis-full flex-wrap items-center gap-2 border-t border-site-border bg-site-surface pt-2"
              onSubmit={(event) => {
                event.preventDefault();
                saveLink();
              }}
            >
              <label htmlFor="community-link-input" className="sr-only">
                {t("editorLink")}
              </label>
              <input
                id="community-link-input"
                value={linkValue}
                onChange={(event) => {
                  setLinkValue(event.target.value);
                  setLinkError("");
                }}
                placeholder="https://example.com"
                className="min-h-9 min-w-44 flex-1 border border-site-border bg-site-canvas px-3 text-xs outline-none focus-visible:border-site-focus focus-visible:ring-2 focus-visible:ring-site-focus/30"
                autoFocus
              />
              <button
                type="submit"
                className="min-h-9 border border-site-border bg-site-action px-3.5 text-xs font-semibold text-site-on-action hover:bg-site-action-hover focus-visible:outline-2 focus-visible:outline-site-focus"
              >
                {t("editorApply")}
              </button>
              {editorState?.link ? (
                <button
                  type="button"
                  className="inline-flex min-h-9 items-center gap-1 border border-site-border bg-site-canvas px-2.5 text-xs font-medium text-site-danger hover:bg-site-surface focus-visible:outline-2 focus-visible:outline-site-focus"
                  onClick={removeLink}
                >
                  <Unlink size={13} />
                  <span>{t("editorRemove")}</span>
                </button>
              ) : null}
              <button
                type="button"
                className="min-h-9 border border-site-border bg-site-canvas px-2.5 text-xs text-site-muted hover:bg-site-surface focus-visible:outline-2 focus-visible:outline-site-focus"
                onClick={() => setLinkOpen(false)}
              >
                {t("cancel")}
              </button>
              {linkError ? <span className="basis-full text-xs font-medium text-site-danger">{linkError}</span> : null}
            </form>
          )}
        </div>
      )}

      {/* Editor Content with Responsive & Compact Mode */}
      <div
        className={`relative cursor-text p-3 sm:p-4 text-sm text-site-foreground sm:text-base ${
          compact
            ? "min-h-[100px] [&_.ProseMirror]:min-h-[80px] text-xs sm:text-sm"
            : "min-h-[140px] sm:min-h-[160px] [&_.ProseMirror]:min-h-[110px] sm:[&_.ProseMirror]:min-h-[128px]"
        } [&_.ProseMirror]:whitespace-pre-wrap [&_.ProseMirror]:outline-none [&_.ProseMirror_p]:my-1.5 [&_.ProseMirror_ul]:my-1.5 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5 [&_.ProseMirror_ol]:my-1.5 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5 [&_.ProseMirror_li]:my-0.5 [&_.ProseMirror_a]:font-medium [&_.ProseMirror_a]:text-site-accent [&_.ProseMirror_a]:underline [&_.ProseMirror_a]:underline-offset-2`}
        onMouseDown={(event) => {
          if (disabled || event.target !== event.currentTarget) return;
          event.preventDefault();
          editor?.commands.focus("end");
        }}
      >
        {isEmpty && !isFocused && (
          <p className="pointer-events-none absolute left-3 sm:left-4 top-3 sm:top-4 text-xs sm:text-sm text-site-muted">
            {placeholder}
          </p>
        )}
        <EditorContent editor={editor} />
      </div>

      {error ? (
        <p className="border-t border-site-border bg-site-danger/5 px-3 sm:px-4 py-2 text-xs font-medium text-site-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`flex size-8 items-center justify-center border transition-colors focus-visible:outline-2 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "border-site-action bg-site-action text-site-on-action"
          : "border-transparent text-site-body hover:border-site-border hover:bg-site-surface hover:text-site-foreground"
      }`}
    >
      {children}
    </button>
  );
}
