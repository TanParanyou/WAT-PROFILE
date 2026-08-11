"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import {
  isDonationProofImage,
  validateDonationProofMetadata,
  type DonationProofValidationMessages,
} from "./proof-upload";

export interface UseDonationProofUploadOptions {
  onChange: (file: File | undefined) => void;
  validationMessages: DonationProofValidationMessages;
}

export function useDonationProofUpload({ onChange, validationMessages }: UseDonationProofUploadOptions) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const previewUrlRef = useRef<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const updatePreview = useCallback((nextFile: File | undefined) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);

    if (nextFile && isDonationProofImage(nextFile)) {
      const nextPreviewUrl = URL.createObjectURL(nextFile);
      previewUrlRef.current = nextPreviewUrl;
      setPreviewUrl(nextPreviewUrl);
      return;
    }

    previewUrlRef.current = null;
    setPreviewUrl(null);
  }, []);

  const selectFile = useCallback((nextFile: File) => {
    const error = validateDonationProofMetadata(nextFile, validationMessages);
    if (error) {
      setSelectionError(error);
      return;
    }

    setSelectionError(null);
    updatePreview(nextFile);
    onChange(nextFile);
  }, [onChange, updatePreview, validationMessages]);

  const openPicker = useCallback(() => {
    setSelectionError(null);
    inputRef.current?.click();
  }, []);

  const onInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0];
    event.target.value = "";
    if (nextFile) selectFile(nextFile);
  }, [selectFile]);

  const onDragEnter = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepth.current += 1;
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setIsDragging(false);
  }, []);

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const onDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepth.current = 0;
    setIsDragging(false);
    const nextFile = event.dataTransfer.files[0];
    if (nextFile) selectFile(nextFile);
  }, [selectFile]);

  const removeFile = useCallback(() => {
    setSelectionError(null);
    updatePreview(undefined);
    onChange(undefined);
    if (inputRef.current) inputRef.current.value = "";
  }, [onChange, updatePreview]);

  return {
    inputRef,
    isDragging,
    selectionError,
    previewUrl,
    selectFile,
    openPicker,
    onInputChange,
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDrop,
    removeFile,
  };
}
