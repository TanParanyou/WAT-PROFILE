"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, MapPin, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { usePublicEventsQuery } from "@/features/public/events/queries";
import { getLocalizedText } from "@/features/public/events/mappers";
import { getLocalizedPlainText } from "@/features/public/shared/rich-text";
import { formatDateRange, formatTimeRange } from "@/utils/formatters";
import { PublicImage } from "@/components/public/media/PublicImage";
import { publicEventFallbackImage } from "@/components/public/media/publicImageFallbacks";
import { fetchEventAlertSettings, type EventAlertSettings } from "@/features/public/event-alert/api";

export default function EventAlertModal() {
  const locale = useLocale();
  const t = useTranslations("EventsSection");
  const query = usePublicEventsQuery(3);
  const [settings, setSettings] = useState<EventAlertSettings | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const event = settings?.event_id ? query.data?.find((item) => item.id === settings.event_id) : undefined;

  useEffect(() => { void fetchEventAlertSettings().then(setSettings).catch(() => setSettings(null)); }, []);

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
      <button aria-label={t("close")} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />
      <div role="dialog" aria-modal="true" className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-zinc-900">
        <button aria-label={t("close")} onClick={close} className="absolute right-4 top-4 z-10 rounded-full bg-black/30 p-2 text-white"><X size={18} /></button>
        <div className="relative h-56 bg-zinc-200">
          <PublicImage src={event.image_url} alt={getLocalizedText(event.title, locale)} fill fallbackSrc={publicEventFallbackImage} className="object-cover" />
        </div>
        <div className="space-y-4 p-6">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">{getLocalizedText(event.title, locale)}</h2>
          <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
            <span className="flex items-center gap-1"><Calendar size={15} />{formatDateRange(event.start_date, event.end_date, locale)}</span>
            <span className="flex items-center gap-1"><Clock size={15} />{formatTimeRange(event.start_time, event.end_time, locale)}</span>
            <span className="flex items-center gap-1"><MapPin size={15} />{getLocalizedText(event.location, locale)}</span>
          </div>
          <p className="line-clamp-3 text-sm text-zinc-600 dark:text-zinc-300">{event.description ? getLocalizedPlainText(event.description, locale) : ""}</p>
          <Link href={`/events/${event.slug}`} onClick={close} className="block rounded-xl bg-primary py-3 text-center font-semibold text-white">{t("readMore")}</Link>
        </div>
      </div>
    </div>
  );
}
