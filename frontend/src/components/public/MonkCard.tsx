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
    <div className="group flex flex-col items-center p-6 bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-amber-50/50">
      <div className="relative w-40 h-40 mb-6 rounded-full overflow-hidden border-4 border-amber-100/50 group-hover:border-amber-200 transition-colors p-1">
        <div className="relative w-full h-full rounded-full overflow-hidden">
          <PublicImage
            src={imageUrl}
            alt={name}
            fill
            fallbackSrc={publicMonkFallbackImage}
            className="object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
          />
        </div>
      </div>
      <h3 className="text-xl font-bold text-gray-900 text-center mb-1 group-hover:text-amber-700 transition-colors">
        <Link href={`/monks/${monk.slug}`} className="hover:underline">
          {name}
        </Link>
      </h3>
      {position && (
        <p className="text-amber-600/80 font-medium text-sm text-center">
          {position}
        </p>
      )}
    </div>
  );
}
