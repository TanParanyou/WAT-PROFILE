"use client";

import { useState, useCallback, useRef } from "react";
import { mediaService } from "@/services/mediaService";

export interface UseImagePreviewOptions {
  value?: string;
  onChange?: (url: string) => void;
  defaultValue?: string;
  maxSizeBytes?: number; // default 5MB
  allowedTypes?: string[]; // default ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  onUploadSuccess?: (url: string) => void;
  onUploadError?: (error: string) => void;
}

const DEFAULT_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB

export function useImagePreview(options?: UseImagePreviewOptions) {
  const {
    value: controlledValue,
    onChange,
    defaultValue = "",
    maxSizeBytes = DEFAULT_MAX_SIZE,
    allowedTypes = DEFAULT_ALLOWED_TYPES,
    onUploadSuccess,
    onUploadError,
  } = options || {};

  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState<string>(defaultValue);
  const rawUrl = isControlled ? controlledValue : internalValue;
  const currentUrl = (rawUrl || "").trim();

  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const [erroredUrl, setErroredUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasLoadError = Boolean(currentUrl && erroredUrl === currentUrl);
  const hasError = Boolean(hasLoadError || uploadError);
  const isLoading = Boolean(
    isUploading || (currentUrl && loadedUrl !== currentUrl && erroredUrl !== currentUrl)
  );
  const isValid = Boolean(currentUrl && !hasLoadError && !uploadError);

  const setUrl = useCallback(
    (newUrl: string) => {
      setUploadError(null);
      if (!isControlled) {
        setInternalValue(newUrl);
      }
      onChange?.(newUrl);
    },
    [isControlled, onChange]
  );

  const triggerFilePicker = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  }, []);

  const handleFileSelect = useCallback(
    async (file: File): Promise<string | null> => {
      setUploadError(null);

      // Validate file type
      if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
        const err = "Only image files (JPG, PNG, WebP, GIF) are supported";
        setUploadError(err);
        onUploadError?.(err);
        return null;
      }

      // Validate file size
      if (file.size > maxSizeBytes) {
        const sizeMb = Math.round(maxSizeBytes / (1024 * 1024));
        const err = `File size exceeds ${sizeMb}MB limit`;
        setUploadError(err);
        onUploadError?.(err);
        return null;
      }

      setIsUploading(true);
      try {
        const uploadedUrl = await mediaService.uploadImage(file);
        setUrl(uploadedUrl);
        setLoadedUrl(uploadedUrl);
        setErroredUrl(null);
        onUploadSuccess?.(uploadedUrl);
        return uploadedUrl;
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Image upload failed. Please verify storage configuration.";
        setUploadError(message);
        onUploadError?.(message);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [allowedTypes, maxSizeBytes, setUrl, onUploadSuccess, onUploadError]
  );

  const handleFileInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        await handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        await handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            await handleFileSelect(file);
            break;
          }
        }
      }
    },
    [handleFileSelect]
  );

  const handleImageLoad = useCallback(() => {
    setLoadedUrl(currentUrl);
    setErroredUrl(null);
  }, [currentUrl]);

  const handleImageError = useCallback(() => {
    setErroredUrl(currentUrl);
    setLoadedUrl(null);
  }, [currentUrl]);

  const handleClear = useCallback(() => {
    setUrl("");
    setLoadedUrl(null);
    setErroredUrl(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [setUrl]);

  const handleCopyUrl = useCallback(async () => {
    if (!currentUrl) return false;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(currentUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [currentUrl]);

  const openLightbox = useCallback(() => {
    if (currentUrl && !hasLoadError) {
      setIsLightboxOpen(true);
    }
  }, [currentUrl, hasLoadError]);

  const closeLightbox = useCallback(() => {
    setIsLightboxOpen(false);
  }, []);

  return {
    url: rawUrl,
    previewSrc: currentUrl,
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
    handleFileSelect,
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
  };
}
