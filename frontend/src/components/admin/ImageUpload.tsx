"use client";

import React, { useState } from "react";
import { Upload, X, Eye } from "lucide-react";
import { useTranslations } from "next-intl";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { MediaPickerDialog } from "./media/MediaPickerDialog";

interface ImageUploadProps {
  label?: string;
  value?: string | File;
  onChange: (value: string | File) => void;
  className?: string;
}

export function ImageUpload({
  label,
  value,
  onChange,
  className = "",
}: ImageUploadProps) {
  const t = useTranslations("Admin");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const handleSelect = (url: string) => {
    onChange(url);
  };

  const handleRemove = () => {
    onChange("");
  };

  const previewSrc = value instanceof File ? "" : value; // Since MediaPickerDialog handles upload, we'll only see URLs now (Files are handled directly to URL inside MediaPickerDialog)

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-admin-body flex items-center min-h-[24px]">
          {label}
        </label>
      )}

      {previewSrc ? (
        <div className="relative inline-block group/preview">
          <img
            src={previewSrc}
            alt="Preview"
            className="h-36 w-36 object-cover rounded-none border border-admin-border"
          />
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            className="absolute inset-0 bg-black/40 text-admin-on-action rounded-none flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transition-opacity focus-visible:outline-2 focus-visible:outline-admin-focus"
            title="ดูภาพขนาดเต็ม"
          >
            <Eye size={20} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 h-6 w-6 bg-admin-danger hover:brightness-90 text-admin-on-action rounded-full flex items-center justify-center shadow-md transition-colors z-10 focus-visible:outline-2 focus-visible:outline-admin-focus"
            title="ลบรูปภาพ"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex flex-col items-center justify-center w-36 h-36 border-2 border-dashed border-admin-control-border rounded-none bg-admin-surface hover:border-admin-focus hover:bg-admin-selected transition-all focus-visible:outline-2 focus-visible:outline-admin-focus group"
        >
          <Upload size={20} className="text-admin-muted group-hover:text-admin-action mb-1 transition-colors" />
          <span className="text-xs text-admin-muted group-hover:text-admin-selected-foreground font-medium">เพิ่มรูปภาพ</span>
        </button>
      )}

      <MediaPickerDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelect}
      />

      {previewSrc && (
        <Lightbox
          open={isLightboxOpen}
          close={() => setIsLightboxOpen(false)}
          slides={[{ src: previewSrc }]}
        />
      )}
    </div>
  );
}
