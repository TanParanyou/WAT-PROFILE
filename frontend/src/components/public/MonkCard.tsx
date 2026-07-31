import React from "react";
import { Link } from "@/navigation";
import type { PublicMonkDto } from "@/features/public/monks/types";
import { getLocalizedText } from "@/features/public/monks/mappers";
import { PublicImage } from "@/components/public/media/PublicImage";
import { publicMonkFallbackImage } from "@/components/public/media/publicImageFallbacks";

interface MonkCardProps {
  monk: PublicMonkDto;
  locale: string;
}

export function MonkCard({ monk, locale }: MonkCardProps) {
  const name = getLocalizedText(monk.name, locale);
  const position = monk.title ? getLocalizedText(monk.title, locale) : monk.position || "";
  const imageUrl = monk.image_url;

  return (
    <div className="group flex flex-col items-center border border-[#333] bg-[#fffef2] p-6 transition-colors hover:bg-[#f7ecdd]">
      <div className="relative mb-6 h-40 w-40 overflow-hidden border border-[#333] p-1">
        <div className="relative h-full w-full overflow-hidden">
          <PublicImage
            src={imageUrl}
            alt={name}
            fill
            fallbackSrc={publicMonkFallbackImage}
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        </div>
      </div>
      <h3 className="mb-1 text-center text-xl font-medium text-[#333] transition-colors group-hover:text-[#945c26]">
        <Link href={`/monks/${monk.slug}`} className="hover:underline">
          {name}
        </Link>
      </h3>
      {position && (
        <p className="text-center text-sm font-medium text-[#945c26]">
          {position}
        </p>
      )}
    </div>
  );
}
