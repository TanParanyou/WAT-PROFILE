"use client";

import React, { useState } from "react";
import { X, Eye, Image as ImageIcon } from "lucide-react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { MediaPickerDialog } from "./MediaPickerDialog";

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
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const previewSrc = value?.trim() || "";

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
            className="absolute inset-0 bg-black/40 text-admin-on-action rounded-none flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transition-opacity focus-visible:outline-2 focus-visible:outline-admin-focus"
            title="ดูภาพขนาดเต็ม"
          >
            <Eye size={20} strokeWidth={1.5} />
          </button>
          
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 h-6 w-6 bg-admin-danger hover:brightness-90 text-admin-on-action rounded-none flex items-center justify-center shadow-md transition-colors z-10 focus-visible:outline-2 focus-visible:outline-admin-focus"
            title="ลบรูปภาพ"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div
          onClick={() => setIsPickerOpen(true)}
          className="flex flex-col items-center justify-center w-36 h-36 border-2 border-dashed border-admin-control-border bg-admin-surface hover:border-admin-focus hover:bg-admin-selected rounded-none transition-all cursor-pointer group"
        >
          <ImageIcon
            size={20}
            className="text-admin-muted group-hover:text-admin-action mb-1 transition-colors"
          />
          <span className="text-xs text-admin-muted group-hover:text-admin-selected-foreground font-medium">
            เลือกจากคลังสื่อ
          </span>
        </div>
      )}

      <MediaPickerDialog
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={(url) => onChange(url)}
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
