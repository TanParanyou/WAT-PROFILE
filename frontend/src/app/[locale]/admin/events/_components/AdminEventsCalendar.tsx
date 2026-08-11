"use client";

import { format, startOfMonth } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { de, enUS, th } from "date-fns/locale";
import { Link } from "@/navigation";
import type { Event } from "@/types/entities";
import type { CalendarDay, CalendarEvent } from "@/features/calendar/calendar-domain";
import { CalendarMonth } from "@/features/calendar/CalendarMonth";
import type { CalendarLabels } from "@/features/calendar/calendar-copy";
import { getLocalizedText } from "@/features/public/events/mappers";

export type AdminCalendarSourceEvent = Pick<
  Event,
  "id" | "title" | "start_date" | "end_date" | "is_active"
>;

interface AdminEventsCalendarProps {
  events: readonly AdminCalendarSourceEvent[];
  days: readonly CalendarDay[];
  month: Date;
  onMonthChange: (month: Date) => void;
  selectedDate: string;
  onSelectedDateChange: (date: string) => void;
  canUpdate: boolean;
  locale: string;
  labels: CalendarLabels;
  monthLabel: string;
  weekStartsOn: 0 | 1;
  isLoading?: boolean;
}

export function toAdminCalendarEvent(
  event: AdminCalendarSourceEvent,
  canUpdate: boolean,
  locale: string,
): CalendarEvent {
  return {
    id: String(event.id),
    title: getLocalizedText(event.title, locale),
    startDate: event.start_date.slice(0, 10),
    endDate: event.end_date.slice(0, 10),
    href: canUpdate ? `/admin/events/${event.id}` : undefined,
    status: event.is_active ? "active" : "inactive",
  };
}

export function AdminEventsCalendar({
  events,
  days,
  month,
  onMonthChange,
  selectedDate,
  onSelectedDateChange,
  canUpdate,
  locale,
  labels,
  monthLabel,
  weekStartsOn,
  isLoading = false,
}: AdminEventsCalendarProps) {
  const mappedEvents = events.map((event) => toAdminCalendarEvent(event, canUpdate, locale));
  const eventById = new Map(mappedEvents.map((event) => [event.id, event]));
  const dateFnsLocale = locale === "th" ? th : locale === "de" ? de : enUS;

  return (
    <CalendarMonth
      days={days.map((day) => ({
        ...day,
        events: day.events.map((event) => eventById.get(event.id) ?? event),
      }))}
      isLoading={isLoading}
      labels={labels}
      month={month}
      monthLabel={monthLabel || format(month, "LLLL yyyy", { locale: dateFnsLocale })}
      onMonthChange={onMonthChange}
      onSelectedDateChange={onSelectedDateChange}
      renderEvent={(event) => {
        const className = `block min-h-8 w-full truncate border-l-2 px-2 py-1 text-left text-xs transition-colors focus-visible:outline-2 focus-visible:outline-admin-focus ${event.status === "inactive" ? "border-admin-muted bg-admin-surface-muted text-admin-muted line-through" : "border-admin-action bg-admin-surface-muted text-admin-foreground"}`;
        if (!event.href) return <span className={className}>{event.title}</span>;
        return <Link className={className} href={event.href}>{event.title}</Link>;
      }}
      selectedDate={selectedDate}
      variant="admin"
      weekStartsOn={weekStartsOn}
      dateFnsLocale={dateFnsLocale}
      todayMonth={startOfMonth(toZonedTime(new Date(), "Europe/Berlin"))}
    />
  );
}
