"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, MapPin, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { usePublicEventQuery, usePublicEventsQuery } from "@/features/public/events/queries";
import { getLocalizedText } from "@/features/public/events/mappers";
import { getLocalizedPlainText } from "@/features/public/shared/rich-text";
import { formatDateRange, formatTimeRange } from "@/utils/formatters";
import { PublicImage } from "@/components/public/media/PublicImage";
import { publicEventFallbackImage } from "@/components/public/media/publicImageFallbacks";
import { useEventAlertSettingsQuery } from "@/features/public/event-alert/api";

export default function EventAlertModal() {
  const locale = useLocale();
  const t = useTranslations("EventsSection");
  const settingsQuery = useEventAlertSettingsQuery();
  const settings = settingsQuery.data;
  
  const specificEventQuery = usePublicEventQuery(settings?.event_slug ?? "");
  const nearestEventQuery = usePublicEventsQuery(1);
  
  let event = undefined;
  if (settings?.enabled) {
    if (settings.event_slug) {
      event = specificEventQuery.data;
    } else {
      event = nearestEventQuery.data?.[0];
    }
  }

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!settings?.enabled || !event || typeof window === "undefined") return;
    const key = `event-alert-dismissed-${event.slug}`;
    const dismissedAt = Number(window.localStorage.getItem(key));
    if (dismissedAt && Date.now() - dismissedAt < settings.dismiss_hours * 60 * 60 * 1000) return;
    const timer = window.setTimeout(() => setIsOpen(true), settings.delay_seconds * 1000);
    return () => window.clearTimeout(timer);
  }, [event, settings]);

  if (!event || !isOpen) return null;
  const close = () => {
    window.localStorage.setItem(`event-alert-dismissed-${event.slug}`, String(Date.now()));
    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label={t("close")} className="absolute inset-0 bg-site-action-hover/70" onClick={close} />
      <div role="dialog" aria-modal="true" className="relative w-full max-w-lg overflow-hidden border border-site-border bg-site-canvas shadow-[0_16px_40px_rgba(36,36,36,0.28)]">
        <button aria-label={t("close")} onClick={close} className="absolute right-4 top-4 z-10 border border-site-on-action bg-site-action/80 p-2 text-site-on-action focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus"><X size={18} /></button>
        <div className="relative h-56 bg-site-surface">
          <PublicImage src={event.image_url} alt={getLocalizedText(event.title, locale)} fill fallbackSrc={publicEventFallbackImage} className="object-cover" />
        </div>
        <div className="space-y-4 p-6">
          <h2 className="text-2xl font-bold tracking-[-0.02em] text-site-foreground">{getLocalizedText(event.title, locale)}</h2>
          <div className="flex flex-wrap gap-4 text-sm text-site-muted">
            <span className="flex items-center gap-1"><Calendar size={15} />{formatDateRange(event.start_date, event.end_date, locale)}</span>
            <span className="flex items-center gap-1"><Clock size={15} />{formatTimeRange(event.start_time, event.end_time, locale)}</span>
            <span className="flex items-center gap-1"><MapPin size={15} />{getLocalizedText(event.location, locale)}</span>
          </div>
          <p className="line-clamp-3 text-sm text-site-body">{event.description ? getLocalizedPlainText(event.description, locale) : ""}</p>
          <Link href={`/events/${event.slug}`} onClick={close} className="block min-h-11 bg-site-action px-6 py-[13px] text-center font-semibold text-site-on-action transition-colors hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus">{t("readMore")}</Link>
        </div>
      </div>
    </div>
  );
}
