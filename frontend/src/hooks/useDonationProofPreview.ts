"use client";

import { useCallback, useState } from "react";

export interface UseDonationProofPreviewOptions {
  minScale?: number;
  maxScale?: number;
  step?: number;
}

export function useDonationProofPreview({
  minScale = 1,
  maxScale = 3,
  step = 0.5,
}: UseDonationProofPreviewOptions = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [scale, setScale] = useState(minScale);

  const open = useCallback(() => {
    setScale(minScale);
    setIsOpen(true);
  }, [minScale]);

  const close = useCallback(() => {
    setIsOpen(false);
    setScale(minScale);
  }, [minScale]);

  const zoomIn = useCallback(() => {
    setScale((value) => Math.min(maxScale, value + step));
  }, [maxScale, step]);

  const zoomOut = useCallback(() => {
    setScale((value) => Math.max(minScale, value - step));
  }, [minScale, step]);

  const resetZoom = useCallback(() => setScale(minScale), [minScale]);

  return {
    isOpen,
    scale,
    zoomPercent: Math.round(scale * 100),
    canZoomIn: scale < maxScale,
    canZoomOut: scale > minScale,
    open,
    close,
    zoomIn,
    zoomOut,
    resetZoom,
  };
}
