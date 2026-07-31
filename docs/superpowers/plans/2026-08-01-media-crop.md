# Image Cropping Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add image cropping functionality (crop, rotate, zoom, aspect ratio selection) to `MediaPickerDialog` when uploading a new file or selecting an existing image from the media gallery.

**Architecture:** Create a canvas utility helper `cropUtils.ts` and a dedicated `ImageCropDialog.tsx` modal using `react-easy-crop`. Integrate this dialog into `MediaPickerDialog.tsx` to handle both file uploads and existing media item cropping.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, `react-easy-crop`, HTML5 Canvas API, Tailwind CSS, Lucide icons.

## Global Constraints

- Preserve `th`, `en`, and `de` localization patterns where applicable.
- Do not use TypeScript `any` or `@ts-ignore`.
- Follow strict component API guidelines in `frontend/AGENTS.md`.
- Ensure `npm run lint`, `tsc --noEmit`, and `npm run build` pass.

---

### Task 1: Dependencies Setup

**Files:**
- Modify: `frontend/package.json`

**Interfaces:**
- Consumes: `npm` package manager
- Produces: `react-easy-crop` module available for import

- [ ] **Step 1: Install `react-easy-crop`**

Run command in `frontend/`:
```bash
cd frontend && npm install react-easy-crop
```

- [ ] **Step 2: Verify installation**

Run: `cd frontend && ./node_modules/.bin/tsc --noEmit`
Expected: PASS with no missing type errors for `react-easy-crop`.

---

### Task 2: Implement Crop Canvas Utilities

**Files:**
- Create: `frontend/src/components/admin/media/cropUtils.ts`

**Interfaces:**
- Consumes: Image URL string, pixel crop area (`Area`), rotation angle (number)
- Produces: `getCroppedImg(imageSrc, pixelCrop, rotation, fileName)` returning `Promise<File>`

- [ ] **Step 1: Write `cropUtils.ts`**

Create `frontend/src/components/admin/media/cropUtils.ts` with complete implementation:

```typescript
export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}

export function getRadianAngle(degreeValue: number): number {
  return (degreeValue * Math.PI) / 180;
}

export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: PixelCrop,
  rotation = 0,
  fileName = "cropped-image.jpg"
): Promise<File> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  const rotRad = getRadianAngle(rotation);

  // calculate bounding box of the rotated image
  const bBoxWidth =
    Math.abs(Math.cos(rotRad) * image.width) +
    Math.abs(Math.sin(rotRad) * image.height);
  const bBoxHeight =
    Math.abs(Math.sin(rotRad) * image.width) +
    Math.abs(Math.cos(rotRad) * image.height);

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);

  ctx.drawImage(image, 0, 0);

  const croppedCanvas = document.createElement("canvas");
  const croppedCtx = croppedCanvas.getContext("2d");

  if (!croppedCtx) {
    throw new Error("No 2d context for crop");
  }

  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise<File>((resolve, reject) => {
    croppedCanvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Canvas is empty"));
        return;
      }
      const file = new File([blob], fileName, { type: "image/jpeg" });
      resolve(file);
    }, "image/jpeg", 0.95);
  });
}
```

- [ ] **Step 2: Type check `cropUtils.ts`**

Run: `cd frontend && ./node_modules/.bin/tsc --noEmit`
Expected: PASS

---

### Task 3: Create `ImageCropDialog` Component

**Files:**
- Create: `frontend/src/components/admin/media/ImageCropDialog.tsx`

**Interfaces:**
- Consumes: `getCroppedImg` from `./cropUtils`, Modal and Button from `@/components/ui/`
- Produces: `ImageCropDialog` React Component

- [ ] **Step 1: Write `ImageCropDialog.tsx`**

Create `frontend/src/components/admin/media/ImageCropDialog.tsx`:

```tsx
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
    try {
      const croppedFile = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation,
        fileName
      );
      await onCropComplete(croppedFile);
    } catch (err) {
      console.error("Failed to crop image:", err);
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
```

- [ ] **Step 2: Type check `ImageCropDialog.tsx`**

Run: `cd frontend && ./node_modules/.bin/tsc --noEmit`
Expected: PASS

---

### Task 4: Integrate `ImageCropDialog` into `MediaPickerDialog`

**Files:**
- Modify: `frontend/src/components/admin/media/MediaPickerDialog.tsx`

**Interfaces:**
- Consumes: `ImageCropDialog` from `./ImageCropDialog`
- Produces: Updated `MediaPickerDialog` component supporting crop on new upload & gallery images

- [ ] **Step 1: Update `MediaPickerDialog.tsx`**

