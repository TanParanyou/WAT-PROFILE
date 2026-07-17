"use client";

import React, { useEffect, useState, useRef } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { mediaService } from "@/services/mediaService";
import { useTranslations } from "next-intl";

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

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setIsUploading(true);
    setError("");
    try {
      const uploaded = await mediaService.upload(file);
      onSelect(uploaded.url);
      onClose();
    } catch {
      setError("อัปโหลดรูปภาพไม่สำเร็จ");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
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
          onChange={handleUploadFile}
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
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onSelect(url);
                  onClose();
                }}
                className="group aspect-square border border-zinc-200 rounded-lg overflow-hidden bg-zinc-50 hover:border-amber-500 transition-all relative shadow-sm"
              >
                <img
                  src={url}
                  alt="Gallery item"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
