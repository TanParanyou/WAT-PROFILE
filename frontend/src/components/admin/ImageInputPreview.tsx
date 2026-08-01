"use client";

import React from "react";
import {
  Eye,
  Image as ImageIcon,
  X,
  Upload,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { useTranslations } from "next-intl";
import { useImagePreview, UseImagePreviewOptions } from "@/hooks/useImagePreview";

export interface ImageInputPreviewProps extends UseImagePreviewOptions {
  label?: string;
  placeholder?: string;
  error?: string;
  description?: string;
  className?: string;
  variant?: "standard" | "avatar" | "banner";
  disabled?: boolean;
}

export function ImageInputPreview({
  label,
  value,
  onChange,
  defaultValue,
  maxSizeBytes,
  allowedTypes,
  onUploadSuccess,
  onUploadError,
  placeholder,
  error: propError,
  description,
  className = "",
  variant = "standard",
  disabled = false,
}: ImageInputPreviewProps) {
  const t = useTranslations("Admin.imageInput");

  const {
    url,
    previewSrc,
    isValid,
    isLoading,
    isUploading,
    hasError,
    uploadError,
    isCopied,
    isLightboxOpen,
    isDragging,
    fileInputRef,
    triggerFilePicker,
    handleFileInputChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handlePaste,
    setUrl,
    handleImageLoad,
    handleImageError,
    handleClear,
    handleCopyUrl,
    openLightbox,
    closeLightbox,
  } = useImagePreview({
    value,
    onChange,
    defaultValue,
    maxSizeBytes,
    allowedTypes,
    onUploadSuccess,
    onUploadError,
  });

  const displayError = propError || uploadError;
  const inputPlaceholder = placeholder || t("urlPlaceholder");

  // ==========================================
  // 1. AVATAR VARIANT (Optimized for Profile)
  // ==========================================
  if (variant === "avatar") {
    return (
      <div
        className={`space-y-3 font-sans border border-admin-border p-4 bg-admin-surface rounded-none ${className}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onPaste={handlePaste}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileInputChange}
          disabled={disabled || isUploading}
        />

        {label && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <label className="text-sm font-semibold text-admin-foreground flex items-center gap-2">
              <ImageIcon size={16} className="text-admin-muted" />
              {label}
            </label>
            {description && (
              <p className="text-xs text-admin-muted">{description}</p>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Avatar Preview Box */}
          <div
            className={`relative group/avatar h-24 w-24 flex-shrink-0 border ${
              isDragging
                ? "border-admin-focus bg-admin-focus/10 ring-2 ring-admin-focus"
                : displayError
                ? "border-admin-danger bg-admin-surface-muted"
                : "border-admin-border bg-admin-surface-muted"
            } rounded-none overflow-hidden flex items-center justify-center transition-all`}
          >
            {previewSrc ? (
              <>
                <img
                  src={previewSrc}
                  alt="Avatar Preview"
                  className="h-full w-full object-cover rounded-none"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
                {/* Hover overlay with Zoom and Replace actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={openLightbox}
                    className="p-1.5 bg-admin-surface/80 hover:bg-admin-surface text-admin-foreground rounded-none transition-colors"
                    title={t("expand")}
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={triggerFilePicker}
                    disabled={disabled || isUploading}
                    className="p-1.5 bg-admin-surface/80 hover:bg-admin-surface text-admin-foreground rounded-none transition-colors"
                    title={t("replace")}
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              </>
            ) : (
              <div
                onClick={triggerFilePicker}
                className="flex flex-col items-center justify-center p-2 text-center cursor-pointer hover:bg-admin-border/30 w-full h-full transition-colors"
              >
                {isUploading ? (
                  <Loader2 size={20} className="animate-spin text-admin-action" />
                ) : (
                  <>
                    <Upload size={18} className="text-admin-muted mb-1" />
                    <span className="text-[10px] text-admin-muted leading-tight font-medium">
                      {t("chooseFile")}
                    </span>
                  </>
                )}
              </div>
            )}

            {isUploading && (
              <div className="absolute inset-0 bg-admin-surface/80 flex flex-col items-center justify-center">
                <Loader2 size={20} className="animate-spin text-admin-action" />
                <span className="text-[10px] text-admin-action font-medium mt-1">
                  {t("uploading")}
                </span>
              </div>
            )}
          </div>

          {/* Action and Input Controls */}
          <div className="flex-1 w-full space-y-2">
            <div className="flex flex-wrap gap-2 items-center">
              <button
                type="button"
                onClick={triggerFilePicker}
                disabled={disabled || isUploading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-admin-action text-admin-on-action hover:opacity-90 transition-opacity focus-visible:outline-2 focus-visible:outline-admin-focus disabled:opacity-50"
              >
                {isUploading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Upload size={14} />
                )}
                <span>{isUploading ? t("uploading") : t("uploadImage")}</span>
              </button>

              {previewSrc && (
                <>
                  <button
                    type="button"
                    onClick={openLightbox}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-admin-surface-muted text-admin-foreground border border-admin-control-border hover:bg-admin-border transition-colors"
                    title={t("expand")}
                  >
                    <Eye size={13} />
                    <span>{t("expand")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-admin-surface-muted text-admin-foreground border border-admin-control-border hover:bg-admin-border transition-colors"
                    title={t("copyUrl")}
                  >
                    {isCopied ? (
                      <Check size={13} className="text-admin-success" />
                    ) : (
                      <Copy size={13} />
                    )}
                    <span>{isCopied ? t("copied") : t("copyUrl")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={disabled || isUploading}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-admin-surface-muted text-admin-danger border border-admin-control-border hover:bg-admin-danger/10 hover:border-admin-danger transition-colors"
                    title={t("clear")}
                  >
                    <X size={13} />
                    <span>{t("clear")}</span>
                  </button>
                </>
              )}
            </div>

            {/* Direct URL input */}
            <div className="flex gap-2 items-center">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={inputPlaceholder}
                disabled={disabled || isUploading}
                className="min-h-9 flex-1 rounded-none border border-admin-control-border bg-admin-surface px-3 py-1.5 text-xs text-admin-foreground placeholder:text-admin-muted focus-visible:border-admin-focus focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-admin-focus"
              />
            </div>
          </div>
        </div>

        {displayError && (
          <p className="text-xs text-admin-danger flex items-center gap-1">
            <AlertCircle size={13} />
            <span>{displayError}</span>
          </p>
        )}

        {previewSrc && (
          <Lightbox
            open={isLightboxOpen}
            close={closeLightbox}
            slides={[{ src: previewSrc }]}
          />
        )}
      </div>
    );
  }

  // ==========================================
  // 2. BANNER / STANDARD VARIANTS
  // ==========================================
  const isBanner = variant === "banner";

  return (
    <div
      className={`space-y-3 font-sans border border-admin-border p-4 bg-admin-surface rounded-none ${className}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPaste={handlePaste}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileInputChange}
        disabled={disabled || isUploading}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          {label && (
            <label className="text-sm font-semibold text-admin-foreground flex items-center gap-2">
              <ImageIcon size={16} className="text-admin-muted" />
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-admin-muted mt-0.5">{description}</p>
          )}
        </div>

        {/* Direct Upload Button from Device */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={triggerFilePicker}
            disabled={disabled || isUploading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-admin-action text-admin-on-action hover:opacity-90 transition-opacity focus-visible:outline-2 focus-visible:outline-admin-focus disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Upload size={14} />
            )}
            <span>{isUploading ? t("uploading") : t("uploadImage")}</span>
          </button>
        </div>
      </div>

      {/* URL Input Bar with Clear Button */}
      <div className="flex gap-2 items-center">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={inputPlaceholder}
          disabled={disabled || isUploading}
          className="min-h-11 flex-1 rounded-none border border-admin-control-border bg-admin-surface px-3 py-2 text-sm text-admin-foreground placeholder:text-admin-muted focus-visible:border-admin-focus focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-admin-focus"
        />
        {url && (
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled || isUploading}
            className="h-11 px-3 bg-admin-surface-muted border border-admin-control-border text-admin-muted hover:text-admin-danger hover:border-admin-danger transition-colors flex items-center justify-center"
            title={t("clear")}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {displayError && (
        <p className="text-sm text-admin-danger flex items-center gap-1 mt-1">
          <AlertCircle size={14} />
          <span>{displayError}</span>
        </p>
      )}

      {/* Live Image Preview Area with Dropzone */}
      <div className="mt-3 pt-3 border-t border-admin-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-admin-muted uppercase tracking-wider block">
            {t("ready")}
          </span>
          {previewSrc && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyUrl}
                className="inline-flex items-center gap-1 text-xs text-admin-muted hover:text-admin-foreground"
                title={t("copyUrl")}
              >
                {isCopied ? (
                  <Check size={12} className="text-admin-success" />
                ) : (
                  <Copy size={12} />
                )}
                <span>{isCopied ? t("copied") : t("copyUrl")}</span>
              </button>
            </div>
          )}
        </div>

        {previewSrc ? (
          <div
            className={`relative group/preview border ${
              isDragging ? "border-admin-focus ring-2 ring-admin-focus" : "border-admin-border"
            } bg-admin-surface-muted p-1 inline-block w-full max-w-lg`}
          >
            <div
              className={`relative overflow-hidden bg-admin-surface border border-admin-border ${
                isBanner ? "h-48 w-full" : "h-36 w-full sm:w-64"
              }`}
            >
              <img
                src={previewSrc}
                alt="Preview"
                className="h-full w-full object-contain"
                onLoad={handleImageLoad}
                onError={handleImageError}
              />

              {/* Hover actions */}
              <div className="absolute inset-0 bg-admin-action/60 text-admin-on-action flex items-center justify-center gap-3 opacity-0 group-hover/preview:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={openLightbox}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-admin-surface/80 hover:bg-admin-surface text-admin-foreground text-xs font-medium transition-colors"
                  title={t("expand")}
                >
                  <Eye size={14} />
                  <span>{t("expand")}</span>
                </button>
                <button
                  type="button"
                  onClick={triggerFilePicker}
                  disabled={disabled || isUploading}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-admin-surface/80 hover:bg-admin-surface text-admin-foreground text-xs font-medium transition-colors"
                  title={t("replace")}
                >
                  <RefreshCw size={14} />
                  <span>{t("replace")}</span>
                </button>
              </div>
            </div>

            {isUploading && (
              <div className="absolute inset-0 bg-admin-surface/80 flex flex-col items-center justify-center">
                <Loader2 size={24} className="animate-spin text-admin-action" />
                <span className="text-xs text-admin-action font-medium mt-1">
                  {t("uploading")}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div
            onClick={triggerFilePicker}
            className={`flex flex-col items-center justify-center p-6 text-xs text-admin-muted border-2 border-dashed ${
              isDragging
                ? "border-admin-focus bg-admin-focus/10 text-admin-focus"
                : "border-admin-control-border bg-admin-surface-muted hover:border-admin-focus hover:bg-admin-selected"
            } cursor-pointer transition-all`}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 size={24} className="animate-spin text-admin-action" />
                <span className="font-medium text-admin-action">{t("uploading")}</span>
              </div>
            ) : (
              <>
                <Upload size={24} className="text-admin-muted mb-2" />
                <span className="font-medium text-admin-foreground mb-1">
                  {t("dragDropOrClick")}
                </span>
                <span className="text-[11px] text-admin-muted">
                  {t("invalidFileType")} • {t("fileSizeExceeded")}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {previewSrc && (
        <Lightbox
          open={isLightboxOpen}
          close={closeLightbox}
          slides={[{ src: previewSrc }]}
        />
      )}
    </div>
  );
}
