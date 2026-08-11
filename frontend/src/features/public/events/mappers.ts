import type { LocalizedTextDto } from "../shared/api-types";
import type { CalendarEvent } from "@/features/calendar/calendar-domain";
import type { EventListItem, PublicEventDto, PublicScheduleDto, ScheduleGroup } from "./types";

export function toEventListItem(event: PublicEventDto): EventListItem {
  return {
    slug: event.slug,
    title: event.title,
    description: event.description,
    startDate: event.start_date,
    endDate: event.end_date,
    imageUrl: event.image_url,
    location: event.location,
  };
}

export function toPublicCalendarEvent(
  event: PublicEventDto,
  locale: string,
): CalendarEvent {
  return {
    id: String(event.id),
    title: getLocalizedText(event.title, locale),
    startDate: event.start_date.slice(0, 10),
    endDate: event.end_date.slice(0, 10),
    href: `/events/${event.slug}`,
  };
}

export function groupSchedules(schedules: readonly PublicScheduleDto[]): ScheduleGroup {
  return {
    daily: schedules.filter((schedule) => schedule.schedule_type === "daily"),
    weekly: schedules.filter((schedule) => schedule.schedule_type === "weekly"),
    online: schedules.filter((schedule) => schedule.schedule_type === "online"),
  };
}

export function getLocalizedText(value: LocalizedTextDto, locale: string): string {
  return value[locale as keyof LocalizedTextDto] || value.th || value.en || value.de;
}
