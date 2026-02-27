import React from "react";
import Image from "next/image";
import { Link } from "@/navigation";
import { Calendar, MapPin } from "lucide-react";
import type { Event } from "@/types/entities";

interface EventCardProps {
  event: Event;
  locale: string;
}

export function EventCard({ event, locale }: EventCardProps) {
  const getLocalizedText = (
    textObj: Record<string, string> | null | undefined | unknown,
    fallback = "",
  ) => {
    if (!textObj || typeof textObj !== "object") return fallback;
    return (
      (textObj as Record<string, string>)[locale] ||
      (textObj as Record<string, string>)["th"] ||
      fallback
    );
  };

  const title = getLocalizedText(event.title);
  const description = getLocalizedText(event.description);
  const location = getLocalizedText(event.location);
  const imageUrl = event.image_url || "/placeholder-event.webp";

  return (
    <div className="group rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full">
      <div className="relative h-48 w-full overflow-hidden bg-gray-100">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-amber-700 shadow-sm">
          {event.event_type}
        </div>
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Calendar size={14} className="text-amber-600" />
          <time
            dateTime={
              event.event_date ? new Date(event.event_date).toISOString() : ""
            }
          >
            {event.event_date
              ? new Date(event.event_date).toLocaleDateString(
                  locale === "th" ? "th-TH" : "en-US",
                  { day: "numeric", month: "short", year: "numeric" },
                )
              : ""}
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
