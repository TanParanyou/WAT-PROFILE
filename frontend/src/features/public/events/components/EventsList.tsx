import { Calendar, MapPin } from "lucide-react";
import { Link } from "@/navigation";
import { useLocale, useTranslations } from "next-intl";
import { formatDateRange } from "@/utils/formatters";
import { getLocalizedText } from "../mappers";
import { getLocalizedPlainText } from "@/features/public/shared/rich-text";
import type { EventListItem } from "../types";
import { PublicImage } from "@/components/public/media/PublicImage";
import { publicEventFallbackImage } from "@/components/public/media/publicImageFallbacks";

interface EventsListProps {
  events: readonly EventListItem[];
}

export function EventsList({ events }: EventsListProps) {
  const locale = useLocale();
  const t = useTranslations("EventsPage");

  return (
    <div className="grid gap-6">
      {events.map((event) => (
        <article key={event.slug} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="relative h-56 bg-gray-100">
            <PublicImage
              src={event.imageUrl}
              alt={getLocalizedText(event.title, locale)}
              fill
              fallbackSrc={publicEventFallbackImage}
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          <div className="p-6">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar size={16} />
              <time dateTime={event.startDate}>{formatDateRange(event.startDate, event.endDate, locale)}</time>
            </div>
            <h3 className="mt-3 text-xl font-bold text-gray-900">
              <Link href={`/events/${event.slug}`}>{getLocalizedText(event.title, locale)}</Link>
            </h3>
            <p className="mt-3 line-clamp-3 text-sm text-gray-600">
              {event.description ? getLocalizedPlainText(event.description, locale).slice(0, 180) : ""}
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
              <MapPin size={16} />
              <span>{getLocalizedText(event.location, locale)}</span>
            </div>
            <div className="mt-5">
              <Link href={`/events/${event.slug}`} className="text-sm font-semibold text-amber-600 hover:underline">
                {t("readMore")}
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
