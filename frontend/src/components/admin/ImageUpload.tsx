"use client";

import React, { useRef, useState, useEffect } from "react";
import { Upload, X, Database, Loader2, Eye } from "lucide-react";
import { galleryAdminService } from "@/services/adminService";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "next-intl";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

interface ImageUploadProps {
  label?: string;
  value?: string | File;
  onChange: (value: string | File) => void;
  className?: string;
}

export function ImageUpload({
  label,
  value,
  onChange,
  className = "",
}: ImageUploadProps) {
  const t = useTranslations("Admin");
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  // Handle local preview for newly selected File objects
  useEffect(() => {
    if (value instanceof File) {
      const objectUrl = URL.createObjectURL(value);
      setLocalPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setLocalPreview(null);
    }
  }, [value]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith("image/")) {
      setError(t("common.error") + ": กรุณาเลือกไฟล์รูปภาพเท่านั้น");
      return;
    }

    // Check file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(t("common.error") + ": ไฟล์ต้องมีขนาดไม่เกิน 5MB");
      return;
    }

    setError("");
    onChange(file); // Pass the File object up
    setIsModalOpen(false); // Close the modal since a file was chosen
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleOpenLibrary = async () => {
    setIsModalOpen(true);
    setIsLoadingGallery(true);
    try {
      const res = await galleryAdminService.getAll({ limit: 100 });
      // Extract unique non-empty image URLs
      const urls = Array.from(
        new Set(
          res.data
            .map((item) => item.image_url)
            .filter((url): url is string => typeof url === "string" && url !== ""),
        ),
      );
      setGalleryImages(urls);
    } catch {
      setError("ไม่สามารถดึงรูปภาพจากคลังได้");
    } finally {
      setIsLoadingGallery(false);
    }
  };

  const handleSelectFromLibrary = (url: string) => {
    onChange(url);
    setIsModalOpen(false);
  };

  const handleRemove = () => {
    onChange("");
  };

  const previewSrc = value instanceof File ? localPreview : value;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-zinc-700 flex items-center min-h-[24px]">
          {label}
        </label>
      )}

      {previewSrc ? (
        <div className="relative inline-block group/preview">
          <img
            src={previewSrc}
            alt="Preview"
            className="h-36 w-36 object-cover rounded-lg border border-zinc-200 shadow-sm"
          />
          {/* Hover View Lightbox Button */}
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            className="absolute inset-0 bg-black/40 text-white rounded-lg flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transition-opacity"
            title="ดูภาพขนาดเต็ม"
          >
            <Eye size={20} strokeWidth={1.5} />
          </button>
          {/* Delete Button */}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors z-10"
            title="ลบรูปภาพ"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        /* Single Upload/Add Button */
        <button
          type="button"
          onClick={handleOpenLibrary}
          className="flex flex-col items-center justify-center w-36 h-36 border-2 border-dashed border-zinc-300 rounded-lg hover:border-amber-500 hover:bg-amber-50/50 transition-all shadow-sm group"
        >
          <Upload size={20} className="text-zinc-400 group-hover:text-amber-600 mb-1 transition-colors" />
          <span className="text-xs text-zinc-500 group-hover:text-amber-700 font-medium">เพิ่มรูปภาพ</span>
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}

      {/* Media Library Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="คลังสื่อ (Media Library)"
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-100 pb-3">
            <p className="text-xs text-zinc-500">
              เลือกรูปภาพที่เคยอัปโหลดไว้แล้วในระบบแกลเลอรี หรือคลิกอัปโหลดรูปภาพใหม่จากคอมพิวเตอร์ของคุณ
            </p>
            <Button
              type="button"
              size="sm"
              variant="primary"
              onClick={() => fileRef.current?.click()}
              icon={<Upload size={14} />}
              className="shrink-0"
            >
              อัปโหลดรูปใหม่
            </Button>
          </div>

          {isLoadingGallery ? (
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
                  onClick={() => handleSelectFromLibrary(url)}
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

      {/* Library Lightbox Preview */}
      {previewSrc && (
        <Lightbox
          open={isLightboxOpen}
          close={() => setIsLightboxOpen(false)}
          slides={[{ src: previewSrc }]}
        />
      )}
    </div>
  );
}
