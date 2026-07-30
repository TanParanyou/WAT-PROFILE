import React from "react";
import { Link } from "@/navigation";
import { Calendar, MapPin } from "lucide-react";
import { useDateFormat } from "@/hooks/useDateFormat";
import type { PublicEventDto } from "@/features/public/events/types";
import { getLocalizedText } from "@/features/public/events/mappers";
import { getLocalizedPlainText } from "@/features/public/shared/rich-text";
import { PublicImage } from "@/components/public/media/PublicImage";
import { publicEventFallbackImage } from "@/components/public/media/publicImageFallbacks";

interface EventCardProps {
  event: PublicEventDto;
  locale: string;
}

export function EventCard({ event, locale }: EventCardProps) {
  const { formatDateRange } = useDateFormat();
  const title = getLocalizedText(event.title, locale);
  const description = event.description ? getLocalizedPlainText(event.description, locale) : "";
  const location = getLocalizedText(event.location, locale);
  const imageUrl = event.image_url;

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-xl">
      <div className="relative h-48 w-full overflow-hidden bg-gray-100">
        <PublicImage
          src={imageUrl}
          alt={title}
          fill
          fallbackSrc={publicEventFallbackImage}
          className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
      </div>
      <div className="flex flex-grow flex-col p-5">
        <div className="mb-2 flex items-center gap-2 text-sm text-gray-500"><Calendar size={14} className="text-amber-600" /><time dateTime={event.start_date}>{formatDateRange(event.start_date, event.end_date)}</time></div>
        <h3 className="mb-2 line-clamp-2 text-lg font-bold leading-tight text-gray-900 transition-colors group-hover:text-amber-700"><Link href={`/events/${event.slug}`} className="hover:underline">{title}</Link></h3>
        <p className="mb-4 line-clamp-3 flex-grow text-sm text-gray-600">{description}</p>
        {location && (
          <div className="mt-auto flex shrink-0 items-center gap-2 border-t border-gray-100 pt-4 text-xs text-gray-500">
            <MapPin size={14} />
            <span className="truncate">{location}</span>
          </div>
        )}
      </div>
    </div>
  );
}
