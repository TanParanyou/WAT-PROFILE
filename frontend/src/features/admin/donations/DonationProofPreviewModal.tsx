"use client";

import Image from "next/image";
import { useCallback } from "react";
import { Download, ExternalLink, FileText, Loader2, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { useDonationProofPreview } from "@/hooks/useDonationProofPreview";

export type DonationProofPreviewKind = "image" | "pdf";

export interface DonationProofPreviewLabels {
  title: string;
  close: string;
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

interface DonationProofPreviewDrawerProps {
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

export function DonationProofPreviewDrawer({
  isOpen,
  isLoading,
  fileUrl,
  fileName,
  kind,
  error,
  labels,
  onClose,
}: DonationProofPreviewDrawerProps) {
  const {
    scale: imageScale,
    zoomPercent,
    canZoomIn,
    canZoomOut,
    close: resetPreview,
    zoomIn,
    zoomOut,
    resetZoom,
  } = useDonationProofPreview();
  const hasPreview = Boolean(fileUrl && fileName && kind);
  const closeModal = useCallback(() => {
    resetPreview();
    onClose();
  }, [onClose, resetPreview]);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={closeModal}
      title={labels.title}
      description={fileName ?? undefined}
      size="lg"
      closeOnOverlayClick={!isLoading}
      closeLabel={labels.close}
      footer={hasPreview && fileUrl && fileName ? (
        <div className="flex flex-wrap items-center justify-end gap-2">
          {kind === "image" ? (
            <div className="flex flex-wrap items-center justify-end gap-2" role="group" aria-label={labels.zoom}>
              <button type="button" onClick={zoomOut} disabled={!canZoomOut} aria-label={labels.zoomOut} className={actionClassName}><ZoomOut className="h-4 w-4" aria-hidden="true" />{labels.zoomOut}</button>
              <span className="min-w-14 text-center text-sm text-admin-muted" aria-live="polite">{zoomPercent}%</span>
              <button type="button" onClick={zoomIn} disabled={!canZoomIn} aria-label={labels.zoomIn} className={actionClassName}><ZoomIn className="h-4 w-4" aria-hidden="true" />{labels.zoomIn}</button>
              <button type="button" onClick={resetZoom} disabled={!canZoomOut} aria-label={labels.zoomReset} className={actionClassName}><RotateCcw className="h-4 w-4" aria-hidden="true" />{labels.zoomReset}</button>
            </div>
          ) : null}
          <a href={fileUrl} target="_blank" rel="noopener noreferrer" className={actionClassName}>
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            {labels.open}
          </a>
          <a href={fileUrl} download={fileName} className={actionClassName}>
            <Download className="h-4 w-4" aria-hidden="true" />
            {labels.download}
          </a>
        </div>
      ) : null}
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
            <div className="flex min-h-56 items-center justify-center overflow-visible border border-admin-border bg-admin-surface-muted p-3 sm:min-h-96 sm:p-5">
              <Image src={fileUrl} alt={labels.imageAlt} width={1600} height={1200} unoptimized style={{ transform: `scale(${imageScale})` }} className="h-auto w-auto max-w-full origin-center object-contain transition-transform motion-reduce:transition-none" />
            </div>
          ) : (
            <div className="flex min-h-56 flex-col items-center justify-center gap-3 border border-admin-border bg-admin-surface-muted p-6 text-center sm:min-h-96">
              <FileText className="h-14 w-14 text-admin-action" aria-hidden="true" />
              <p className="text-sm font-medium text-admin-body">{labels.pdf}</p>
            </div>
          )}
        </>
      ) : null}
    </Drawer>
  );
}
