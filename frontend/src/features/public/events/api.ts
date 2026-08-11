import { publicApi } from "@/services/publicService";
import { unwrapApiData, type ApiSuccess } from "../shared/api-types";
import type {
  PublicEventDto,
  PublicEventsListOptions,
  PublicScheduleDto,
} from "./types";

export async function fetchPublicEvents(
  options: PublicEventsListOptions = {},
): Promise<PublicEventDto[]> {
  const params = {
    ...(options.limit ? { limit: options.limit } : {}),
    ...(options.from ? { from: options.from } : {}),
    ...(options.to ? { to: options.to } : {}),
  };
  const response = await publicApi.get<ApiSuccess<PublicEventDto[]>>("/events", {
    params: Object.keys(params).length > 0 ? params : undefined,
  });
  return unwrapApiData(response.data);
}

export async function fetchPublicEventBySlug(slug: string): Promise<PublicEventDto> {
  const response = await publicApi.get<ApiSuccess<PublicEventDto>>(`/events/${slug}`);
  return unwrapApiData(response.data);
}

export async function fetchPublicSchedules(type?: string): Promise<PublicScheduleDto[]> {
  const response = await publicApi.get<ApiSuccess<PublicScheduleDto[]>>("/schedules", {
    params: type ? { type } : undefined,
  });
  return unwrapApiData(response.data);
}
