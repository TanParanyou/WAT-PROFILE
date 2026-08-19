"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { Loader2, RotateCcw, RotateCw, X, ZoomIn, ZoomOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { createAvatarFile, type AvatarPixelCrop } from "./avatarCrop";

interface AvatarCropDialogProps {
  imageSrc: string;
  isOpen: boolean;
  isUploading: boolean;
  onClose: () => void;
  onApply: (file: File) => Promise<void>;
}

export function AvatarCropDialog({
  imageSrc,
  isOpen,
  isUploading,
  onClose,
  onApply,
}: AvatarCropDialogProps) {
  const t = useTranslations("Account");
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedArea, setCroppedArea] = useState<AvatarPixelCrop | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedArea(null);
    setError(null);
  }, [imageSrc, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isProcessing && !isUploading) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, isProcessing, isUploading, onClose]);

  const handleCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedArea(pixels);
  }, []);

  const handleApply = async () => {
    if (!croppedArea) return;
    setIsProcessing(true);
    setError(null);
    try {
      const file = await createAvatarFile(imageSrc, croppedArea, rotation);
      await onApply(file);
    } catch {
      setError(t("account.avatarProcessingError"));
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const busy = isProcessing || isUploading;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-3 sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-xl overflow-hidden border border-site-border bg-site-canvas text-site-foreground shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-site-border px-4 py-4 sm:px-6">
          <div>
            <h2 id={titleId} className="font-heading text-lg font-bold">
              {t("account.avatarCropTitle")}
            </h2>
            <p className="mt-1 text-sm text-site-muted">{t("account.avatarCropDescription")}</p>
          </div>
          <button
            type="button"
            ref={closeButtonRef}
            onClick={onClose}
            disabled={busy}
            className="inline-flex min-h-11 min-w-11 items-center justify-center border border-site-border text-site-muted transition-colors hover:bg-site-surface hover:text-site-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={t("account.avatarCancel")}
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-4 sm:p-6">
          <div className="relative h-[min(68vw,360px)] min-h-64 w-full overflow-hidden bg-site-ink">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={handleCropComplete}
            />
          </div>

          <div className="grid gap-3 border border-site-border bg-site-surface p-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <label className="flex items-center gap-3 text-sm text-site-muted" htmlFor="avatar-zoom">
              <ZoomOut className="size-4 shrink-0" aria-hidden />
              <span className="sr-only">{t("account.avatarZoom")}</span>
              <input
                id="avatar-zoom"
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="w-full accent-site-action"
                aria-label={t("account.avatarZoom")}
              />
              <ZoomIn className="size-4 shrink-0" aria-hidden />
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRotation((value) => (value + 270) % 360)}
                disabled={busy}
                className="inline-flex min-h-11 min-w-11 items-center justify-center border border-site-border text-site-foreground hover:bg-site-canvas focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus disabled:opacity-50"
                aria-label={t("account.avatarRotateLeft")}
              >
                <RotateCcw className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setRotation((value) => (value + 90) % 360)}
                disabled={busy}
                className="inline-flex min-h-11 min-w-11 items-center justify-center border border-site-border text-site-foreground hover:bg-site-canvas focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus disabled:opacity-50"
                aria-label={t("account.avatarRotateRight")}
              >
                <RotateCw className="size-4" aria-hidden />
              </button>
            </div>
          </div>

          {error ? (
            <p role="alert" className="border border-red-700 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 border-t border-site-border pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="inline-flex min-h-11 items-center justify-center border border-site-border px-5 py-2.5 font-semibold text-site-foreground hover:bg-site-surface focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus disabled:opacity-50"
            >
              {t("account.avatarCancel")}
            </button>
            <button
              type="button"
              onClick={() => void handleApply()}
              disabled={busy || !croppedArea}
              className="inline-flex min-h-11 items-center justify-center gap-2 bg-site-action px-5 py-2.5 font-semibold text-site-on-action hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? <Loader2 className="size-5 animate-spin motion-reduce:animate-none" aria-hidden /> : null}
              {busy ? t("account.avatarUploading") : t("account.avatarApply")}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
