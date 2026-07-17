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
        <label className="text-sm font-medium text-zinc-700 flex items-center min-h-[24px]">
          {label}
        </label>
      )}

      {previewSrc ? (
        <div className="relative inline-block group/preview">
          <img
            src={previewSrc}
            alt="Preview"
            className="h-36 w-36 object-cover rounded-lg border border-zinc-200 shadow-sm"
          />
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            className="absolute inset-0 bg-black/40 text-white rounded-lg flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transition-opacity"
            title="ดูภาพขนาดเต็ม"
          >
            <Eye size={20} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors z-10"
            title="ลบรูปภาพ"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex flex-col items-center justify-center w-36 h-36 border-2 border-dashed border-zinc-300 rounded-lg hover:border-amber-500 hover:bg-amber-50/50 transition-all shadow-sm group"
        >
          <Upload size={20} className="text-zinc-400 group-hover:text-amber-600 mb-1 transition-colors" />
          <span className="text-xs text-zinc-500 group-hover:text-amber-700 font-medium">เพิ่มรูปภาพ</span>
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
