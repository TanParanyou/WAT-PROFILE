"use client";

import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { richTextExtensions } from "@/lib/rich-text/extensions";
import type { RichTextDocument } from "@/lib/rich-text/document";
import { RichTextToolbar } from "./RichTextToolbar";

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
  const editor = useEditor({
    immediatelyRender: false,
    extensions: richTextExtensions,
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const currentJSONStr = JSON.stringify(editor.getJSON());
    const incomingJSONStr = JSON.stringify(value);
    if (currentJSONStr !== incomingJSONStr) {
      (editor.commands.setContent as any)(value, false);
    }
  }, [value, editor]);

  // Sync disabled state
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  return (
    <div className={`border rounded-lg overflow-hidden bg-white ${error ? "border-red-500" : "border-zinc-200"}`}>
      {editor && <RichTextToolbar editor={editor} />}
      <div className="p-4 min-h-[180px] font-sans text-sm focus:outline-none max-h-[500px] overflow-y-auto prose max-w-none">
        <EditorContent editor={editor} />
      </div>
      {error && <p className="text-xs text-red-500 px-4 pb-2">{error}</p>}
    </div>
  );
}
