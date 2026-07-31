"use client";

import React, { useState, useCallback } from "react";
import Cropper, { Point, Area } from "react-easy-crop";
import { RotateCw, RotateCcw, ZoomIn, ZoomOut, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { getCroppedImg, PixelCrop } from "./cropUtils";

interface ImageCropDialogProps {
  isOpen: boolean;
  imageSrc: string;
  fileName?: string;
  onClose: () => void;
  onCropComplete: (croppedFile: File) => Promise<void> | void;
}

type AspectRatioOption = {
  label: string;
  value: number | undefined;
};

const ASPECT_RATIOS: AspectRatioOption[] = [
  { label: "อิสระ", value: undefined },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "16:9", value: 16 / 9 },
];

export function ImageCropDialog({
  isOpen,
  imageSrc,
  fileName = "cropped-image.jpg",
  onClose,
  onCropComplete,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>("");

  const onCropChange = (crop: Point) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropCompleteCallback = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleRotateLeft = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  const handleRotateRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    setError("");
    try {
      const croppedFile = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation,
        fileName
      );
      await onCropComplete(croppedFile);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการครอปรูปภาพ";
      setError(msg);
      console.error("Failed to crop image:", msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ครอบตัดรูปภาพ (Crop Image)"
      size="lg"
    >
      <div className="space-y-4 font-sans text-sm">
        {/* Cropper Container */}
        <div className="relative w-full h-[360px] bg-zinc-900 rounded-lg overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onRotationChange={setRotation}
            onCropComplete={onCropCompleteCallback}
          />
        </div>

        {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

        {/* Controls Toolbar */}
        <div className="space-y-3 bg-zinc-50 p-3 rounded-lg border border-zinc-200">
          {/* Aspect Ratio */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-medium text-zinc-600">อัตราส่วนภาพ:</span>
            <div className="flex items-center gap-1.5">
              {ASPECT_RATIOS.map((option, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAspect(option.value)}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                    aspect === option.value
                      ? "bg-amber-600 text-white font-medium shadow-sm"
                      : "bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Zoom Slider & Rotation Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-zinc-200">
            {/* Zoom Slider */}
            <div className="flex items-center gap-2 flex-1">
              <ZoomOut size={16} className="text-zinc-500 shrink-0" />
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-label="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
              />
              <ZoomIn size={16} className="text-zinc-500 shrink-0" />
            </div>

            {/* Rotation Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleRotateLeft}
                className="p-1.5 bg-white border border-zinc-200 hover:bg-zinc-100 rounded-md text-zinc-700 transition-colors flex items-center gap-1 text-xs"
                title="หมุนทวนเข็ม 90°"
              >
                <RotateCcw size={14} />
                <span>-90°</span>
              </button>
              <button
                type="button"
                onClick={handleRotateRight}
                className="p-1.5 bg-white border border-zinc-200 hover:bg-zinc-100 rounded-md text-zinc-700 transition-colors flex items-center gap-1 text-xs"
                title="หมุนตามเข็ม 90°"
              >
                <RotateCw size={14} />
                <span>+90°</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isProcessing}
          >
            ยกเลิก
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={isProcessing}
            icon={isProcessing ? <Loader2 size={14} className="animate-spin" /> : undefined}
          >
            {isProcessing ? "กำลังประมวลผล..." : "ตกลงและอัปโหลด"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
