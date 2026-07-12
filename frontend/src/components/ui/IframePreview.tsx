"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";

export interface IframePreviewProps {
  url: string;
  title?: string;
}

export function IframePreview({ url, title = "Preview" }: IframePreviewProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="flex-1 w-full h-full bg-zinc-100 overflow-hidden relative flex flex-col items-center justify-center">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
          <Loader2 className="animate-spin text-zinc-400" size={32} />
        </div>
      )}
      <iframe
        src={url}
        className="w-full h-full border-none"
        title={title}
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
}
