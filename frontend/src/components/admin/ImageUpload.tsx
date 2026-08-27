"use client";

import React, { useState, useRef, useCallback } from "react";
import { Upload, X, Eye, Loader2, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { mediaService } from "@/services/mediaService";

import { optimizeImageToWebP } from "@/utils/imageOptimization";

interface ImageUploadProps {
  label?: string;
  value?: string | File;
  onChange: (value: string | File) => void;
  className?: string;
  autoUpload?: boolean; // If true (default), uploads file to server immediately
}

export function ImageUpload({
  label,
  value,
  onChange,
  className = "",
  autoUpload = true,
}: ImageUploadProps) {
  const t = useTranslations("Admin");
  const tCommon = useTranslations("Admin.common");
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setUploadError(null);

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setUploadError(t("gallery.uploadErrors.invalidType") || "กรุณาเลือกไฟล์รูปภาพเท่านั้น");
        return;
      }

      // Validate file size (15MB raw limit, will be compressed)
      if (file.size > 15 * 1024 * 1024) {
        setUploadError(t("gallery.uploadErrors.fileTooLarge") || "ขนาดไฟล์ต้องไม่เกิน 15MB");
        return;
      }

      // Optimize image to WebP in user browser (auto-resize + WebP quality 85%)
      const optResult = await optimizeImageToWebP(file);
      const targetFile = optResult.file;

      // Create instant local preview
      const objectUrl = URL.createObjectURL(targetFile);
      setLocalPreview(objectUrl);

      if (autoUpload) {
        setIsUploading(true);
        try {
          const url = await mediaService.uploadImage(targetFile);
          onChange(url);
          setLocalPreview(null);
        } catch (err: unknown) {
          const message =
            err instanceof Error
              ? err.message
              : t("gallery.uploadErrors.uploadFailed") || "อัปโหลดรูปภาพไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
          setUploadError(message);
        } finally {
          setIsUploading(false);
        }
      } else {
        onChange(targetFile);
      }
    },
    [autoUpload, onChange, t]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleRemove = () => {
    onChange("");
    setLocalPreview(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const previewSrc =
    localPreview || (typeof value === "string" && value.trim() ? value.trim() : "");

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  return (
    <div className={`space-y-2 font-sans ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleInputChange}
        disabled={isUploading}
      />

      {label && (
        <label className="text-sm font-medium text-admin-body flex items-center min-h-[24px]">
          {label}
        </label>
      )}

      {previewSrc ? (
        <div className="relative inline-block group/preview">
          <div className="relative h-36 w-36 overflow-hidden border border-admin-border bg-admin-surface-muted">
            <img
              src={previewSrc}
              alt="Preview"
              className="h-full w-full object-cover rounded-none"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://placehold.co/200x200?text=Invalid+Image";
              }}
            />

            {isUploading && (
              <div className="absolute inset-0 bg-admin-surface/80 flex flex-col items-center justify-center">
                <Loader2 size={24} className="animate-spin text-admin-action" />
                <span className="text-[10px] text-admin-action font-medium mt-1">
                  {tCommon("imageUpload.uploading")}
                </span>
              </div>
            )}
          </div>

          {!isUploading && (
            <>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                className="absolute inset-0 bg-black/40 text-admin-on-action rounded-none flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transition-opacity focus-visible:outline-2 focus-visible:outline-admin-focus"
                title={t("previews.expandImage") || tCommon("view")}
              >
                <Eye size={20} strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="absolute -top-2 -right-2 h-6 w-6 bg-admin-danger hover:brightness-90 text-admin-on-action rounded-none flex items-center justify-center shadow-md transition-colors z-10 focus-visible:outline-2 focus-visible:outline-admin-focus"
                title={tCommon("delete")}
              >
                <X size={14} />
              </button>
            </>
          )}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center w-36 h-36 border-2 border-dashed ${
            isDragging
              ? "border-admin-focus bg-admin-focus/10 ring-2 ring-admin-focus"
              : "border-admin-control-border bg-admin-surface hover:border-admin-focus hover:bg-admin-selected"
          } rounded-none transition-all cursor-pointer group`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center justify-center">
              <Loader2 size={20} className="animate-spin text-admin-action mb-1" />
              <span className="text-[10px] text-admin-action font-medium">{tCommon("imageUpload.uploading")}</span>
            </div>
          ) : (
            <>
              <Upload
                size={20}
                className="text-admin-muted group-hover:text-admin-action mb-1 transition-colors"
              />
              <span className="text-xs text-admin-muted group-hover:text-admin-selected-foreground font-medium text-center px-2">
                {tCommon("imageUpload.clickToUpload")}
              </span>
              <span className="text-[9px] text-admin-muted mt-0.5 text-center px-1">{tCommon("imageUpload.dragAndDrop")}</span>
            </>
          )}
        </div>
      )}

      {uploadError && (
        <p className="text-xs text-admin-danger flex items-center gap-1 mt-1">
          <AlertCircle size={12} />
          <span>{uploadError}</span>
        </p>
      )}

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
