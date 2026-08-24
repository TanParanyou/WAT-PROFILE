import { Calendar, Clock, MapPin, Radio, UserCheck, HeartHandshake } from "lucide-react";
import { Link } from "@/navigation";
import { useLocale, useTranslations } from "next-intl";
import { formatDateRange, formatTimeRange } from "@/utils/formatters";
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
    <div className="grid border-t border-site-border">
      {events.map((event) => {
        const title = getLocalizedText(event.title, locale);
        const timeRange = formatTimeRange(event.startTime, event.endTime, locale);

        return (
          <article
            key={event.slug}
            className="group grid overflow-hidden border-b border-site-border bg-site-canvas md:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.2fr)]"
          >
            <div className="relative min-h-60 overflow-hidden bg-site-surface md:min-h-full">
              <PublicImage
                src={event.imageUrl}
                alt={title}
                fill
                fallbackSrc={publicEventFallbackImage}
                className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                sizes="(max-width: 768px) 100vw, 40vw"
              />
              {(() => {
                const categoryLabel = event.category?.name
                  ? getLocalizedText(event.category.name, locale)
                  : (event.eventType ? (t.has(`types.${event.eventType}`) ? t(`types.${event.eventType}`) : event.eventType) : null);
                if (!categoryLabel) return null;
                return (
                  <div className="absolute top-3 left-3 z-10">
                    <span className="bg-black/75 text-white text-[11px] font-semibold px-2.5 py-1 uppercase tracking-wider border border-white/20 backdrop-blur-sm">
                      {categoryLabel}
                    </span>
                  </div>
                );
              })()}
            </div>
            <div className="flex flex-col p-6 md:p-8">
              {/* Badges / Tags */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {event.onlineJoinUrl && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-site-danger-surface text-site-danger px-2 py-0.5 border border-site-danger">
                    <Radio size={11} className="animate-pulse text-site-danger" />
                    {t("liveStreaming")}
                  </span>
                )}
                {event.registrationEnabled && (() => {
                  const isClosed = event.registrationDeadline
                    ? new Date(event.registrationDeadline).getTime() < Date.now()
                    : false;

                  if (isClosed) {
                    return (
                      <span className="inline-flex min-h-9 items-center gap-1 border border-site-border/60 bg-site-surface/50 px-2.5 py-1 text-[11px] font-medium text-site-muted">
                        <UserCheck size={11} />
                        {t("registrationClosed")}
                      </span>
                    );
                  }

                  return (
                    <Link
                      href={`/events/${event.slug}/register`}
                      className="inline-flex min-h-9 items-center gap-1 border border-site-border bg-site-surface px-2.5 py-1 text-[11px] font-medium text-site-accent transition-colors hover:bg-site-canvas focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus"
                      aria-label={t("registrationOpen")}
                    >
                      <UserCheck size={11} />
                      {t("registrationOpen")}
                    </Link>
                  );
                })()}
                {event.donationEnabled && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-site-surface text-site-foreground px-2 py-0.5 border border-site-border">
                    <HeartHandshake size={11} className="text-site-accent" />
                    {t("donationSupport")}
                  </span>
                )}
              </div>

              {/* Event Metadata */}
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-site-muted">
                <span className="flex items-center gap-1.5 font-medium text-site-foreground">
                  <Calendar size={15} className="text-site-accent" aria-hidden="true" />
                  <time dateTime={event.startDate}>
                    {formatDateRange(event.startDate, event.endDate, locale)}
                  </time>
                </span>
                {timeRange && (
                  <span className="flex items-center gap-1.5 text-site-muted">
                    <Clock size={15} aria-hidden="true" />
                    <span>{timeRange}</span>
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-site-muted">
                  <MapPin size={15} aria-hidden="true" />
                  <span>{getLocalizedText(event.location, locale)}</span>
                </span>
              </div>

              <h3 className="mt-3 font-heading text-2xl font-semibold leading-tight text-site-foreground text-balance">
                <Link
                  href={`/events/${event.slug}`}
                  className="transition-colors hover:text-site-accent focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus"
                >
                  {title}
                </Link>
              </h3>

              <p className="mt-3 line-clamp-3 max-w-[65ch] text-base leading-7 text-site-body">
                {event.description
                  ? getLocalizedPlainText(event.description, locale).slice(0, 220)
                  : ""}
              </p>

              <div className="mt-6 pt-2">
                <Link
                  href={`/events/${event.slug}`}
                  className="inline-flex min-h-11 items-center bg-site-action px-5 py-[13px] text-sm font-semibold text-site-on-action transition-colors hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus"
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
