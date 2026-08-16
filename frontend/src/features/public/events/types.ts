import type { LocalizedRichTextDto, LocalizedTextDto } from "../shared/api-types";
import type { RegistrationAvailability } from "../event-registration/types";

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
  category?: { id: number; name: LocalizedTextDto; description?: LocalizedTextDto } | null;
  event_type?: string;
  registration_enabled?: boolean;
  registration_deadline?: string | null;
  max_participants?: number | null;
  gallery_urls?: readonly string[];
  online_join_url?: string | null;
  dress_code?: LocalizedTextDto | null;
  what_to_bring?: LocalizedTextDto | null;
  donation_enabled?: boolean;
  contact_phone?: string | null;
  contact_line?: string | null;
  contact_email?: string | null;
  transport_info?: LocalizedTextDto | null;
  schedules?: readonly PublicEventScheduleDto[];
  registration?: RegistrationAvailability;
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
  startTime?: string | null;
  endTime?: string | null;
  imageUrl: string | null;
  location: LocalizedTextDto;
  category?: { id: number; name: LocalizedTextDto; description?: LocalizedTextDto } | null;
  eventType?: string;
  registrationEnabled?: boolean;
  donationEnabled?: boolean;
  onlineJoinUrl?: string | null;
  galleryUrls?: readonly string[];
}

export interface ScheduleGroup {
  daily: readonly PublicScheduleDto[];
  weekly: readonly PublicScheduleDto[];
  online: readonly PublicScheduleDto[];
}
