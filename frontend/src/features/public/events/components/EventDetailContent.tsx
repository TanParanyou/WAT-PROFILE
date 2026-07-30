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

      <section className="border-y border-primary/15 py-6">
        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-text-800">
          <span className="flex items-center gap-2">
            <Calendar size={16} aria-hidden="true" />
            {formatDateRange(event.start_date, event.end_date, locale)}
          </span>
          {timeRange ? (
            <span className="flex items-center gap-2">
              <Clock size={16} aria-hidden="true" />
              {timeRange}
            </span>
          ) : null}
          <span className="flex items-center gap-2">
            <MapPin size={16} aria-hidden="true" />
            {getLocalizedText(event.location, locale)}
          </span>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {event.map_url ? (
            <a
              href={event.map_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              {t("openMap")}
            </a>
          ) : null}
          <a
            href={calendarUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center rounded-full border border-primary/25 bg-white px-5 py-2.5 text-sm font-semibold text-text-800 transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >
            {t("addToCalendar")}
          </a>
          <EventPrinter event={event} locale={locale} />
          <ShareButton shareLabel={t("share")} copiedLabel={t("copied")} />
        </div>
      </section>

      <section className="mx-auto max-w-3xl">
        {event.description ? (
          <RichTextContent value={event.description} locale={locale} defaultLocale="th" />
        ) : (
          <p className="text-sm text-text-700">{t("note")}</p>
        )}
      </section>

      {scheduleEntries.length > 0 ? (
        <section className="overflow-hidden rounded-2xl border border-primary/15 bg-white">
          <div className="border-b border-primary/15 p-6">
            <h2 className="font-heading text-2xl font-bold text-text-900">{t("schedule")}</h2>
          </div>
          <div className="divide-y divide-primary/10">
            {scheduleEntries.map((schedule) => (
              <div key={schedule.id} className="grid gap-3 p-6 md:grid-cols-[140px_1fr]">
                <div className="font-mono text-sm font-semibold text-primary-700">
                  {formatTimeRange(schedule.start_time, schedule.end_time, locale)}
                </div>
                <div className="text-sm text-text-800">{getLocalizedText(schedule.activity, locale)}</div>
              </div>
            ))}
          </div>
        </section>
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
