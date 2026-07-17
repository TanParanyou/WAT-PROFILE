"use client";

import React, { useEffect } from "react";
import { useEditor, EditorContent, useEditorState } from "@tiptap/react";
import { richTextExtensions } from "@/lib/rich-text/extensions";
import type { RichTextDocument } from "@/lib/rich-text/document";
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

  const { isEmpty, isFocused } = useEditorState({
    editor,
    selector: (ctx) => ({
      isEmpty: ctx.editor ? ctx.editor.isEmpty : true,
      isFocused: ctx.editor ? ctx.editor.isFocused : false,
    }),
  });

  useEffect(() => {
    if (!editor) return;
    const currentJSONStr = JSON.stringify(editor.getJSON());
    const incomingJSONStr = JSON.stringify(value);
    if (currentJSONStr !== incomingJSONStr) {
      editor.commands.setContent(value, { emitUpdate: false });
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
        className="relative min-h-[180px] cursor-text p-4 [&_.ProseMirror]:min-h-[148px] [&_.ProseMirror]:outline-none max-h-[500px] overflow-y-auto prose max-w-none font-sans text-sm text-zinc-900"
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
