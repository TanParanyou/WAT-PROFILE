"use client";

import { ImagePlus, Loader2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Account } from "../types";
import { useAvatarUpload } from "../hooks/useAvatarUpload";
import { AccountAvatar } from "./AccountAvatar";
import { AvatarCropDialog } from "./AvatarCropDialog";

interface AvatarUploadProps {
  account: Account;
  onUploaded?: () => void;
}

export function AvatarUpload({ account, onUploaded }: AvatarUploadProps) {
  const t = useTranslations("Account");
  const {
    fileInputRef,
    cropSource,
    clientError,
    uploadError,
    isUploading,
    openFilePicker,
    handleFileChange,
    cancelCrop,
    applyCrop: applyCropInternal,
  } = useAvatarUpload();

  const applyCrop = async (file: File) => {
    await applyCropInternal(file);
    onUploaded?.();
  };

  const error = clientError ?? uploadError;
  return (
    <div className="border border-site-border bg-site-surface p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <AccountAvatar account={account} size="xl" alt={t("account.avatarAlt")} />
        <div className="min-w-0 space-y-2">
          <div>
            <h3 className="font-heading text-base font-bold text-site-foreground">
              {t("account.avatarTitle")}
            </h3>
            <p className="mt-1 text-sm text-site-muted">{t("account.avatarDescription")}</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleFileChange}
            className="sr-only"
            disabled={isUploading}
          />
          <button
            type="button"
            onClick={openFilePicker}
            disabled={isUploading}
            className="inline-flex min-h-11 items-center justify-center gap-2 border border-site-border bg-site-canvas px-4 py-2.5 font-semibold text-site-foreground transition-colors hover:bg-site-canvas focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUploading ? (
              <Loader2 className="size-5 animate-spin motion-reduce:animate-none" aria-hidden />
            ) : (
              <ImagePlus className="size-5" aria-hidden />
            )}
            {isUploading ? t("account.avatarUploading") : t("account.avatarChoose")}
          </button>
        </div>
      </div>

      <p className="mt-4 flex items-start gap-2 text-xs text-site-muted">
        <Upload className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>{t("account.avatarFormats")}</span>
      </p>

      {error ? (
        <p role="alert" className="mt-3 border border-red-700 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {cropSource ? (
        <AvatarCropDialog
          imageSrc={cropSource}
          isOpen
          isUploading={isUploading}
          onClose={cancelCrop}
          onApply={applyCrop}
        />
      ) : null}
    </div>
  );
}
