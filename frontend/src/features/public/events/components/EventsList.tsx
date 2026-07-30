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
      {events.map((event) => {
        const title = getLocalizedText(event.title, locale);

        return (
          <article
            key={event.slug}
            className="group grid overflow-hidden rounded-2xl border border-primary/15 bg-white md:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.2fr)]"
          >
            <div className="relative min-h-60 overflow-hidden bg-secondary-50 md:min-h-full">
              <PublicImage
                src={event.imageUrl}
                alt={title}
                fill
                fallbackSrc={publicEventFallbackImage}
                className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                sizes="(max-width: 768px) 100vw, 40vw"
              />
            </div>
            <div className="flex flex-col p-6 md:p-8">
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-text-700">
                <span className="flex items-center gap-2">
                  <Calendar size={16} aria-hidden="true" />
                  <time dateTime={event.startDate}>
                    {formatDateRange(event.startDate, event.endDate, locale)}
                  </time>
                </span>
                <span className="flex items-center gap-2">
                  <MapPin size={16} aria-hidden="true" />
                  {getLocalizedText(event.location, locale)}
                </span>
              </div>
              <h3 className="mt-4 font-heading text-2xl font-bold leading-tight text-text-900 text-balance">
                <Link
                  href={`/events/${event.slug}`}
                  className="transition-colors hover:text-primary focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                >
                  {title}
                </Link>
              </h3>
              <p className="mt-4 line-clamp-3 max-w-[65ch] text-base leading-7 text-text-800">
                {event.description
                  ? getLocalizedPlainText(event.description, locale).slice(0, 220)
                  : ""}
              </p>
              <div className="mt-7">
                <Link
                  href={`/events/${event.slug}`}
                  className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                >
                  {t("readMore")}
                </Link>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
