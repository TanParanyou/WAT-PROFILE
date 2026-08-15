import type { LocalizedTextDto } from "../shared/api-types";
import type { EventListItem, PublicEventDto, PublicScheduleDto, ScheduleGroup } from "./types";

export function toEventListItem(event: PublicEventDto): EventListItem {
  return {
    slug: event.slug,
    title: event.title,
    description: event.description,
    startDate: event.start_date,
    endDate: event.end_date,
    startTime: event.start_time,
    endTime: event.end_time,
    imageUrl: event.image_url,
    location: event.location,
    eventType: event.event_type,
    registrationEnabled: event.registration_enabled,
    donationEnabled: event.donation_enabled,
    onlineJoinUrl: event.online_join_url,
    galleryUrls: event.gallery_urls,
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
