"use client";

import React from "react";
import { type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { useTranslations } from "next-intl";

type ImageBubbleMenuProps = {
  editor: Editor;
};

export function ImageBubbleMenu({ editor }: ImageBubbleMenuProps) {
  const t = useTranslations("Admin.richText.toolbar");
  if (!editor) return null;

  const getAlign = () => {
    return editor.getAttributes("image").align || "center";
  };

  const handleAlign = (align: "left" | "center" | "right") => {
    editor.chain().focus().setImageAlign(align).run();
  };

  const buttonClass = (isActive: boolean) =>
    `p-1.5 rounded transition-colors focus-visible:outline-2 focus-visible:outline-admin-focus ${
      isActive ? "bg-admin-selected text-admin-selected-foreground font-bold" : "text-admin-body hover:bg-admin-surface-muted"
    }`;

  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: "bottom" }}
      shouldShow={({ editor }) => editor.isActive("image")}
      className="flex items-center gap-1 bg-admin-surface border border-admin-border rounded-none p-1"
    >
      <button
        type="button"
        onClick={() => handleAlign("left")}
        className={buttonClass(getAlign() === "left")}
        title={t("alignLeft")}
      >
        <AlignLeft size={16} />
      </button>
      <button
        type="button"
        onClick={() => handleAlign("center")}
        className={buttonClass(getAlign() === "center")}
        title={t("alignCenter")}
      >
        <AlignCenter size={16} />
      </button>
      <button
        type="button"
        onClick={() => handleAlign("right")}
        className={buttonClass(getAlign() === "right")}
        title={t("alignRight")}
      >
        <AlignRight size={16} />
      </button>
    </BubbleMenu>
  );
}
