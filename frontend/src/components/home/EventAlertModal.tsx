"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, MapPin } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { usePublicEventsQuery } from "@/features/public/events/queries";
import { getLocalizedText } from "@/features/public/events/mappers";
import { getLocalizedPlainText } from "@/features/public/shared/rich-text";
import { formatDateRange, formatTimeRange } from "@/utils/formatters";
import { PublicImage } from "@/components/public/media/PublicImage";
import { publicEventFallbackImage } from "@/components/public/media/publicImageFallbacks";
import { useEventAlertSettingsQuery } from "@/features/public/event-alert/api";
import { AccessibleDialog } from "@/components/ui/AccessibleDialog";

export default function EventAlertModal() {
  const locale = useLocale();
  const t = useTranslations("EventsSection");
  const query = usePublicEventsQuery(3);
  const settingsQuery = useEventAlertSettingsQuery();
  const settings = settingsQuery.data;
  const [isOpen, setIsOpen] = useState(false);
  const event = settings?.event_id ? query.data?.find((item) => item.id === settings.event_id) : undefined;

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
    <AccessibleDialog
      isOpen={isOpen}
      onClose={close}
      title={getLocalizedText(event.title, locale)}
      closeLabel={t("close")}
      className="overflow-hidden"
    >
      <div className="relative h-56 bg-zinc-200">
        <PublicImage src={event.image_url} alt={getLocalizedText(event.title, locale)} fill fallbackSrc={publicEventFallbackImage} className="object-cover" />
      </div>
      <div className="space-y-4 p-6">
        <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{getLocalizedText(event.title, locale)}</h3>
        <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
          <span className="flex items-center gap-1"><Calendar aria-hidden="true" size={15} />{formatDateRange(event.start_date, event.end_date, locale)}</span>
          <span className="flex items-center gap-1"><Clock aria-hidden="true" size={15} />{formatTimeRange(event.start_time, event.end_time, locale)}</span>
          <span className="flex items-center gap-1"><MapPin aria-hidden="true" size={15} />{getLocalizedText(event.location, locale)}</span>
        </div>
        <p className="line-clamp-3 text-sm text-zinc-600 dark:text-zinc-300">{event.description ? getLocalizedPlainText(event.description, locale) : ""}</p>
        <Link href={`/events/${event.slug}`} onClick={close} className="block min-h-11 rounded-xl bg-primary py-3 text-center font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{t("readMore")}</Link>
      </div>
    </AccessibleDialog>
  );
}
