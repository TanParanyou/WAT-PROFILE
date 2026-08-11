"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { Download, ExternalLink, FileText, Loader2, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

export type DonationProofPreviewKind = "image" | "pdf";

export interface DonationProofPreviewLabels {
  title: string;
  open: string;
  download: string;
  loading: string;
  error: string;
  imageAlt: string;
  pdf: string;
  zoom: string;
  zoomIn: string;
  zoomOut: string;
  zoomReset: string;
}

interface DonationProofPreviewModalProps {
  isOpen: boolean;
  isLoading: boolean;
  fileUrl: string | null;
  fileName: string | null;
  kind: DonationProofPreviewKind | null;
  error: string | null;
  labels: DonationProofPreviewLabels;
  onClose: () => void;
}

const actionClassName = "inline-flex min-h-11 items-center justify-center gap-2 border border-admin-control-border bg-admin-surface px-4 py-2 text-sm font-medium text-admin-body transition-colors hover:bg-admin-surface-muted focus-visible:outline-2 focus-visible:outline-admin-focus";

export function DonationProofPreviewModal({
  isOpen,
  isLoading,
  fileUrl,
  fileName,
  kind,
  error,
  labels,
  onClose,
}: DonationProofPreviewModalProps) {
  const [imageScale, setImageScale] = useState(1);
  const hasPreview = Boolean(fileUrl && fileName && kind);
  const closeModal = useCallback(() => {
    setImageScale(1);
    onClose();
  }, [onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title={labels.title}
      description={fileName ?? undefined}
      size="lg"
      closeOnOverlayClick={!isLoading}
      closeOnEscape={!isLoading}
    >
      {isLoading ? (
        <div role="status" aria-live="polite" className="flex min-h-48 flex-col items-center justify-center gap-3 text-sm text-admin-muted">
          <Loader2 className="h-7 w-7 animate-spin motion-reduce:animate-none text-admin-action" aria-hidden="true" />
          <span>{labels.loading}</span>
        </div>
      ) : error ? (
        <p role="alert" className="border border-admin-danger bg-admin-danger-surface p-4 text-sm text-admin-danger">{error ?? labels.error}</p>
      ) : hasPreview && fileUrl && fileName && kind ? (
        <>
          {kind === "image" ? (
            <div className="flex min-h-56 max-h-[60vh] items-center justify-center overflow-auto border border-admin-border bg-admin-surface-muted p-3 sm:min-h-96 sm:p-5">
              <Image src={fileUrl} alt={labels.imageAlt} width={1600} height={1200} unoptimized style={{ transform: `scale(${imageScale})` }} className="h-auto w-auto max-w-full origin-center object-contain transition-transform motion-reduce:transition-none" />
            </div>
          ) : (
            <div className="flex min-h-56 flex-col items-center justify-center gap-3 border border-admin-border bg-admin-surface-muted p-6 text-center sm:min-h-96">
              <FileText className="h-14 w-14 text-admin-action" aria-hidden="true" />
              <p className="text-sm font-medium text-admin-body">{labels.pdf}</p>
            </div>
          )}
          {kind === "image" ? (
            <div className="mt-3 flex flex-wrap items-center justify-end gap-2" role="group" aria-label={labels.zoom}>
              <button type="button" onClick={() => setImageScale((value) => Math.max(1, value - 0.5))} disabled={imageScale <= 1} aria-label={labels.zoomOut} className={actionClassName}><ZoomOut className="h-4 w-4" aria-hidden="true" />{labels.zoomOut}</button>
              <span className="min-w-14 text-center text-sm text-admin-muted" aria-live="polite">{Math.round(imageScale * 100)}%</span>
              <button type="button" onClick={() => setImageScale((value) => Math.min(3, value + 0.5))} disabled={imageScale >= 3} aria-label={labels.zoomIn} className={actionClassName}><ZoomIn className="h-4 w-4" aria-hidden="true" />{labels.zoomIn}</button>
              <button type="button" onClick={() => setImageScale(1)} disabled={imageScale === 1} aria-label={labels.zoomReset} className={actionClassName}><RotateCcw className="h-4 w-4" aria-hidden="true" />{labels.zoomReset}</button>
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className={actionClassName}>
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              {labels.open}
            </a>
            <a href={fileUrl} download={fileName} className={actionClassName}>
              <Download className="h-4 w-4" aria-hidden="true" />
              {labels.download}
            </a>
          </div>
        </>
      ) : null}
    </Modal>
  );
}
