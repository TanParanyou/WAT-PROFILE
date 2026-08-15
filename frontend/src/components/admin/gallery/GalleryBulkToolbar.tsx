"use client";

import React from "react";
import { FolderCheck, Tag, CheckCircle2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { BulkActionToolbar, BulkActionButton } from "@/components/admin/BulkActionToolbar";
import { Icons } from "@/components/ui/Icons";

interface GalleryBulkToolbarProps {
  selectedCount: number;
  onClear: () => void;
  onBulkCategory: () => void;
  onBulkEvent: () => void;
  onBulkActive: () => void;
  onBulkInactive: () => void;
  onBulkDelete: () => void;
}

export function GalleryBulkToolbar({
  selectedCount,
  onClear,
  onBulkCategory,
  onBulkEvent,
  onBulkActive,
  onBulkInactive,
  onBulkDelete,
}: GalleryBulkToolbarProps) {
  const t = useTranslations("Admin");

  return (
    <BulkActionToolbar selectedCount={selectedCount} onClear={onClear}>
      <BulkActionButton
        resource="gallery"
        action="update"
        icon={<FolderCheck size={17} />}
        label={t("gallery.bulkCategory")}
        onClick={onBulkCategory}
      />

      <BulkActionButton
        resource="gallery"
        action="update"
        icon={<Tag size={17} />}
        label={t("gallery.bulkEvent")}
        onClick={onBulkEvent}
      />

      <BulkActionButton
        resource="gallery"
        action="update"
        variant="success"
        icon={<CheckCircle2 size={17} />}
        label={t("gallery.bulkActive")}
        onClick={onBulkActive}
      />

      <BulkActionButton
        resource="gallery"
        action="update"
        variant="muted"
        icon={<XCircle size={17} />}
        label={t("gallery.bulkInactive")}
        onClick={onBulkInactive}
      />

      <BulkActionButton
        resource="gallery"
        action="delete"
        variant="danger"
        icon={<Icons.Delete size={17} />}
        label={t("common.delete")}
        onClick={onBulkDelete}
      />
    </BulkActionToolbar>
  );
}