Update `frontend/src/components/admin/media/MediaPickerDialog.tsx`:

```tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import { Upload, Loader2, Crop } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { mediaService } from "@/services/mediaService";
import { useTranslations } from "next-intl";
import { ImageCropDialog } from "./ImageCropDialog";

type MediaPickerDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
};

export function MediaPickerDialog({
  isOpen,
  onClose,
  onSelect,
}: MediaPickerDialogProps) {
  const t = useTranslations("Admin");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  // Crop State
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropFileName, setCropFileName] = useState("image.jpg");
  const [isCropOpen, setIsCropOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      void fetchImages();
    }
  }, [isOpen]);

  const fetchImages = async () => {
    setIsLoading(true);
    setError("");
    try {
      const media = await mediaService.list();
      const urls = Array.from(
        new Set(
          media
            .map((item) => item.url)
            .filter((url): url is string => typeof url === "string" && url !== ""),
        ),
      );
      setGalleryImages(urls);
    } catch {
      setError("ไม่สามารถดึงรูปภาพจากคลังได้");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("ไฟล์ต้องมีขนาดไม่เกิน 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCropSrc(reader.result);
        setCropFileName(file.name);
        setIsCropOpen(true);
      }
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleOpenCropForGallery = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCropSrc(url);
    setCropFileName("gallery-cropped.jpg");
    setIsCropOpen(true);
  };

  const handleCropComplete = async (croppedFile: File) => {
    setIsUploading(true);
    setError("");
    try {
      const uploaded = await mediaService.upload(croppedFile);
      setIsCropOpen(false);
      setCropSrc(null);
      onSelect(uploaded.url);
      onClose();
    } catch {
      setError("อัปโหลดรูปภาพไม่สำเร็จ");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="คลังสื่อ (Media Library)"
        size="lg"
      >
        <div className="space-y-4 font-sans text-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-100 pb-3">
            <p className="text-xs text-zinc-500">
              เลือกรูปภาพที่เคยอัปโหลดไว้แล้วในระบบแกลเลอรี หรือคลิกอัปโหลดรูปภาพใหม่จากคอมพิวเตอร์ของคุณ
            </p>
            <Button
              type="button"
              size="sm"
              variant="primary"
              onClick={() => fileInputRef.current?.click()}
              icon={<Upload size={14} />}
              className="shrink-0"
              disabled={isUploading}
            >
              {isUploading ? "กำลังอัปโหลด..." : "อัปโหลดรูปใหม่"}
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {error && <p className="text-sm text-red-600 mt-1">{error}</p>}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="animate-spin text-zinc-400 mb-2" size={32} />
              <span className="text-sm text-zinc-500">กำลังโหลดรูปภาพ...</span>
            </div>
          ) : galleryImages.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
              <span className="text-sm text-zinc-400">ไม่พบรูปภาพในคลังสื่อ</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[360px] overflow-y-auto pr-1">
              {galleryImages.map((url, idx) => (
                <div
                  key={idx}
                  className="group aspect-square border border-zinc-200 rounded-lg overflow-hidden bg-zinc-50 hover:border-amber-500 transition-all relative shadow-sm cursor-pointer"
                  onClick={() => {
                    onSelect(url);
                    onClose();
                  }}
                >
                  <img
                    src={url}
                    alt="Gallery item"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                  {/* Overlay buttons */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => handleOpenCropForGallery(url, e)}
                      className="p-1.5 bg-white/90 hover:bg-white text-zinc-800 rounded-md shadow-sm transition-colors text-xs flex items-center gap-1 font-medium"
                      title="ครอบตัดรูปภาพนี้"
                    >
                      <Crop size={14} className="text-amber-600" />
                      <span>ครอป</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Image Crop Dialog */}
      {cropSrc && (
        <ImageCropDialog
          isOpen={isCropOpen}
          imageSrc={cropSrc}
          fileName={cropFileName}
          onClose={() => {
            setIsCropOpen(false);
            setCropSrc(null);
          }}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
}
```

- [ ] **Step 2: Type check `MediaPickerDialog.tsx`**

Run: `cd frontend && ./node_modules/.bin/tsc --noEmit`
Expected: PASS

---

### Task 5: Verification & Quality Check

**Files:**
- Test/Verify: `frontend/` build & lint

- [ ] **Step 1: Run type checking**

Run: `cd frontend && ./node_modules/.bin/tsc --noEmit`
Expected: PASS with 0 errors

- [ ] **Step 2: Run linter**

Run: `cd frontend && npm run lint`
Expected: PASS with 0 errors

- [ ] **Step 3: Run production build**

Run: `cd frontend && npm run build`
Expected: PASS cleanly
