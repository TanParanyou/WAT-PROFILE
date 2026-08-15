"use client";

import React from "react";
import { Eye, Edit3, Copy, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { Icons } from "@/components/ui/Icons";
import type { PermissionAction, PermissionResource } from "@/types/auth";

interface RowActionButtonProps {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  variant?: "default" | "danger";
  resource?: PermissionResource;
  action?: PermissionAction;
}

function RowActionButton({
  icon,
  title,
  onClick,
  variant = "default",
  resource,
  action,
}: RowActionButtonProps) {
  const hoverClass =
    variant === "danger"
      ? "hover:bg-admin-danger-surface hover:text-admin-danger"
      : "hover:bg-admin-surface-muted hover:text-admin-foreground";

  const button = (
    <button
      type="button"
      onClick={onClick}
      className={`p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-none text-admin-muted transition-colors focus-visible:outline-2 focus-visible:outline-admin-focus active:scale-95 ${hoverClass}`}
      title={title}
    >
      {icon}
    </button>
  );

  if (resource && action) {
    return (
      <PermissionGuard resource={resource} action={action}>
        {button}
      </PermissionGuard>
    );
  }

  return button;
}

interface GalleryRowActionsProps {
  onPreview: () => void;
  onEdit: () => void;
  onCopyUrl: () => void;
  onDelete: () => void;
  isCopied?: boolean;
}

export function GalleryRowActions({
  onPreview,
  onEdit,
  onCopyUrl,
  onDelete,
  isCopied,
}: GalleryRowActionsProps) {
  const t = useTranslations("Admin");

  return (
    <div className="flex items-center gap-1">
      <RowActionButton
        icon={<Eye size={16} />}
        title={t("gallery.viewFull")}
        onClick={onPreview}
      />

      <RowActionButton
        resource="gallery"
        action="update"
        icon={<Edit3 size={16} />}
        title={t("gallery.edit")}
        onClick={onEdit}
      />

      <RowActionButton
        icon={
          isCopied ? (
            <Check size={16} className="text-admin-success" />
          ) : (
            <Copy size={16} />
          )
        }
        title={t("gallery.copyUrl")}
        onClick={onCopyUrl}
      />

      <RowActionButton
        resource="gallery"
        action="delete"
        variant="danger"
        icon={<Icons.Delete size={16} />}
        title={t("common.delete")}
        onClick={onDelete}
      />
    </div>
  );
}
