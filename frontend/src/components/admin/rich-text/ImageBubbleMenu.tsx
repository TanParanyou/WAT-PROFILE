"use client";

import React, { useState } from "react";
import { type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { NodeSelection } from "@tiptap/pm/state";
import { AlignLeft, AlignCenter, AlignRight, Maximize2, Trash2, Tag } from "lucide-react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type ImageBubbleMenuProps = {
  editor: Editor;
};

export function ImageBubbleMenu({ editor }: ImageBubbleMenuProps) {
  const t = useTranslations("Admin.richText.toolbar");
  const tCommon = useTranslations("Admin.common");
  const [isAltModalOpen, setIsAltModalOpen] = useState(false);
  const [altText, setAltText] = useState("");

  if (!editor) return null;

  const isImageSelection = (currentEditor: Editor) => {
    if (!currentEditor || currentEditor.isDestroyed) return false;
    const { selection } = currentEditor.state;
    if (selection instanceof NodeSelection && selection.node.type.name === "image") {
      return true;
    }
    return currentEditor.isActive("image");
  };

  const getAlign = (): "left" | "center" | "right" | "full" => {
    return (editor.getAttributes("image").align as "left" | "center" | "right" | "full") || "center";
  };

  const handleAlign = (align: "left" | "center" | "right" | "full") => {
    editor.chain().focus().setImageAlign(align).run();
  };

  const handleDeleteImage = () => {
    editor.chain().focus().deleteSelection().run();
  };

  const handleOpenAltModal = () => {
    const currentAlt = editor.getAttributes("image").alt || "";
    setAltText(currentAlt);
    setIsAltModalOpen(true);
  };

  const handleSaveAlt = (e: React.FormEvent) => {
    e.preventDefault();
    editor.chain().focus().updateAttributes("image", { alt: altText.trim() }).run();
    setIsAltModalOpen(false);
  };

  const buttonClass = (isActive: boolean) =>
    `p-1.5 rounded-none transition-colors focus-visible:outline-2 focus-visible:outline-admin-focus ${
      isActive ? "bg-admin-selected text-admin-selected-foreground font-bold" : "text-admin-body hover:bg-admin-surface-muted"
    }`;

  return (
    <>
      <BubbleMenu
        editor={editor}
        options={{
          placement: "bottom",
        }}
        shouldShow={({ editor: currentEditor }) => isImageSelection(currentEditor)}
        className="flex items-center gap-1 bg-admin-surface border border-admin-border rounded-none p-1 shadow-lg z-30"
      >
        <button
          type="button"
          onClick={() => handleAlign("left")}
          className={buttonClass(getAlign() === "left")}
          title={t("alignLeft")}
          aria-label={t("alignLeft")}
        >
          <AlignLeft size={16} />
        </button>
        <button
          type="button"
          onClick={() => handleAlign("center")}
          className={buttonClass(getAlign() === "center")}
          title={t("alignCenter")}
          aria-label={t("alignCenter")}
        >
          <AlignCenter size={16} />
        </button>
        <button
          type="button"
          onClick={() => handleAlign("right")}
          className={buttonClass(getAlign() === "right")}
          title={t("alignRight")}
          aria-label={t("alignRight")}
        >
          <AlignRight size={16} />
        </button>
        <button
          type="button"
          onClick={() => handleAlign("full")}
          className={buttonClass(getAlign() === "full")}
          title={t("alignFull")}
          aria-label={t("alignFull")}
        >
          <Maximize2 size={16} />
        </button>

        <div className="w-[1px] h-4 bg-admin-border mx-0.5" />

        <button
          type="button"
          onClick={handleOpenAltModal}
          className={buttonClass(false)}
          title={t("editAltText")}
          aria-label={t("editAltText")}
        >
          <Tag size={16} />
        </button>
        <button
          type="button"
          onClick={handleDeleteImage}
          className="p-1.5 rounded-none text-admin-danger hover:bg-admin-danger/10 transition-colors focus-visible:outline-2 focus-visible:outline-admin-focus"
          title={t("removeImage")}
          aria-label={t("removeImage")}
        >
          <Trash2 size={16} />
        </button>
      </BubbleMenu>

      <Modal
        isOpen={isAltModalOpen}
        onClose={() => setIsAltModalOpen(false)}
        title={t("editAltText")}
        footer={
          <form onSubmit={handleSaveAlt} className="flex justify-end gap-2 w-full">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAltModalOpen(false)}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              {tCommon("save")}
            </Button>
          </form>
        }
      >
        <div className="space-y-4">
          <Input
            label={t("altTextLabel")}
            placeholder={t("altTextPlaceholder")}
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            autoFocus
          />
        </div>
      </Modal>
    </>
  );
}
