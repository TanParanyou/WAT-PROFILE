"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "next-intl";

type RichTextLinkDialogProps = {
  isOpen: boolean;
  initialUrl: string;
  initialOpenInNewTab?: boolean;
  onClose: () => void;
  onSave: (url: string, openInNewTab: boolean) => void;
  onRemove: () => void;
};

export function isValidRichTextLink(value: string): boolean {
  const url = value.trim();
  if (url.startsWith("/") && !url.startsWith("//")) return true;
  try {
    const parsed = new URL(url);
    return ["http:", "https:", "mailto:", "tel:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function RichTextLinkDialog({
  isOpen,
  initialUrl,
  initialOpenInNewTab = false,
  onClose,
  onSave,
  onRemove,
}: RichTextLinkDialogProps): React.JSX.Element | null {
  if (!isOpen) return null;

  return (
    <RichTextLinkDialogContent
      key={`${initialUrl}-${initialOpenInNewTab}`}
      initialUrl={initialUrl}
      initialOpenInNewTab={initialOpenInNewTab}
      onClose={onClose}
      onSave={onSave}
      onRemove={onRemove}
    />
  );
}

function RichTextLinkDialogContent({
  isOpen,
  initialUrl,
  initialOpenInNewTab = false,
  onClose,
  onSave,
  onRemove,
}: Omit<RichTextLinkDialogProps, "isOpen"> & { isOpen?: boolean }): React.JSX.Element {
  const t = useTranslations("Admin.richText");
  const tCommon = useTranslations("Admin.common");
  const [url, setUrl] = useState(initialUrl);
  const [openInNewTab, setOpenInNewTab] = useState(initialOpenInNewTab);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    let trimmed = url.trim();
    if (!trimmed) {
      setError(t("linkDialog.invalidUrl"));
      return;
    }
    // Auto-prefix https:// if user wrote example.com without protocol and not a path
    if (!trimmed.startsWith("/") && !/^https?:\/\//i.test(trimmed) && !/^(mailto|tel):/i.test(trimmed)) {
      if (trimmed.includes(".") && !trimmed.includes(" ")) {
        trimmed = `https://${trimmed}`;
      }
    }
    if (!isValidRichTextLink(trimmed)) {
      setError(t("linkDialog.invalidUrl"));
      return;
    }
    setError("");
    onSave(trimmed, openInNewTab);
  };

  const footer = (
    <div className="flex w-full items-center justify-between">
      <div>
        {initialUrl && (
          <Button
            type="button"
            variant="danger"
            onClick={onRemove}
          >
            {t("linkDialog.remove")}
          </Button>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
        >
          {tCommon("cancel")}
        </Button>
        <Button
          type="submit"
          variant="primary"
        >
          {t("linkDialog.save")}
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen ?? true}
      onClose={onClose}
      title={t("linkDialog.title")}
      footer={
        <form onSubmit={handleSubmit} className="w-full">
          {footer}
        </form>
      }
    >
      <div className="space-y-4">
        <Input
          label={t("linkDialog.urlLabel")}
          placeholder={t("linkDialog.urlPlaceholder")}
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (error) setError("");
          }}
          error={error}
          autoFocus
        />

        <label className="flex items-center gap-2.5 cursor-pointer text-sm text-admin-body select-none">
          <input
            type="checkbox"
            checked={openInNewTab}
            onChange={(e) => setOpenInNewTab(e.target.checked)}
            className="rounded border-admin-control-border text-admin-action focus:ring-admin-focus"
          />
          <span>{t("linkDialog.openInNewTab")}</span>
        </label>
      </div>
    </Modal>
  );
}
