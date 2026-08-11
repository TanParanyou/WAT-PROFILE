import type { LocalizedRichTextDto, LocalizedTextDto } from "../shared/api-types";

export interface PublicEventScheduleDto {
  id: number;
  start_time: string;
  end_time: string;
  activity: LocalizedTextDto;
  display_order: number;
}

export interface PublicEventDto {
  id: number;
  slug: string;
  title: LocalizedTextDto;
  description: LocalizedRichTextDto | null;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  location: LocalizedTextDto;
  image_url: string | null;
  map_url: string | null;
  schedules?: readonly PublicEventScheduleDto[];
}

export interface PublicEventsListOptions {
  limit?: number;
  from?: string;
  to?: string;
}

export interface PublicScheduleDto {
  id: number;
  schedule_type: "daily" | "weekly" | "online";
  day_of_week: number | null;
  time_start: string | null;
  time_end: string | null;
  activity: LocalizedTextDto;
  location: LocalizedTextDto;
  online_link: string | null;
  display_order: number;
}

export interface EventListItem {
  slug: string;
  title: LocalizedTextDto;
  description: LocalizedRichTextDto | null;
  startDate: string;
  endDate: string;
  imageUrl: string | null;
  location: LocalizedTextDto;
}

export interface ScheduleGroup {
  daily: readonly PublicScheduleDto[];
  weekly: readonly PublicScheduleDto[];
  online: readonly PublicScheduleDto[];
}
