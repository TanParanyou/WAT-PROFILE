"use client";

import { useState, useEffect, useRef } from "react";
import { useMockMediaStore, MockMedia } from "@/stores/mock-media-store";
import { MediaDetailsSidebar } from "@/components/admin/website/MediaDetailsSidebar";
import { Button } from "@/components/ui/Button";
import { Loader2, Upload } from "lucide-react";

export default function MediaLibraryPage() {
  const { mediaList, isLoading, isUploading, fetchMedia, addMedia } =
    useMockMediaStore();
  const [selectedMedia, setSelectedMedia] = useState<MockMedia | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate uploading local file by creating a blob URL
    const url = URL.createObjectURL(file);
    await addMedia(url, file.name);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="flex-1 space-y-4 overflow-y-auto p-4 font-sans text-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-950">
              Media Library
            </h1>
            <p className="text-sm text-zinc-500">
              Manage public content media files
            </p>
          </div>

          <div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="text-xs uppercase tracking-wider flex items-center gap-2"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {isUploading ? "Uploading..." : "Upload Image"}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {mediaList.map((media) => (
              <button
                key={media.id}
                onClick={() => setSelectedMedia(media)}
                className={`group relative aspect-video overflow-hidden border bg-zinc-50 ${
                  selectedMedia?.id === media.id
                    ? "border-zinc-950"
                    : "border-zinc-200"
                }`}
              >
                <img
                  src={media.url}
                  alt=""
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              </button>
            ))}
          </div>
        )}
      </div>
      <MediaDetailsSidebar
        media={selectedMedia}
        onClose={() => setSelectedMedia(null)}
      />
    </div>
  );
}
