"use client";

import React from "react";
import { Eye, Edit3, Copy, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { Icons } from "@/components/ui/Icons";
import { AdminTableAction, AdminTableActionGroup } from "@/components/admin/AdminTableAction";

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
    <AdminTableActionGroup>
      <AdminTableAction
        icon={<Eye size={16} />}
        label={t("gallery.viewFull") || "ดูรูปขนาดเต็ม"}
        onClick={onPreview}
      />

      <AdminTableAction
        resource="gallery"
        action="update"
        icon={<Edit3 size={16} />}
        label={t("gallery.edit") || "แก้ไข"}
        onClick={onEdit}
      />

      <AdminTableAction
        icon={
          isCopied ? (
            <Check size={16} className="text-admin-success" />
          ) : (
            <Copy size={16} />
          )
        }
        label={t("gallery.copyUrl") || "คัดลอก URL"}
        onClick={onCopyUrl}
      />

      <AdminTableAction
        resource="gallery"
        action="delete"
        variant="danger"
        icon={<Icons.Delete size={16} />}
        label={t("common.delete") || "ลบ"}
        onClick={onDelete}
      />
    </AdminTableActionGroup>
  );
}
