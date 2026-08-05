"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import { toAccountApiError } from "../api";
import { useAccountErrorMessage } from "../hooks";
import { useUploadAccountAvatar } from "../queries";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ACCEPTED_AVATAR_TYPES = new Set(["image/jpeg", "image/png"]);

export function useAvatarUpload() {
  const t = useTranslations("Account");
  const getErrorMessage = useAccountErrorMessage();
  const upload = useUploadAccountAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const replaceObjectUrl = useCallback((file: File) => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const nextUrl = URL.createObjectURL(file);
    objectUrlRef.current = nextUrl;
    setCropSource(nextUrl);
  }, []);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const openFilePicker = useCallback(() => {
    setClientError(null);
    setUploadError(null);
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;

      setClientError(null);
      setUploadError(null);
      if (!ACCEPTED_AVATAR_TYPES.has(file.type)) {
        setClientError(t("account.avatarInvalidType"));
        return;
      }
      if (file.size > MAX_AVATAR_BYTES) {
        setClientError(t("account.avatarTooLarge"));
        return;
      }
      replaceObjectUrl(file);
    },
    [replaceObjectUrl, t],
  );

  const cancelCrop = useCallback(() => {
    setCropSource(null);
    setClientError(null);
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const applyCrop = useCallback(
    async (file: File) => {
      setUploadError(null);
      try {
        await upload.mutateAsync(file);
        cancelCrop();
      } catch (error: unknown) {
        setUploadError(getErrorMessage(toAccountApiError(error)));
        throw error;
      }
    },
    [cancelCrop, getErrorMessage, upload],
  );

  return {
    fileInputRef,
    cropSource,
    clientError,
    uploadError,
    isUploading: upload.isPending,
    openFilePicker,
    handleFileChange,
    cancelCrop,
    applyCrop,
  };
}
