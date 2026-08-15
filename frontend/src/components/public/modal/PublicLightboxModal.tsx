"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Loader2,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { SiteModalPortal } from "./SiteModalPortal";
import { PublicImage } from "@/components/public/media/PublicImage";
import { publicEventFallbackImage } from "@/components/public/media/publicImageFallbacks";
import { toPlainText } from "@/features/public/shared/rich-text";

export type LightboxSlideMeta = Record<string, string | undefined>;

function safePlainText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object") {
    if ("text" in value || "content" in value || "type" in value) {
      return toPlainText(value as Parameters<typeof toPlainText>[0]);
    }
    const obj = value as Record<string, unknown>;
    const textVal = obj.th ?? obj.en ?? obj.de;
    if (textVal != null) return safePlainText(textVal);
  }
  return "";
}

export interface LightboxSlide {
  src: string;
  alt?: string;
  title?: string;
  description?: string;
  downloadUrl?: string;
  externalUrl?: string;
  action?: ReactNode;
  meta?: LightboxSlideMeta;
}

export interface PublicLightboxModalProps {
  open: boolean;
  onClose: () => void;
  slides: LightboxSlide[];
  initialIndex?: number;
  closeLabel?: string;
  prevLabel?: string;
  nextLabel?: string;
  downloadLabel?: string;
  openExternalLabel?: string;
  zoomInLabel?: string;
  zoomOutLabel?: string;
  resetZoomLabel?: string;
  showDownload?: boolean;
  showOpenExternal?: boolean;
  showZoom?: boolean;
  onDownload?: (slide: LightboxSlide, index: number) => void;
  actions?:
    | ReactNode
    | ((context: {
        slide: LightboxSlide;
        index: number;
        onClose: () => void;
      }) => ReactNode);
}

export function PublicLightboxModal({
  open,
  onClose,
  slides,
  initialIndex = 0,
  closeLabel = "Close",
  prevLabel = "Previous",
  nextLabel = "Next",
  downloadLabel = "Download",
  openExternalLabel = "Open in new tab",
  zoomInLabel = "Zoom in",
  zoomOutLabel = "Zoom out",
  resetZoomLabel = "Reset zoom",
  showDownload = true,
  showOpenExternal = true,
  showZoom = true,
  onDownload,
  actions,
}: PublicLightboxModalProps) {
  if (!open || slides.length === 0) return null;

  return (
    <PublicLightboxModalContent
      key={`${open}-${initialIndex}`}
      onClose={onClose}
      slides={slides}
      initialIndex={initialIndex}
      closeLabel={closeLabel}
      prevLabel={prevLabel}
      nextLabel={nextLabel}
      downloadLabel={downloadLabel}
      openExternalLabel={openExternalLabel}
      zoomInLabel={zoomInLabel}
      zoomOutLabel={zoomOutLabel}
      resetZoomLabel={resetZoomLabel}
      showDownload={showDownload}
      showOpenExternal={showOpenExternal}
      showZoom={showZoom}
      onDownload={onDownload}
      actions={actions}
    />
  );
}

