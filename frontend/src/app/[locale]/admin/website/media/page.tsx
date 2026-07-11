"use client";

import { useState } from "react";
import { useMockMediaStore, MockMedia } from "@/stores/mock-media-store";
import { MediaDetailsSidebar } from "@/components/admin/website/MediaDetailsSidebar";
import { Button } from "@/components/ui/Button";

export default function MediaLibraryPage() {
  const mediaList = useMockMediaStore((s) => s.mediaList);
  const addMedia = useMockMediaStore((s) => s.addMedia);
  const [selectedMedia, setSelectedMedia] = useState<MockMedia | null>(null);

  const handleMockUpload = () => {
    const mockUrls = [
      "https://images.unsplash.com/photo-1590076275577-468b960f9a67?w=500&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=60",
    ];
    const randomUrl = mockUrls[Math.floor(Math.random() * mockUrls.length)];
    addMedia(randomUrl, `upload-${Date.now().toString().slice(-4)}.jpg`);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="flex-1 space-y-4 overflow-y-auto p-4 font-sans text-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-950">Media Library</h1>
            <p className="text-sm text-zinc-500">Manage public content media files</p>
          </div>
          <Button onClick={handleMockUpload} className="text-xs uppercase tracking-wider">
            Upload Mock Image
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {mediaList.map((media) => (
            <button
              key={media.id}
              onClick={() => setSelectedMedia(media)}
              className={`group relative aspect-video overflow-hidden border bg-zinc-50 ${
                selectedMedia?.id === media.id ? "border-zinc-950" : "border-zinc-200"
              }`}
            >
              <img src={media.url} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
            </button>
          ))}
        </div>
      </div>
      <MediaDetailsSidebar media={selectedMedia} onClose={() => setSelectedMedia(null)} />
    </div>
  );
}
