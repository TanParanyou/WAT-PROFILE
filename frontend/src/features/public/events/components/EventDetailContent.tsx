"use client";

import React, { useState } from "react";
import Script from "next/script";
import {
  Calendar,
  MapPin,
  Radio,
  ChevronDown,
  ExternalLink,
  Phone,
  MessageCircle,
  Mail,
  Navigation,
  Search,
  Shirt,
  ShoppingBag,
  HeartHandshake,
  ArrowRight,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { formatDateRange, formatTimeRange, toCalendarDateTime } from "@/utils/formatters";
import { EmptyState } from "@/components/public/states/EmptyState";
import { QueryErrorState } from "@/components/public/states/QueryErrorState";
import EventPrinter from "@/components/events/EventPrinter";
import ShareButton from "@/components/common/ShareButton";
import { RichTextContent } from "@/components/admin/rich-text/RichTextContent";
import { PublicImage } from "@/components/public/media/PublicImage";
import { publicEventFallbackImage } from "@/components/public/media/publicImageFallbacks";
import { PublicLightboxModal, type LightboxSlide } from "@/components/public/modal";
import { getLocalizedText } from "../mappers";
import { usePublicEventQuery, usePublicEventsQuery } from "../queries";
import type { PublicEventDto } from "../types";
import { EventDetailSkeleton } from "./EventDetailSkeleton";
import { getLocalizedPlainText } from "@/features/public/shared/rich-text";
import { RegistrationPanel } from "@/features/public/event-registration/components/RegistrationPanel";

interface EventDetailContentProps {
  slug: string;
  initialEvent?: PublicEventDto;
}

export function EventDetailContent({ slug, initialEvent }: EventDetailContentProps) {
  const locale = useLocale();
  const t = useTranslations("EventDetailPage");
  const tState = useTranslations("PublicState");
  const eventQuery = usePublicEventQuery(slug, initialEvent);

  // Fetch upcoming/related events for bottom section
  const relatedEventsQuery = usePublicEventsQuery({ limit: 4 });

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [calendarMenuOpen, setCalendarMenuOpen] = useState(false);

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

  const titleText = getLocalizedText(event.title, locale);
  const locationText = getLocalizedText(event.location, locale);
  const timeRange = formatTimeRange(event.start_time, event.end_time, locale);
  const scheduleEntries = [...(event.schedules || [])].sort(
    (left, right) => left.display_order - right.display_order,
  );

  // Status computation
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventStartDate = new Date(event.start_date);
  eventStartDate.setHours(0, 0, 0, 0);
  const eventEndDate = new Date(event.end_date);
  eventEndDate.setHours(23, 59, 59, 999);

  const isToday = today >= eventStartDate && today <= eventEndDate;
  const isPast = today > eventEndDate;
  const diffTime = eventStartDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isUpcoming = diffDays > 0;

  // Calendar Links
  const googleCalendarUrl = buildGoogleCalendarUrl(event, locale);
  const outlookCalendarUrl = buildOutlookCalendarUrl(event, locale);

  const handleDownloadIcs = () => {
    const icsContent = buildIcsContent(event, locale);
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute("download", `${event.slug || "event"}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Structured Data (JSON-LD)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: titleText,
    startDate: event.start_date,
    endDate: event.end_date,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: event.online_join_url
      ? "https://schema.org/MixedEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: locationText,
      address: {
        "@type": "PostalAddress",
        addressLocality: locationText,
      },
    },
    image: event.image_url ? [event.image_url] : undefined,
    description: event.description ? getLocalizedPlainText(event.description, locale) : undefined,
  };

  const otherEvents = (relatedEventsQuery.data || []).filter(
    (item: PublicEventDto) => item.slug !== event.slug,
  );

  const galleryImages = (event.gallery_urls || []).filter((url) => !!url);
  const dressCode = event.dress_code ? getLocalizedText(event.dress_code, locale) : "";
  const whatToBring = event.what_to_bring ? getLocalizedText(event.what_to_bring, locale) : "";
  const transportInfo = event.transport_info ? getLocalizedText(event.transport_info, locale) : "";

  const categoryName = event.category?.name
    ? getLocalizedText(event.category.name, locale)
    : (event.event_type ? (t.has(`types.${event.event_type}`) ? t(`types.${event.event_type}`) : event.event_type) : undefined);

  return (
    <div className="w-full">
      {/* Schema.org Structured Data */}
      <Script
        id={`event-ld-${event.id}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 1. Status Badges & Action Bar */}
      <section className="border-b border-site-border pb-6 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status Badges Row */}
          <div className="flex flex-wrap items-center gap-2">
            {categoryName && (
              <span className="inline-flex items-center gap-1.5 border border-site-border bg-site-surface px-2.5 py-1 text-xs font-semibold text-site-foreground uppercase tracking-wide">
                {categoryName}
              </span>
            )}
            {isToday && (
              <span className="inline-flex items-center gap-1.5 border border-site-border bg-site-action px-2.5 py-1 text-xs font-semibold text-site-on-action">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                {t("statusToday")}
              </span>
            )}
            {!isToday && isUpcoming && (
              <span className="inline-flex items-center gap-1.5 border border-site-border bg-site-surface px-2.5 py-1 text-xs font-semibold text-site-accent">
                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                {t("statusUpcoming")} {diffDays > 0 ? `(${t("daysRemaining", { days: diffDays })})` : ""}
              </span>
            )}
            {isPast && (
              <span className="inline-flex items-center gap-1.5 border border-site-border bg-site-surface px-2.5 py-1 text-xs font-semibold text-site-muted">
                {t("statusPast")}
              </span>
            )}

            {event.online_join_url && (
              <span className="inline-flex items-center gap-1.5 border border-red-700 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">
                <Radio size={12} className="animate-pulse" />
                {t("hasLive")}
              </span>
            )}

            {event.registration_enabled && (
              <span className="inline-flex items-center gap-1.5 border border-site-border bg-site-surface px-2.5 py-1 text-xs font-semibold text-site-foreground">
                {t("registrationTitle")}
              </span>
            )}

            {event.donation_enabled && (
              <span className="inline-flex items-center gap-1.5 border border-site-border bg-site-surface px-2.5 py-1 text-xs font-semibold text-site-accent">
                {t("donationTitle")}
              </span>
            )}
          </div>

          {/* Action Buttons: Unified min-h-11, same padding, and SVG icons */}
          <div className="flex flex-wrap items-center gap-2">
            {event.map_url ? (
              <a
                href={event.map_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center gap-2 border border-site-border bg-site-action px-4 py-2.5 text-xs font-semibold text-site-on-action transition-colors hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus"
              >
                <Navigation size={15} aria-hidden="true" />
                {t("openMap")}
              </a>
            ) : null}

            {/* Add to Calendar Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setCalendarMenuOpen(!calendarMenuOpen)}
                className="inline-flex min-h-11 items-center gap-2 border border-site-border bg-site-canvas px-4 py-2.5 text-xs font-semibold text-site-foreground transition-colors hover:bg-site-surface hover:text-site-accent focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus"
              >
                <Calendar size={15} aria-hidden="true" />
                <span>{t("addToCalendar")}</span>
                <ChevronDown size={14} aria-hidden="true" />
              </button>

              {calendarMenuOpen && (
                <div className="absolute left-0 top-full z-40 mt-1 w-56 border border-site-border bg-site-canvas shadow-lg">
                  <a
                    href={googleCalendarUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setCalendarMenuOpen(false)}
                    className="block px-3.5 py-2.5 text-xs font-medium text-site-foreground hover:bg-site-surface hover:text-site-accent"
                  >
                    {t("googleCalendar")}
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      handleDownloadIcs();
                      setCalendarMenuOpen(false);
                    }}
                    className="block w-full text-left px-3.5 py-2.5 text-xs font-medium text-site-foreground hover:bg-site-surface hover:text-site-accent border-t border-site-border"
                  >
                    {t("appleCalendar")}
                  </button>
                  <a
                    href={outlookCalendarUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setCalendarMenuOpen(false)}
                    className="block px-3.5 py-2.5 text-xs font-medium text-site-foreground hover:bg-site-surface hover:text-site-accent border-t border-site-border"
                  >
                    {t("outlookCalendar")}
                  </a>
                </div>
              )}
            </div>

            <EventPrinter event={event} locale={locale} />
            <ShareButton shareLabel={t("share")} copiedLabel={t("copied")} />
          </div>
        </div>
      </section>

      {/* 2. Main Grid (Content & Sidebar) */}
      <div className="grid gap-10 lg:grid-cols-12 items-start">
        {/* Left Column: Narrative, Live Stream, Poster, Timeline, Gallery */}
        <div className="space-y-10 lg:col-span-8">
          {/* Live Streaming Banner if available */}
          {event.online_join_url && (
            <div className="border border-red-700 bg-red-50 p-6 dark:bg-red-950/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="flex items-center gap-2 font-heading text-lg font-bold text-red-900 dark:text-red-200">
                    <Radio size={20} className="text-red-600 animate-pulse" />
                    {t("liveBannerTitle")}
                  </h3>
                  <p className="mt-1 text-sm text-red-800 dark:text-red-300">
                    {t("liveBannerDesc")}
                  </p>
                </div>
                <a
                  href={event.online_join_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center justify-center gap-2 border border-red-800 bg-red-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-800 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-red-600 whitespace-nowrap"
                >
                  <ExternalLink size={16} />
                  {t("watchLive")}
                </a>
              </div>
            </div>
          )}

          {/* Main Cover / Poster preview with zoom option */}
          {event.image_url && (
            <div
              onClick={() => setLightboxIndex(0)}
              className="group relative aspect-video sm:aspect-[21/9] w-full cursor-pointer overflow-hidden bg-site-canvas"
            >
              <PublicImage
                src={event.image_url}
                alt={titleText}
                fill
                fallbackSrc={publicEventFallbackImage}
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 66vw"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="inline-flex items-center gap-1.5 border border-white bg-black/70 px-4 py-2 text-xs font-semibold text-white">
                  <Search size={14} aria-hidden="true" />
                  {t("zoomPoster")}
                </span>
              </div>
            </div>
          )}

          {/* Main Event Description */}
          {event.description ? (
            <article className="space-y-4">
              <div className="max-w-none text-base leading-relaxed text-site-body">
                <RichTextContent value={event.description} locale={locale} defaultLocale="th" />
              </div>
            </article>
          ) : null}

          {/* Dress Code & What to bring cards */}
          {(dressCode || whatToBring) && (
            <section className="space-y-4">
              <h3 className="font-heading text-xl font-medium text-site-foreground border-b border-site-border pb-2">
                {t("guidelines")}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {dressCode && (
                  <div className="border border-site-border bg-site-canvas p-5">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-site-accent mb-2">
                      <Shirt size={16} className="text-site-accent shrink-0" aria-hidden="true" />
                      {t("dressCodeTitle")}
                    </h4>
                    <p className="text-sm leading-relaxed text-site-body">{dressCode}</p>
                  </div>
                )}
                {whatToBring && (
                  <div className="border border-site-border bg-site-canvas p-5">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-site-accent mb-2">
                      <ShoppingBag size={16} className="text-site-accent shrink-0" aria-hidden="true" />
                      {t("whatToBringTitle")}
                    </h4>
                    <p className="text-sm leading-relaxed text-site-body">{whatToBring}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Step Timeline Schedule Section */}
          {scheduleEntries.length > 0 && (
            <section className="border border-site-border bg-site-canvas overflow-hidden">
              <div className="border-b border-site-border bg-site-surface p-5 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-heading text-xl font-bold text-site-foreground">
                  {t("schedule")}
                </h3>
                <span className="text-xs text-site-muted">{t("scheduleSubtitle")}</span>
              </div>
              <div className="p-6 space-y-6">
                {scheduleEntries.map((schedule, idx) => (
                  <div key={schedule.id} className="grid grid-cols-[85px_24px_1fr] sm:grid-cols-[110px_24px_1fr] gap-4 items-start">
                    <div className="text-sm font-mono font-bold text-site-accent">
                      {formatTimeRange(schedule.start_time, schedule.end_time, locale)}
                    </div>
                    <div className="flex flex-col items-center h-full">
                      <div className="h-3 w-3 border-2 border-site-border bg-site-canvas" />
                      {idx !== scheduleEntries.length - 1 && (
                        <div className="w-[1px] bg-site-border flex-grow min-h-6 my-1" />
                      )}
                    </div>
                    <div className="text-sm text-site-body leading-relaxed">
                      {getLocalizedText(schedule.activity, locale)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-dashed border-site-border bg-site-surface/50 p-4 text-xs text-site-muted italic">
                {t("note")}
              </div>
            </section>
          )}

          {/* Additional Gallery Images Section */}
          {galleryImages.length > 0 && (
            <section className="space-y-4">
              <h3 className="font-heading text-xl font-medium text-site-foreground border-b border-site-border pb-2">
                {t("galleryTitle")}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {galleryImages.map((imgUrl, index) => {
                  const targetIndex = event.image_url ? index + 1 : index;
                  return (
                    <div
                      key={index}
                      onClick={() => setLightboxIndex(targetIndex)}
                      className="group relative aspect-video cursor-pointer overflow-hidden border border-site-border bg-site-surface"
                    >
                      <PublicImage
                        src={imgUrl}
                        alt={`${titleText} ${index + 1}`}
                        fill
                        fallbackSrc={publicEventFallbackImage}
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="inline-flex items-center justify-center p-1.5 text-white bg-black/60 border border-white/20">
                          <Search size={14} aria-hidden="true" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Sidebar Action & Info Cards */}
        <aside className="space-y-6 lg:col-span-4">
          {/* Registration Card */}
          <RegistrationPanel slug={event.slug} availability={event.registration} />

          {/* Donation Support Card */}
          {event.donation_enabled && (
            <div className="border border-site-border bg-site-surface p-6 space-y-4">
              <h3 className="font-heading text-lg font-bold text-site-foreground flex items-center gap-2">
                <HeartHandshake size={18} className="text-site-accent shrink-0" aria-hidden="true" />
                {t("donationTitle")}
              </h3>
              <p className="text-xs text-site-body leading-relaxed">
                {t("donationDesc")}
              </p>
              <Link
                href="/donate/report"
                className="inline-flex min-h-11 w-full items-center justify-center border border-site-border bg-site-canvas px-4 py-2.5 text-sm font-semibold text-site-foreground transition-colors hover:bg-site-surface hover:text-site-accent focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus"
              >
                {t("makeDonation")}
              </Link>
            </div>
          )}

          {/* Transport Info Card */}
          {transportInfo && (
            <div className="border border-site-border bg-site-canvas p-6 space-y-3">
              <h3 className="font-heading text-base font-bold text-site-foreground flex items-center gap-2">
                <Navigation size={16} className="text-site-accent" />
                {t("transportTitle")}
              </h3>
              <p className="text-xs text-site-body leading-relaxed whitespace-pre-line">
                {transportInfo}
              </p>
            </div>
          )}

          {/* Event Quick Contacts Card */}
          {(event.contact_phone || event.contact_line || event.contact_email) && (
            <div className="border border-site-border bg-site-canvas p-6 space-y-4">
              <h3 className="font-heading text-base font-bold text-site-foreground">
                {t("contactInquiry")}
              </h3>
              <ul className="space-y-2.5 text-xs text-site-body">
                {event.contact_phone && (
                  <li className="flex items-center gap-2.5">
                    <Phone size={14} className="text-site-accent shrink-0" />
                    <a href={`tel:${event.contact_phone}`} className="hover:text-site-accent hover:underline">
                      {event.contact_phone}
                    </a>
                  </li>
                )}
                {event.contact_line && (
                  <li className="flex items-center gap-2.5">
                    <MessageCircle size={14} className="text-site-accent shrink-0" />
                    <span className="font-mono">{event.contact_line}</span>
                  </li>
                )}
                {event.contact_email && (
                  <li className="flex items-center gap-2.5">
                    <Mail size={14} className="text-site-accent shrink-0" />
                    <a href={`mailto:${event.contact_email}`} className="hover:text-site-accent hover:underline">
                      {event.contact_email}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Location & Maps Preview Card */}
          {locationText && (
            <div className="border border-site-border bg-site-canvas p-6 space-y-3">
              <h3 className="font-heading text-base font-bold text-site-foreground flex items-center gap-2">
                <MapPin size={16} className="text-site-accent" />
                {locationText}
              </h3>
              {event.map_url && (
                <a
                  href={event.map_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-site-accent hover:underline"
                >
                  <Navigation size={12} />
                  <span>{t("openMap")}</span>
                  <ArrowRight size={13} />
                </a>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* 4. Related & Upcoming Events Section */}
      {otherEvents.length > 0 && (
        <section className="border-t border-site-border pt-12 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-2xl font-bold text-site-foreground">
              {t("relatedEvents")}
            </h3>
            <Link
              href="/events"
              className="text-sm font-semibold text-site-accent hover:underline flex items-center gap-1"
            >
              <span>{t("viewAllEvents")}</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {otherEvents.map((item) => {
              const itemTitle = getLocalizedText(item.title, locale);
              return (
                <article
                  key={item.slug}
                  className="group flex flex-col border border-site-border bg-site-canvas overflow-hidden"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-site-surface">
                    <PublicImage
                      src={item.image_url}
                      alt={itemTitle}
                      fill
                      fallbackSrc={publicEventFallbackImage}
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-5 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-site-accent">
                      <Calendar size={13} />
                      {formatDateRange(item.start_date, item.end_date, locale)}
                    </div>
                    <h4 className="font-heading text-lg font-semibold text-site-foreground leading-snug">
                      <Link
                        href={`/events/${item.slug}`}
                        className="hover:text-site-accent transition-colors"
                      >
                        {itemTitle}
                      </Link>
                    </h4>
                    <div className="mt-auto pt-2">
                      <Link
                        href={`/events/${item.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-site-accent hover:underline"
                      >
                        <span>{t("backToEvents")}</span>
                        <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. Central Lightbox Modal with Carousel, Event Info Panel and Thumbnails */}
      {(() => {
        const slides: LightboxSlide[] = [];
        const eventDesc = event.description
          ? getLocalizedPlainText(event.description, locale)
          : undefined;
        const eventCategory = categoryName;

        const eventMeta = {
          date: formatDateRange(event.start_date, event.end_date, locale),
          time: timeRange || undefined,
          location: locationText || undefined,
          category: eventCategory,
          dressCode: event.dress_code
            ? getLocalizedText(event.dress_code, locale)
            : undefined,
          whatToBring: event.what_to_bring
            ? getLocalizedText(event.what_to_bring, locale)
            : undefined,
        };

        if (event.image_url) {
          slides.push({
            src: event.image_url,
            alt: titleText,
            title: titleText,
            description: eventDesc || t("posterModalTitle"),
            meta: eventMeta,
          });
        }
        galleryImages.forEach((imgUrl, i) => {
          slides.push({
            src: imgUrl,
            alt: `${titleText} ${i + 1}`,
            title: `${titleText} - ${t("galleryTitle")} (${i + 1}/${galleryImages.length})`,
            description: eventDesc,
            meta: eventMeta,
          });
        });

        return (
          <PublicLightboxModal
            open={lightboxIndex !== null}
            initialIndex={lightboxIndex ?? 0}
            onClose={() => setLightboxIndex(null)}
            slides={slides}
            closeLabel={t("close") || "Close"}
          />
        );
      })()}
    </div>
  );
}

// Helpers for Calendar links
function buildGoogleCalendarUrl(event: PublicEventDto, locale: string): string {
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

function buildOutlookCalendarUrl(event: PublicEventDto, locale: string): string {
  const params = new URLSearchParams();
  params.set("path", "/calendar/action/compose");
  params.set("rru", "addevent");
  params.set("subject", getLocalizedText(event.title, locale));
  params.set("body", event.description ? getLocalizedPlainText(event.description, locale) : "");
  params.set("startdt", `${event.start_date}T${event.start_time || "09:00:00"}`);
  params.set("enddt", `${event.end_date}T${event.end_time || "17:00:00"}`);

  const location = getLocalizedText(event.location, locale);
  if (location) {
    params.set("location", location);
  }

  return `https://outlook.live.com/calendar/0/action/compose?${params.toString()}`;
}

function buildIcsContent(event: PublicEventDto, locale: string): string {
  const title = getLocalizedText(event.title, locale);
  const description = event.description ? getLocalizedPlainText(event.description, locale) : "";
  const location = getLocalizedText(event.location, locale);

  const start = toCalendarDateTime(event.start_date, event.start_time);
  const end = toCalendarDateTime(event.end_date, event.end_time ?? event.start_time);

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Wat Loung Por Sai//Event Calendar//TH",
    "BEGIN:VEVENT",
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/\n/g, "\\n")}`,
    `LOCATION:${location}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
