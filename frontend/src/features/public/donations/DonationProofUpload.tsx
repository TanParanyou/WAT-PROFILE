"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { Download, Eye, ExternalLink, FileText, Image as ImageIcon, RotateCcw, Upload, X, ZoomIn, ZoomOut } from "lucide-react";
import { SiteModal } from "@/components/public/modal";
import {
  DONATION_PROOF_TYPES,
  formatDonationProofSize,
  isDonationProofImage,
} from "./proof-upload";
import { useDonationProofUpload } from "./useDonationProofUpload";

export interface DonationProofUploadMessages {
  hint: string;
  choose: string;
  drop: string;
  replace: string;
  remove: string;
  image: string;
  pdf: string;
  previewAlt: string;
  preview: string;
  open: string;
  download: string;
  zoom: string;
  zoomIn: string;
  zoomOut: string;
  zoomReset: string;
  previewClose: string;
  invalidType: string;
  tooLarge: string;
}

export interface DonationProofUploadProps {
  id: string;
  file: File | undefined;
  error?: string;
  locale: string;
  onChange: (file: File | undefined) => void;
  messages: DonationProofUploadMessages;
}

export function DonationProofUpload({ id, file, error, locale, onChange, messages }: DonationProofUploadProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);
  const {
    inputRef,
    isDragging,
    selectionError,
    previewUrl,
    openPicker,
    onInputChange,
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDrop,
    removeFile,
  } = useDonationProofUpload({
    onChange,
    validationMessages: { invalidType: messages.invalidType, tooLarge: messages.tooLarge },
  });
  const displayError = selectionError ?? error;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const closePreview = useCallback(() => {
    setIsPreviewOpen(false);
    setPreviewScale(1);
  }, []);
  const openPreview = useCallback(() => {
    setPreviewScale(1);
    setIsPreviewOpen(true);
  }, []);
  const imagePreview = Boolean(file && previewUrl && isDonationProofImage(file));
  const previewActionClassName = "inline-flex min-h-11 items-center justify-center gap-2 border border-site-border px-4 py-2 text-sm font-semibold text-site-foreground transition-colors hover:bg-site-canvas focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus";

  return (
    <div
      className={`min-h-[11rem] border bg-site-surface p-4 transition-colors sm:grid sm:grid-cols-[8rem_minmax(0,1fr)] sm:items-center sm:gap-5 ${
        displayError ? "border-site-danger" : "border-site-border"
      } ${isDragging ? "bg-site-surface ring-2 ring-site-focus" : ""}`}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <input
        id={id}
        ref={inputRef}
        name="proof"
        type="file"
        accept={DONATION_PROOF_TYPES.join(",")}
        className="sr-only"
        aria-label={messages.choose}
        onChange={onInputChange}
        aria-invalid={Boolean(displayError)}
        aria-describedby={displayError ? `${hintId} ${errorId}` : hintId}
      />
      <p id={hintId} className="text-xs leading-5 text-site-muted sm:col-span-2">{messages.hint}</p>

      <div className="flex min-h-[8rem] items-center justify-center border border-site-border bg-site-canvas p-3">
        {imagePreview && previewUrl ? (
          <Image src={previewUrl} alt={messages.previewAlt} width={128} height={128} unoptimized className="h-28 w-28 object-contain" />
        ) : file ? (
          <FileText className="size-12 text-site-accent" aria-hidden="true" />
        ) : (
          <ImageIcon className="size-10 text-site-muted" aria-hidden="true" />
        )}
      </div>

      <div className="flex min-w-0 flex-col justify-center gap-3 py-2 sm:py-0">
        {file ? (
          <div className="min-w-0">
            <p aria-live="polite" translate="no" className="break-words text-sm font-semibold text-site-foreground">{file.name}</p>
            <p className="mt-1 text-xs text-site-muted">{file.type === "application/pdf" ? messages.pdf : messages.image} · {formatDonationProofSize(file.size, locale)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {previewUrl ? imagePreview ? <button type="button" aria-haspopup="dialog" onClick={openPreview} className={previewActionClassName}><Eye className="size-4" aria-hidden="true" />{messages.preview}</button> : <a href={previewUrl} target="_blank" rel="noopener noreferrer" className={previewActionClassName}><ExternalLink className="size-4" aria-hidden="true" />{messages.open}</a> : null}
              {previewUrl ? <a href={previewUrl} download={file.name} className={previewActionClassName}><Download className="size-4" aria-hidden="true" />{messages.download}</a> : null}
              <button type="button" onClick={openPicker} className="inline-flex min-h-11 items-center justify-center border border-site-border px-4 py-2 text-sm font-semibold text-site-foreground transition-colors hover:bg-site-canvas focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus">{messages.replace}</button>
              <button type="button" onClick={() => { setIsPreviewOpen(false); removeFile(); }} className="inline-flex min-h-11 items-center justify-center gap-2 border border-site-border px-4 py-2 text-sm font-semibold text-site-foreground transition-colors hover:bg-site-canvas focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus"><X className="size-4" aria-hidden="true" />{messages.remove}</button>
            </div>
          </div>
        ) : (
          <div className="flex min-w-0 flex-col items-start gap-2">
            <button type="button" onClick={openPicker} className="inline-flex min-h-11 items-center justify-center gap-2 bg-site-action px-5 py-3 text-sm font-semibold text-site-on-action transition-colors hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus"><Upload className="size-4" aria-hidden="true" />{messages.choose}</button>
            <p className="text-xs leading-5 text-site-muted">{messages.drop}</p>
          </div>
        )}
      </div>

      <div className="min-h-8 pt-3 sm:col-span-2">
        {displayError ? <p id={errorId} role="alert" className="text-sm text-site-danger">{displayError}</p> : null}
      </div>

      {file && previewUrl && imagePreview ? (
        <SiteModal open={isPreviewOpen} title={messages.preview} description={file.name} onClose={closePreview} closeLabel={messages.previewClose} size="md">
          <div className="flex min-h-[16rem] max-h-[60vh] items-center justify-center overflow-auto border border-site-border bg-site-surface p-3 sm:min-h-[24rem] sm:p-5">
            <Image src={previewUrl} alt={messages.previewAlt} width={1200} height={900} unoptimized style={{ transform: `scale(${previewScale})` }} className="h-auto w-auto max-w-full origin-center object-contain transition-transform motion-reduce:transition-none" />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-end gap-2" role="group" aria-label={messages.zoom}>
            <button type="button" onClick={() => setPreviewScale((value) => Math.max(1, value - 0.5))} disabled={previewScale <= 1} aria-label={messages.zoomOut} className={previewActionClassName}><ZoomOut className="size-4" aria-hidden="true" />{messages.zoomOut}</button>
            <span className="min-w-14 text-center text-sm text-site-muted" aria-live="polite">{Math.round(previewScale * 100)}%</span>
            <button type="button" onClick={() => setPreviewScale((value) => Math.min(3, value + 0.5))} disabled={previewScale >= 3} aria-label={messages.zoomIn} className={previewActionClassName}><ZoomIn className="size-4" aria-hidden="true" />{messages.zoomIn}</button>
            <button type="button" onClick={() => setPreviewScale(1)} disabled={previewScale === 1} aria-label={messages.zoomReset} className={previewActionClassName}><RotateCcw className="size-4" aria-hidden="true" />{messages.zoomReset}</button>
          </div>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <a href={previewUrl} target="_blank" rel="noopener noreferrer" className={previewActionClassName}><ExternalLink className="size-4" aria-hidden="true" />{messages.open}</a>
            <a href={previewUrl} download={file.name} className={previewActionClassName}><Download className="size-4" aria-hidden="true" />{messages.download}</a>
          </div>
        </SiteModal>
      ) : null}
    </div>
  );
}
