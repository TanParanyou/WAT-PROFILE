"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { useTranslations } from "next-intl";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Bold, Link as LinkIcon, List, ListOrdered } from "lucide-react";
import type { RichTextDocument } from "@/lib/rich-text/document";

interface CommunityRichTextEditorProps {
  value: RichTextDocument;
  onChange: (value: RichTextDocument) => void;
  placeholder: string;
  disabled?: boolean;
  error?: string;
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

export function CommunityRichTextEditor({ value, onChange, placeholder, disabled = false, error }: CommunityRichTextEditorProps) {
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
    editorProps: { attributes: { class: "min-h-40 outline-none leading-7 text-site-foreground" } },
    onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getJSON()),
  });

  useEffect(() => {
    if (!editor) return;
    if (JSON.stringify(editor.getJSON()) !== JSON.stringify(value)) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  const openLink = () => {
    if (!editor || disabled) return;
    selectionRef.current = { from: editor.state.selection.from, to: editor.state.selection.to };
    setLinkValue(editor.getAttributes("link").href ?? "");
    setLinkError("");
    setLinkOpen(true);
  };

  const saveLink = () => {
    if (!editor || !isSafeLink(linkValue)) {
      setLinkError(t("linkInvalid"));
      return;
    }
    const selection = selectionRef.current;
    if (selection) editor.chain().focus().setTextSelection(selection).setLink({ href: linkValue.trim() }).run();
    setLinkOpen(false);
    selectionRef.current = null;
  };

  const removeLink = () => {
    if (!editor) return;
    const selection = selectionRef.current;
    if (selection) editor.chain().focus().setTextSelection(selection).unsetLink().run();
    setLinkOpen(false);
    selectionRef.current = null;
  };

  return (
    <div className={`overflow-hidden border bg-site-canvas ${error ? "border-site-danger" : "border-site-border"}`}>
      {editor ? (
        <div className="flex flex-wrap items-center gap-1 border-b border-site-border bg-site-surface p-2">
          <ToolbarButton label={t("editorBold")} active={editor.isActive("bold")} disabled={disabled || !editor.can().toggleBold()} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={16} /></ToolbarButton>
          <ToolbarButton label={t("editorBulletList")} active={editor.isActive("bulletList")} disabled={disabled || !editor.can().toggleBulletList()} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={16} /></ToolbarButton>
          <ToolbarButton label={t("editorOrderedList")} active={editor.isActive("orderedList")} disabled={disabled || !editor.can().toggleOrderedList()} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={16} /></ToolbarButton>
          <ToolbarButton label={t("editorLink")} active={editor.isActive("link")} disabled={disabled} onClick={openLink}><LinkIcon size={16} /></ToolbarButton>
          {linkOpen ? (
            <form className="flex min-h-10 basis-full flex-wrap items-center gap-2 border-t border-site-border pt-2 sm:basis-auto sm:border-0 sm:pt-0" onSubmit={(event) => { event.preventDefault(); saveLink(); }}>
              <label htmlFor="community-link" className="sr-only">{t("editorLink")}</label>
              <input id="community-link" value={linkValue} onChange={(event) => { setLinkValue(event.target.value); setLinkError(""); }} placeholder="https://…" className="min-h-9 min-w-48 border border-site-border bg-site-canvas px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-site-focus/30" autoFocus />
              <button type="submit" className="min-h-9 border border-site-border px-3 text-xs font-semibold hover:bg-site-surface">{t("editorApply")}</button>
              <button type="button" className="min-h-9 px-2 text-xs underline" onClick={removeLink}>{t("editorRemove")}</button>
              {linkError ? <span className="basis-full text-xs text-site-danger">{linkError}</span> : null}
            </form>
          ) : null}
        </div>
      ) : null}
      <div className="relative min-h-48 p-4">
        {!editor?.getText().trim() ? <p className="pointer-events-none absolute left-4 top-4 text-sm text-site-muted">{placeholder}</p> : null}
        <EditorContent editor={editor} />
      </div>
      {error ? <p className="border-t border-site-border px-4 py-2 text-xs text-site-danger" role="alert">{error}</p> : null}
    </div>
  );
}

function ToolbarButton({ label, active, disabled, onClick, children }: { label: string; active: boolean; disabled: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" aria-label={label} title={label} aria-pressed={active} disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={onClick} className={`flex min-h-9 min-w-9 items-center justify-center border border-transparent p-1.5 text-site-body hover:bg-site-canvas hover:text-site-foreground focus-visible:outline-2 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:opacity-40 ${active ? "bg-site-canvas text-site-foreground" : ""}`}>{children}</button>;
}
