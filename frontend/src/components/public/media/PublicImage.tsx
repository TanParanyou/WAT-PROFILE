"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

interface PublicImageProps extends Omit<ImageProps, "src" | "alt"> {
  src: string | null | undefined;
  alt: string;
  fallbackSrc: string;
}

export function PublicImage({ src, alt, fallbackSrc, onError, ...props }: PublicImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc);
  const [hasFailed, setHasFailed] = useState(false);

  if (hasFailed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 p-4 text-center text-sm text-stone-500"
      >
        <span>{alt}</span>
      </div>
    );
  }

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      onError={(event) => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        } else {
          setHasFailed(true);
        }

        onError?.(event);
      }}
    />
  );
}
