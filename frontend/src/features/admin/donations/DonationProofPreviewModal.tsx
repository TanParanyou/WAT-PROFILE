"use client";

import Image from "next/image";
import { Download, ExternalLink, FileText, Loader2 } from "lucide-react";
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
  const hasPreview = Boolean(fileUrl && fileName && kind);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
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
            <div className="flex min-h-56 items-center justify-center border border-admin-border bg-admin-surface-muted p-3 sm:min-h-96">
              <Image src={fileUrl} alt={labels.imageAlt} width={1600} height={1200} unoptimized className="max-h-[60vh] w-auto max-w-full object-contain" />
            </div>
          ) : (
            <div className="flex min-h-56 flex-col items-center justify-center gap-3 border border-admin-border bg-admin-surface-muted p-6 text-center sm:min-h-96">
              <FileText className="h-14 w-14 text-admin-action" aria-hidden="true" />
              <p className="text-sm font-medium text-admin-body">{labels.pdf}</p>
            </div>
          )}
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
