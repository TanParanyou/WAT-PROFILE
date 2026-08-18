"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/Modal";
import { Loading } from "@/components/ui/Loading";
import { AlertTriangle } from "lucide-react";

interface SafetyReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "default";
  isLoading?: boolean;
  minReasonLength?: number;
}

export function SafetyReasonModal(props: SafetyReasonModalProps) {
  if (!props.isOpen) return null;
  return <SafetyReasonModalContent {...props} />;
}

function SafetyReasonModalContent({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  variant = "danger",
  isLoading = false,
  minReasonLength = 2,
}: SafetyReasonModalProps) {
  const t = useTranslations("Admin.community");
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);

  const isReasonValid = reason.trim().length >= minReasonLength;
  const isDanger = variant === "danger";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!isReasonValid || isLoading) return;
    await onConfirm(reason.trim());
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? () => undefined : onClose}
      size="md"
      title={title}
      description={description}
      showCloseButton={!isLoading}
      closeOnOverlayClick={!isLoading}
      closeOnEscape={!isLoading}
      footer={
        <div className="flex w-full items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="min-h-11 border border-admin-control-border bg-admin-surface px-4 py-2 text-sm font-medium text-admin-body hover:bg-admin-surface-muted disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-admin-focus"
          >
            {cancelText ?? t("cancel")}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !isReasonValid}
            className={`flex min-h-11 items-center justify-center gap-2 px-5 py-2 text-sm font-medium text-admin-on-action disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-admin-focus ${
              isDanger
                ? "bg-admin-danger hover:brightness-95"
                : "bg-admin-action hover:brightness-95"
            }`}
          >
            {isLoading ? <Loading size="sm" /> : confirmText ?? t("confirm")}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start gap-3 border border-admin-border bg-admin-surface-muted p-3">
          <AlertTriangle
            className={`mt-0.5 size-5 shrink-0 ${
              isDanger ? "text-admin-danger" : "text-admin-warning"
            }`}
          />
          <p className="text-xs text-admin-muted">
            {t("reasonPlaceholder")}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-admin-foreground">
            {t("reason")} <span className="text-admin-danger">*</span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              onBlur={() => setTouched(true)}
              rows={3}
              maxLength={2000}
              placeholder={t("reasonPlaceholder")}
              disabled={isLoading}
              className="mt-1.5 w-full border border-admin-border bg-admin-canvas px-3 py-2 text-sm text-admin-foreground placeholder:text-admin-muted focus-visible:outline-2 focus-visible:outline-admin-focus"
            />
          </label>
          {touched && !isReasonValid ? (
            <p className="mt-1 text-xs text-admin-danger">
              {t("reason")}
            </p>
          ) : null}
        </div>
      </form>
    </Modal>
  );
}
