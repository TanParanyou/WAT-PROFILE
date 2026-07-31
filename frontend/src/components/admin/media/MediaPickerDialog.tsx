"use client";

import React, { useEffect, useState, useRef } from "react";
import { Upload, Loader2, Crop } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { mediaService } from "@/services/mediaService";
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
