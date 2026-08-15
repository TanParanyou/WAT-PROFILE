"use client";

import React, { useState } from "react";
import { X, Eye, Image as ImageIcon } from "lucide-react";
import { PublicLightboxModal } from "@/components/public/modal";
import { MediaPickerDialog } from "./MediaPickerDialog";
import { classifyMediaSource } from "@/lib/mediaOrigins";
import { useTranslations } from "next-intl";

interface MediaImagePickerProps {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  className?: string;
}

export function MediaImagePicker({
  label,
  value,
  onChange,
  className = "",
}: MediaImagePickerProps) {
  const t = useTranslations("Admin.mediaPicker");
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const previewSrc = value?.trim() || "";
  const isExternal = previewSrc !== "" && classifyMediaSource(previewSrc) === "external";

  return (
    <div className={`space-y-2 font-sans ${className}`}>
      {label && (
        <label className="text-sm font-medium text-admin-body flex items-center min-h-[24px]">
          {label}
        </label>
      )}

      {previewSrc ? (
        <div className="relative inline-block group/preview">
          <div className="relative h-36 w-36 overflow-hidden border border-admin-border bg-admin-surface-muted cursor-pointer" onClick={() => setIsPickerOpen(true)}>
            <img
              src={previewSrc}
              alt="Preview"
              className="h-full w-full object-cover rounded-none"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://placehold.co/200x200?text=Invalid+Image";
              }}
            />
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsLightboxOpen(true);
            }}
            className="absolute bottom-1 right-1 p-1 bg-black/60 hover:bg-black/80 text-white rounded-none opacity-0 group-hover/preview:opacity-100 transition-opacity"
            title={t("viewFullImage") || "ดูรูปขนาดเต็ม"}
            aria-label={t("viewFullImage") || "ดูรูปขนาดเต็ม"}
          >
            <Eye size={14} />
          </button>
          
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-1 right-1 p-1 bg-admin-danger/80 hover:bg-admin-danger text-white rounded-none opacity-0 group-hover/preview:opacity-100 transition-opacity"
            title={t("removeImage") || "ลบรูปภาพ"}
            aria-label={t("removeImage") || "ลบรูปภาพ"}
          >
            <X size={14} />
          </button>
          {isExternal && (
            <div className="mt-1 text-[10px] text-admin-warning">
              {t("externalHostNotice") || "สื่อภายนอก (External Host)"}
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => setIsPickerOpen(true)}
          className="flex flex-col items-center justify-center p-4 border border-dashed border-admin-border bg-admin-surface-muted hover:border-admin-action hover:bg-admin-surface cursor-pointer transition-colors group h-24 w-full"
        >
          <ImageIcon
            size={20}
            className="text-admin-muted group-hover:text-admin-action mb-1 transition-colors"
          />
          <span className="text-xs text-admin-muted group-hover:text-admin-selected-foreground font-medium">
            {t("selectFromMedia") || "เลือกจากคลังสื่อ"}
          </span>
        </div>
      )}

      <MediaPickerDialog
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={(url) => onChange(url)}
      />

      {previewSrc && (
        <PublicLightboxModal
          open={isLightboxOpen}
          initialIndex={0}
          onClose={() => setIsLightboxOpen(false)}
          slides={[{ src: previewSrc, title: label || "Image Preview" }]}
        />
      )}
    </div>
  );
}
