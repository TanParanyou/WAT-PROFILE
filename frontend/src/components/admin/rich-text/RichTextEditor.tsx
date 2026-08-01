"use client";

import React, { useEffect } from "react";
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
};

export function RichTextEditor({
  value,
  onChange,
  disabled = false,
  placeholder,
  error,
}: RichTextEditorProps) {
  const t = useTranslations("Admin.richText");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: richTextExtensions,
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
  });

  const editorState = useEditorState({
    editor,
    selector: (ctx) => ({
      isEmpty: ctx.editor ? ctx.editor.isEmpty : true,
      isFocused: ctx.editor ? ctx.editor.isFocused : false,
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

  // Sync disabled state
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  const ringStyle = isFocused
    ? "border-admin-focus ring-2 ring-admin-focus/20"
    : error
    ? "border-admin-danger"
    : "border-admin-control-border";

  return (
    <div className={`border rounded-none overflow-hidden bg-admin-surface transition-all ${ringStyle}`}>
      {editor && <RichTextToolbar editor={editor} disabled={disabled} />}
      {editor && <ImageBubbleMenu editor={editor} />}
      
      <div
        className="relative min-h-[180px] cursor-text p-4 max-h-[500px] overflow-y-auto font-sans text-sm text-admin-foreground [&_.ProseMirror]:min-h-[148px] [&_.ProseMirror]:whitespace-pre-wrap [&_.ProseMirror]:outline-none [&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:mt-6 [&_.ProseMirror_h2]:mb-4 [&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_h3]:mt-5 [&_.ProseMirror_h3]:mb-3 [&_.ProseMirror_ul]:my-2 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ol]:my-2 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_li]:my-1 [&_.ProseMirror_blockquote]:my-3 [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-admin-focus [&_.ProseMirror_blockquote]:bg-admin-selected [&_.ProseMirror_blockquote]:px-4 [&_.ProseMirror_blockquote]:py-2 [&_.ProseMirror_blockquote]:text-admin-body [&_.ProseMirror_hr]:my-4 [&_.ProseMirror_hr]:border-admin-border [&_.ProseMirror_a]:font-medium [&_.ProseMirror_a]:text-admin-selected-foreground [&_.ProseMirror_a]:underline [&_.ProseMirror_a]:underline-offset-2 [&_.ProseMirror_img[data-align=left]]:float-left [&_.ProseMirror_img[data-align=left]]:mr-4 [&_.ProseMirror_img[data-align=left]]:mb-4 [&_.ProseMirror_img[data-align=right]]:float-right [&_.ProseMirror_img[data-align=right]]:ml-4 [&_.ProseMirror_img[data-align=right]]:mb-4 [&_.ProseMirror_img[data-align=center]]:mx-auto [&_.ProseMirror_img[data-align=center]]:block [&_.ProseMirror_img]:clear-both"
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
      
      {error && <p className="text-xs text-admin-danger px-4 pb-2">{error}</p>}
    </div>
  );
}
