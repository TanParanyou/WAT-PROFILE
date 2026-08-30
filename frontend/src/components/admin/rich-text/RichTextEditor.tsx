"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useEditor, EditorContent, useEditorState } from "@tiptap/react";
import { richTextExtensions } from "@/lib/rich-text/extensions";
import type { RichTextDocument } from "@/lib/rich-text/document";
import { setEditorContentWithoutHistory } from "@/lib/rich-text/editor-commands";
import { RichTextToolbar } from "./RichTextToolbar";
import { ImageBubbleMenu } from "./ImageBubbleMenu";
import { useTranslations } from "next-intl";

type RichTextEditorProps = {
  value: RichTextDocument;
  onChange: (value: RichTextDocument) => void;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
  showStats?: boolean;
};

export function RichTextEditor({
  value,
  onChange,
  disabled = false,
  placeholder,
  error,
  showStats = true,
}: RichTextEditorProps) {
  const t = useTranslations("Admin.richText");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: richTextExtensions,
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
      text: ctx.editor ? ctx.editor.getText() : "",
    }),
  });

  const isEmpty = editorState?.isEmpty ?? true;
  const isFocused = editorState?.isFocused ?? false;
  const textContent = editorState?.text ?? "";

  const stats = useMemo(() => {
    const characters = textContent.length;
    const words = textContent.trim() ? textContent.trim().split(/\s+/).length : 0;
    return { characters, words };
  }, [textContent]);

  // Sync external document changes
  useEffect(() => {
    if (!editor) return;
    const currentJSONStr = JSON.stringify(editor.getJSON());
    const incomingJSONStr = JSON.stringify(value);
    if (currentJSONStr !== incomingJSONStr) {
      setEditorContentWithoutHistory(editor, value);
    }
  }, [value, editor]);

  // Sync disabled state
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  // Exit fullscreen on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  const ringStyle = isFocused
    ? "border-admin-focus ring-2 ring-admin-focus/20"
    : error
    ? "border-admin-danger"
    : "border-admin-control-border";

  const containerClasses = isFullscreen
    ? "fixed inset-0 z-50 bg-admin-surface flex flex-col h-screen w-screen overflow-hidden"
    : `border rounded-none overflow-hidden bg-admin-surface transition-all ${ringStyle}`;

  const editorAreaClasses = isFullscreen
    ? "flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full font-sans text-sm text-admin-foreground cursor-text"
    : "relative min-h-[180px] cursor-text p-4 max-h-[550px] overflow-y-auto font-sans text-sm text-admin-foreground";

  return (
    <div className={containerClasses}>
      {editor && (
        <RichTextToolbar
          editor={editor}
          disabled={disabled}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen((prev) => !prev)}
        />
      )}
      {editor && <ImageBubbleMenu editor={editor} />}

      <div
        className={`${editorAreaClasses} [&&_.ProseMirror]:min-h-[148px] [&&_.ProseMirror]:whitespace-pre-wrap [&&_.ProseMirror]:outline-none [&&_.ProseMirror_h1]:text-2xl [&&_.ProseMirror_h1]:font-bold [&&_.ProseMirror_h1]:mt-6 [&&_.ProseMirror_h1]:mb-3 [&&_.ProseMirror_h2]:text-xl [&&_.ProseMirror_h2]:font-bold [&&_.ProseMirror_h2]:mt-6 [&&_.ProseMirror_h2]:mb-3 [&&_.ProseMirror_h3]:text-lg [&&_.ProseMirror_h3]:font-semibold [&&_.ProseMirror_h3]:mt-5 [&&_.ProseMirror_h3]:mb-2 [&&_.ProseMirror_h4]:text-base [&&_.ProseMirror_h4]:font-semibold [&&_.ProseMirror_h4]:mt-4 [&&_.ProseMirror_h4]:mb-2 [&&_.ProseMirror_p]:my-2 [&&_.ProseMirror_p]:leading-relaxed [&&_.ProseMirror_u]:underline [&&_.ProseMirror_u]:underline-offset-2 [&&_.ProseMirror_sub]:text-xs [&&_.ProseMirror_sub]:align-sub [&&_.ProseMirror_sup]:text-xs [&&_.ProseMirror_sup]:align-super [&&_.ProseMirror_mark]:bg-amber-200/80 [&&_.ProseMirror_mark]:px-1 [&&_.ProseMirror_mark]:rounded-none [&&_.ProseMirror_code]:rounded-none [&&_.ProseMirror_code]:bg-admin-surface-muted [&&_.ProseMirror_code]:px-1.5 [&&_.ProseMirror_code]:py-0.5 [&&_.ProseMirror_code]:font-mono [&&_.ProseMirror_code]:text-xs [&&_.ProseMirror_pre]:my-4 [&&_.ProseMirror_pre]:rounded-none [&&_.ProseMirror_pre]:bg-neutral-900 [&&_.ProseMirror_pre]:p-4 [&&_.ProseMirror_pre]:font-mono [&&_.ProseMirror_pre]:text-xs [&&_.ProseMirror_pre]:text-neutral-100 [&&_.ProseMirror_ul]:my-2 [&&_.ProseMirror_ul]:list-disc [&&_.ProseMirror_ul]:pl-6 [&&_.ProseMirror_ol]:my-2 [&&_.ProseMirror_ol]:list-decimal [&&_.ProseMirror_ol]:pl-6 [&&_.ProseMirror_li]:my-1 [&&_.ProseMirror_blockquote]:my-3 [&&_.ProseMirror_blockquote]:border-l-4 [&&_.ProseMirror_blockquote]:border-admin-focus [&&_.ProseMirror_blockquote]:bg-admin-selected [&&_.ProseMirror_blockquote]:px-4 [&&_.ProseMirror_blockquote]:py-2 [&&_.ProseMirror_blockquote]:text-admin-body [&&_.ProseMirror_hr]:my-4 [&&_.ProseMirror_hr]:border-admin-border [&&_.ProseMirror_a]:font-medium [&&_.ProseMirror_a]:text-admin-selected-foreground [&&_.ProseMirror_a]:underline [&&_.ProseMirror_a]:underline-offset-2 [&&_.ProseMirror_img]:cursor-pointer [&&_.ProseMirror_img]:transition-all [&&_.ProseMirror_img.ProseMirror-selectednode]:ring-2 [&&_.ProseMirror_img.ProseMirror-selectednode]:ring-admin-focus [&&_.ProseMirror_img.ProseMirror-selectednode]:ring-offset-2 [&&_.ProseMirror_img.ProseMirror-selectednode]:outline-none [&&_.ProseMirror_img[data-align=left]]:float-left [&&_.ProseMirror_img[data-align=left]]:mr-4 [&&_.ProseMirror_img[data-align=left]]:mb-4 [&&_.ProseMirror_img[data-align=left]]:max-w-[50%] [&&_.ProseMirror_img[data-align=right]]:float-right [&&_.ProseMirror_img[data-align=right]]:ml-4 [&&_.ProseMirror_img[data-align=right]]:mb-4 [&&_.ProseMirror_img[data-align=right]]:max-w-[50%] [&&_.ProseMirror_img[data-align=center]]:mx-auto [&&_.ProseMirror_img[data-align=center]]:block [&&_.ProseMirror_img[data-align=full]]:w-full [&&_.ProseMirror_img[data-align=full]]:block [&&_.ProseMirror_img]:clear-both`}
        onMouseDown={(event) => {
          if (disabled || event.target !== event.currentTarget) return;
          event.preventDefault();
          editor?.commands.focus("end");
        }}
      >
        {isEmpty && !isFocused && (
          <p className="pointer-events-none absolute left-4 top-4 text-sm text-admin-muted">
            {placeholder || t("placeholder")}
          </p>
        )}
        <EditorContent editor={editor} />
      </div>

      {/* Editor Status Footer with Word/Character Count */}
      {showStats && (
        <div className="flex items-center justify-between border-t border-admin-border bg-admin-surface-muted px-3 py-1 text-[11px] text-admin-muted select-none">
          <div className="flex items-center gap-3">
            <span>
              {stats.words} {t("toolbar.words")}
            </span>
            <span>
              {stats.characters} {t("toolbar.characters")}
            </span>
          </div>
          {isFullscreen && (
            <span className="text-[10px] text-admin-muted">
              {t("toolbar.pressEscToExit")}
            </span>
          )}
        </div>
      )}

      {error && <p className="text-xs text-admin-danger px-4 pb-2 pt-1">{error}</p>}
    </div>
  );
}
