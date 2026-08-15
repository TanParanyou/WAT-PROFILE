"use client";

import { useLocale } from "next-intl";
import { useRouter } from "@/navigation";
import { Calendar } from "@/features/calendar/Calendar";
import {
  formatWatEventTime,
  getWatEventBarClass,
  getWatEventLocation,
} from "@/features/calendar/adapters/wat-calendar";
import { useRoutedCalendar } from "@/features/calendar/integrations/next/useRoutedCalendar";
import { CalendarQueryBoundary } from "@/features/calendar/integrations/wat/CalendarQueryBoundary";
import { useClientCalendarLabels } from "@/features/calendar/integrations/wat/useClientCalendarLabels";
import { discoveryPreset } from "@/features/calendar/presets/discovery";
import { useCalendarEntries } from "@/features/calendar/queries";
import type { CalendarEntry, CalendarLocale } from "@/features/calendar/types";

export function PublicCalendarSection() {
  const localeValue = useLocale();
  const locale: CalendarLocale = localeValue === "de" || localeValue === "en" ? localeValue : "th";
  const router = useRouter();
  const controller = useRoutedCalendar({
    scope: "public",
    weekStartsOn: locale === "th" ? 0 : 1,
    initialView: "month",
  });
  const query = useCalendarEntries({ scope: "public", locale, range: controller.visibleRange });
  const labels = useClientCalendarLabels(locale);

  const activateEvent = (event: CalendarEntry) => {
    if (event.detail.href) router.push(event.detail.href);
  };

  const formatEventTime = (event: CalendarEntry, date: string) => formatWatEventTime(event, date, labels.allDay);
  const renderEvent = (event: CalendarEntry) => event.title;
  const getEventBarClass = (
    event: CalendarEntry,
    density: "summary" | "row" | "timeGrid",
  ) => getWatEventBarClass(event, "public", density);

  return (
    <CalendarQueryBoundary query={query} labels={labels}>
      {(data) => (
        <Calendar
          preset={discoveryPreset}
          controller={controller}
          events={data.entries}
          labels={labels}
          variant="public"
          onEventActivate={activateEvent}
          renderEvent={renderEvent}
          formatEventTime={formatEventTime}
          formatEventLocation={getWatEventLocation}
          getEventClassName={getEventBarClass}
          themeClassName="public-theme bg-site-canvas text-site-foreground"
          controlClassName="border border-site-border bg-site-canvas text-site-foreground hover:bg-site-surface"
          activeTabClassName="bg-site-action text-site-on-action"
          inactiveTabClassName="text-site-foreground hover:bg-site-surface"
          focusClassName="focus-visible:outline-site-focus"
        />
      )}
    </CalendarQueryBoundary>
  );
}
