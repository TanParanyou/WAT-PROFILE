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
    <div className="group rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full">
      <div className="relative h-48 w-full overflow-hidden bg-gray-100">
        <PublicImage
          src={imageUrl}
          alt={title}
          fill
          fallbackSrc={publicEventFallbackImage}
          className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-amber-700 shadow-sm">
          {title}
        </div>
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Calendar size={14} className="text-amber-600" />
          <time
            dateTime={
              event.start_date
            }
          >
            {formatDateRange(event.start_date, event.end_date)}
          </time>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 leading-tight group-hover:text-amber-700 transition-colors">
          <Link href={`/events/${event.slug}`} className="hover:underline">
            {title}
          </Link>
        </h3>
        <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-grow">
          {description}
        </p>
        {location && (
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-auto pt-4 border-t border-gray-100 shrink-0">
            <MapPin size={14} />
            <span className="truncate">{location}</span>
          </div>
        )}
      </div>
    </div>
  );
}
