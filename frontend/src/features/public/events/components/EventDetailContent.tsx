"use client";

import Script from "next/script";
import { Calendar, Clock, MapPin } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatDateRange, formatTimeRange } from "@/utils/formatters";
import { EmptyState } from "@/components/public/states/EmptyState";
import { QueryErrorState } from "@/components/public/states/QueryErrorState";
import EventPrinter from "@/components/events/EventPrinter";
import ShareButton from "@/components/common/ShareButton";
import { RichTextContent } from "@/components/admin/rich-text/RichTextContent";
import { getLocalizedText } from "../mappers";
import { usePublicEventQuery } from "../queries";
import type { PublicEventDto } from "../types";
import { EventDetailSkeleton } from "./EventDetailSkeleton";
import { getLocalizedPlainText } from "@/features/public/shared/rich-text";
import { PublicImage } from "@/components/public/media/PublicImage";
import { publicEventFallbackImage } from "@/components/public/media/publicImageFallbacks";

interface EventDetailContentProps {
  slug: string;
  initialEvent?: PublicEventDto;
}

export function EventDetailContent({ slug, initialEvent }: EventDetailContentProps) {
  const locale = useLocale();
  const t = useTranslations("EventDetailPage");
  const tState = useTranslations("PublicState");
  const eventQuery = usePublicEventQuery(slug, initialEvent);

  if (eventQuery.isLoading) {
    return <EventDetailSkeleton />;
  }

  if (eventQuery.isError) {
    return (
      <QueryErrorState
        title={tState("errorTitle")}
        description={tState("errorDescription")}
        retryLabel={tState("retry")}
        onRetry={() => eventQuery.refetch()}
        isRetrying={eventQuery.isFetching}
      />
    );
  }

  const event = eventQuery.data;

  if (!event) {
    return <EmptyState title={tState("emptyEvents")} description={tState("emptyContent")} />;
  }

  const image = event.image_url;
  const description = event.description ? getLocalizedPlainText(event.description, locale) : "";
  const timeRange = formatTimeRange(event.start_time, event.end_time, locale);
  const calendarUrl = buildCalendarUrl(event, locale);
  const scheduleEntries = [...event.schedules].sort((left, right) => left.display_order - right.display_order);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: getLocalizedText(event.title, locale),
    startDate: event.start_date,
    endDate: event.end_date,
    location: {
      "@type": "Place",
      name: getLocalizedText(event.location, locale),
    },
    description,
    ...(image ? { image: [image] } : {}),
  };

  return (
    <div className="space-y-8">
      <Script
        id={`event-json-ld-${event.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <div className="relative aspect-video bg-gray-100">
          <PublicImage
            src={image}
            alt={getLocalizedText(event.title, locale)}
            fill
            fallbackSrc={publicEventFallbackImage}
            className="object-cover"
          />
        </div>
        <div className="border-t border-gray-100 p-6 md:p-8">
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <Calendar size={16} />
              {formatDateRange(event.start_date, event.end_date, locale)}
            </span>
            {timeRange ? (
              <span className="flex items-center gap-2">
                <Clock size={16} />
                {timeRange}
              </span>
            ) : null}
            <span className="flex items-center gap-2">
              <MapPin size={16} />
              {getLocalizedText(event.location, locale)}
            </span>
          </div>
          <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold text-gray-900">{getLocalizedText(event.title, locale)}</h2>
              <div className="mt-6">
                {event.description ? (
                  <RichTextContent value={event.description} locale={locale} defaultLocale="th" />
                ) : (
                  <p className="text-sm text-gray-500">{t("note")}</p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              {event.map_url ? (
                <a
                  href={event.map_url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-100"
                >
                  {t("openMap")}
                </a>
              ) : null}
              <a
                href={calendarUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                {t("addToCalendar")}
              </a>
              <EventPrinter event={event} locale={locale} />
              <ShareButton />
            </div>
          </div>
        </div>
      </div>

      {scheduleEntries.length > 0 ? (
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-6">
            <h3 className="text-2xl font-bold text-gray-900">{t("schedule")}</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {scheduleEntries.map((schedule) => (
              <div key={schedule.id} className="grid gap-3 p-6 md:grid-cols-[140px_1fr]">
                <div className="font-mono text-sm font-semibold text-amber-700">
                  {formatTimeRange(schedule.start_time, schedule.end_time, locale)}
                </div>
                <div className="text-sm text-gray-700">{getLocalizedText(schedule.activity, locale)}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function buildCalendarUrl(event: PublicEventDto, locale: string): string {
  const params = new URLSearchParams();
  params.set("action", "TEMPLATE");
  params.set("text", getLocalizedText(event.title, locale));
  params.set("details", event.description ? getLocalizedPlainText(event.description, locale) : "");

  const start = toCalendarDateTime(event.start_date, event.start_time);
  const end = toCalendarDateTime(event.end_date, event.end_time ?? event.start_time);
  params.set("dates", `${start}/${end}`);

  const location = getLocalizedText(event.location, locale);
  if (location) {
    params.set("location", location);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function toCalendarDateTime(date: string, time: string | null): string {
  const [year, month, day] = date.split("-");

  if (!time) {
    return `${year}${month}${day}`;
  }

  const [hour = "00", minute = "00", second = "00"] = time.split(":");
  return `${year}${month}${day}T${hour}${minute}${second}`;
}
