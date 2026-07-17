"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "next-intl";

type RichTextLinkDialogProps = {
  isOpen: boolean;
  initialUrl: string;
  onClose: () => void;
  onSave: (url: string) => void;
  onRemove: () => void;
};

export function isValidRichTextLink(value: string): boolean {
  const url = value.trim();
  if (url.startsWith("/")) return true;
  try {
    const parsed = new URL(url);
    return ["http:", "https:", "mailto:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function RichTextLinkDialog({
  isOpen,
  initialUrl,
  onClose,
  onSave,
  onRemove,
}: RichTextLinkDialogProps): React.JSX.Element | null {
  if (!isOpen) return null;

  return (
    <RichTextLinkDialogContent
      key={initialUrl}
      initialUrl={initialUrl}
      onClose={onClose}
      onSave={onSave}
      onRemove={onRemove}
    />
  );
}

function RichTextLinkDialogContent({
  isOpen,
  initialUrl,
  onClose,
  onSave,
  onRemove,
}: Omit<RichTextLinkDialogProps, "isOpen"> & { isOpen?: boolean }): React.JSX.Element {
  const t = useTranslations("Admin.richText");
  const tCommon = useTranslations("Admin.common");
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const trimmed = url.trim();
    if (!isValidRichTextLink(trimmed)) {
      setError(t("linkDialog.invalidUrl"));
      return;
    }
    setError("");
    onSave(trimmed);
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
      </div>
    </Modal>
  );
}
