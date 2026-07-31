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
    <div className="group flex h-full flex-col border-b border-[#333] bg-[#fffef2] py-0 md:border-b-0 md:border-r md:px-7 md:first:pl-0 md:last:border-r-0 md:last:pr-0">
      <div className="relative h-56 w-full overflow-hidden bg-[#f7ecdd]">
        <PublicImage
          src={imageUrl}
          alt={title}
          fill
          fallbackSrc={publicEventFallbackImage}
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
        />
      </div>
      <div className="flex flex-grow flex-col py-6">
        <div className="mb-3 flex items-center gap-2 text-sm text-[#666]"><Calendar size={14} className="text-[#945c26]" /><time dateTime={event.start_date}>{formatDateRange(event.start_date, event.end_date)}</time></div>
        <h3 className="mb-3 line-clamp-2 text-xl font-medium leading-tight text-[#333]"><Link href={`/events/${event.slug}`} className="hover:text-[#945c26] hover:underline">{title}</Link></h3>
        <p className="mb-5 line-clamp-3 flex-grow text-sm leading-7 text-[#505050]">{description}</p>
        {location && (
          <div className="mt-auto flex shrink-0 items-center gap-2 border-t border-[#333] pt-4 text-xs text-[#666]">
            <MapPin size={14} />
            <span className="truncate">{location}</span>
          </div>
        )}
      </div>
    </div>
  );
}