function PublicLightboxModalContent({
  onClose,
  slides,
  initialIndex = 0,
  closeLabel = "Close",
  prevLabel = "Previous",
  nextLabel = "Next",
  downloadLabel = "Download",
  openExternalLabel = "Open in new tab",
  zoomInLabel = "Zoom in",
  zoomOutLabel = "Zoom out",
  resetZoomLabel = "Reset zoom",
  showDownload = true,
  showOpenExternal = true,
  showZoom = true,
  onDownload,
  actions,
}: Omit<PublicLightboxModalProps, "open">) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  const currentSlide = slides[currentIndex] || slides[0];

  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handlePrev = useCallback(() => {
    resetZoom();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : slides.length - 1));
  }, [resetZoom, slides.length]);

  const handleNext = useCallback(() => {
    resetZoom();
    setCurrentIndex((prev) => (prev < slides.length - 1 ? prev + 1 : 0));
  }, [resetZoom, slides.length]);

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(Number((prev + 0.5).toFixed(1)), 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => {
      const nextScale = Math.max(Number((prev - 0.5).toFixed(1)), 1);
      if (nextScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return nextScale;
    });
  }, []);

  const handleToggleZoom = useCallback(() => {
    setScale((prev) => {
      if (prev > 1) {
        setPosition({ x: 0, y: 0 });
        return 1;
      }
      return 2;
    });
  }, []);

  const handleDownload = useCallback(async () => {
    if (!currentSlide) return;

    if (onDownload) {
      onDownload(currentSlide, currentIndex);
      return;
    }

    const targetUrl = currentSlide.downloadUrl || currentSlide.src;
    if (!targetUrl) return;

    try {
      setIsDownloading(true);
      const response = await fetch(targetUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;

      const fallbackName = `image-${currentIndex + 1}.jpg`;
      const cleanName =
        targetUrl.split("/").pop()?.split("?")[0] || fallbackName;
      link.download = cleanName.endsWith(".jpg") || cleanName.endsWith(".png") || cleanName.endsWith(".webp")
        ? cleanName
        : `${cleanName}.jpg`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    } finally {
      setIsDownloading(false);
    }
  }, [currentSlide, currentIndex, onDownload]);

  const handleOpenExternal = useCallback(() => {
    if (!currentSlide) return;
    const targetUrl = currentSlide.externalUrl || currentSlide.src;
    if (targetUrl) {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    }
  }, [currentSlide]);

  // Keyboard navigation & shortcuts
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "ArrowLeft") {
        handlePrev();
      } else if (event.key === "ArrowRight") {
        handleNext();
      } else if (event.key === "+" || event.key === "=") {
        if (showZoom) handleZoomIn();
      } else if (event.key === "-") {
        if (showZoom) handleZoomOut();
      } else if (event.key === "0") {
        if (showZoom) resetZoom();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [
    onClose,
    handlePrev,
    handleNext,
    handleZoomIn,
    handleZoomOut,
    resetZoom,
    showZoom,
  ]);

  // Pan / Drag handlers when zoomed
  const handleMouseDown = (e: ReactMouseEvent) => {
    if (scale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y,
    };
  };

  const handleMouseMove = (e: ReactMouseEvent) => {
    if (!isDragging || scale <= 1) return;
    e.preventDefault();
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    setPosition({
      x: dragStartRef.current.posX + deltaX,
      y: dragStartRef.current.posY + deltaY,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Render custom actions if provided
  const renderedCustomActions =
    typeof actions === "function"
      ? actions({ slide: currentSlide, index: currentIndex, onClose })
      : actions;

  const slideTitle = safePlainText(currentSlide?.title);
  const slideDescription = safePlainText(currentSlide?.description);

  return (
    <SiteModalPortal>
      <div
        className="fixed inset-0 z-[80] flex flex-col justify-between bg-black/90 backdrop-blur-sm select-none p-3 sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-label={slideTitle || "Image Lightbox"}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between z-10 w-full gap-2">
          {/* Left: Counter & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="shrink-0 border border-white/20 bg-black/60 px-3 py-1 text-xs font-mono text-white">
              {currentIndex + 1} / {slides.length}
            </span>
            {slideTitle && (
              <span className="hidden sm:inline-block text-sm font-semibold text-white/90 truncate max-w-xs md:max-w-md">
                {slideTitle}
              </span>
            )}
          </div>

          {/* Right: Actions Toolbar & Close Button */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Custom injected actions */}
            {renderedCustomActions}

            {/* Zoom Controls */}
            {showZoom && (
              <div className="flex items-center bg-black/60 border border-white/20">
                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={scale >= 3}
                  aria-label={zoomInLabel}
                  title={`${zoomInLabel} (+)`}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center text-white transition-colors hover:bg-site-action focus-visible:outline-3 focus-visible:outline-white disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ZoomIn size={18} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={scale <= 1}
                  aria-label={zoomOutLabel}
                  title={`${zoomOutLabel} (-)`}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center text-white transition-colors hover:bg-site-action focus-visible:outline-3 focus-visible:outline-white disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ZoomOut size={18} aria-hidden="true" />
                </button>
                {scale > 1 && (
                  <button
                    type="button"
                    onClick={resetZoom}
                    aria-label={resetZoomLabel}
                    title={`${resetZoomLabel} (0)`}
                    className="inline-flex min-h-11 px-2.5 items-center justify-center gap-1 text-xs font-mono text-white/90 transition-colors hover:bg-site-action focus-visible:outline-3 focus-visible:outline-white border-l border-white/10"
                  >
                    <RotateCcw size={14} aria-hidden="true" />
                    <span>{Math.round(scale * 100)}%</span>
                  </button>
                )}
              </div>
            )}

            {/* Open in new tab button */}
            {showOpenExternal && (
              <button
                type="button"
                onClick={handleOpenExternal}
                aria-label={openExternalLabel}
                title={openExternalLabel}
                className="inline-flex min-h-11 min-w-11 items-center justify-center border border-white/20 bg-black/60 text-white transition-colors hover:bg-site-action hover:border-site-action focus-visible:outline-3 focus-visible:outline-white"
              >
                <ExternalLink size={18} aria-hidden="true" />
              </button>
            )}

            {/* Download button */}
            {showDownload && (
              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading}
                aria-label={downloadLabel}
                title={downloadLabel}
                className="inline-flex min-h-11 min-w-11 items-center justify-center border border-white/20 bg-black/60 text-white transition-colors hover:bg-site-action hover:border-site-action focus-visible:outline-3 focus-visible:outline-white disabled:opacity-50"
              >
                {isDownloading ? (
                  <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                ) : (
                  <Download size={18} aria-hidden="true" />
                )}
              </button>
            )}

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              title={`${closeLabel} (Esc)`}
              className="inline-flex min-h-11 min-w-11 items-center justify-center border border-white/20 bg-black/60 text-white transition-colors hover:bg-site-action hover:border-site-action focus-visible:outline-3 focus-visible:outline-white"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Carousel Center Stage */}
        <div className="relative flex-1 flex items-center justify-center my-2 sm:my-4 overflow-hidden">
          {/* Previous Button */}
          {slides.length > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              aria-label={prevLabel}
              className="absolute left-2 sm:left-4 z-20 inline-flex min-h-11 min-w-11 items-center justify-center border border-white/20 bg-black/60 text-white transition-all hover:bg-site-action hover:border-site-action focus-visible:outline-3 focus-visible:outline-white"
            >
              <ChevronLeft size={24} aria-hidden="true" />
            </button>
          )}

          {/* Main Slide Image with Zoom and Pan */}
          <div
            className={`relative w-full h-full max-h-[70vh] flex items-center justify-center transition-transform duration-100 ${
              scale > 1
                ? isDragging
                  ? "cursor-grabbing"
                  : "cursor-grab"
                : "cursor-zoom-in"
            }`}
            onClick={(e) => {
              e.stopPropagation();
            }}
            onDoubleClick={handleToggleZoom}
            onMouseDown={handleMouseDown}
            style={{
              transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
            }}
          >
            <PublicImage
              src={currentSlide.src}
              alt={currentSlide.alt || currentSlide.title || "Image"}
              fill
              fallbackSrc={publicEventFallbackImage}
              className="object-contain pointer-events-none"
              sizes="100vw"
              priority
            />
          </div>

          {/* Next Button */}
          {slides.length > 1 && (
            <button
              type="button"
              onClick={handleNext}
              aria-label={nextLabel}
              className="absolute right-2 sm:right-4 z-20 inline-flex min-h-11 min-w-11 items-center justify-center border border-white/20 bg-black/60 text-white transition-all hover:bg-site-action hover:border-site-action focus-visible:outline-3 focus-visible:outline-white"
            >
              <ChevronRight size={24} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Footer Bar: Captions & Slide Actions & Thumbnail Strip */}
        <div className="z-10 w-full flex flex-col items-center gap-3">
          {(slideDescription || currentSlide.action || currentSlide.meta) && (
            <div className="flex flex-col items-center justify-center gap-2 max-w-2xl px-4 text-center">
              {slideDescription && (
                <p className="text-xs sm:text-sm text-center text-white/80 line-clamp-2">
                  {slideDescription}
                </p>
              )}
              {currentSlide.meta && Object.entries(currentSlide.meta).filter(([, v]) => !!safePlainText(v)).length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-xs text-white/75">
                  {Object.entries(currentSlide.meta)
                    .filter(([, val]) => Boolean(safePlainText(val)))
                    .map(([key, val]) => (
                      <span key={key} className="inline-flex items-center px-2 py-0.5 rounded bg-white/10 border border-white/15 text-white/90">
                        <strong className="capitalize mr-1 opacity-75">{key}:</strong> {safePlainText(val)}
                      </span>
                    ))}
                </div>
              )}
              {currentSlide.action && (
                <div className="shrink-0">{currentSlide.action}</div>
              )}
            </div>
          )}

          {/* Thumbnail Strip (when 2+ images) */}
          {slides.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 px-2">
              {slides.map((slide, idx) => {
                const isActive = idx === currentIndex;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      resetZoom();
                      setCurrentIndex(idx);
                    }}
                    className={`relative h-12 w-16 sm:h-14 sm:w-20 shrink-0 border-2 overflow-hidden transition-all ${
                      isActive
                        ? "border-site-action scale-105"
                        : "border-white/20 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <PublicImage
                      src={slide.src}
                      alt={`Thumbnail ${idx + 1}`}
                      fill
                      fallbackSrc={publicEventFallbackImage}
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </SiteModalPortal>
  );
}
