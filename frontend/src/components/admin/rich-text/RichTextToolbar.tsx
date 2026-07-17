"use client";

import React, { useState } from "react";
import { type Editor } from "@tiptap/react";
import {
  Undo,
  Redo,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Strikethrough,
  RemoveFormatting,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link,
  Image,
} from "lucide-react";
import { MediaPickerDialog } from "../media/MediaPickerDialog";

type RichTextToolbarProps = {
  editor: Editor;
};

export function RichTextToolbar({ editor }: RichTextToolbarProps) {
  const [isMediaOpen, setIsMediaOpen] = useState(false);

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL:", previousUrl);

    // Cancelled
    if (url === null) {
      return;
    }

    // Empty URL = remove link
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    // Set link
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const insertImage = (url: string) => {
    editor.chain().focus().setImage({ src: url, alt: "" }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-zinc-200 bg-zinc-50 p-2">
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="p-1.5 rounded hover:bg-zinc-200 text-zinc-700 disabled:opacity-30"
        title="Undo"
      >
        <Undo size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="p-1.5 rounded hover:bg-zinc-200 text-zinc-700 disabled:opacity-30"
        title="Redo"
      >
        <Redo size={16} />
      </button>

      <div className="w-[1px] h-5 bg-zinc-300 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-1.5 rounded hover:bg-zinc-200 text-zinc-700 ${editor.isActive("heading", { level: 2 }) ? "bg-zinc-200 font-bold" : ""}`}
        title="Heading 2"
      >
        <Heading2 size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`p-1.5 rounded hover:bg-zinc-200 text-zinc-700 ${editor.isActive("heading", { level: 3 }) ? "bg-zinc-200 font-bold" : ""}`}
        title="Heading 3"
      >
        <Heading3 size={16} />
      </button>

      <div className="w-[1px] h-5 bg-zinc-300 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1.5 rounded hover:bg-zinc-200 text-zinc-700 ${editor.isActive("bold") ? "bg-zinc-200 font-bold" : ""}`}
        title="Bold"
      >
        <Bold size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded hover:bg-zinc-200 text-zinc-700 ${editor.isActive("italic") ? "bg-zinc-200 font-bold" : ""}`}
        title="Italic"
      >
        <Italic size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-1.5 rounded hover:bg-zinc-200 text-zinc-700 ${editor.isActive("strike") ? "bg-zinc-200 font-bold" : ""}`}
        title="Strikethrough"
      >
        <Strikethrough size={16} />
      </button>

      <div className="w-[1px] h-5 bg-zinc-300 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded hover:bg-zinc-200 text-zinc-700 ${editor.isActive("bulletList") ? "bg-zinc-200 font-bold" : ""}`}
        title="Bullet List"
      >
        <List size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded hover:bg-zinc-200 text-zinc-700 ${editor.isActive("orderedList") ? "bg-zinc-200 font-bold" : ""}`}
        title="Ordered List"
      >
        <ListOrdered size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-1.5 rounded hover:bg-zinc-200 text-zinc-700 ${editor.isActive("blockquote") ? "bg-zinc-200 font-bold" : ""}`}
        title="Blockquote"
      >
        <Quote size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className="p-1.5 rounded hover:bg-zinc-200 text-zinc-700"
        title="Horizontal Rule"
      >
        <Minus size={16} />
      </button>

      <div className="w-[1px] h-5 bg-zinc-300 mx-1" />

      <button
        type="button"
        onClick={setLink}
        className={`p-1.5 rounded hover:bg-zinc-200 text-zinc-700 ${editor.isActive("link") ? "bg-zinc-200 font-bold" : ""}`}
        title="Link"
      >
        <Link size={16} />
      </button>
      <button
        type="button"
        onClick={() => setIsMediaOpen(true)}
        className="p-1.5 rounded hover:bg-zinc-200 text-zinc-700"
        title="Image"
      >
        <Image size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        className="p-1.5 rounded hover:bg-zinc-200 text-zinc-700"
        title="Clear Format"
      >
        <RemoveFormatting size={16} />
      </button>

      <MediaPickerDialog
        isOpen={isMediaOpen}
        onClose={() => setIsMediaOpen(false)}
        onSelect={insertImage}
      />
    </div>
  );
}
