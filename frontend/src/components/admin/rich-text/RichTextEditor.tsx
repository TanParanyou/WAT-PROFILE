"use client";

import React, { useEffect } from "react";
import { useEditor, EditorContent, useEditorState } from "@tiptap/react";
import { richTextExtensions } from "@/lib/rich-text/extensions";
import type { RichTextDocument } from "@/lib/rich-text/document";
import { setEditorContentWithoutHistory } from "@/lib/rich-text/editor-commands";
import { RichTextToolbar } from "./RichTextToolbar";
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
    ? "border-amber-500 ring-2 ring-amber-500/20"
    : error
    ? "border-red-500"
    : "border-zinc-200";

  return (
    <div className={`border rounded-lg overflow-hidden bg-white transition-all ${ringStyle}`}>
      {editor && <RichTextToolbar editor={editor} disabled={disabled} />}
      
      <div
        className="relative min-h-[180px] cursor-text p-4 max-h-[500px] overflow-y-auto font-sans text-sm text-zinc-900 [&_.ProseMirror]:min-h-[148px] [&_.ProseMirror]:outline-none [&_.ProseMirror_ul]:my-2 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ol]:my-2 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_li]:my-1 [&_.ProseMirror_blockquote]:my-3 [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-amber-500 [&_.ProseMirror_blockquote]:bg-amber-50 [&_.ProseMirror_blockquote]:px-4 [&_.ProseMirror_blockquote]:py-2 [&_.ProseMirror_blockquote]:text-zinc-700 [&_.ProseMirror_hr]:my-4 [&_.ProseMirror_hr]:border-zinc-300 [&_.ProseMirror_a]:font-medium [&_.ProseMirror_a]:text-amber-700 [&_.ProseMirror_a]:underline [&_.ProseMirror_a]:underline-offset-2"
        onMouseDown={(event) => {
          if (disabled || event.target !== event.currentTarget) return;
          event.preventDefault();
          editor?.commands.focus("end");
        }}
      >
        {isEmpty && !isFocused && (
          <p className="pointer-events-none absolute left-4 top-4 text-sm text-zinc-400">
            {placeholder || t("placeholder")}
          </p>
        )}
        <EditorContent editor={editor} />
      </div>
      
      {error && <p className="text-xs text-red-500 px-4 pb-2">{error}</p>}
    </div>
  );
}
